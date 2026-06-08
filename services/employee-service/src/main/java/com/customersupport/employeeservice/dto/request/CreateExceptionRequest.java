package com.customersupport.employeeservice.dto.request;

import com.customersupport.employeeservice.domain.enums.ExceptionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateExceptionRequest(
        @NotNull LocalDate     exceptionDate,
        @NotNull ExceptionType exceptionType,
        String                 reason,
        Boolean                isApproved
) {
    public boolean approvedOrFalse() { return Boolean.TRUE.equals(isApproved); }
}
