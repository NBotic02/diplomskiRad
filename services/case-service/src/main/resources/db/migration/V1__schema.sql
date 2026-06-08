-- V1: case_mgmt schema. Schema kreira docker-entrypoint, ovdje samo
-- tablice, indeksi i triggeri.

CREATE TABLE customers (
    customer_id  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id  VARCHAR(255) UNIQUE,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL UNIQUE,
    phone        VARCHAR(50),
    company      VARCHAR(255),
    tier         VARCHAR(20)  NOT NULL DEFAULT 'STANDARD'
                 CHECK (tier IN ('STANDARD','PREMIUM','ENTERPRISE')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE case_categories (
    category_id        SERIAL       PRIMARY KEY,
    name               VARCHAR(150) NOT NULL,
    parent_category_id INT          REFERENCES case_categories(category_id) ON DELETE SET NULL,
    description        TEXT,
    is_active          BOOLEAN      NOT NULL DEFAULT true,
    sort_order         INT          NOT NULL DEFAULT 0
);

CREATE TABLE sla_policies (
    policy_id              SERIAL       PRIMARY KEY,
    name                   VARCHAR(150) NOT NULL,
    priority               VARCHAR(20)  NOT NULL
                           CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    first_response_minutes INT          NOT NULL CHECK (first_response_minutes > 0),
    resolution_minutes     INT          NOT NULL CHECK (resolution_minutes > 0),
    business_hours_only    BOOLEAN      NOT NULL DEFAULT true,
    is_active              BOOLEAN      NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE case_number_seq AS BIGINT START WITH 100001;

CREATE TABLE cases (
    case_id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number        BIGINT       NOT NULL UNIQUE DEFAULT nextval('case_number_seq'),
    customer_id        UUID         NOT NULL REFERENCES customers(customer_id),
    category_id        INT          REFERENCES case_categories(category_id),
    subject            VARCHAR(500) NOT NULL,
    description        TEXT,
    priority           VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM'
                       CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    status             VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                       CHECK (status IN ('NEW','OPEN','PENDING','ON_HOLD','PENDING_APPROVAL',
                                         'ESCALATED','RESOLVED','CLOSED','REOPENED')),
    -- assigned_agent_id i team_id su iz employee servisa, bez FK-a
    assigned_agent_id  UUID,
    team_id            UUID,
    reopened_count     INT          NOT NULL DEFAULT 0,
    satisfaction_score SMALLINT     CHECK (satisfaction_score BETWEEN 1 AND 5),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE case_status_history (
    history_id    BIGSERIAL   PRIMARY KEY,
    case_id       UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    from_status   VARCHAR(20)
                  CHECK (from_status IS NULL OR from_status IN
                         ('NEW','OPEN','PENDING','ON_HOLD','PENDING_APPROVAL',
                          'ESCALATED','RESOLVED','CLOSED','REOPENED')),
    to_status     VARCHAR(20) NOT NULL
                  CHECK (to_status IN
                         ('NEW','OPEN','PENDING','ON_HOLD','PENDING_APPROVAL',
                          'ESCALATED','RESOLVED','CLOSED','REOPENED')),
    changed_by    UUID        NOT NULL,
    change_reason TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_communications (
    communication_id UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id          UUID         NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    sender_type      VARCHAR(20)  NOT NULL
                     CHECK (sender_type IN ('CUSTOMER','AGENT','SYSTEM')),
    sender_id        UUID         NOT NULL,
    subject          VARCHAR(500),
    body             TEXT         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE case_attachments (
    attachment_id    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID          NOT NULL REFERENCES case_communications(communication_id) ON DELETE CASCADE,
    file_name        VARCHAR(500)  NOT NULL,
    file_path        VARCHAR(1024) NOT NULL,
    file_size_bytes  BIGINT        NOT NULL CHECK (file_size_bytes >= 0),
    mime_type        VARCHAR(255)  NOT NULL,
    uploaded_by      UUID          NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE case_notes (
    note_id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id    UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    author_id  UUID        NOT NULL,
    content    TEXT        NOT NULL,
    is_pinned  BOOLEAN     NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sla_tracking (
    tracking_id         BIGSERIAL   PRIMARY KEY,
    case_id             UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    sla_policy_id       INT         NOT NULL REFERENCES sla_policies(policy_id),
    sla_status          VARCHAR(20) NOT NULL DEFAULT 'WITHIN_SLA'
                        CHECK (sla_status IN ('WITHIN_SLA','AT_RISK','BREACHED')),
    response_deadline   TIMESTAMPTZ NOT NULL,
    resolution_deadline TIMESTAMPTZ NOT NULL,
    first_response_at   TIMESTAMPTZ,
    response_met        BOOLEAN,
    resolution_met      BOOLEAN,
    breached_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (case_id)
);

CREATE TABLE case_audit_log (
    audit_id   BIGSERIAL   PRIMARY KEY,
    case_id    UUID        NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    operation  VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data   JSONB,
    new_data   JSONB,
    changed_by UUID,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- case_id je NULL ako pad nastane prije kreiranja slučaja
CREATE TABLE workflow_failures (
    failure_id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_name      VARCHAR(100) NOT NULL,
    n8n_execution_id   VARCHAR(100),
    case_id            UUID         REFERENCES cases(case_id) ON DELETE SET NULL,
    failed_node        VARCHAR(100) NOT NULL,
    error_message      TEXT,
    error_payload      JSONB,
    inbound_payload    JSONB,
    case_status_before VARCHAR(20),
    compensated        BOOLEAN      NOT NULL DEFAULT false,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_status           ON cases (status);
CREATE INDEX idx_cases_priority         ON cases (priority);
CREATE INDEX idx_cases_assigned_agent   ON cases (assigned_agent_id);
CREATE INDEX idx_cases_customer         ON cases (customer_id);
CREATE INDEX idx_cases_created_at       ON cases (created_at);
CREATE INDEX idx_cases_open_active      ON cases (status, priority, created_at)
    WHERE status NOT IN ('RESOLVED', 'CLOSED');
CREATE INDEX idx_cases_status_priority  ON cases (status, priority);
CREATE INDEX idx_cases_agent_status     ON cases (assigned_agent_id, status);
CREATE INDEX idx_status_history_case    ON case_status_history (case_id, created_at);
CREATE INDEX idx_communications_case    ON case_communications (case_id, created_at);
CREATE INDEX idx_attachments_comm       ON case_attachments (communication_id);
CREATE INDEX idx_case_notes_case        ON case_notes (case_id);
CREATE INDEX idx_sla_tracking_case      ON sla_tracking (case_id);
CREATE INDEX idx_sla_tracking_policy    ON sla_tracking (sla_policy_id);
CREATE INDEX idx_audit_log_case         ON case_audit_log (case_id);
CREATE INDEX idx_audit_log_changed_at   ON case_audit_log (changed_at);
CREATE INDEX idx_categories_parent      ON case_categories (parent_category_id);
CREATE UNIQUE INDEX idx_customers_email_lower ON customers (LOWER(email));

-- spriječi duplo logiranje istog pada pri retry-u workflowa
CREATE UNIQUE INDEX uq_workflow_failures_exec_node
    ON workflow_failures (n8n_execution_id, failed_node)
    WHERE n8n_execution_id IS NOT NULL;
CREATE INDEX idx_workflow_failures_case    ON workflow_failures (case_id);
CREATE INDEX idx_workflow_failures_created ON workflow_failures (created_at DESC);

-- Trigger: kreiraj sla_tracking redak za svaki novi case
CREATE OR REPLACE FUNCTION create_sla_tracking()
RETURNS TRIGGER AS $$
DECLARE
    v_policy RECORD;
BEGIN
    SELECT * INTO v_policy FROM sla_policies
     WHERE priority = NEW.priority AND is_active = true
     ORDER BY policy_id DESC LIMIT 1;

    IF NOT FOUND THEN RETURN NEW; END IF;

    INSERT INTO sla_tracking (
        case_id, sla_policy_id, sla_status, response_deadline, resolution_deadline
    ) VALUES (
        NEW.case_id, v_policy.policy_id, 'WITHIN_SLA',
        NEW.created_at + make_interval(mins => v_policy.first_response_minutes),
        NEW.created_at + make_interval(mins => v_policy.resolution_minutes)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cases_sla_tracking
    AFTER INSERT ON cases
    FOR EACH ROW EXECUTE FUNCTION create_sla_tracking();

-- Trigger: JSON diff svake promjene case-a u audit log. changed_by se
-- čita iz session varijable app.current_user_id koju postavlja servis.
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data   JSONB := NULL;
    v_new_data   JSONB := NULL;
    v_case_id    UUID;
    v_changed_by UUID;
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_case_id  := OLD.case_id;
    END IF;
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_new_data := to_jsonb(NEW);
        v_case_id  := NEW.case_id;
    END IF;
    BEGIN
        v_changed_by := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    INSERT INTO case_audit_log (case_id, operation, old_data, new_data, changed_by)
    VALUES (v_case_id, TG_OP, v_old_data, v_new_data, v_changed_by);

    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_cases_audit
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
