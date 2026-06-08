-- V2: nekoliko uskih grla da panel na dashboardu nije prazan dok
-- detection job ne odradi prvi prolaz.

INSERT INTO bottleneck_detection (
    id, detected_at, bottleneck_type, description,
    affected_entity_type, affected_entity_id,
    metric_value, threshold_value, severity, is_resolved
) VALUES
('aabbccdd-1111-4111-8111-000000000001', NOW() - INTERVAL '30 minutes',
 'HIGH_VOLUME',
 'Inbound case volume in last hour is 2.3× the rolling 24-hour average. Most are NEW + unassigned in Customer Support.',
 'department', '33333333-3333-3333-3333-333333333301',
 18, 8, 'HIGH', false),

('aabbccdd-1111-4111-8111-000000000002', NOW() - INTERVAL '1 hour',
 'SLA_BREACH_RATE',
 'First-response SLA breach rate of 14% in the last 4 hours, exceeding 10% threshold. Concentrated in HIGH-priority cases.',
 'priority', NULL,
 14.00, 10.00, 'MEDIUM', false),

('aabbccdd-1111-4111-8111-000000000003', NOW() - INTERVAL '2 hours',
 'AGENT_OVERLOAD',
 'Marko Markic currently has 9 active cases, near his 10-case capacity. Consider redistributing new HIGH-priority work.',
 'agent', '44444444-4444-4444-4444-444444444401',
 9.00, 8.00, 'MEDIUM', false),

('aabbccdd-1111-4111-8111-000000000004', NOW() - INTERVAL '4 hours',
 'SLOW_RESOLUTION',
 'Average resolution time on Technical category cases trending 38% longer than 7-day baseline. Likely linked to the OAuth and webhook outages.',
 'category', NULL,
 174.5, 126.0, 'HIGH', false),

('aabbccdd-1111-4111-8111-000000000005', NOW() - INTERVAL '8 hours',
 'AGENT_OVERLOAD',
 'Filip Filipic is the only on-shift agent in Technical Operations during evening window. Increase coverage or rotate.',
 'agent', NULL,
 1.00, 2.00, 'LOW', false),

-- Riješeno usko grlo za prikaz povijesti
('aabbccdd-1111-4111-8111-000000000006', NOW() - INTERVAL '2 days',
 'SLA_BREACH_RATE',
 'Resolution-deadline breach spike on Friday afternoon, mitigated by ad-hoc escalation rotation. Tracked for trend analysis.',
 'priority', NULL,
 22.00, 15.00, 'CRITICAL', true)
ON CONFLICT (id) DO NOTHING;

UPDATE bottleneck_detection
   SET resolved_at = NOW() - INTERVAL '1 day' - INTERVAL '6 hours'
 WHERE id = 'aabbccdd-1111-4111-8111-000000000006'
   AND resolved_at IS NULL;
