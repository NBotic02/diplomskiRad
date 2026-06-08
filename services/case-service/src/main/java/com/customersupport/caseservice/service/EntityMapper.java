package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.*;
import com.customersupport.caseservice.dto.response.*;
import org.springframework.stereotype.Component;

/** Entity -> DTO mapperi. */
@Component
public class EntityMapper {

    public CustomerResponse toResponse(Customer e) {
        return new CustomerResponse(
                e.getCustomerId(), e.getExternalId(),
                e.getFirstName(), e.getLastName(), e.getEmail(),
                e.getPhone(), e.getCompany(), e.getTier(),
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    public CaseResponse toResponse(Case e) {
        return new CaseResponse(
                e.getCaseId(), e.getCaseNumber(), e.getCustomerId(), e.getCategoryId(),
                e.getSubject(), e.getDescription(),
                e.getPriority(), e.getStatus(),
                e.getAssignedAgentId(), e.getTeamId(),
                e.getReopenedCount(), e.getSatisfactionScore(),
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    public CommunicationResponse toResponse(CaseCommunication e) {
        return new CommunicationResponse(
                e.getCommunicationId(), e.getCaseId(),
                e.getSenderType(), e.getSenderId(),
                e.getSubject(), e.getBody(), e.getCreatedAt()
        );
    }

    public NoteResponse toResponse(CaseNote e) {
        return new NoteResponse(
                e.getNoteId(), e.getCaseId(), e.getAuthorId(),
                e.getContent(), e.getIsPinned(),
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }

    public CategoryResponse toResponse(CaseCategory e) {
        return new CategoryResponse(
                e.getCategoryId(), e.getName(), e.getParentCategoryId(),
                e.getDescription(), e.getIsActive(), e.getSortOrder()
        );
    }

    public SlaTrackingResponse toResponse(SlaTracking e) {
        return new SlaTrackingResponse(
                e.getTrackingId(), e.getCaseId(), e.getSlaPolicyId(), e.getSlaStatus(),
                e.getResponseDeadline(), e.getResolutionDeadline(),
                e.getFirstResponseAt(), e.getResponseMet(), e.getResolutionMet(),
                e.getBreachedAt()
        );
    }

    public StatusHistoryResponse toResponse(CaseStatusHistory e) {
        return new StatusHistoryResponse(
                e.getHistoryId(), e.getCaseId(),
                e.getFromStatus(), e.getToStatus(),
                e.getChangedBy(), e.getChangeReason(),
                e.getCreatedAt()
        );
    }

    public WorkflowFailureResponse toResponse(WorkflowFailure e) {
        return new WorkflowFailureResponse(
                e.getFailureId(), e.getWorkflowName(), e.getN8nExecutionId(),
                e.getCaseId(), e.getFailedNode(),
                e.getErrorMessage(), e.getErrorPayload(), e.getInboundPayload(),
                e.getCaseStatusBefore(), e.getCompensated(),
                e.getCreatedAt()
        );
    }
}
