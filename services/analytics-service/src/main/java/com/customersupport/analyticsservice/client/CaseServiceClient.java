package com.customersupport.analyticsservice.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/** HTTP client for case-service's analytics-facing rollup endpoints. */
@Component
@RequiredArgsConstructor
@Slf4j
public class CaseServiceClient {

    private final RestTemplate restTemplate;

    @Value("${app.case-service.base-url}")
    private String baseUrl;

    /** GET /api/v1/cases/agent-rollup?date=YYYY-MM-DD; returns empty list on failure. */
    public List<AgentRollupDto> agentRollupForDate(LocalDate date) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/v1/cases/agent-rollup")
                .queryParam("date", date)
                .toUriString();
        try {
            ResponseEntity<List<AgentRollupDto>> resp = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<AgentRollupDto>>() {});
            List<AgentRollupDto> body = resp.getBody();
            return body != null ? body : Collections.emptyList();
        } catch (RuntimeException e) {
            log.warn("Failed to fetch agent rollup from case-service ({}): {}",
                     url, e.getMessage());
            return Collections.emptyList();
        }
    }

    /** GET /api/v1/cases/team-rollup?from=...&to=...; returns empty list on failure. */
    public List<TeamRollupDto> teamRollupBetween(LocalDate from, LocalDate to) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/v1/cases/team-rollup")
                .queryParam("from", from)
                .queryParam("to",   to)
                .toUriString();
        try {
            ResponseEntity<List<TeamRollupDto>> resp = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<TeamRollupDto>>() {});
            List<TeamRollupDto> body = resp.getBody();
            return body != null ? body : Collections.emptyList();
        } catch (RuntimeException e) {
            log.warn("Failed to fetch team rollup from case-service ({}): {}",
                     url, e.getMessage());
            return Collections.emptyList();
        }
    }
}
