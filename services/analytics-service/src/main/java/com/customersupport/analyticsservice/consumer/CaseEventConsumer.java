package com.customersupport.analyticsservice.consumer;

import com.customersupport.analyticsservice.service.MetricsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Real-time projection of case-events into the analytics read model. */
@Component
@RequiredArgsConstructor
@Slf4j
public class CaseEventConsumer {

    private final MetricsService metrics;

    @RabbitListener(queues = "${app.rabbitmq.case-events-queue}")
    public void handle(Map<String, Object> payload,
                       @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        log.debug("Analytics received {} payload={}", routingKey, payload);

        String priority = String.valueOf(payload.getOrDefault("priority", ""));
        String status   = String.valueOf(payload.getOrDefault("status", ""));
        UUID   agentId  = uuid(payload.get("assignedAgentId")).orElse(null);

        switch (routingKey) {
            case "case.created"  -> {
                metrics.incrementToday("created", priority);
                if ("RESOLVED".equals(status) || "CLOSED".equals(status)) {
                    metrics.incrementToday("resolved", null);
                    metrics.incrementToday("auto", null);
                }
            }
            case "case.resolved" -> {
                metrics.incrementToday("resolved", null);
                metrics.incrementAgentToday(agentId, "resolved");
            }
            case "case.escalated" -> {
                metrics.incrementToday("escalated", null);
                metrics.incrementAgentToday(agentId, "escalated");
            }
            case "case.reopened"  -> metrics.incrementToday("reopened", null);
            case "case.assigned"  -> metrics.incrementAgentToday(agentId, "assigned");
            default               -> log.trace("Ignoring routing key {}", routingKey);
        }
    }

    private static Optional<UUID> uuid(Object raw) {
        if (raw == null) return Optional.empty();
        try {
            return Optional.of(UUID.fromString(raw.toString()));
        } catch (IllegalArgumentException notAUuid) {
            return Optional.empty();
        }
    }
}
