package com.customersupport.analyticsservice.scheduler;

import com.customersupport.analyticsservice.client.CaseServiceClient;
import com.customersupport.analyticsservice.client.TeamRollupDto;
import com.customersupport.analyticsservice.service.MetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/** Periodically refreshes daily_case_metrics from case-service team rollups (UPSERT). */
@Component
@RequiredArgsConstructor
@Slf4j
public class TeamMetricsAggregator {

    private static final int LOOKBACK_DAYS = 30;

    private final CaseServiceClient client;
    private final MetricsService    metrics;

    @Scheduled(
            fixedRateString = "${app.agent-performance.poll-interval-ms}",
            initialDelay    = 20_000)
    public void refresh() {
        LocalDate today = LocalDate.now();
        LocalDate from  = today.minusDays(LOOKBACK_DAYS);

        List<TeamRollupDto> rollup = client.teamRollupBetween(from, today);
        if (rollup.isEmpty()) {
            log.debug("Team rollup {}..{} is empty — nothing to upsert", from, today);
            return;
        }
        for (TeamRollupDto r : rollup) {
            metrics.upsertDailyMetric(
                    r.metricDate(),
                    nz(r.totalCreated()), nz(r.totalResolved()), nz(r.totalEscalated()),
                    nz(r.totalReopened()), nz(r.autoResolved()),
                    r.avgFirstResponseMinutes(),
                    r.avgResolutionMinutes(),
                    r.slaComplianceRate(),
                    r.customerSatisfactionAvg(),
                    r.casesByPriority(),
                    r.casesByCategory()
            );
        }
        log.info("Refreshed daily team metrics {}..{} — {} day rows", from, today, rollup.size());
    }

    private static int nz(Integer i) { return i == null ? 0 : i; }
}
