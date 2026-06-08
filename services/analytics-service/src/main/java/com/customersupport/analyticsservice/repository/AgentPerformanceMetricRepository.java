package com.customersupport.analyticsservice.repository;

import com.customersupport.analyticsservice.domain.entity.AgentPerformanceMetric;
import com.customersupport.analyticsservice.domain.enums.PeriodType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentPerformanceMetricRepository extends JpaRepository<AgentPerformanceMetric, UUID> {

    Optional<AgentPerformanceMetric> findByAgentIdAndPeriodStartAndPeriodType(
            UUID agentId, LocalDate periodStart, PeriodType periodType);

    List<AgentPerformanceMetric> findAllByAgentIdAndPeriodTypeOrderByPeriodStartDesc(
            UUID agentId, PeriodType periodType);
}
