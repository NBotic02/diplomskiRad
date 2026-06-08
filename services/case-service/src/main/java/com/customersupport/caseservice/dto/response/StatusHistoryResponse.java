package com.customersupport.caseservice.dto.response;

import com.customersupport.caseservice.domain.enums.CaseStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StatusHistoryResponse(
        Long            historyId,
        UUID            caseId,
        CaseStatus      fromStatus,
        CaseStatus      toStatus,
        UUID            changedBy,
        String          changeReason,
        OffsetDateTime  createdAt
) {}
