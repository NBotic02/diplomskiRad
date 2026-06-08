package com.customersupport.caseservice.domain.entity;

import com.customersupport.caseservice.domain.enums.SlaStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sla_tracking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaTracking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tracking_id")
    private Long trackingId;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Column(name = "sla_policy_id", nullable = false)
    private Integer slaPolicyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sla_status", nullable = false, length = 20)
    private SlaStatus slaStatus;

    @Column(name = "response_deadline", nullable = false)
    private OffsetDateTime responseDeadline;

    @Column(name = "resolution_deadline", nullable = false)
    private OffsetDateTime resolutionDeadline;

    @Column(name = "first_response_at")
    private OffsetDateTime firstResponseAt;

    @Column(name = "response_met")
    private Boolean responseMet;

    @Column(name = "resolution_met")
    private Boolean resolutionMet;

    @Column(name = "breached_at")
    private OffsetDateTime breachedAt;

    // Rows are created by a DB trigger on case insert; timestamps are read-only.
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;
}
