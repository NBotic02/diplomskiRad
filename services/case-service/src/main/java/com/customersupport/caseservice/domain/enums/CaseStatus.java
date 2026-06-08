package com.customersupport.caseservice.domain.enums;

public enum CaseStatus {
    NEW,
    OPEN,
    PENDING,
    ON_HOLD,
    PENDING_APPROVAL,
    ESCALATED,
    RESOLVED,
    CLOSED,
    REOPENED;

    public boolean isTerminal() {
        return this == RESOLVED || this == CLOSED;
    }
}
