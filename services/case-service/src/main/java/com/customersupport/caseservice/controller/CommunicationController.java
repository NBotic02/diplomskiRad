package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.dto.request.CreateCommunicationRequest;
import com.customersupport.caseservice.dto.response.CommunicationResponse;
import com.customersupport.caseservice.service.CommunicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/communications")
@RequiredArgsConstructor
public class CommunicationController {

    private final CommunicationService service;

    @GetMapping
    public List<CommunicationResponse> list(@PathVariable UUID caseId) {
        return service.listForCase(caseId);
    }

    @PostMapping
    public ResponseEntity<CommunicationResponse> add(@PathVariable UUID caseId,
                                                     @Valid @RequestBody CreateCommunicationRequest req) {
        return ResponseEntity.status(201).body(service.add(caseId, req));
    }
}
