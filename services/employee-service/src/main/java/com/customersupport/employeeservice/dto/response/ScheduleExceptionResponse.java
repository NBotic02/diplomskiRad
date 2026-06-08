package com.customersupport.employeeservice.dto.response;

import com.customersupport.employeeservice.domain.enums.ExceptionType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ScheduleExceptionResponse(
        UUID            exceptionId,
        UUID            agentId,
        LocalDate       exceptionDate,
        ExceptionType   exceptionType,
        String          reason,
        Boolean         isApproved,
        UUID            approvedBy,
        OffsetDateTime  createdAt
) {}
