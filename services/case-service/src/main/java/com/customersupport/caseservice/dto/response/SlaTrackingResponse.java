package com.customersupport.caseservice.dto.response;

import com.customersupport.caseservice.domain.enums.SlaStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SlaTrackingResponse(
        Long            trackingId,
        UUID            caseId,
        Integer         slaPolicyId,
        SlaStatus       slaStatus,
        OffsetDateTime  responseDeadline,
        OffsetDateTime  resolutionDeadline,
        OffsetDateTime  firstResponseAt,
        Boolean         responseMet,
        Boolean         resolutionMet,
        OffsetDateTime  breachedAt
) {}
