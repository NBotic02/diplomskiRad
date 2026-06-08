package com.customersupport.notificationservice.controller;

import com.customersupport.notificationservice.dto.request.SendNotificationRequest;
import com.customersupport.notificationservice.dto.response.NotificationResponse;
import com.customersupport.notificationservice.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    /** Primary endpoint — n8n posts fully-rendered notifications here. */
    @PostMapping("/send")
    public ResponseEntity<NotificationResponse> send(@Valid @RequestBody SendNotificationRequest req) {
        return ResponseEntity.status(202).body(service.send(req));
    }

    @GetMapping
    public List<NotificationResponse> list(@RequestParam(required = false) UUID caseId,
                                           @RequestParam(required = false) UUID recipientId) {
        if (caseId != null)      return service.listForCase(caseId);
        if (recipientId != null) return service.listForRecipient(recipientId);
        return List.of();
    }
}
