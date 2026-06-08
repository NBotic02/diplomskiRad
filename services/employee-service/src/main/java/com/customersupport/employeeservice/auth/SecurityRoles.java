package com.customersupport.employeeservice.auth;

public final class SecurityRoles {

    public static final String ADMIN           = "ADMIN";
    public static final String LEAD = "LEAD";
    public static final String AGENT           = "AGENT";

    public static final String ROLE_PREFIX = "ROLE_";

    public static final String CLAIM_NAMESPACE = "https://supportly";
    public static final String CLAIM_ROLE          = CLAIM_NAMESPACE + "/role";
    public static final String CLAIM_AGENT_ID      = CLAIM_NAMESPACE + "/agent_id";
    public static final String CLAIM_DEPARTMENT_ID = CLAIM_NAMESPACE + "/department_id";

    private SecurityRoles() {}
}
