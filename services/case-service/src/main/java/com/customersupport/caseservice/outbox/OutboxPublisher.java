package com.customersupport.caseservice.outbox;

import com.customersupport.caseservice.domain.entity.OutboxEvent;
import com.customersupport.caseservice.domain.enums.CaseEventType;
import com.customersupport.caseservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/** Periodically publishes pending outbox rows to RabbitMQ. */
@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxEventRepository repo;
    private final RabbitTemplate         rabbitTemplate;

    @Value("${app.outbox.batch-size:50}")
    private int batchSize;

    @Value("${app.rabbitmq.case-events-exchange:case-events}")
    private String exchange;

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:5000}")
    @Transactional
    public void publishPending() {
        List<OutboxEvent> batch = repo.findPendingForUpdate(batchSize);
        if (batch.isEmpty()) return;

        log.debug("Publishing {} pending outbox events", batch.size());
        for (OutboxEvent event : batch) {
            try {
                String routingKey = routingKeyFor(event.getEventType());
                rabbitTemplate.convertAndSend(exchange, routingKey, event.getPayload());
                event.setStatus(OutboxEvent.STATUS_PUBLISHED);
                event.setPublishedAt(OffsetDateTime.now());
                event.setLastError(null);
            } catch (AmqpException ex) {
                log.warn("Failed to publish outbox event {}: {}", event.getEventId(), ex.getMessage());
                event.setStatus(OutboxEvent.STATUS_FAILED);
                event.setRetryCount(event.getRetryCount() + 1);
                event.setLastError(ex.getMessage());
            }
        }
    }

    private String routingKeyFor(String eventType) {
        try {
            return CaseEventType.valueOf(eventType).routingKey();
        } catch (IllegalArgumentException unknownEnum) {
            return eventType.toLowerCase().replace('_', '.');
        }
    }
}
