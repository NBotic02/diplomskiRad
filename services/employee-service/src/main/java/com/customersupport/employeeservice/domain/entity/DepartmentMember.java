package com.customersupport.employeeservice.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "department_members")
@IdClass(DepartmentMember.DepartmentMemberId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentMember {

    @Id
    @Column(name = "department_id")
    private UUID departmentId;

    @Id
    @Column(name = "agent_id")
    private UUID agentId;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private OffsetDateTime joinedAt;

    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    public static class DepartmentMemberId implements Serializable {
        private UUID departmentId;
        private UUID agentId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof DepartmentMemberId other)) return false;
            return Objects.equals(departmentId, other.departmentId)
                && Objects.equals(agentId, other.agentId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(departmentId, agentId);
        }
    }
}
