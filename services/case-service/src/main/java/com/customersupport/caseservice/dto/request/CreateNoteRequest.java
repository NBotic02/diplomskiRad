package com.customersupport.caseservice.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateNoteRequest(
        @NotNull  UUID    authorId,
        @NotBlank String  content,
        Boolean           isPinned
) {
    public boolean pinnedOrFalse() {
        return Boolean.TRUE.equals(isPinned);
    }
}
