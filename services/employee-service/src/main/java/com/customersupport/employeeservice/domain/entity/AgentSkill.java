package com.customersupport.employeeservice.domain.entity;

import com.customersupport.employeeservice.domain.enums.ProficiencyLevel;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "agent_skills")
@IdClass(AgentSkill.AgentSkillId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgentSkill {

    @Id
    @Column(name = "agent_id")
    private UUID agentId;

    @Id
    @Column(name = "skill_id")
    private UUID skillId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProficiencyLevel proficiency;

    @Column(name = "certified_at")
    private LocalDate certifiedAt;

    /** Composite-key holder for {@code @IdClass}. */
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    public static class AgentSkillId implements Serializable {
        private UUID agentId;
        private UUID skillId;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof AgentSkillId other)) return false;
            return Objects.equals(agentId, other.agentId)
                && Objects.equals(skillId, other.skillId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(agentId, skillId);
        }
    }
}
