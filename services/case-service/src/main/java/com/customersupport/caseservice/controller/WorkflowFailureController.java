package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.dto.request.RecordWorkflowFailureRequest;
import com.customersupport.caseservice.dto.response.WorkflowFailureResponse;
import com.customersupport.caseservice.service.WorkflowFailureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Endpoints for n8n workflow failure records. */
@RestController
@RequiredArgsConstructor
public class WorkflowFailureController {

    private final WorkflowFailureService service;

    @PostMapping("/api/v1/workflow-failures")
    public ResponseEntity<WorkflowFailureResponse> record(
            @Valid @RequestBody RecordWorkflowFailureRequest req) {
        return ResponseEntity.status(201).body(service.record(req));
    }

    @GetMapping("/api/v1/workflow-failures")
    public List<WorkflowFailureResponse> recent(
            @RequestParam(defaultValue = "7") int days) {
        return service.listRecent(days);
    }

    @GetMapping("/api/v1/cases/{caseId}/workflow-failures")
    public List<WorkflowFailureResponse> forCase(@PathVariable UUID caseId) {
        return service.listForCase(caseId);
    }
}
