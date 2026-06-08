package com.customersupport.caseservice.domain.enums;

/** Tipovi evenata case-lifecyclea i njihovi routing keyevi. */
public enum CaseEventType {
    CASE_CREATED("case.created"),
    CASE_ASSIGNED("case.assigned"),
    CASE_STATUS_CHANGED("case.status.changed"),
    CASE_RESOLVED("case.resolved"),
    CASE_ESCALATED("case.escalated"),
    CASE_REOPENED("case.reopened"),
    COMMUNICATION_ADDED("case.communication.added");

    private final String routingKey;

    CaseEventType(String routingKey) {
        this.routingKey = routingKey;
    }

    public String routingKey() {
        return routingKey;
    }
}
