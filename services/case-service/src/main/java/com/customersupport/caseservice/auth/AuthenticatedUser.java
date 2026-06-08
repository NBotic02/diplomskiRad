package com.customersupport.caseservice.auth;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Optional;
import java.util.UUID;

/** Citanje role i identiteta pozivatelja iz JWT-a; anonimni pozivatelji su ADMIN. */
public final class AuthenticatedUser {

    private AuthenticatedUser() {}

    public static boolean isAuthenticated() {
        return jwt().isPresent();
    }

    public static String role() {
        return jwt()
                .map(j -> j.getClaimAsString(SecurityRoles.CLAIM_ROLE))
                .filter(s -> s != null && !s.isBlank())
                .orElse(SecurityRoles.ADMIN);
    }

    public static boolean isAdmin()           { return SecurityRoles.ADMIN.equals(role()); }
    public static boolean isLead()  { return SecurityRoles.LEAD.equals(role()); }
    public static boolean isAgent()           { return SecurityRoles.AGENT.equals(role()); }

    public static Optional<UUID> agentId() {
        return jwt()
                .map(j -> j.getClaimAsString(SecurityRoles.CLAIM_AGENT_ID))
                .filter(s -> s != null && !s.isBlank())
                .map(AuthenticatedUser::parseUuid)
                .filter(Optional::isPresent)
                .map(Optional::get);
    }

    public static Optional<UUID> departmentId() {
        return jwt()
                .map(j -> j.getClaimAsString(SecurityRoles.CLAIM_DEPARTMENT_ID))
                .filter(s -> s != null && !s.isBlank())
                .map(AuthenticatedUser::parseUuid)
                .filter(Optional::isPresent)
                .map(Optional::get);
    }

    public static Optional<String> email() {
        return jwt().map(j -> j.getClaimAsString("email"));
    }

    private static Optional<Jwt> jwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return Optional.empty();
        Object principal = auth.getPrincipal();
        return principal instanceof Jwt j ? Optional.of(j) : Optional.empty();
    }

    private static Optional<UUID> parseUuid(String s) {
        try { return Optional.of(UUID.fromString(s)); }
        catch (IllegalArgumentException e) { return Optional.empty(); }
    }
}
