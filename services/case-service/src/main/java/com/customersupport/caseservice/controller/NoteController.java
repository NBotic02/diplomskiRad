package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.dto.request.CreateNoteRequest;
import com.customersupport.caseservice.dto.response.NoteResponse;
import com.customersupport.caseservice.service.NoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/cases/{caseId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService service;

    @GetMapping
    public List<NoteResponse> list(@PathVariable UUID caseId) {
        return service.listForCase(caseId);
    }

    @PostMapping
    public ResponseEntity<NoteResponse> add(@PathVariable UUID caseId,
                                            @Valid @RequestBody CreateNoteRequest req) {
        return ResponseEntity.status(201).body(service.add(caseId, req));
    }
}
