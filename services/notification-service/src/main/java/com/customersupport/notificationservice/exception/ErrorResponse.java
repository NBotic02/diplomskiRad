package com.customersupport.notificationservice.exception;

import java.time.OffsetDateTime;
import java.util.List;

public record ErrorResponse(String code, String message, List<String> details, OffsetDateTime timestamp) {
    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, List.of(), OffsetDateTime.now());
    }
    public static ErrorResponse of(String code, String message, List<String> details) {
        return new ErrorResponse(code, message, details, OffsetDateTime.now());
    }
}
