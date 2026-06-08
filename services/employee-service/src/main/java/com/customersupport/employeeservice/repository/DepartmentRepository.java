package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    List<Department> findAllByIsActiveTrueOrderByNameAsc();
}
