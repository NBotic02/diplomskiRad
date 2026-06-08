-- V1: notification schema. Schema kreira docker-entrypoint.
-- case_id, recipient_id, agent_id su cross-service reference bez FK-a.

CREATE TABLE notification_rules (
    rule_id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name                   VARCHAR(150) NOT NULL,
    priority               VARCHAR(20)  NOT NULL
                           CHECK (priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
    hours_after_creation   INT          NOT NULL CHECK (hours_after_creation >= 0),
    action                 VARCHAR(20)  NOT NULL
                           CHECK (action IN ('NOTIFY','REMINDER','ESCALATE')),
    notification_type      VARCHAR(40)  NOT NULL,
    notify_assigned_agent  BOOLEAN      NOT NULL DEFAULT true,
    notify_department_lead BOOLEAN      NOT NULL DEFAULT false,
    is_active              BOOLEAN      NOT NULL DEFAULT true,
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Bez preferencije se default-a na EMAIL.
CREATE TABLE notification_preferences (
    preference_id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id          UUID        NOT NULL,
    notification_type VARCHAR(40) NOT NULL,
    preferred_channel VARCHAR(20) NOT NULL DEFAULT 'EMAIL'
                      CHECK (preferred_channel IN ('EMAIL','SMS','SLACK')),
    is_enabled        BOOLEAN     NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agent_id, notification_type)
);

CREATE TABLE notifications (
    notification_id UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id         UUID         REFERENCES notification_rules(rule_id),
    case_id         UUID         NOT NULL,
    recipient_id    UUID         NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    channel         VARCHAR(20)  NOT NULL
                    CHECK (channel IN ('EMAIL','SMS','SLACK')),
    subject         VARCHAR(500),
    body            TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','SENT','FAILED')),
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_status_pending ON notifications (status)
    WHERE status = 'PENDING';
CREATE INDEX idx_notif_case           ON notifications (case_id);
CREATE INDEX idx_notif_recipient      ON notifications (recipient_id, created_at);
CREATE INDEX idx_notif_prefs_agent    ON notification_preferences (agent_id);
