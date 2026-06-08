package com.customersupport.notificationservice.dto.request;

import com.customersupport.notificationservice.domain.enums.NotificationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpsertPreferenceRequest(
        @NotBlank             String              notificationType,
        @NotNull              NotificationChannel preferredChannel,
        Boolean                                   isEnabled
) {
    public boolean enabledOrTrue() {
        return isEnabled == null || isEnabled;
    }
}
