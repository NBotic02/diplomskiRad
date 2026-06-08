package com.customersupport.employeeservice.service;

import com.customersupport.employeeservice.domain.entity.Department;
import com.customersupport.employeeservice.dto.request.CreateDepartmentRequest;
import com.customersupport.employeeservice.dto.response.DepartmentResponse;
import com.customersupport.employeeservice.exception.BusinessException;
import com.customersupport.employeeservice.exception.ResourceNotFoundException;
import com.customersupport.employeeservice.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DepartmentService {

    private final DepartmentRepository repo;
    private final EntityMapper         mapper;

    public List<DepartmentResponse> listActive() {
        return repo.findAllByIsActiveTrueOrderByNameAsc().stream()
                .map(mapper::toResponse).toList();
    }

    public DepartmentResponse getById(UUID id) {
        return repo.findById(id).map(mapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
    }

    @Transactional
    public DepartmentResponse create(CreateDepartmentRequest req) {
        if (repo.findAll().stream().anyMatch(d -> d.getName().equalsIgnoreCase(req.name()))) {
            throw new BusinessException("DEPARTMENT_EXISTS",
                    "Department named %s already exists".formatted(req.name()));
        }
        Department d = Department.builder()
                .name(req.name())
                .departmentLeadId(req.departmentLeadId())
                .description(req.description())
                .isActive(true)
                .build();

        Department saved = repo.saveAndFlush(d);
        saved = repo.findById(saved.getDepartmentId()).orElseThrow();
        return mapper.toResponse(saved);
    }
}
