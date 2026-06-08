package com.customersupport.analyticsservice.client;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Mirror of case-service's TeamRollupResponse, matched by JSON contract. */
public record TeamRollupDto(
        LocalDate            metricDate,
        Integer              totalCreated,
        Integer              totalResolved,
        Integer              totalEscalated,
        Integer              totalReopened,
        Integer              autoResolved,
        BigDecimal           avgFirstResponseMinutes,
        BigDecimal           avgResolutionMinutes,
        BigDecimal           slaComplianceRate,
        BigDecimal           customerSatisfactionAvg,
        Map<String, Integer> casesByPriority,
        Map<String, Integer> casesByCategory
) {}
