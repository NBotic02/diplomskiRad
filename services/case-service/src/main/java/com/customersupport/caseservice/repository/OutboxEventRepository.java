package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, UUID> {

    /** Dohvaca sljedecu skupinu pending evenata uz row-level lockove. */
    @Query(value = """
            SELECT * FROM shared_types.outbox_events
             WHERE status = 'PENDING'
               AND aggregate_type IN ('Case', 'Customer')
             ORDER BY created_at
             LIMIT :batchSize
             FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxEvent> findPendingForUpdate(@Param("batchSize") int batchSize);
}
