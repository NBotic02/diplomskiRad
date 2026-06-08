package com.customersupport.analyticsservice.dto.response;

import com.customersupport.analyticsservice.domain.enums.BottleneckSeverity;
import com.customersupport.analyticsservice.domain.enums.BottleneckType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BottleneckResponse(
        UUID                id,
        OffsetDateTime      detectedAt,
        BottleneckType      bottleneckType,
        String              description,
        String              affectedEntityType,
        UUID                affectedEntityId,
        BigDecimal          metricValue,
        BigDecimal          thresholdValue,
        BottleneckSeverity  severity,
        Boolean             isResolved,
        OffsetDateTime      resolvedAt
) {}
