package com.customersupport.caseservice.controller;

import com.customersupport.caseservice.dto.request.CreateCustomerRequest;
import com.customersupport.caseservice.dto.response.CustomerResponse;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;

    /** Finds a customer by email address. */
    @GetMapping(params = "email")
    public ResponseEntity<CustomerResponse> findByEmail(@RequestParam String email) {
        return service.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "email=" + email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse created = service.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.customerId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }
}
