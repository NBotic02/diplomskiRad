package com.customersupport.analyticsservice.dto.response;

import com.customersupport.analyticsservice.domain.enums.PeriodType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AgentPerformanceResponse(
        UUID        agentId,
        LocalDate   periodStart,
        PeriodType  periodType,
        Integer     casesAssigned,
        Integer     casesResolved,
        Integer     casesEscalated,
        BigDecimal  avgResolutionMinutes,
        BigDecimal  avgFirstResponseMinutes,
        BigDecimal  slaComplianceRate,
        BigDecimal  customerSatisfactionAvg
) {}
