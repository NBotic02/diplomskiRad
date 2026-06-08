-- V1: employee schema. Schema kreira docker-entrypoint.

CREATE TABLE departments (
    department_id      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(100) NOT NULL UNIQUE,
    department_lead_id UUID,
    description        TEXT,
    is_active          BOOLEAN      NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE agents (
    agent_id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number      VARCHAR(20)  NOT NULL UNIQUE,
    first_name           VARCHAR(100) NOT NULL,
    last_name            VARCHAR(100) NOT NULL,
    email                VARCHAR(255) NOT NULL UNIQUE,
    phone                VARCHAR(30),
    role                 VARCHAR(20)  NOT NULL DEFAULT 'AGENT'
                         CHECK (role IN ('AGENT','LEAD','ADMIN')),
    hire_date            DATE,
    is_active            BOOLEAN      NOT NULL DEFAULT true,
    max_concurrent_cases INT          NOT NULL DEFAULT 10
                         CHECK (max_concurrent_cases >= 0),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Odgođeni FK jer lead pokazuje na agenta
ALTER TABLE departments
    ADD CONSTRAINT fk_department_lead
    FOREIGN KEY (department_lead_id) REFERENCES agents(agent_id);

CREATE TABLE department_members (
    department_id UUID        NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    agent_id      UUID        NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (department_id, agent_id)
);

CREATE TABLE skills (
    skill_id    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    category    VARCHAR(50),
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT true
);

CREATE TABLE agent_skills (
    agent_id     UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    skill_id     UUID NOT NULL REFERENCES skills(skill_id) ON DELETE CASCADE,
    proficiency  VARCHAR(20) NOT NULL DEFAULT 'BEGINNER'
                 CHECK (proficiency IN ('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT')),
    certified_at DATE,
    PRIMARY KEY (agent_id, skill_id)
);

CREATE TABLE shifts (
    shift_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(50) NOT NULL,
    start_time   TIME        NOT NULL,
    end_time     TIME        NOT NULL,
    days_of_week INT[]       NOT NULL,
    timezone     VARCHAR(50) NOT NULL DEFAULT 'Europe/Zagreb',
    is_overnight BOOLEAN     NOT NULL DEFAULT false,
    is_active    BOOLEAN     NOT NULL DEFAULT true
);

CREATE TABLE agent_schedules (
    schedule_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id       UUID        NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    shift_id       UUID        NOT NULL REFERENCES shifts(shift_id),
    effective_from DATE        NOT NULL,
    effective_to   DATE,
    is_active      BOOLEAN     NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE TABLE schedule_exceptions (
    exception_id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id       UUID        NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    exception_date DATE        NOT NULL,
    exception_type VARCHAR(20) NOT NULL
                   CHECK (exception_type IN ('HOLIDAY','SICK_LEAVE','VACATION','TRAINING','OTHER')),
    reason         TEXT,
    is_approved    BOOLEAN     NOT NULL DEFAULT false,
    approved_by    UUID        REFERENCES agents(agent_id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agent_id, exception_date)
);

CREATE INDEX idx_agents_active          ON agents (is_active);
CREATE INDEX idx_agent_skills_skill     ON agent_skills (skill_id, proficiency);
CREATE INDEX idx_agent_schedules_range  ON agent_schedules (agent_id, effective_from, effective_to);
CREATE INDEX idx_schedule_exceptions_dt ON schedule_exceptions (agent_id, exception_date);
CREATE INDEX idx_department_members_a   ON department_members (agent_id);
