package com.customersupport.caseservice.service;

import com.customersupport.caseservice.dto.response.CaseBreakdownResponse;
import com.customersupport.caseservice.dto.response.TeamRollupResponse;
import com.customersupport.caseservice.repository.CaseRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Date;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/** Computes team-wide rollup metrics over the given range. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TeamRollupService {

    private final CaseRepository repo;
    private final ObjectMapper   mapper;

    public List<TeamRollupResponse> rollupBetween(LocalDate fromDay, LocalDate toDay) {
        return repo.findTeamRollupBetween(fromDay, toDay).stream()
                .map(this::map)
                .toList();
    }

    /** Breakdown by category and priority, optionally filtered by agents. */
    public CaseBreakdownResponse breakdownBetween(LocalDate fromDay, LocalDate toDay,
                                                  java.util.UUID[] agentIds) {
        java.util.UUID[] safe = agentIds == null ? new java.util.UUID[0] : agentIds;
        java.util.Map<String, Integer> byCategory = new java.util.LinkedHashMap<>();
        for (Object[] row : repo.findCategoryBreakdown(fromDay, toDay, safe)) {
            byCategory.put(String.valueOf(row[0]), ((Number) row[1]).intValue());
        }
        java.util.Map<String, Integer> byPriority = new java.util.LinkedHashMap<>();
        for (Object[] row : repo.findPriorityBreakdown(fromDay, toDay, safe)) {
            byPriority.put(String.valueOf(row[0]), ((Number) row[1]).intValue());
        }
        return new CaseBreakdownResponse(byCategory, byPriority);
    }

    private TeamRollupResponse map(Object[] row) {
        return new TeamRollupResponse(
                toLocalDate(row[0]),
                toInt(row[1]),
                toInt(row[2]),
                toInt(row[3]),
                toInt(row[4]),
                toInt(row[5]),
                round(row[6], 2),
                round(row[7], 2),
                round(row[8], 2),
                round(row[9], 2),
                toMap(row[10]),
                toMap(row[11])
        );
    }

    private static LocalDate toLocalDate(Object o) {
        if (o == null) return null;
        if (o instanceof LocalDate ld) return ld;
        if (o instanceof Date d) return d.toLocalDate();
        return LocalDate.parse(o.toString());
    }

    private static Integer toInt(Object o) {
        if (o == null) return 0;
        if (o instanceof Number n) return n.intValue();
        return Integer.valueOf(o.toString());
    }

    private static BigDecimal round(Object o, int scale) {
        if (o == null) return null;
        BigDecimal bd = (o instanceof BigDecimal b) ? b : new BigDecimal(o.toString());
        return bd.setScale(scale, RoundingMode.HALF_UP);
    }

    // Postgres JSONB column arrives as PGobject; decoded from its JSON toString.
    private Map<String, Integer> toMap(Object o) {
        if (o == null) return Collections.emptyMap();
        String json = o.toString();
        if (json.isBlank() || json.equals("null")) return Collections.emptyMap();
        try {
            return mapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Failed to decode jsonb breakdown column: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
