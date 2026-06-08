package com.customersupport.analyticsservice.service;

import com.customersupport.analyticsservice.domain.entity.AgentPerformanceMetric;
import com.customersupport.analyticsservice.domain.entity.BottleneckDetection;
import com.customersupport.analyticsservice.domain.entity.DailyCaseMetric;
import com.customersupport.analyticsservice.dto.response.AgentPerformanceResponse;
import com.customersupport.analyticsservice.dto.response.BottleneckResponse;
import com.customersupport.analyticsservice.dto.response.DailyCaseMetricResponse;
import org.springframework.stereotype.Component;

@Component
public class EntityMapper {

    public DailyCaseMetricResponse toResponse(DailyCaseMetric m) {
        return new DailyCaseMetricResponse(
                m.getMetricDate(),
                m.getTotalCreated(), m.getTotalResolved(),
                m.getTotalEscalated(), m.getTotalReopened(), m.getAutoResolved(),
                m.getAvgFirstResponseMinutes(), m.getAvgResolutionMinutes(),
                m.getSlaComplianceRate(), m.getCustomerSatisfactionAvg(),
                m.getCasesByPriority(), m.getCasesByCategory()
        );
    }

    public AgentPerformanceResponse toResponse(AgentPerformanceMetric m) {
        return new AgentPerformanceResponse(
                m.getAgentId(), m.getPeriodStart(), m.getPeriodType(),
                m.getCasesAssigned(), m.getCasesResolved(), m.getCasesEscalated(),
                m.getAvgResolutionMinutes(), m.getAvgFirstResponseMinutes(),
                m.getSlaComplianceRate(), m.getCustomerSatisfactionAvg()
        );
    }

    public BottleneckResponse toResponse(BottleneckDetection b) {
        return new BottleneckResponse(
                b.getId(), b.getDetectedAt(), b.getBottleneckType(),
                b.getDescription(), b.getAffectedEntityType(), b.getAffectedEntityId(),
                b.getMetricValue(), b.getThresholdValue(), b.getSeverity(),
                b.getIsResolved(), b.getResolvedAt()
        );
    }
}
