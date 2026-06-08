package com.customersupport.analyticsservice.client;

import java.math.BigDecimal;
import java.util.UUID;

/** Mirror of case-service's AgentRollupResponse, matched by JSON contract. */
public record AgentRollupDto(
        UUID        agentId,
        Integer     casesAssigned,
        Integer     casesResolved,
        Integer     casesEscalated,
        BigDecimal  avgFirstResponseMinutes,
        BigDecimal  avgResolutionMinutes,
        BigDecimal  slaComplianceRate,
        BigDecimal  customerSatisfactionAvg
) {}
