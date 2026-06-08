package com.customersupport.employeeservice.repository;

import com.customersupport.employeeservice.domain.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgentRepository extends JpaRepository<Agent, UUID> {

    Optional<Agent> findByEmail(String email);

    Optional<Agent> findByEmployeeNumber(String employeeNumber);

    List<Agent> findAllByIsActiveTrueOrderByEmployeeNumberAsc();

    /** Available candidates with the requested skill, on shift, not on exception. */
    @Query(value = """
            SELECT DISTINCT a.*
              FROM employee.agents a
              JOIN employee.agent_skills ask ON ask.agent_id = a.agent_id
              JOIN employee.skills s         ON s.skill_id   = ask.skill_id
              JOIN employee.agent_schedules sc
                ON sc.agent_id = a.agent_id
               AND sc.is_active = true
               AND sc.effective_from <= CURRENT_DATE
               AND (sc.effective_to IS NULL OR sc.effective_to >= CURRENT_DATE)
              JOIN employee.shifts sh
                ON sh.shift_id = sc.shift_id
               AND sh.is_active = true
               AND EXTRACT(ISODOW FROM CURRENT_DATE)::INT = ANY(sh.days_of_week)
             WHERE a.is_active = true
               AND s.name = :skillName
               AND NOT EXISTS (
                   SELECT 1 FROM employee.schedule_exceptions se
                    WHERE se.agent_id       = a.agent_id
                      AND se.exception_date = CURRENT_DATE
                      AND se.is_approved    = true
               )
             ORDER BY a.employee_number
             LIMIT :limit
            """, nativeQuery = true)
    List<Agent> findAvailableBySkillName(@Param("skillName") String skillName,
                                         @Param("limit")     int limit);

    /** Fallback: available on-shift agents regardless of skill. */
    @Query(value = """
            SELECT DISTINCT a.*
              FROM employee.agents a
              JOIN employee.agent_schedules sc
                ON sc.agent_id = a.agent_id
               AND sc.is_active = true
               AND sc.effective_from <= CURRENT_DATE
               AND (sc.effective_to IS NULL OR sc.effective_to >= CURRENT_DATE)
              JOIN employee.shifts sh
                ON sh.shift_id = sc.shift_id
               AND sh.is_active = true
               AND EXTRACT(ISODOW FROM CURRENT_DATE)::INT = ANY(sh.days_of_week)
             WHERE a.is_active = true
               AND NOT EXISTS (
                   SELECT 1 FROM employee.schedule_exceptions se
                    WHERE se.agent_id       = a.agent_id
                      AND se.exception_date = CURRENT_DATE
                      AND se.is_approved    = true
               )
             ORDER BY a.employee_number
             LIMIT :limit
            """, nativeQuery = true)
    List<Agent> findAvailableAnyOnShift(@Param("limit") int limit);

    /** Active agents in the given department. */
    @Query(value = """
            SELECT a.*
              FROM employee.agents a
              JOIN employee.department_members dm ON dm.agent_id = a.agent_id
             WHERE dm.department_id = :departmentId
               AND a.is_active      = true
             ORDER BY a.employee_number
            """, nativeQuery = true)
    List<Agent> findAllActiveByDepartmentId(@Param("departmentId") UUID departmentId);
}
