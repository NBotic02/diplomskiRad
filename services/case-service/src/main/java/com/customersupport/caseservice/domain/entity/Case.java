package com.customersupport.caseservice.domain.entity;

import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Generated;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.generator.EventType;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cases")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "case_id", updatable = false, nullable = false)
    private UUID caseId;

    /** Read-only, generira ga DB sekvenca case_number_seq. */
    @Generated(event = EventType.INSERT)
    @Column(name = "case_number", insertable = false, updatable = false)
    private Long caseNumber;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(nullable = false, length = 500)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CasePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CaseStatus status;

    @Column(name = "assigned_agent_id")
    private UUID assignedAgentId;

    @Column(name = "team_id")
    private UUID teamId;

    @Column(name = "reopened_count", nullable = false)
    private Integer reopenedCount;

    @Column(name = "satisfaction_score")
    private Short satisfactionScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
