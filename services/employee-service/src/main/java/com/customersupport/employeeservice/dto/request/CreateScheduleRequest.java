package com.customersupport.employeeservice.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleRequest(
        @NotNull UUID      shiftId,
        @NotNull LocalDate effectiveFrom,
        LocalDate          effectiveTo
) {}
