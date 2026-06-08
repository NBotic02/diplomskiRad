package com.customersupport.employeeservice.domain.entity;

import com.customersupport.employeeservice.domain.enums.ExceptionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "schedule_exceptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleException {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "exception_id", updatable = false, nullable = false)
    private UUID exceptionId;

    @Column(name = "agent_id", nullable = false)
    private UUID agentId;

    @Column(name = "exception_date", nullable = false)
    private LocalDate exceptionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "exception_type", nullable = false, length = 20)
    private ExceptionType exceptionType;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
