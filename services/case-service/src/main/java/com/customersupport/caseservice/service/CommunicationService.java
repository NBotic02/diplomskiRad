package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.Case;
import com.customersupport.caseservice.domain.entity.CaseCommunication;
import com.customersupport.caseservice.domain.entity.Customer;
import com.customersupport.caseservice.domain.enums.CaseEventType;
import com.customersupport.caseservice.domain.enums.SenderType;
import com.customersupport.caseservice.dto.request.CreateCommunicationRequest;
import com.customersupport.caseservice.dto.response.CommunicationResponse;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.outbox.OutboxRecorder;
import com.customersupport.caseservice.repository.CaseCommunicationRepository;
import com.customersupport.caseservice.repository.CaseRepository;
import com.customersupport.caseservice.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class CommunicationService {

    private final CaseCommunicationRepository repo;
    private final CaseRepository              caseRepo;
    private final CustomerRepository          customerRepo;
    private final EntityMapper                mapper;
    private final OutboxRecorder              outbox;
    private final OutboundEmailSender         emailSender;

    public List<CommunicationResponse> listForCase(UUID caseId) {
        ensureCaseExists(caseId);
        return repo.findAllByCaseIdOrderByCreatedAtAsc(caseId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public CommunicationResponse add(UUID caseId, CreateCommunicationRequest req) {
        Case kase = caseRepo.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", caseId));

        CaseCommunication toSave = CaseCommunication.builder()
                .caseId(caseId)
                .senderType(req.senderType())
                .senderId(req.senderId())
                .subject(req.subject())
                .body(req.body())
                .build();
        CaseCommunication saved = repo.saveAndFlush(toSave);
        saved = repo.findById(saved.getCommunicationId()).orElseThrow();

        outbox.record(OutboxRecorder.AGGREGATE_CASE, caseId,
                CaseEventType.COMMUNICATION_ADDED,
                Map.of(
                        "caseId",          caseId.toString(),
                        "communicationId", saved.getCommunicationId().toString(),
                        "senderType",      saved.getSenderType().name()
                ));

        if (req.senderType() == SenderType.AGENT) {
            dispatchOutbound(kase, saved, req);
        }

        return mapper.toResponse(saved);
    }

    /** Sends outbound mail; errors are logged but do not roll back the write. */
    private void dispatchOutbound(Case kase, CaseCommunication saved, CreateCommunicationRequest req) {
        String to = req.to();
        if (to == null || to.isBlank()) {
            Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);
            if (customer == null) {
                log.warn("Skipping outbound email for case {} — customer {} not found",
                         kase.getCaseId(), kase.getCustomerId());
                return;
            }
            to = customer.getEmail();
        }

        String subject = (saved.getSubject() != null && !saved.getSubject().isBlank())
                ? saved.getSubject()
                : "Re: " + (kase.getSubject() == null ? "your support case" : kase.getSubject());

        if (kase.getCaseNumber() != null && !subject.contains("#" + kase.getCaseNumber())) {
            subject = "[#" + kase.getCaseNumber() + "] " + subject;
        }

        try {
            emailSender.send(to, req.cc(), subject, saved.getBody());
        } catch (RuntimeException e) {
            log.error("Outbound email failed for case {}: {}", kase.getCaseId(), e.getMessage(), e);
        }
    }

    private void ensureCaseExists(UUID caseId) {
        if (!caseRepo.existsById(caseId)) {
            throw new ResourceNotFoundException("Case", caseId);
        }
    }
}
