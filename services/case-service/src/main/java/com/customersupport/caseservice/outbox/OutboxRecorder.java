package com.customersupport.caseservice.outbox;

import com.customersupport.caseservice.domain.entity.OutboxEvent;
import com.customersupport.caseservice.domain.enums.CaseEventType;
import com.customersupport.caseservice.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/** Writes an outbox event in the same transaction as the business change. */
@Component
@RequiredArgsConstructor
public class OutboxRecorder {

    public static final String AGGREGATE_CASE     = "Case";
    public static final String AGGREGATE_CUSTOMER = "Customer";

    private final OutboxEventRepository repo;

    public void record(String aggregateType, UUID aggregateId,
                       CaseEventType type, Map<String, Object> payload) {
        OutboxEvent event = OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(type.name())
                .payload(payload)
                .build();
        repo.save(event);
    }
}
