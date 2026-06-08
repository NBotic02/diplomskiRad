#!/bin/bash
# =====================================================================
# PostgreSQL bootstrap — runs once on first container start.
# Creates per-service login roles, per-service schemas (with the
# service user as owner), and the shared_types tables consumed by
# all services and by n8n.
# =====================================================================
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- ---------------------------------------------------------------
    -- Per-service login roles (least-privilege: each service has its
    -- own DB user; nothing connects as the admin role at runtime).
    -- ---------------------------------------------------------------
    CREATE ROLE ${CASE_DB_USER}         LOGIN PASSWORD '${CASE_DB_PASSWORD}';
    CREATE ROLE ${EMPLOYEE_DB_USER}     LOGIN PASSWORD '${EMPLOYEE_DB_PASSWORD}';
    CREATE ROLE ${NOTIFICATION_DB_USER} LOGIN PASSWORD '${NOTIFICATION_DB_PASSWORD}';
    CREATE ROLE ${ANALYTICS_DB_USER}    LOGIN PASSWORD '${ANALYTICS_DB_PASSWORD}';
    CREATE ROLE ${N8N_DB_USER}          LOGIN PASSWORD '${N8N_DB_PASSWORD}';

    -- ---------------------------------------------------------------
    -- Schemas — each microservice owns its own schema.
    -- shared_types is owned by admin; services receive explicit grants.
    -- ---------------------------------------------------------------
    CREATE SCHEMA shared_types;
    CREATE SCHEMA case_mgmt    AUTHORIZATION ${CASE_DB_USER};
    CREATE SCHEMA employee     AUTHORIZATION ${EMPLOYEE_DB_USER};
    CREATE SCHEMA notification AUTHORIZATION ${NOTIFICATION_DB_USER};
    CREATE SCHEMA analytics    AUTHORIZATION ${ANALYTICS_DB_USER};
    CREATE SCHEMA n8n          AUTHORIZATION ${N8N_DB_USER};

    GRANT USAGE ON SCHEMA shared_types
        TO ${CASE_DB_USER}, ${EMPLOYEE_DB_USER}, ${NOTIFICATION_DB_USER},
           ${ANALYTICS_DB_USER}, ${N8N_DB_USER};

    -- n8n issues CREATE SCHEMA IF NOT EXISTS on every startup (TypeORM default).
    -- PostgreSQL checks the CREATE-on-database privilege before the IF NOT EXISTS
    -- clause, so n8n_service must hold it even though the schema already exists.
    GRANT CREATE ON DATABASE ${POSTGRES_DB} TO ${N8N_DB_USER};

    -- ---------------------------------------------------------------
    -- shared_types.outbox_events — transactional outbox.
    -- All services INSERT events here within their business transaction.
    -- n8n polls and publishes them to RabbitMQ / external systems.
    -- ---------------------------------------------------------------
    CREATE TABLE shared_types.outbox_events (
        event_id       UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
        aggregate_type VARCHAR(100) NOT NULL,
        aggregate_id   UUID         NOT NULL,
        event_type     VARCHAR(100) NOT NULL,
        payload        JSONB        NOT NULL,
        metadata       JSONB        DEFAULT '{}',
        created_at     TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
        published_at   TIMESTAMPTZ,
        status         VARCHAR(20)  DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
        retry_count    INTEGER      DEFAULT 0,
        last_error     TEXT
    );

    CREATE INDEX idx_outbox_pending
        ON shared_types.outbox_events (created_at)
        WHERE status = 'PENDING';

    CREATE INDEX idx_outbox_aggregate
        ON shared_types.outbox_events (aggregate_type, aggregate_id);

    -- ---------------------------------------------------------------
    -- shared_types.workflow_error_log — failed n8n executions.
    -- ---------------------------------------------------------------
    CREATE TABLE shared_types.workflow_error_log (
        id            BIGSERIAL    PRIMARY KEY,
        workflow_name VARCHAR(255),
        execution_id  VARCHAR(100),
        failed_node   VARCHAR(255),
        error_message TEXT,
        error_data    JSONB,
        severity      VARCHAR(20)  DEFAULT 'ERROR',
        created_at    TIMESTAMPTZ  DEFAULT NOW(),
        resolved_at   TIMESTAMPTZ
    );

    -- Each service runs its own publisher: INSERT events for its aggregates,
    -- SELECT FOR UPDATE SKIP LOCKED them, and UPDATE the row to PUBLISHED/FAILED.
    -- Services filter by aggregate_type at the application layer so they
    -- only pick up rows they themselves recorded.
    GRANT INSERT, SELECT, UPDATE ON shared_types.outbox_events
        TO ${CASE_DB_USER}, ${EMPLOYEE_DB_USER}, ${NOTIFICATION_DB_USER}, ${ANALYTICS_DB_USER};
    GRANT SELECT, UPDATE ON shared_types.outbox_events TO ${N8N_DB_USER};

    -- n8n owns the workflow error log.
    GRANT INSERT, SELECT, UPDATE ON shared_types.workflow_error_log TO ${N8N_DB_USER};
    GRANT USAGE, SELECT ON SEQUENCE shared_types.workflow_error_log_id_seq TO ${N8N_DB_USER};
EOSQL

echo "Bootstrap complete — schemas, roles and shared_types tables created."
