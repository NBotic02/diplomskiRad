package com.customersupport.caseservice.dto.response;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record WorkflowFailureResponse(
        UUID                failureId,
        String              workflowName,
        String              n8nExecutionId,
        UUID                caseId,
        String              failedNode,
        String              errorMessage,
        Map<String, Object> errorPayload,
        Map<String, Object> inboundPayload,
        String              caseStatusBefore,
        Boolean             compensated,
        OffsetDateTime      createdAt
) {}
