package com.customersupport.caseservice.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;
import java.util.UUID;

/** Payload sent by n8n WF_ErrorHandler when a workflow fails. */
public record RecordWorkflowFailureRequest(
        @NotBlank String              workflowName,
                  String              n8nExecutionId,
                  UUID                caseId,
        @NotBlank String              failedNode,
                  String              errorMessage,
                  Map<String, Object> errorPayload,
                  Map<String, Object> inboundPayload
) {}
