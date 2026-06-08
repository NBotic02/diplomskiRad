package com.customersupport.notificationservice.controller;

import com.customersupport.notificationservice.dto.request.UpsertPreferenceRequest;
import com.customersupport.notificationservice.dto.response.NotificationPreferenceResponse;
import com.customersupport.notificationservice.service.PreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notification-preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService service;

    @GetMapping("/agent/{agentId}")
    public List<NotificationPreferenceResponse> list(@PathVariable UUID agentId) {
        return service.listForAgent(agentId);
    }

    @PutMapping("/agent/{agentId}")
    public NotificationPreferenceResponse upsert(@PathVariable UUID agentId,
                                                 @Valid @RequestBody UpsertPreferenceRequest req) {
        return service.upsert(agentId, req);
    }
}
