package com.customersupport.notificationservice.dto.response;

import com.customersupport.notificationservice.domain.enums.NotificationChannel;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationPreferenceResponse(
        UUID                preferenceId,
        UUID                agentId,
        String              notificationType,
        NotificationChannel preferredChannel,
        Boolean             isEnabled,
        OffsetDateTime      createdAt,
        OffsetDateTime      updatedAt
) {}
