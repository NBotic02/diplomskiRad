package com.customersupport.caseservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/** Zapis neuspjeha n8n workflowa. */
@Entity
@Table(name = "workflow_failures")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowFailure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "failure_id", updatable = false, nullable = false)
    private UUID failureId;

    @Column(name = "workflow_name", nullable = false, length = 100)
    private String workflowName;

    @Column(name = "n8n_execution_id", length = 100)
    private String n8nExecutionId;

    @Column(name = "case_id")
    private UUID caseId;

    @Column(name = "failed_node", nullable = false, length = 100)
    private String failedNode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "error_payload", columnDefinition = "jsonb")
    private Map<String, Object> errorPayload;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "inbound_payload", columnDefinition = "jsonb")
    private Map<String, Object> inboundPayload;

    @Column(name = "case_status_before", length = 20)
    private String caseStatusBefore;

    @Column(nullable = false)
    private Boolean compensated;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (compensated == null) compensated = false;
    }
}
