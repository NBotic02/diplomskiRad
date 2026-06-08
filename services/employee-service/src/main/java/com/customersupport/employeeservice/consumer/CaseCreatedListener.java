package com.customersupport.employeeservice.consumer;

import com.customersupport.employeeservice.dto.response.AgentResponse;
import com.customersupport.employeeservice.service.AgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Consumes case.created and publishes agent.candidates. */
@Slf4j
@Component
@RequiredArgsConstructor
public class CaseCreatedListener {

    private static final int CANDIDATE_BATCH_SIZE = 10;

    private final AgentService  agentService;
    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.agent-events-exchange:agent-events}")
    private String agentEventsExchange;

    @RabbitListener(queues = "${app.rabbitmq.case-created-queue:employee.case-created}")
    public void onCaseCreated(Map<String, Object> payload) {
        String caseId   = str(payload.get("caseId"));
        String category = str(payload.get("category"));
        String status   = str(payload.get("status"));
        String existing = str(payload.get("assignedAgentId"));

        if (caseId == null) {
            log.warn("Ignoring case.created event without caseId: {}", payload);
            return;
        }
        if ("RESOLVED".equals(status) || "CLOSED".equals(status)) {
            log.info("Skipping agent assignment for case {} — already {} (AI auto-resolved)", caseId, status);
            return;
        }
        if (existing != null && !existing.isBlank()) {
            log.info("Skipping agent assignment for case {} — already assigned to {}", caseId, existing);
            return;
        }

        List<AgentResponse> candidates = (category == null || category.isBlank())
                ? List.of()
                : agentService.findAvailable(category, CANDIDATE_BATCH_SIZE);

        boolean usedFallback = false;
        if (candidates.isEmpty()) {
            candidates = agentService.findAvailableAnyOnShift(CANDIDATE_BATCH_SIZE);
            usedFallback = !candidates.isEmpty();
        }
        if (candidates.isEmpty()) {
            log.warn("No available agent at all for case {} (category='{}') — leaving unassigned",
                    caseId, category);
            return;
        }
        if (usedFallback) {
            log.info("No skilled agent for category '{}' — publishing fallback candidates for case {}",
                    category, caseId);
        }

        List<Map<String, Object>> candidatePayloads = new ArrayList<>(candidates.size());
        for (AgentResponse a : candidates) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("agentId",             a.agentId().toString());
            entry.put("agentEmail",          a.email());
            entry.put("agentFirstName",      a.firstName());
            entry.put("agentLastName",       a.lastName());
            entry.put("employeeNumber",      a.employeeNumber());
            entry.put("maxConcurrentCases",  a.maxConcurrentCases());
            candidatePayloads.add(entry);
        }

        Map<String, Object> out = new HashMap<>();
        out.put("caseId",     caseId);
        out.put("category",   category);
        out.put("candidates", candidatePayloads);

        rabbitTemplate.convertAndSend(agentEventsExchange, "agent.candidates", out);
        log.info("Published agent.candidates: case={} count={} skill='{}'{}",
                caseId, candidatePayloads.size(), category, usedFallback ? " (fallback)" : "");
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
