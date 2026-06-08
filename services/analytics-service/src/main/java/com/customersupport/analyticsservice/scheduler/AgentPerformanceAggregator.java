package com.customersupport.analyticsservice.scheduler;

import com.customersupport.analyticsservice.client.AgentRollupDto;
import com.customersupport.analyticsservice.client.CaseServiceClient;
import com.customersupport.analyticsservice.service.MetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

// Periodically refreshes agent_performance_metrics (UPSERT).
@Component
@RequiredArgsConstructor
@Slf4j
public class AgentPerformanceAggregator {

    private final CaseServiceClient client;
    private final MetricsService    metrics;

    // Refresh metrics for the last 30 days.
    @Scheduled(
            fixedRateString = "${app.agent-performance.poll-interval-ms}",
            initialDelay    = 15_000)
    public void refresh() {
        LocalDate today = LocalDate.now();
        for (int d = 0; d < 30; d++) {
            refreshForDay(today.minusDays(d));
        }
    }

    private void refreshForDay(LocalDate day) {
        List<AgentRollupDto> rollup = client.agentRollupForDate(day);
        if (rollup.isEmpty()) {
            log.debug("Agent rollup for {} is empty — nothing to upsert", day);
            return;
        }
        for (AgentRollupDto r : rollup) {
            metrics.upsertAgentDaily(
                    r.agentId(), day,
                    nz(r.casesAssigned()), nz(r.casesResolved()), nz(r.casesEscalated()),
                    r.avgFirstResponseMinutes(),
                    r.avgResolutionMinutes(),
                    r.slaComplianceRate(),
                    r.customerSatisfactionAvg()
            );
        }
        log.info("Refreshed agent performance metrics for {} — {} agent rows", day, rollup.size());
    }

    private static int nz(Integer i) { return i == null ? 0 : i; }
}
