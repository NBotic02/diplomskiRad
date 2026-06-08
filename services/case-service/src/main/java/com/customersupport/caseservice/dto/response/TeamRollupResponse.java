package com.customersupport.caseservice.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/** Team-wide rollup metrics for one day. */
public record TeamRollupResponse(
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
