package com.customersupport.caseservice.dto.response;

import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CaseResponse(
        UUID            caseId,
        Long            caseNumber,
        UUID            customerId,
        Integer         categoryId,
        String          subject,
        String          description,
        CasePriority    priority,
        CaseStatus      status,
        UUID            assignedAgentId,
        UUID            teamId,
        Integer         reopenedCount,
        Short           satisfactionScore,
        OffsetDateTime  createdAt,
        OffsetDateTime  updatedAt
) {}
