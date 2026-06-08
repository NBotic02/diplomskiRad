package com.customersupport.caseservice.dto.response;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NoteResponse(
        UUID            noteId,
        UUID            caseId,
        UUID            authorId,
        String          content,
        Boolean         isPinned,
        OffsetDateTime  createdAt,
        OffsetDateTime  updatedAt
) {}
