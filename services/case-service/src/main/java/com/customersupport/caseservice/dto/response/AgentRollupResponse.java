package com.customersupport.caseservice.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

/** Per-agent rollup metrics for one day. */
public record AgentRollupResponse(
        UUID        agentId,
        Integer     casesAssigned,
        Integer     casesResolved,
        Integer     casesEscalated,
        BigDecimal  avgFirstResponseMinutes,
        BigDecimal  avgResolutionMinutes,
        BigDecimal  slaComplianceRate,
        BigDecimal  customerSatisfactionAvg
) {}
