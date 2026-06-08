package com.customersupport.caseservice.repository;

import com.customersupport.caseservice.domain.entity.Case;
import com.customersupport.caseservice.domain.enums.CasePriority;
import com.customersupport.caseservice.domain.enums.CaseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CaseRepository extends JpaRepository<Case, UUID> {

    Page<Case> findAllByStatus(CaseStatus status, Pageable pageable);

    Page<Case> findAllByAssignedAgentId(UUID agentId, Pageable pageable);

    @Query("""
            SELECT c FROM Case c
             WHERE (:status   IS NULL OR c.status   = :status)
               AND (:priority IS NULL OR c.priority = :priority)
               AND (:agentId  IS NULL OR c.assignedAgentId = :agentId)
            """)
    Page<Case> search(@Param("status")   CaseStatus status,
                      @Param("priority") CasePriority priority,
                      @Param("agentId")  UUID agentId,
                      Pageable pageable);

    /** Same as search but limited to the given team. */
    @Query("""
            SELECT c FROM Case c
             WHERE (:status   IS NULL OR c.status   = :status)
               AND (:priority IS NULL OR c.priority = :priority)
               AND (:agentId  IS NULL OR c.assignedAgentId = :agentId)
               AND  c.teamId  = :teamId
            """)
    Page<Case> searchByTeam(@Param("status")   CaseStatus status,
                            @Param("priority") CasePriority priority,
                            @Param("agentId")  UUID agentId,
                            @Param("teamId")   UUID teamId,
                            Pageable pageable);

    /** Cases visible to an agent: own + unassigned in the agent's team. */
    @Query("""
            SELECT c FROM Case c
             WHERE (:status   IS NULL OR c.status   = :status)
               AND (:priority IS NULL OR c.priority = :priority)
               AND (
                       c.assignedAgentId = :agentId
                    OR (c.assignedAgentId IS NULL AND c.teamId = :teamId)
                   )
            """)
    Page<Case> searchForAgent(@Param("status")   CaseStatus status,
                              @Param("priority") CasePriority priority,
                              @Param("agentId")  UUID agentId,
                              @Param("teamId")   UUID teamId,
                              Pageable pageable);

    long countByStatusIn(List<CaseStatus> statuses);

    /** Per-agent rollup of cases opened on the given day. */
    @Query(value = """
            SELECT
              c.assigned_agent_id                                                        AS agent_id,
              COUNT(*)                                                                   AS cases_assigned,
              COUNT(*) FILTER (WHERE c.status IN ('RESOLVED','CLOSED'))                  AS cases_resolved,
              COUNT(*) FILTER (WHERE c.status = 'ESCALATED')                             AS cases_escalated,
              AVG(EXTRACT(EPOCH FROM (sla.first_response_at - c.created_at)) / 60.0)
                  FILTER (WHERE sla.first_response_at IS NOT NULL)                       AS avg_first_response_minutes,
              AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 60.0)
                  FILTER (WHERE c.status IN ('RESOLVED','CLOSED'))                       AS avg_resolution_minutes,
              CASE WHEN COUNT(*) FILTER (WHERE sla.response_met IS NOT NULL) = 0 THEN NULL
                   ELSE 100.0 * COUNT(*) FILTER (WHERE sla.response_met IS TRUE)
                              / NULLIF(COUNT(*) FILTER (WHERE sla.response_met IS NOT NULL), 0)
              END                                                                        AS sla_compliance_rate,
              AVG(c.satisfaction_score)
                  FILTER (WHERE c.satisfaction_score IS NOT NULL)                        AS customer_satisfaction_avg
            FROM case_mgmt.cases c
            LEFT JOIN case_mgmt.sla_tracking sla ON sla.case_id = c.case_id
            WHERE c.assigned_agent_id IS NOT NULL
              AND c.created_at::date = :day
            GROUP BY c.assigned_agent_id
            """, nativeQuery = true)
    List<Object[]> findAgentRollupForDate(@Param("day") java.time.LocalDate day);

    /** Team-wide daily rollup over the given date range. */
    @Query(value = """
            WITH daily_cases AS (
                SELECT c.case_id, c.created_at::date AS day, c.status,
                       c.assigned_agent_id, c.reopened_count, c.priority,
                       c.category_id, c.updated_at, c.created_at,
                       c.satisfaction_score,
                       sla.first_response_at, sla.response_met
                  FROM case_mgmt.cases c
                  LEFT JOIN case_mgmt.sla_tracking sla ON sla.case_id = c.case_id
                 WHERE c.created_at::date BETWEEN :fromDay AND :toDay
            ),
            prio_per_day AS (
                SELECT day, jsonb_object_agg(priority, n) AS by_priority
                  FROM (
                      SELECT day, priority, COUNT(*) AS n
                        FROM daily_cases
                       GROUP BY day, priority
                  ) t
                 GROUP BY day
            ),
            cat_per_day AS (
                SELECT dc.day,
                       jsonb_object_agg(coalesce(cat.name, 'Uncategorised'), dc.n) AS by_category
                  FROM (
                      SELECT day, category_id, COUNT(*) AS n
                        FROM daily_cases
                       GROUP BY day, category_id
                  ) dc
                  LEFT JOIN case_mgmt.case_categories cat ON cat.category_id = dc.category_id
                 GROUP BY dc.day
            )
            SELECT
              dc.day                                                                     AS day,
              COUNT(*)                                                                   AS total_created,
              COUNT(*) FILTER (WHERE dc.status IN ('RESOLVED','CLOSED'))                 AS total_resolved,
              COUNT(*) FILTER (WHERE dc.status = 'ESCALATED')                            AS total_escalated,
              COUNT(*) FILTER (WHERE dc.reopened_count > 0)                              AS total_reopened,
              COUNT(*) FILTER (WHERE dc.status IN ('RESOLVED','CLOSED')
                                 AND dc.assigned_agent_id IS NULL)                       AS auto_resolved,
              AVG(EXTRACT(EPOCH FROM (dc.first_response_at - dc.created_at)) / 60.0)
                  FILTER (WHERE dc.first_response_at IS NOT NULL)                        AS avg_first_response_minutes,
              AVG(EXTRACT(EPOCH FROM (dc.updated_at - dc.created_at)) / 60.0)
                  FILTER (WHERE dc.status IN ('RESOLVED','CLOSED'))                      AS avg_resolution_minutes,
              CASE WHEN COUNT(*) FILTER (WHERE dc.response_met IS NOT NULL) = 0 THEN NULL
                   ELSE 100.0 * COUNT(*) FILTER (WHERE dc.response_met IS TRUE)
                              / NULLIF(COUNT(*) FILTER (WHERE dc.response_met IS NOT NULL), 0)
              END                                                                        AS sla_compliance_rate,
              AVG(dc.satisfaction_score) FILTER (WHERE dc.satisfaction_score IS NOT NULL) AS customer_satisfaction_avg,
              prio.by_priority                                                            AS cases_by_priority,
              cat.by_category                                                             AS cases_by_category
            FROM daily_cases dc
            LEFT JOIN prio_per_day prio ON prio.day = dc.day
            LEFT JOIN cat_per_day  cat  ON cat.day  = dc.day
            GROUP BY dc.day, prio.by_priority, cat.by_category
            ORDER BY dc.day
            """, nativeQuery = true)
    List<Object[]> findTeamRollupBetween(@Param("fromDay") java.time.LocalDate fromDay,
                                         @Param("toDay")   java.time.LocalDate toDay);

    /** Counts per category over a date range, optionally filtered by agents. */
    @Query(value = """
            SELECT COALESCE(cat.name, 'Uncategorised') AS category, COUNT(*) AS cnt
              FROM case_mgmt.cases c
              LEFT JOIN case_mgmt.case_categories cat ON cat.category_id = c.category_id
             WHERE c.created_at::date BETWEEN :fromDay AND :toDay
               AND (
                   COALESCE(array_length(CAST(:agentIds AS uuid[]), 1), 0) = 0
                OR c.assigned_agent_id = ANY(CAST(:agentIds AS uuid[]))
               )
             GROUP BY COALESCE(cat.name, 'Uncategorised')
             ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> findCategoryBreakdown(@Param("fromDay") java.time.LocalDate fromDay,
                                         @Param("toDay")   java.time.LocalDate toDay,
                                         @Param("agentIds") UUID[] agentIds);

    /** Counts per priority over a date range. */
    @Query(value = """
            SELECT c.priority, COUNT(*) AS cnt
              FROM case_mgmt.cases c
             WHERE c.created_at::date BETWEEN :fromDay AND :toDay
               AND (
                   COALESCE(array_length(CAST(:agentIds AS uuid[]), 1), 0) = 0
                OR c.assigned_agent_id = ANY(CAST(:agentIds AS uuid[]))
               )
             GROUP BY c.priority
             ORDER BY cnt DESC
            """, nativeQuery = true)
    List<Object[]> findPriorityBreakdown(@Param("fromDay") java.time.LocalDate fromDay,
                                         @Param("toDay")   java.time.LocalDate toDay,
                                         @Param("agentIds") UUID[] agentIds);

    /** Counts open cases per agent for a given candidate set. */
    @Query("""
            SELECT c.assignedAgentId, COUNT(c)
              FROM Case c
             WHERE c.assignedAgentId IN :agentIds
               AND c.status NOT IN (
                   com.customersupport.caseservice.domain.enums.CaseStatus.RESOLVED,
                   com.customersupport.caseservice.domain.enums.CaseStatus.CLOSED
               )
             GROUP BY c.assignedAgentId
            """)
    List<Object[]> countOpenByAssignedAgents(@Param("agentIds") java.util.Collection<UUID> agentIds);
}
