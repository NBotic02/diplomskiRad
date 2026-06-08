package com.customersupport.caseservice.domain.entity;

import com.customersupport.caseservice.domain.enums.SenderType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "case_communications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseCommunication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "communication_id", updatable = false, nullable = false)
    private UUID communicationId;

    @Column(name = "case_id", nullable = false)
    private UUID caseId;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 20)
    private SenderType senderType;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(length = 500)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
