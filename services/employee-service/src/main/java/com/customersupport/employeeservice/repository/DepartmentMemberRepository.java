package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.DepartmentMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentMemberRepository
        extends JpaRepository<DepartmentMember, DepartmentMember.DepartmentMemberId> {

    List<DepartmentMember> findAllByDepartmentId(UUID departmentId);

    List<DepartmentMember> findAllByAgentId(UUID agentId);
}
