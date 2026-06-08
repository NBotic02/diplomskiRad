package com.customersupport.caseservice.dto.request;

import com.customersupport.caseservice.domain.enums.CustomerTier;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomerRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Email @Size(max = 255) String email,
        @Size(max = 50)  String phone,
        @Size(max = 255) String company,
        @Size(max = 255) String externalId,
        CustomerTier     tier
) {
    public CustomerTier tierOrDefault() {
        return tier == null ? CustomerTier.STANDARD : tier;
    }
}
