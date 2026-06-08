package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.dto.response.AgentRollupResponse;
import com.customersupport.caseservice.dto.response.CaseBreakdownResponse;
import com.customersupport.caseservice.dto.response.TeamRollupResponse;
import com.customersupport.caseservice.service.AgentRollupService;
import com.customersupport.caseservice.service.TeamRollupService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Endpoints for the rollup aggregates pulled by analytics-service. */
@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class AgentRollupController {

    private final AgentRollupService agentService;
    private final TeamRollupService  teamService;

    /** One row per agent for cases opened on the given day. */
    @GetMapping("/agent-rollup")
    public List<AgentRollupResponse> agentRollup(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return agentService.rollupForDay(date == null ? LocalDate.now() : date);
    }

    /** One row per day, team-wide aggregate. */
    @GetMapping("/team-rollup")
    public List<TeamRollupResponse> teamRollup(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate end   = (to   == null) ? LocalDate.now()    : to;
        LocalDate start = (from == null) ? end.minusDays(30)  : from;
        return teamService.rollupBetween(start, end);
    }

    /** Case breakdown by category and priority over the given range. */
    @GetMapping("/breakdown")
    public CaseBreakdownResponse breakdown(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) java.util.List<java.util.UUID> agentIds) {
        LocalDate end   = (to   == null) ? LocalDate.now()    : to;
        LocalDate start = (from == null) ? end.minusDays(30)  : from;
        java.util.UUID[] arr = (agentIds == null || agentIds.isEmpty())
                ? new java.util.UUID[0]
                : agentIds.toArray(new java.util.UUID[0]);
        return teamService.breakdownBetween(start, end, arr);
    }
}
