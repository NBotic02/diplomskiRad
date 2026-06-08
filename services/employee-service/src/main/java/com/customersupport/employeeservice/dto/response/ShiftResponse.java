package com.customersupport.employeeservice.dto.response;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ShiftResponse(
        UUID           shiftId,
        String         name,
        LocalTime      startTime,
        LocalTime      endTime,
        List<Integer>  daysOfWeek,
        String         timezone,
        Boolean        isOvernight,
        Boolean        isActive
) {}
