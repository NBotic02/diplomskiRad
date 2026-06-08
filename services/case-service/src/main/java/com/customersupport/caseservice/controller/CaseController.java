package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import com.customersupport.caseservice.dto.request.AssignAgentRequest;
import com.customersupport.caseservice.dto.request.CreateCaseRequest;
import com.customersupport.caseservice.dto.request.UpdateStatusRequest;
import com.customersupport.caseservice.dto.response.CaseResponse;
import com.customersupport.caseservice.dto.response.SlaTrackingResponse;
import com.customersupport.caseservice.service.CaseService;
import com.customersupport.caseservice.service.SlaTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cases")
@RequiredArgsConstructor
public class CaseController {

    private final CaseService        cases;
    private final SlaTrackingService sla;

    @GetMapping
    public Page<CaseResponse> search(
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(required = false) CasePriority priority,
            @RequestParam(required = false) UUID assignedAgentId,
            @PageableDefault(size = 25) Pageable pageable) {
        return cases.search(status, priority, assignedAgentId, pageable);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(cases.getById(id));
    }

    @PostMapping
    public ResponseEntity<CaseResponse> create(@Valid @RequestBody CreateCaseRequest req) {
        CaseResponse created = cases.create(req);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.caseId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<CaseResponse> assign(@PathVariable UUID id,
                                               @Valid @RequestBody AssignAgentRequest req) {
        return ResponseEntity.ok(cases.assignAgent(id, req));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<CaseResponse> updateStatus(@PathVariable UUID id,
                                                     @Valid @RequestBody UpdateStatusRequest req) {
        UUID actorId = com.customersupport.caseservice.auth.AuthenticatedUser
                .agentId().orElse(null);
        return ResponseEntity.ok(cases.updateStatus(id, req, actorId));
    }

    @GetMapping("/{id}/sla")
    public ResponseEntity<SlaTrackingResponse> getSla(@PathVariable UUID id) {
        return ResponseEntity.ok(sla.getByCaseId(id));
    }
}
