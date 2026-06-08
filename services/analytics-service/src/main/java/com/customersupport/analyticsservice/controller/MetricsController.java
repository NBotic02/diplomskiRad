package com.customersupport.analyticsservice.controller;

import com.customersupport.analyticsservice.domain.enums.PeriodType;
import com.customersupport.analyticsservice.dto.response.AgentPerformanceResponse;
import com.customersupport.analyticsservice.dto.response.DailyCaseMetricResponse;
import com.customersupport.analyticsservice.service.MetricsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
public class MetricsController {

    private final MetricsService service;

    /** Day-by-day totals over a date range. {@code from}/{@code to} default to the last 7 days. */
    @GetMapping("/daily")
    public List<DailyCaseMetricResponse> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end   = to   == null ? LocalDate.now()           : to;
        LocalDate start = from == null ? end.minusDays(7)          : from;
        return service.daily(start, end);
    }

    @GetMapping("/agents/{id}")
    public List<AgentPerformanceResponse> agent(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "DAILY") PeriodType period) {
        return service.agentHistory(id, period);
    }

    /** Today's per-agent DAILY snapshot. Returns 204 when no row exists yet. */
    @GetMapping("/agents/{id}/today")
    public ResponseEntity<AgentPerformanceResponse> agentToday(@PathVariable UUID id) {
        return service.agentToday(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
