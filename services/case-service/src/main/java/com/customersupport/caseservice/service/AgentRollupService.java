package com.customersupport.caseservice.service;

import com.customersupport.caseservice.dto.response.AgentRollupResponse;
import com.customersupport.caseservice.repository.CaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Computes daily per-agent rollup metrics from cases + sla_tracking. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AgentRollupService {

    private final CaseRepository repo;

    public List<AgentRollupResponse> rollupForDay(LocalDate day) {
        return repo.findAgentRollupForDate(day).stream()
                .map(AgentRollupService::map)
                .toList();
    }

    private static AgentRollupResponse map(Object[] row) {
        return new AgentRollupResponse(
                (UUID) row[0],
                toInt(row[1]),
                toInt(row[2]),
                toInt(row[3]),
                round(row[4], 2),
                round(row[5], 2),
                round(row[6], 2),
                round(row[7], 2)
        );
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
}
