package com.customersupport.caseservice.service;

import com.customersupport.caseservice.domain.entity.Customer;
import com.customersupport.caseservice.domain.enums.CaseEventType;
import com.customersupport.caseservice.dto.request.CreateCustomerRequest;
import com.customersupport.caseservice.dto.response.CustomerResponse;
import com.customersupport.caseservice.exception.BusinessException;
import com.customersupport.caseservice.exception.ResourceNotFoundException;
import com.customersupport.caseservice.outbox.OutboxRecorder;
import com.customersupport.caseservice.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository repo;
    private final EntityMapper       mapper;
    private final OutboxRecorder     outbox;

    public Optional<CustomerResponse> findByEmail(String email) {
        return repo.findByEmailIgnoreCase(email).map(mapper::toResponse);
    }

    public CustomerResponse getById(UUID id) {
        return repo.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
    }

    @Transactional
    public CustomerResponse create(CreateCustomerRequest req) {
        if (repo.existsByEmail(req.email())) {
            throw new BusinessException("CUSTOMER_EXISTS",
                    "A customer with email %s already exists".formatted(req.email()));
        }

        Customer customer = Customer.builder()
                .externalId(req.externalId())
                .firstName(req.firstName())
                .lastName(req.lastName())
                .email(req.email())
                .phone(req.phone())
                .company(req.company())
                .tier(req.tierOrDefault())
                .build();

        Customer saved = repo.saveAndFlush(customer);
        saved = repo.findById(saved.getCustomerId()).orElseThrow();

        outbox.record(OutboxRecorder.AGGREGATE_CUSTOMER, saved.getCustomerId(),
                CaseEventType.CASE_CREATED,
                Map.of(
                        "customerId", saved.getCustomerId().toString(),
                        "email",      saved.getEmail(),
                        "tier",       saved.getTier().name()
                ));

        return mapper.toResponse(saved);
    }
}
