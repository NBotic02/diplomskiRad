package com.customersupport.notificationservice.dto.request;

import com.customersupport.notificationservice.domain.enums.CasePriority;
import com.customersupport.notificationservice.domain.enums.RuleAction;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateRuleRequest(
        @NotBlank   String       name,
        @NotNull    CasePriority priority,
        @NotNull @Min(0) Integer hoursAfterCreation,
        @NotNull    RuleAction   action,
        @NotBlank   String       notificationType,
        Boolean                  notifyAssignedAgent,
        Boolean                  notifyDepartmentLead
) {}
