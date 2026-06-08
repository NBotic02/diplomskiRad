package com.customersupport.caseservice.dto.request;

import com.customersupport.caseservice.domain.enums.CaseStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull CaseStatus status,
        String     changeReason
) {}
