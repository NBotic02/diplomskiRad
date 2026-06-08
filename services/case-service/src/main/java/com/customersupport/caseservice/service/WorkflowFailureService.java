package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.Case;
import com.customersupport.caseservice.domain.entity.CaseNote;
import com.customersupport.caseservice.domain.entity.WorkflowFailure;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import com.customersupport.caseservice.dto.request.RecordWorkflowFailureRequest;
import com.customersupport.caseservice.dto.request.UpdateStatusRequest;
import com.customersupport.caseservice.dto.response.WorkflowFailureResponse;
import com.customersupport.caseservice.repository.CaseNoteRepository;
import com.customersupport.caseservice.repository.CaseRepository;
import com.customersupport.caseservice.repository.WorkflowFailureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Records n8n workflow failures and compensates case state. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class WorkflowFailureService {

    private final WorkflowFailureRepository repo;
    private final CaseRepository            caseRepo;
    private final CaseNoteRepository        noteRepo;
    private final CaseService               caseService;
    private final EntityMapper              mapper;

    public List<WorkflowFailureResponse> listForCase(UUID caseId) {
        return repo.findAllByCaseIdOrderByCreatedAtDesc(caseId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    public List<WorkflowFailureResponse> listRecent(int days) {
        OffsetDateTime since = OffsetDateTime.now().minusDays(Math.max(1, days));
        return repo.findAllByCreatedAtAfterOrderByCreatedAtDesc(since).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public WorkflowFailureResponse record(RecordWorkflowFailureRequest req) {
        // Idempotent: same n8n execution + node returns the existing row.
        if (req.n8nExecutionId() != null && !req.n8nExecutionId().isBlank()) {
            Optional<WorkflowFailure> existing =
                    repo.findByN8nExecutionIdAndFailedNode(req.n8nExecutionId(), req.failedNode());
            if (existing.isPresent()) {
                log.info("Idempotent re-post of workflow_failure for exec={} node={}",
                         req.n8nExecutionId(), req.failedNode());
                return mapper.toResponse(existing.get());
            }
        }

        Case kase = req.caseId() == null ? null : caseRepo.findById(req.caseId()).orElse(null);
        String statusBefore = kase == null ? null : kase.getStatus().name();

        WorkflowFailure toSave = WorkflowFailure.builder()
                .workflowName(req.workflowName())
                .n8nExecutionId(req.n8nExecutionId())
                .caseId(req.caseId())
                .failedNode(req.failedNode())
                .errorMessage(truncate(req.errorMessage(), 4000))
                .errorPayload(req.errorPayload())
                .inboundPayload(req.inboundPayload())
                .caseStatusBefore(statusBefore)
                .compensated(false)
                .build();
        WorkflowFailure saved = repo.saveAndFlush(toSave);

        boolean compensated = false;
        if (kase != null) {
            try {
                compensated = compensate(kase, req);
            } catch (RuntimeException ex) {
                log.error("Compensation for case {} after failure at node {} threw: {}",
                          kase.getCaseId(), req.failedNode(), ex.getMessage(), ex);
            }
        }
        if (compensated) {
            saved.setCompensated(true);
            saved = repo.saveAndFlush(saved);
        }

        log.warn("Recorded workflow failure: workflow={} node={} caseId={} compensated={}",
                 req.workflowName(), req.failedNode(), req.caseId(), saved.getCompensated());
        return mapper.toResponse(saved);
    }

    /** Compensation: reverts AI-resolved cases to OPEN and leaves a pinned note. */
    private boolean compensate(Case kase, RecordWorkflowFailureRequest req) {
        boolean aiOwned = kase.getStatus() == CaseStatus.RESOLVED
                       && kase.getAssignedAgentId() == null;
        if (!aiOwned) {
            log.info("Skipping compensation for case {} — status={} agent={}",
                     kase.getCaseId(), kase.getStatus(), kase.getAssignedAgentId());
            return false;
        }

        String reason = "AI workflow failed at " + req.failedNode()
                      + (req.errorMessage() == null ? "" : ": " + truncate(req.errorMessage(), 200));
        caseService.updateStatus(
                kase.getCaseId(),
                new UpdateStatusRequest(CaseStatus.OPEN, reason),
                null);

        String noteBody = "AI auto-handle failed at node \"" + req.failedNode() + "\". "
                        + "The customer was not replied to. Please review the case and respond manually."
                        + (req.errorMessage() == null ? "" : "\n\nError: " + truncate(req.errorMessage(), 500));
        noteRepo.save(CaseNote.builder()
                .caseId(kase.getCaseId())
                .authorId(CaseService.SYSTEM_USER_ID)
                .content(noteBody)
                .isPinned(true)
                .build());

        return true;
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
