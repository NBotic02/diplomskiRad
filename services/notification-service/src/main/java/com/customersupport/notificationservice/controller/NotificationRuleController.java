package com.customersupport.notificationservice.controller;

import com.customersupport.notificationservice.dto.request.CreateRuleRequest;
import com.customersupport.notificationservice.dto.response.NotificationRuleResponse;
import com.customersupport.notificationservice.service.NotificationRuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-rules")
@RequiredArgsConstructor
public class NotificationRuleController {

    private final NotificationRuleService service;

    @GetMapping
    public List<NotificationRuleResponse> list() {
        return service.listActive();
    }

    @PostMapping
    public ResponseEntity<NotificationRuleResponse> create(@Valid @RequestBody CreateRuleRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        service.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
