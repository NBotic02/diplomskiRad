package com.customersupport.employeeservice.dto.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AgentScheduleResponse(
        UUID            scheduleId,
        UUID            agentId,
        UUID            shiftId,
        LocalDate       effectiveFrom,
        LocalDate       effectiveTo,
        Boolean         isActive,
        OffsetDateTime  createdAt
) {}
