package com.customersupport.employeeservice.controller;

import com.customersupport.employeeservice.dto.request.CreateSkillRequest;
import com.customersupport.employeeservice.dto.response.SkillResponse;
import com.customersupport.employeeservice.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService service;

    @GetMapping
    public List<SkillResponse> list() {
        return service.listActive();
    }

    @PostMapping
    public ResponseEntity<SkillResponse> create(@Valid @RequestBody CreateSkillRequest req) {
        return ResponseEntity.status(201).body(service.createSkill(req));
    }
}
