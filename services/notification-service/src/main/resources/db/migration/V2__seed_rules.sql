-- V2: default pravila koja cron evaluira nad otvorenim case-ovima.
INSERT INTO notification_rules (name, priority, hours_after_creation, action, notification_type, notify_assigned_agent, notify_department_lead) VALUES
    ('Critical SLA approaching',  'CRITICAL', 0, 'REMINDER', 'SLA_WARNING',      true, false),
    ('Critical SLA breached',     'CRITICAL', 1, 'ESCALATE', 'SLA_BREACH',       true, true),
    ('High SLA approaching',      'HIGH',     2, 'REMINDER', 'SLA_WARNING',      true, false),
    ('High SLA breached',         'HIGH',     8, 'ESCALATE', 'SLA_BREACH',       true, true),
    ('Medium SLA approaching',    'MEDIUM',   8, 'REMINDER', 'SLA_WARNING',      true, false),
    ('Low — daily reminder',      'LOW',     48, 'REMINDER', 'CASE_REMINDER',    true, false);
