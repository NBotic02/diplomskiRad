package com.customersupport.employeeservice.dto.request;

import com.customersupport.employeeservice.domain.enums.ExceptionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Time-off request spanning an inclusive date range. */
public record CreateExceptionRangeRequest(
        @NotNull LocalDate     fromDate,
        @NotNull LocalDate     toDate,
        @NotNull ExceptionType exceptionType,
        String                 reason,
        Boolean                isApproved
) {
    public boolean approvedOrFalse() { return Boolean.TRUE.equals(isApproved); }
}
