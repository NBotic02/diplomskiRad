package com.customersupport.caseservice.consumer;

import com.customersupport.caseservice.repository.CaseRepository;
import com.customersupport.caseservice.service.CaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Picks the least-loaded candidate from agent.candidates events and assigns the case. */
@Slf4j
@Component
@RequiredArgsConstructor
public class AgentFoundListener {

    private final CaseService    caseService;
    private final CaseRepository caseRepo;

    @RabbitListener(queues = "${app.rabbitmq.agent-found-queue:case.agent-found}")
    @SuppressWarnings("unchecked")
    public void onAgentCandidates(Map<String, Object> payload) {
        String caseIdRaw = str(payload.get("caseId"));
        Object rawCandidates = payload.get("candidates");

        if (caseIdRaw == null) {
            log.warn("Ignoring agent.candidates event without caseId: {}", payload);
            return;
        }
        if (!(rawCandidates instanceof List<?> rawList) || rawList.isEmpty()) {
            log.warn("Ignoring agent.candidates event for case {} — empty or missing candidates list",
                    caseIdRaw);
            return;
        }

        UUID caseId;
        try {
            caseId = UUID.fromString(caseIdRaw);
        } catch (IllegalArgumentException ex) {
            log.warn("Ignoring agent.candidates event with non-UUID caseId='{}'", caseIdRaw);
            return;
        }

        List<Map<String, Object>> candidates = (List<Map<String, Object>>) rawList;
        List<UUID> candidateIds = new java.util.ArrayList<>(candidates.size());
        Map<UUID, Integer> capacityByAgent = new HashMap<>(candidates.size());
        Map<UUID, Map<String, Object>> byId = new HashMap<>(candidates.size());

        for (Map<String, Object> c : candidates) {
            String idRaw = str(c.get("agentId"));
            if (idRaw == null) continue;
            try {
                UUID id = UUID.fromString(idRaw);
                candidateIds.add(id);
                byId.put(id, c);
                Object cap = c.get("maxConcurrentCases");
                capacityByAgent.put(id, cap instanceof Number n ? n.intValue() : Integer.MAX_VALUE);
            } catch (IllegalArgumentException ignore) {
                log.debug("Skipping candidate with non-UUID agentId='{}'", idRaw);
            }
        }
        if (candidateIds.isEmpty()) {
            log.warn("No usable candidates parsed from agent.candidates payload for case {}", caseId);
            return;
        }

        Map<UUID, Long> loadByAgent = new HashMap<>();
        for (Object[] row : caseRepo.countOpenByAssignedAgents(candidateIds)) {
            loadByAgent.put((UUID) row[0], (Long) row[1]);
        }

        UUID picked = null;
        long pickedLoad = Long.MAX_VALUE;
        for (UUID id : candidateIds) {
            long load = loadByAgent.getOrDefault(id, 0L);
            int  cap  = capacityByAgent.getOrDefault(id, Integer.MAX_VALUE);
            if (load >= cap) continue;
            if (load < pickedLoad) {
                picked     = id;
                pickedLoad = load;
            }
        }

        if (picked == null) {
            log.warn("All {} candidates are at capacity for case {} — leaving unassigned",
                    candidateIds.size(), caseId);
            return;
        }

        Map<String, Object> winner = byId.get(picked);
        String agentEmail = str(winner.get("agentEmail"));

        try {
            caseService.assignAgentFromEvent(caseId, picked, agentEmail);
            log.info("Assigned agent {} to case {} (load={}, picked from {} candidates)",
                    picked, caseId, pickedLoad, candidateIds.size());
        } catch (Exception e) {
            log.error("Failed to apply assignment for case {} to agent {}: {}",
                    caseId, picked, e.getMessage(), e);
        }
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
