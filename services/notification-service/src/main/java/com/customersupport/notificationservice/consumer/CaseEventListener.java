package com.customersupport.notificationservice.consumer;

import com.customersupport.notificationservice.dto.request.SendNotificationRequest;
import com.customersupport.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/** Subscribes to case-events and drafts a notification for the assigned agent. */
@Component
@RequiredArgsConstructor
@Slf4j
public class CaseEventListener {

    private final NotificationService notifications;

    @RabbitListener(queues = "${app.rabbitmq.case-events-queue}")
    public void handle(Map<String, Object> payload,
                       @Header(AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        log.debug("Received case event {} payload={}", routingKey, payload);

        UUID caseId = uuid(payload.get("caseId")).orElse(null);
        if (caseId == null) {
            log.warn("Skipping event {} — missing caseId", routingKey);
            return;
        }

        UUID agentId = uuid(payload.get("assignedAgentId")).orElse(null);
        if (agentId == null) {
            log.debug("Event {} for case {} has no assignedAgentId yet — skipping", routingKey, caseId);
            return;
        }

        String type    = mapToNotificationType(routingKey);
        String subject = renderSubject(routingKey, payload);
        String body    = renderBody(routingKey, payload);

        Object emailRaw = payload.get("agentEmail");
        String agentEmail = (emailRaw == null || emailRaw.toString().isBlank()) ? null : emailRaw.toString();

        SendNotificationRequest req = new SendNotificationRequest(
                caseId, agentId,
                agentEmail,
                null,
                type, subject, body,
                null,
                null
        );

        try {
            notifications.send(req);
        } catch (Exception ex) {
            log.error("Failed to dispatch notification for {} ({}): {}",
                      caseId, routingKey, ex.getMessage());
        }
    }

    private String mapToNotificationType(String routingKey) {
        return switch (routingKey) {
            case "case.assigned"        -> "CASE_ASSIGNED";
            case "case.escalated"       -> "CASE_ESCALATED";
            case "case.resolved"        -> "CASE_RESOLVED";
            case "case.sla.warning"     -> "SLA_WARNING";
            case "case.sla.breached"    -> "SLA_BREACH";
            default                     -> "CASE_REMINDER";
        };
    }

    private String renderSubject(String routingKey, Map<String, Object> p) {
        Object num = p.getOrDefault("caseNumber", p.get("caseId"));
        return switch (routingKey) {
            case "case.assigned"     -> "Case #%s assigned to you".formatted(num);
            case "case.escalated"    -> "Case #%s has been escalated".formatted(num);
            case "case.sla.warning"  -> "SLA warning on case #%s".formatted(num);
            case "case.sla.breached" -> "SLA breached on case #%s".formatted(num);
            case "case.resolved"     -> "Case #%s resolved".formatted(num);
            default                  -> "Update on case #%s".formatted(num);
        };
    }

    private String renderBody(String routingKey, Map<String, Object> p) {
        return """
                Routing key: %s
                Case ID:     %s
                Priority:    %s
                Status:      %s

                Open the case in the support console for details.
                """.formatted(
                        routingKey,
                        p.get("caseId"),
                        p.getOrDefault("priority", "n/a"),
                        p.getOrDefault("status",   "n/a"));
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
