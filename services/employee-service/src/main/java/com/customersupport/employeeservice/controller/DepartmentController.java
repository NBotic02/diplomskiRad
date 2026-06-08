package com.customersupport.employeeservice.controller;

import com.customersupport.employeeservice.dto.request.CreateDepartmentRequest;
import com.customersupport.employeeservice.dto.response.DepartmentResponse;
import com.customersupport.employeeservice.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService service;

    @GetMapping
    public List<DepartmentResponse> list() {
        return service.listActive();
    }

    @GetMapping("/{id}")
    public DepartmentResponse getById(@PathVariable UUID id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<DepartmentResponse> create(@Valid @RequestBody CreateDepartmentRequest req) {
        return ResponseEntity.status(201).body(service.create(req));
    }
}
