package com.customersupport.analyticsservice.exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ErrorResponse(String code, String message, List<String> details, OffsetDateTime timestamp) {
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, List.of(), OffsetDateTime.now());
    }
}
