package com.customersupport.notificationservice.dto.request;

import com.customersupport.notificationservice.domain.enums.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendNotificationRequest(
        @NotNull   UUID                caseId,
        @NotNull   UUID                recipientId,
        String                         recipientEmail,
        String                         recipientPhone,
        @NotBlank  String              notificationType,
        @NotBlank  String              subject,
        @NotBlank  String              body,
        UUID                           ruleId,
        NotificationChannel            preferredChannel
) {}
