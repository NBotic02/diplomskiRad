-- V1: analytics schema (CQRS read model). Puni se preko RabbitMQ
-- listenera i scheduled bottleneck job-a.

CREATE TABLE daily_case_metrics (
    id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date                DATE         NOT NULL UNIQUE,
    total_created              INT          NOT NULL DEFAULT 0,
    total_resolved             INT          NOT NULL DEFAULT 0,
    total_escalated            INT          NOT NULL DEFAULT 0,
    total_reopened             INT          NOT NULL DEFAULT 0,
    auto_resolved              INT          NOT NULL DEFAULT 0,
    avg_first_response_minutes NUMERIC(10,2),
    avg_resolution_minutes     NUMERIC(10,2),
    sla_compliance_rate        NUMERIC(5,2),
    customer_satisfaction_avg  NUMERIC(3,2),
    cases_by_priority          JSONB        NOT NULL DEFAULT '{}',
    cases_by_category          JSONB        NOT NULL DEFAULT '{}',
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_performance_metrics (
    id                         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id                   UUID         NOT NULL,
    period_start               DATE         NOT NULL,
    period_type                VARCHAR(10)  NOT NULL
                               CHECK (period_type IN ('DAILY','WEEKLY','MONTHLY')),
    cases_assigned             INT          NOT NULL DEFAULT 0,
    cases_resolved             INT          NOT NULL DEFAULT 0,
    cases_escalated            INT          NOT NULL DEFAULT 0,
    avg_resolution_minutes     NUMERIC(10,2),
    avg_first_response_minutes NUMERIC(10,2),
    sla_compliance_rate        NUMERIC(5,2),
    customer_satisfaction_avg  NUMERIC(3,2),
    created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (agent_id, period_start, period_type)
);

CREATE TABLE bottleneck_detection (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    detected_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    bottleneck_type      VARCHAR(50)  NOT NULL,
    description          TEXT         NOT NULL,
    affected_entity_type VARCHAR(50),
    affected_entity_id   UUID,
    metric_value         NUMERIC(12,2) NOT NULL,
    threshold_value      NUMERIC(12,2) NOT NULL,
    severity             VARCHAR(20)  NOT NULL
                         CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    is_resolved          BOOLEAN      NOT NULL DEFAULT false,
    resolved_at          TIMESTAMPTZ
);

CREATE INDEX idx_daily_metrics_date    ON daily_case_metrics (metric_date);
CREATE INDEX idx_agent_perf_period     ON agent_performance_metrics (agent_id, period_start);
CREATE INDEX idx_agent_perf_period_type ON agent_performance_metrics (period_type, period_start);
CREATE INDEX idx_bottleneck_unresolved ON bottleneck_detection (detected_at)
    WHERE is_resolved = false;
CREATE INDEX idx_bottleneck_type       ON bottleneck_detection (bottleneck_type);
