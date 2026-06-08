package com.customersupport.analyticsservice.service;

import com.customersupport.analyticsservice.domain.entity.AgentPerformanceMetric;
import com.customersupport.analyticsservice.domain.entity.DailyCaseMetric;
import com.customersupport.analyticsservice.domain.enums.PeriodType;
import com.customersupport.analyticsservice.dto.response.AgentPerformanceResponse;
import com.customersupport.analyticsservice.dto.response.DailyCaseMetricResponse;
import com.customersupport.analyticsservice.repository.AgentPerformanceMetricRepository;
import com.customersupport.analyticsservice.repository.DailyCaseMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

/** Read-side queries plus upsert helpers for daily and per-agent metrics. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetricsService {

    private final DailyCaseMetricRepository        dailyRepo;
    private final AgentPerformanceMetricRepository agentRepo;
    private final EntityMapper                     mapper;

    public List<DailyCaseMetricResponse> daily(LocalDate from, LocalDate to) {
        return dailyRepo.findAllByMetricDateBetweenOrderByMetricDateAsc(from, to).stream()
                .map(mapper::toResponse).toList();
    }

    public List<AgentPerformanceResponse> agentHistory(UUID agentId, PeriodType period) {
        return agentRepo.findAllByAgentIdAndPeriodTypeOrderByPeriodStartDesc(agentId, period).stream()
                .map(mapper::toResponse).toList();
    }

    /** Increments the named counter on today's row, creating it if missing. */
    @Transactional
    public DailyCaseMetric incrementToday(String counter, String priority) {
        LocalDate today = LocalDate.now();
        DailyCaseMetric m = dailyRepo.findByMetricDate(today)
                .orElseGet(() -> dailyRepo.saveAndFlush(DailyCaseMetric.builder()
                        .metricDate(today)
                        .casesByPriority(new HashMap<>())
                        .casesByCategory(new HashMap<>())
                        .build()));

        switch (counter) {
            case "created"   -> m.setTotalCreated(m.getTotalCreated() + 1);
            case "resolved"  -> m.setTotalResolved(m.getTotalResolved() + 1);
            case "escalated" -> m.setTotalEscalated(m.getTotalEscalated() + 1);
            case "reopened"  -> m.setTotalReopened(m.getTotalReopened() + 1);
            case "auto"      -> m.setAutoResolved(m.getAutoResolved() + 1);
        }

        if (priority != null && counter.equals("created")) {
            m.getCasesByPriority().merge(priority, 1, Integer::sum);
        }
        return m;
    }

    /** UPSERT the daily row for the given date from a case-service rollup. */
    @Transactional
    public void upsertDailyMetric(LocalDate day,
                                  int totalCreated, int totalResolved, int totalEscalated,
                                  int totalReopened, int autoResolved,
                                  java.math.BigDecimal avgFirstResponseMinutes,
                                  java.math.BigDecimal avgResolutionMinutes,
                                  java.math.BigDecimal slaComplianceRate,
                                  java.math.BigDecimal customerSatisfactionAvg,
                                  java.util.Map<String, Integer> casesByPriority,
                                  java.util.Map<String, Integer> casesByCategory) {
        DailyCaseMetric m = dailyRepo.findByMetricDate(day)
                .orElseGet(() -> DailyCaseMetric.builder()
                        .metricDate(day)
                        .casesByPriority(new HashMap<>())
                        .casesByCategory(new HashMap<>())
                        .build());

        m.setTotalCreated(totalCreated);
        m.setTotalResolved(totalResolved);
        m.setTotalEscalated(totalEscalated);
        m.setTotalReopened(totalReopened);
        m.setAutoResolved(autoResolved);
        m.setAvgFirstResponseMinutes(avgFirstResponseMinutes);
        m.setAvgResolutionMinutes(avgResolutionMinutes);
        m.setSlaComplianceRate(slaComplianceRate);
        m.setCustomerSatisfactionAvg(customerSatisfactionAvg);
        m.setCasesByPriority(casesByPriority != null ? casesByPriority : new HashMap<>());
        m.setCasesByCategory(casesByCategory != null ? casesByCategory : new HashMap<>());

        dailyRepo.save(m);
    }

    /** Today's per-agent DAILY row, or empty when none exists. */
    public java.util.Optional<AgentPerformanceResponse> agentToday(UUID agentId) {
        return agentRepo.findByAgentIdAndPeriodStartAndPeriodType(
                        agentId, LocalDate.now(), PeriodType.DAILY)
                .map(mapper::toResponse);
    }

    /** UPSERT the per-agent DAILY row for the given date from a case-service rollup. */
    @Transactional
    public void upsertAgentDaily(UUID agentId, LocalDate day,
                                 int casesAssigned, int casesResolved, int casesEscalated,
                                 java.math.BigDecimal avgFirstResponseMinutes,
                                 java.math.BigDecimal avgResolutionMinutes,
                                 java.math.BigDecimal slaComplianceRate,
                                 java.math.BigDecimal customerSatisfactionAvg) {
        AgentPerformanceMetric m = agentRepo
                .findByAgentIdAndPeriodStartAndPeriodType(agentId, day, PeriodType.DAILY)
                .orElseGet(() -> AgentPerformanceMetric.builder()
                        .agentId(agentId)
                        .periodStart(day)
                        .periodType(PeriodType.DAILY)
                        .build());

        m.setCasesAssigned(casesAssigned);
        m.setCasesResolved(casesResolved);
        m.setCasesEscalated(casesEscalated);
        m.setAvgFirstResponseMinutes(avgFirstResponseMinutes);
        m.setAvgResolutionMinutes(avgResolutionMinutes);
        m.setSlaComplianceRate(slaComplianceRate);
        m.setCustomerSatisfactionAvg(customerSatisfactionAvg);

        agentRepo.save(m);
    }

    /** Per-agent counter increment on today's DAILY row. */
    @Transactional
    public void incrementAgentToday(UUID agentId, String counter) {
        if (agentId == null) return;
        LocalDate today = LocalDate.now();
        AgentPerformanceMetric m = agentRepo
                .findByAgentIdAndPeriodStartAndPeriodType(agentId, today, PeriodType.DAILY)
                .orElseGet(() -> agentRepo.saveAndFlush(AgentPerformanceMetric.builder()
                        .agentId(agentId)
                        .periodStart(today)
                        .periodType(PeriodType.DAILY)
                        .build()));

        switch (counter) {
            case "assigned"  -> m.setCasesAssigned(m.getCasesAssigned() + 1);
            case "resolved"  -> m.setCasesResolved(m.getCasesResolved() + 1);
            case "escalated" -> m.setCasesEscalated(m.getCasesEscalated() + 1);
        }
    }
}
