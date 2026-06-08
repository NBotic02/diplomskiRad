package com.customersupport.notificationservice.dto.response;

import com.customersupport.notificationservice.domain.enums.NotificationChannel;
import com.customersupport.notificationservice.domain.enums.NotificationStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID                notificationId,
        UUID                ruleId,
        UUID                caseId,
        UUID                recipientId,
        String              recipientEmail,
        String              recipientPhone,
        NotificationChannel channel,
        String              subject,
        String              body,
        NotificationStatus  status,
        OffsetDateTime      sentAt,
        String              errorMessage,
        OffsetDateTime      createdAt
) {}
