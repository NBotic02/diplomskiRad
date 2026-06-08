package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.WorkflowFailure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowFailureRepository extends JpaRepository<WorkflowFailure, UUID> {

    /** Idempotent: same n8n execution + node must not produce two rows. */
    Optional<WorkflowFailure> findByN8nExecutionIdAndFailedNode(String n8nExecutionId,
                                                                String failedNode);

    List<WorkflowFailure> findAllByCaseIdOrderByCreatedAtDesc(UUID caseId);

    List<WorkflowFailure> findAllByCreatedAtAfterOrderByCreatedAtDesc(OffsetDateTime since);
}
