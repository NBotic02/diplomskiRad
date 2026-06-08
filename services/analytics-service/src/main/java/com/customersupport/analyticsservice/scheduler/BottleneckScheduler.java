package com.customersupport.analyticsservice.scheduler;

import com.customersupport.analyticsservice.domain.entity.DailyCaseMetric;
import com.customersupport.analyticsservice.domain.enums.BottleneckSeverity;
import com.customersupport.analyticsservice.domain.enums.BottleneckType;
import com.customersupport.analyticsservice.repository.DailyCaseMetricRepository;
import com.customersupport.analyticsservice.service.BottleneckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Scans today's daily metrics and records bottlenecks when thresholds are breached. */
@Component
@RequiredArgsConstructor
@Slf4j
public class BottleneckScheduler {

    private final DailyCaseMetricRepository dailyRepo;
    private final BottleneckService          bottlenecks;

    @Value("${app.bottleneck.sla-compliance-min}")
    private BigDecimal slaComplianceMin;

    @Value("${app.bottleneck.avg-resolution-minutes-max}")
    private BigDecimal avgResolutionMax;

    @Value("${app.bottleneck.open-cases-max}")
    private int openCasesMax;

    @Scheduled(cron = "0 */30 * * * *")
    public void detect() {
        DailyCaseMetric today = dailyRepo.findByMetricDate(LocalDate.now()).orElse(null);
        if (today == null) {
            log.debug("No metric row for today yet — skipping bottleneck detection");
            return;
        }

        int created = today.getTotalCreated();
        if (created > openCasesMax) {
            bottlenecks.record(BottleneckType.HIGH_VOLUME,
                    BottleneckSeverity.HIGH,
                    "%d cases created today (threshold: %d)".formatted(created, openCasesMax),
                    BigDecimal.valueOf(created),
                    BigDecimal.valueOf(openCasesMax),
                    "DailyMetric", today.getId());
        }

        BigDecimal sla = today.getSlaComplianceRate();
        if (sla != null && sla.compareTo(slaComplianceMin) < 0) {
            bottlenecks.record(BottleneckType.SLA_BREACH_RATE,
                    BottleneckSeverity.CRITICAL,
                    "SLA compliance at %s%% (threshold: %s%%)".formatted(sla, slaComplianceMin),
                    sla, slaComplianceMin, "DailyMetric", today.getId());
        }

        BigDecimal avg = today.getAvgResolutionMinutes();
        if (avg != null && avg.compareTo(avgResolutionMax) > 0) {
            bottlenecks.record(BottleneckType.SLOW_RESOLUTION,
                    BottleneckSeverity.MEDIUM,
                    "Average resolution %s min (threshold: %s min)".formatted(avg, avgResolutionMax),
                    avg, avgResolutionMax, "DailyMetric", today.getId());
        }
    }
}
