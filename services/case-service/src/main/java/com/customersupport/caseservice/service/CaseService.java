package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.Case;
import com.customersupport.caseservice.domain.entity.CaseStatusHistory;
import com.customersupport.caseservice.domain.enums.CaseEventType;
import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import com.customersupport.caseservice.dto.request.AssignAgentRequest;
import com.customersupport.caseservice.dto.request.CreateCaseRequest;
import com.customersupport.caseservice.dto.request.UpdateStatusRequest;
import com.customersupport.caseservice.dto.response.CaseResponse;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.auth.AuthenticatedUser;
import com.customersupport.caseservice.outbox.OutboxRecorder;
import com.customersupport.caseservice.repository.CaseCategoryRepository;
import com.customersupport.caseservice.repository.CaseRepository;
import com.customersupport.caseservice.repository.CaseStatusHistoryRepository;
import com.customersupport.caseservice.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CaseService {

    /** Sentinel UUID for system-driven changes (n8n, cron). */
    public static final UUID SYSTEM_USER_ID =
            UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final CaseRepository                caseRepo;
    private final CaseStatusHistoryRepository   historyRepo;
    private final CustomerRepository            customerRepo;
    private final CaseCategoryRepository        categoryRepo;
    private final EntityMapper                  mapper;
    private final OutboxRecorder                outbox;

    @Value("${app.case.default-team-id:}")
    private String defaultTeamId;

    public CaseResponse getById(UUID id) {
        return caseRepo.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Case", id));
    }

    public Page<CaseResponse> search(CaseStatus status, CasePriority priority,
                                     UUID agentId, Pageable pageable) {
        if (AuthenticatedUser.isAdmin()) {
            return caseRepo.search(status, priority, agentId, pageable).map(mapper::toResponse);
        }
        UUID teamId = AuthenticatedUser.departmentId().orElse(null);
        if (AuthenticatedUser.isLead()) {
            if (teamId == null) {
                return Page.empty(pageable);
            }
            return caseRepo.searchByTeam(status, priority, agentId, teamId, pageable)
                    .map(mapper::toResponse);
        }
        UUID me = AuthenticatedUser.agentId()
                .orElse(agentId);
        if (me == null) {
            return Page.empty(pageable);
        }
        return caseRepo.searchForAgent(status, priority, me, teamId, pageable)
                .map(mapper::toResponse);
    }

    @Transactional
    public CaseResponse create(CreateCaseRequest req) {
        if (!customerRepo.existsById(req.customerId())) {
            throw new ResourceNotFoundException("Customer", req.customerId());
        }

        Case toSave = Case.builder()
                .customerId(req.customerId())
                .categoryId(req.categoryId())
                .subject(req.subject())
                .description(req.description())
                .priority(req.priorityOrDefault())
                .status(req.statusOrDefault())
                .reopenedCount(0)
                .teamId(req.teamId() != null
                        ? req.teamId()
                        : (defaultTeamId == null || defaultTeamId.isBlank()
                                ? null
                                : UUID.fromString(defaultTeamId)))
                .build();

        Case saved = caseRepo.save(toSave);

        historyRepo.save(CaseStatusHistory.builder()
                .caseId(saved.getCaseId())
                .toStatus(saved.getStatus())
                .changedBy(SYSTEM_USER_ID)
                .changeReason("Case created")
                .build());

        outbox.record(OutboxRecorder.AGGREGATE_CASE, saved.getCaseId(),
                CaseEventType.CASE_CREATED, basePayload(saved));

        return mapper.toResponse(saved);
    }

    @Transactional
    public CaseResponse assignAgent(UUID caseId, AssignAgentRequest req) {
        return doAssignAgent(caseId, req.assignedAgentId(), req.teamId(), null);
    }

    /** Variant called from the event listener; adds agentEmail to the outbox payload. */
    @Transactional
    public CaseResponse assignAgentFromEvent(UUID caseId, UUID agentId, String agentEmail) {
        return doAssignAgent(caseId, agentId, null, agentEmail);
    }

    private CaseResponse doAssignAgent(UUID caseId, UUID agentId, UUID teamId, String agentEmail) {
        Case c = caseRepo.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", caseId));

        c.setAssignedAgentId(agentId);
        if (teamId != null) c.setTeamId(teamId);
        if (c.getStatus() == CaseStatus.NEW) {
            transitionStatus(c, CaseStatus.OPEN, SYSTEM_USER_ID, "Agent assigned");
        }

        Map<String, Object> payload = new HashMap<>(basePayload(c));
        payload.put("assignedAgentId", agentId.toString());
        if (teamId != null) payload.put("teamId", teamId.toString());
        if (agentEmail != null && !agentEmail.isBlank()) payload.put("agentEmail", agentEmail);

        outbox.record(OutboxRecorder.AGGREGATE_CASE, c.getCaseId(),
                CaseEventType.CASE_ASSIGNED, payload);

        return mapper.toResponse(c);
    }

    @Transactional
    public CaseResponse updateStatus(UUID caseId, UpdateStatusRequest req, UUID actorId) {
        Case c = caseRepo.findById(caseId)
                .orElseThrow(() -> new ResourceNotFoundException("Case", caseId));

        if (c.getStatus() == req.status()) {
            return mapper.toResponse(c);
        }

        guardTransition(c.getStatus(), req.status(), actorId);

        UUID changedBy = actorId == null ? SYSTEM_USER_ID : actorId;
        transitionStatus(c, req.status(), changedBy, req.changeReason());

        CaseEventType type = switch (req.status()) {
            case RESOLVED  -> CaseEventType.CASE_RESOLVED;
            case ESCALATED -> CaseEventType.CASE_ESCALATED;
            case REOPENED  -> CaseEventType.CASE_REOPENED;
            default        -> CaseEventType.CASE_STATUS_CHANGED;
        };
        outbox.record(OutboxRecorder.AGGREGATE_CASE, c.getCaseId(), type, basePayload(c));

        return mapper.toResponse(c);
    }

    /** Permission check for a status transition. */
    private void guardTransition(CaseStatus from, CaseStatus to, UUID actorId) {
        boolean isSystem = actorId == null || !AuthenticatedUser.isAuthenticated();
        if (isSystem) return;

        if (to == CaseStatus.RESOLVED && !AuthenticatedUser.isAdmin() && !AuthenticatedUser.isLead()) {
            throw new IllegalStateException(
                    "Agents must submit a case for approval before it can be resolved. " +
                    "Move to PENDING_APPROVAL and wait for a lead to approve.");
        }
    }

    private void transitionStatus(Case c, CaseStatus newStatus, UUID changedBy, String reason) {
        CaseStatus prev = c.getStatus();
        c.setStatus(newStatus);
        if (newStatus == CaseStatus.REOPENED) {
            c.setReopenedCount(c.getReopenedCount() + 1);
        }
        historyRepo.save(CaseStatusHistory.builder()
                .caseId(c.getCaseId())
                .fromStatus(prev)
                .toStatus(newStatus)
                .changedBy(changedBy)
                .changeReason(reason)
                .build());
    }

    private Map<String, Object> basePayload(Case c) {
        Map<String, Object> p = new HashMap<>();
        p.put("caseId",     c.getCaseId().toString());
        p.put("caseNumber", c.getCaseNumber());
        p.put("customerId", c.getCustomerId().toString());
        p.put("priority",   c.getPriority().name());
        p.put("status",     c.getStatus().name());
        if (c.getCategoryId() != null) {
            p.put("categoryId", c.getCategoryId());
            categoryRepo.findById(c.getCategoryId())
                    .ifPresent(cat -> p.put("category", cat.getName()));
        }
        if (c.getAssignedAgentId() != null) p.put("assignedAgentId", c.getAssignedAgentId().toString());
        return p;
    }
}
