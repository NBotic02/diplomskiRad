package com.customersupport.notificationservice.dto.response;

import com.customersupport.notificationservice.domain.enums.CasePriority;
import com.customersupport.notificationservice.domain.enums.RuleAction;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationRuleResponse(
        UUID            ruleId,
        String          name,
        CasePriority    priority,
        Integer         hoursAfterCreation,
        RuleAction      action,
        String          notificationType,
        Boolean         notifyAssignedAgent,
        Boolean         notifyDepartmentLead,
        Boolean         isActive,
        OffsetDateTime  createdAt
) {}
