package com.customersupport.caseservice.dto.request;

import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateCaseRequest(
        @NotNull  UUID         customerId,
        Integer                categoryId,
        @NotBlank @Size(max = 500) String subject,
        String                 description,
        CasePriority           priority,
        CaseStatus             status,
        UUID                   teamId
) {
    public CasePriority priorityOrDefault() {
        return priority == null ? CasePriority.MEDIUM : priority;
    }

    public CaseStatus statusOrDefault() {
        return status == null ? CaseStatus.NEW : status;
    }
}
