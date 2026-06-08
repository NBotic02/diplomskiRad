-- V3: demo case-ovi, komunikacija i bilješke. UUID-evi su deterministički
-- pa V2/V3 employee servisa znaju na koga referirati.

-- Customer Support (aaaa-*)
INSERT INTO cases (
    case_id, customer_id, category_id, subject, description,
    priority, status, assigned_agent_id, team_id, reopened_count,
    created_at, updated_at
) VALUES
-- NEW
('aaaaaaaa-1111-4111-8111-000000000001',
 '243e0ade-39c4-46ee-862a-9498abf617b4', 1,
 'Charged twice for last month''s subscription',
 'I see two identical $29 charges on my card statement for last month — could you check if one is a duplicate? Order numbers attached.',
 'HIGH',     'NEW',
 NULL, '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '12 minutes',  NOW() - INTERVAL '12 minutes'),

('aaaaaaaa-1111-4111-8111-000000000002',
 'c988b8ed-dc8c-4167-999d-ebe37dca4761', 4,
 'Wrong size shipped — need exchange',
 'I ordered the merino sweater in M but received an L. Could you arrange an exchange? Order #12877.',
 'MEDIUM',   'NEW',
 NULL, '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '38 minutes',  NOW() - INTERVAL '38 minutes'),

('aaaaaaaa-1111-4111-8111-000000000003',
 '195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 7,
 'Cannot log in — password reset email not arriving',
 'I''ve requested a reset 3 times in the last 10 minutes and nothing arrived (also checked spam). Help?',
 'HIGH',     'NEW',
 NULL, '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '4 minutes',   NOW() - INTERVAL '4 minutes'),

-- OPEN
('aaaaaaaa-2222-4222-8222-000000000004',
 '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa', 2,
 'Mobile app crashes on checkout (iOS 17.4)',
 'Reproducible: add 2 items, tap Pay → instant crash. iPhone 14, iOS 17.4, app v3.8.1.',
 'HIGH',     'OPEN',
 '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '2 hours',     NOW() - INTERVAL '40 minutes'),

('aaaaaaaa-2222-4222-8222-000000000005',
 '038d09e3-3c95-4cfc-bd63-48b933fc6b62', 8,
 'API 429 errors after upgrading to Business plan',
 'After the upgrade we''re still getting rate-limited at 60 req/min instead of 600. Please check the entitlement.',
 'MEDIUM',   'OPEN',
 '44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '5 hours',     NOW() - INTERVAL '1 hour'),

('aaaaaaaa-2222-4222-8222-000000000006',
 '243e0ade-39c4-46ee-862a-9498abf617b4', 1,
 'Refund not received after 7 days',
 'You confirmed a refund last Wednesday but my bank still shows nothing. Can you trace?',
 'MEDIUM',   'OPEN',
 '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '1 day',       NOW() - INTERVAL '6 hours'),

-- PENDING
('aaaaaaaa-3333-4333-8333-000000000007',
 'c988b8ed-dc8c-4167-999d-ebe37dca4761', 3,
 'Account merge — duplicate signup',
 'I created two accounts by mistake. Asked the customer for the other order numbers; awaiting reply.',
 'LOW',      'PENDING',
 '44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '2 days',      NOW() - INTERVAL '20 hours'),

-- PENDING_APPROVAL
('aaaaaaaa-4444-4444-8444-000000000008',
 '195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 4,
 'Damaged item — replacement shipped, awaiting close',
 'Replacement was dispatched yesterday with tracking ZH9981. I''d like to mark this resolved pending lead approval.',
 'MEDIUM',   'PENDING_APPROVAL',
 '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '3 days',      NOW() - INTERVAL '90 minutes'),

('aaaaaaaa-4444-4444-8444-000000000009',
 '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa', 1,
 'Annual plan downgrade — pro-rated refund processed',
 'Customer is downgrading from Business to Standard. Refund of $148 issued; please review and approve.',
 'LOW',      'PENDING_APPROVAL',
 '44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '1 day',       NOW() - INTERVAL '30 minutes'),

-- ESCALATED
('aaaaaaaa-5555-4555-8555-000000000010',
 '038d09e3-3c95-4cfc-bd63-48b933fc6b62', 2,
 'Production outage — webhooks not firing for 4h',
 'Customer''s integration has been silent since 06:00 UTC. SEV-2. Ops paging needed.',
 'CRITICAL', 'ESCALATED',
 '44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '4 hours',     NOW() - INTERVAL '15 minutes'),

('aaaaaaaa-5555-4555-8555-000000000011',
 '243e0ade-39c4-46ee-862a-9498abf617b4', 5,
 'Counterfeit product complaint — luxury handbag',
 'Customer sent photos suggesting the bag isn''t authentic. Forwarded to authentication team.',
 'HIGH',     'ESCALATED',
 '44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '6 hours',     NOW() - INTERVAL '2 hours'),

-- RESOLVED
('aaaaaaaa-6666-4666-8666-000000000012',
 'c988b8ed-dc8c-4167-999d-ebe37dca4761', 7,
 'Forgot 2FA recovery codes — identity verified',
 'Verified ID, reset 2FA, account restored. Customer confirmed working.',
 'MEDIUM',   'RESOLVED',
 '44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '7 days',      NOW() - INTERVAL '5 days'),

('aaaaaaaa-6666-4666-8666-000000000013',
 '195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 6,
 'Refund for cancelled order — completed',
 '$87.50 refunded to original card. Confirmation email sent.',
 'LOW',      'RESOLVED',
 '44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 0,
 NOW() - INTERVAL '4 days',      NOW() - INTERVAL '3 days')
ON CONFLICT (case_id) DO NOTHING;

-- Technical Operations (bbbb-*)
INSERT INTO cases (
    case_id, customer_id, category_id, subject, description,
    priority, status, assigned_agent_id, team_id, reopened_count,
    created_at, updated_at
) VALUES
-- NEW
('bbbbbbbb-1111-4111-8111-000000000001',
 '243e0ade-39c4-46ee-862a-9498abf617b4', 8,
 'Webhook signature mismatch on payment events',
 'Our HMAC-SHA256 verification fails on every payment event since 09:00 UTC. Other event types verify fine.',
 'CRITICAL', 'NEW',
 NULL, '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '8 minutes',  NOW() - INTERVAL '8 minutes'),

('bbbbbbbb-1111-4111-8111-000000000002',
 'c988b8ed-dc8c-4167-999d-ebe37dca4761', 8,
 'GraphQL mutation returns 500 with vague error',
 'POST /graphql with createSubscription mutation returns 500 "internal server error". Worked yesterday.',
 'HIGH',     'NEW',
 NULL, '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),

-- OPEN
('bbbbbbbb-2222-4222-8222-000000000003',
 '195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 2,
 'OAuth callback redirects to wrong URL after login',
 'Our staging app redirects to https://prod.example.com after Auth0 callback instead of the configured staging URL.',
 'HIGH',     'OPEN',
 '44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '3 hours',    NOW() - INTERVAL '20 minutes'),

('bbbbbbbb-2222-4222-8222-000000000004',
 '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa', 8,
 'API rate limit incorrectly applied during burst',
 'We see 429s during 30-second bursts even though our average is well below 600 req/min on Business plan.',
 'MEDIUM',   'OPEN',
 '44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '6 hours',    NOW() - INTERVAL '1 hour'),

('bbbbbbbb-2222-4222-8222-000000000005',
 '038d09e3-3c95-4cfc-bd63-48b933fc6b62', 2,
 'iOS app push notifications stopped arriving',
 'Devices receive notifications on Android but not iOS for the same APNs payload. Started after our last release.',
 'HIGH',     'OPEN',
 '44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '1 day',      NOW() - INTERVAL '4 hours'),

-- PENDING_APPROVAL
('bbbbbbbb-4444-4444-8444-000000000006',
 'c988b8ed-dc8c-4167-999d-ebe37dca4761', 4,
 'Resolved: webhook retry exhausted — manual replay completed',
 'Customer''s payment events failed verification due to a clock skew on their server; helped them adjust NTP and replayed the missed events.',
 'MEDIUM',   'PENDING_APPROVAL',
 '44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '2 days',     NOW() - INTERVAL '45 minutes'),

-- ESCALATED
('bbbbbbbb-5555-4555-8555-000000000007',
 '038d09e3-3c95-4cfc-bd63-48b933fc6b62', 2,
 'Multi-tenant data leak suspicion — needs review',
 'Customer reports seeing another tenant''s case in their export. Logs are being preserved; please review immediately.',
 'CRITICAL', 'ESCALATED',
 '44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '20 minutes'),

-- RESOLVED
('bbbbbbbb-6666-4666-8666-000000000008',
 '195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 8,
 'API key rotation procedure documented',
 'Walked customer through rotating their API key without downtime via the dual-key window. Updated KB article.',
 'LOW',      'RESOLVED',
 '44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 0,
 NOW() - INTERVAL '5 days',     NOW() - INTERVAL '3 days')
ON CONFLICT (case_id) DO NOTHING;

-- Inicijalni unos u status history da timeline ne bude prazan
INSERT INTO case_status_history (case_id, from_status, to_status, changed_by, change_reason)
SELECT case_id, NULL, status, '00000000-0000-0000-0000-000000000001', 'Seeded for demo'
  FROM cases
 WHERE case_id::text LIKE 'aaaaaaaa-%-%-%-%'
    OR case_id::text LIKE 'bbbbbbbb-%-%-%-%'
   AND NOT EXISTS (
       SELECT 1 FROM case_status_history h WHERE h.case_id = cases.case_id
   );

-- Komunikacija
INSERT INTO case_communications (communication_id, case_id, sender_type, sender_id, subject, body, created_at) VALUES
-- Customer Support, samo ulazne (NEW)
('e0000001-0000-4000-8000-000000000001', 'aaaaaaaa-1111-4111-8111-000000000001',
 'CUSTOMER', '243e0ade-39c4-46ee-862a-9498abf617b4',
 'Charged twice for last month''s subscription',
 'Hi, I was just looking at my card statement and I see two identical $29 charges from your store on October 12. Order numbers attached: #18841 and #18842. Could you check whether one of them is a duplicate? Thanks, Ana',
 NOW() - INTERVAL '12 minutes'),

('e0000001-0000-4000-8000-000000000002', 'aaaaaaaa-1111-4111-8111-000000000002',
 'CUSTOMER', 'c988b8ed-dc8c-4167-999d-ebe37dca4761',
 'Wrong size shipped — need exchange',
 'Hello, I ordered the merino sweater in size M but the parcel I received contains an L. Order #12877. Could you please arrange an exchange? Bruno',
 NOW() - INTERVAL '38 minutes'),

('e0000001-0000-4000-8000-000000000003', 'aaaaaaaa-1111-4111-8111-000000000003',
 'CUSTOMER', '195cbe93-92e8-4d6d-ae63-3fa07ffcab31',
 'Cannot log in — password reset email not arriving',
 'I''ve requested password reset 3 times in the last 10 minutes and nothing has arrived. Already checked spam. Help? — Cvita',
 NOW() - INTERVAL '4 minutes'),

-- OPEN, customer + agent
('e0000001-0000-4000-8000-000000000004', 'aaaaaaaa-2222-4222-8222-000000000004',
 'CUSTOMER', '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa',
 'Mobile app crashes on checkout (iOS 17.4)',
 'Reproducible: add 2 items to cart, tap Pay → instant crash. iPhone 14, iOS 17.4, app v3.8.1. Damir',
 NOW() - INTERVAL '2 hours'),
('e0000001-0000-4000-8000-000000000005', 'aaaaaaaa-2222-4222-8222-000000000004',
 'AGENT', '44444444-4444-4444-4444-444444444401',
 'Re: Mobile app crashes on checkout (iOS 17.4)',
 'Hi Damir, thanks for the report. Engineering pushed a hotfix to TestFlight this afternoon — could you please try v3.8.2 and let us know? — Marko',
 NOW() - INTERVAL '40 minutes'),

('e0000001-0000-4000-8000-000000000006', 'aaaaaaaa-2222-4222-8222-000000000005',
 'CUSTOMER', '038d09e3-3c95-4cfc-bd63-48b933fc6b62',
 'API 429 errors after upgrading to Business plan',
 'After the upgrade we''re still getting rate-limited at 60 req/min instead of the 600 req/min the Business plan promises. — Eva',
 NOW() - INTERVAL '5 hours'),
('e0000001-0000-4000-8000-000000000007', 'aaaaaaaa-2222-4222-8222-000000000005',
 'AGENT', '44444444-4444-4444-4444-444444444402',
 'Re: API 429 errors after upgrading to Business plan',
 'Hi Eva, the upgrade did go through but our cache lagged behind. I''ve forced a refresh; please retry now. — Iva',
 NOW() - INTERVAL '1 hour'),

('e0000001-0000-4000-8000-000000000008', 'aaaaaaaa-2222-4222-8222-000000000006',
 'CUSTOMER', '243e0ade-39c4-46ee-862a-9498abf617b4',
 'Refund not received after 7 days',
 'You confirmed a refund last Wednesday but my bank still shows nothing. Could you trace where it''s stuck? — Ana',
 NOW() - INTERVAL '1 day'),
('e0000001-0000-4000-8000-000000000009', 'aaaaaaaa-2222-4222-8222-000000000006',
 'AGENT', '44444444-4444-4444-4444-444444444401',
 'Re: Refund not received after 7 days',
 'Hi Ana, the refund was issued but the acquirer flagged it for verification. I''ve resubmitted; should land within 2 business days. — Marko',
 NOW() - INTERVAL '6 hours'),

-- PENDING
('e0000001-0000-4000-8000-000000000010', 'aaaaaaaa-3333-4333-8333-000000000007',
 'CUSTOMER', 'c988b8ed-dc8c-4167-999d-ebe37dca4761',
 'Account merge — duplicate signup',
 'I think I created two accounts by mistake using the same email. Could you merge them? — Bruno',
 NOW() - INTERVAL '2 days'),
('e0000001-0000-4000-8000-000000000011', 'aaaaaaaa-3333-4333-8333-000000000007',
 'AGENT', '44444444-4444-4444-4444-444444444402',
 'Re: Account merge — duplicate signup',
 'Hi Bruno, could you list the order numbers from the second account so I can confirm before merging? — Iva',
 NOW() - INTERVAL '20 hours'),

-- PENDING_APPROVAL
('e0000001-0000-4000-8000-000000000012', 'aaaaaaaa-4444-4444-8444-000000000008',
 'CUSTOMER', '195cbe93-92e8-4d6d-ae63-3fa07ffcab31',
 'Item arrived damaged — need replacement',
 'The lamp I ordered (#19284) arrived with the shade cracked. Could you ship a replacement? — Cvita',
 NOW() - INTERVAL '3 days'),
('e0000001-0000-4000-8000-000000000013', 'aaaaaaaa-4444-4444-8444-000000000008',
 'AGENT', '44444444-4444-4444-4444-444444444401',
 'Re: Item arrived damaged — need replacement',
 'Hi Cvita, sorry about that. A replacement is on the way with tracking ZH9981. — Marko',
 NOW() - INTERVAL '2 days'),

('e0000001-0000-4000-8000-000000000014', 'aaaaaaaa-4444-4444-8444-000000000009',
 'CUSTOMER', '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa',
 'Downgrade Business → Standard with pro-rated refund',
 'Hi, we''d like to downgrade from Business to Standard for the rest of the year. Could you process a pro-rated refund? — Damir',
 NOW() - INTERVAL '1 day' - INTERVAL '4 hours'),
('e0000001-0000-4000-8000-000000000015', 'aaaaaaaa-4444-4444-8444-000000000009',
 'AGENT', '44444444-4444-4444-4444-444444444402',
 'Re: Downgrade Business → Standard with pro-rated refund',
 'Hi Damir, downgraded effective today, $148 refunded to the original card. — Iva',
 NOW() - INTERVAL '1 day'),

-- ESCALATED
('e0000001-0000-4000-8000-000000000016', 'aaaaaaaa-5555-4555-8555-000000000010',
 'CUSTOMER', '038d09e3-3c95-4cfc-bd63-48b933fc6b62',
 'Production outage — webhooks down for 4h',
 'Webhooks have been silent since 06:00 UTC. SEV-2 on our side. Need urgent help. — Eva',
 NOW() - INTERVAL '4 hours'),
('e0000001-0000-4000-8000-000000000017', 'aaaaaaaa-5555-4555-8555-000000000010',
 'AGENT', '44444444-4444-4444-4444-444444444403',
 'Re: Production outage — webhooks down for 4h',
 'Hi Eva, escalated to Ops, paging on-call now. Will update every 30 minutes until resolved. — Petar',
 NOW() - INTERVAL '15 minutes'),

('e0000001-0000-4000-8000-000000000018', 'aaaaaaaa-5555-4555-8555-000000000011',
 'CUSTOMER', '243e0ade-39c4-46ee-862a-9498abf617b4',
 'Possible counterfeit — luxury handbag authentication request',
 'I think the bag I just received isn''t authentic. Stitching is uneven and the date code doesn''t match. — Ana',
 NOW() - INTERVAL '6 hours'),
('e0000001-0000-4000-8000-000000000019', 'aaaaaaaa-5555-4555-8555-000000000011',
 'AGENT', '44444444-4444-4444-4444-444444444403',
 'Re: Possible counterfeit — luxury handbag authentication request',
 'Hi Ana, forwarded photos to our authentication team. We''ll have an answer within 1 business day. — Petar',
 NOW() - INTERVAL '2 hours'),

-- RESOLVED
('e0000001-0000-4000-8000-000000000020', 'aaaaaaaa-6666-4666-8666-000000000012',
 'CUSTOMER', 'c988b8ed-dc8c-4167-999d-ebe37dca4761',
 'Lost 2FA device, no recovery codes either',
 'I got a new phone and lost both my Google Authenticator and the recovery codes. Help? — Bruno',
 NOW() - INTERVAL '7 days'),
('e0000001-0000-4000-8000-000000000021', 'aaaaaaaa-6666-4666-8666-000000000012',
 'AGENT', '44444444-4444-4444-4444-444444444401',
 'Re: Lost 2FA device, no recovery codes either',
 'Hi Bruno, identity verified via government ID. 2FA reset, account access restored. — Marko',
 NOW() - INTERVAL '5 days'),

('e0000001-0000-4000-8000-000000000022', 'aaaaaaaa-6666-4666-8666-000000000013',
 'CUSTOMER', '195cbe93-92e8-4d6d-ae63-3fa07ffcab31',
 'Refund for cancelled order',
 'Cancelled order #19102 yesterday but no refund yet. — Cvita',
 NOW() - INTERVAL '4 days'),
('e0000001-0000-4000-8000-000000000023', 'aaaaaaaa-6666-4666-8666-000000000013',
 'AGENT', '44444444-4444-4444-4444-444444444402',
 'Re: Refund for cancelled order',
 'Hi Cvita, $87.50 refunded to original card. Confirmation email on its way. — Iva',
 NOW() - INTERVAL '3 days'),

-- Technical Operations
('e0000002-0000-4000-8000-000000000001', 'bbbbbbbb-1111-4111-8111-000000000001',
 'CUSTOMER', '243e0ade-39c4-46ee-862a-9498abf617b4',
 'Webhook HMAC mismatch on payment events',
 'Our HMAC-SHA256 verification has been failing on every payment event since 09:00 UTC. — Ana',
 NOW() - INTERVAL '8 minutes'),

('e0000002-0000-4000-8000-000000000002', 'bbbbbbbb-1111-4111-8111-000000000002',
 'CUSTOMER', 'c988b8ed-dc8c-4167-999d-ebe37dca4761',
 'GraphQL createSubscription 500',
 'POST /graphql with the createSubscription mutation returns 500 reliably since this morning. — Bruno',
 NOW() - INTERVAL '25 minutes'),

('e0000002-0000-4000-8000-000000000003', 'bbbbbbbb-2222-4222-8222-000000000003',
 'CUSTOMER', '195cbe93-92e8-4d6d-ae63-3fa07ffcab31',
 'OAuth callback redirects to wrong URL after login',
 'Our staging Auth0 redirects to https://prod.example.com after callback. — Cvita',
 NOW() - INTERVAL '3 hours'),
('e0000002-0000-4000-8000-000000000004', 'bbbbbbbb-2222-4222-8222-000000000003',
 'AGENT', '44444444-4444-4444-4444-444444444405',
 'Re: OAuth callback redirects to wrong URL after login',
 'Hi Cvita, looking into your tenant config — the staging callback URL was overwritten. Will fix and confirm. — Tomislav',
 NOW() - INTERVAL '20 minutes'),

('e0000002-0000-4000-8000-000000000005', 'bbbbbbbb-2222-4222-8222-000000000004',
 'CUSTOMER', '0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa',
 'API rate limit incorrectly applied during burst',
 'We see 429s during 30-second bursts even though our average is well below 600 req/min. — Damir',
 NOW() - INTERVAL '6 hours'),
('e0000002-0000-4000-8000-000000000006', 'bbbbbbbb-2222-4222-8222-000000000004',
 'AGENT', '44444444-4444-4444-4444-444444444406',
 'Re: API rate limit incorrectly applied during burst',
 'Hi Damir, we use a token-bucket with 100 burst capacity. I can request a higher budget for your account. — Maja',
 NOW() - INTERVAL '1 hour'),

('e0000002-0000-4000-8000-000000000007', 'bbbbbbbb-2222-4222-8222-000000000005',
 'CUSTOMER', '038d09e3-3c95-4cfc-bd63-48b933fc6b62',
 'iOS push notifications stopped arriving',
 'Devices receive notifications on Android but not iOS for the same APNs payload. — Eva',
 NOW() - INTERVAL '1 day'),

('e0000002-0000-4000-8000-000000000008', 'bbbbbbbb-4444-4444-8444-000000000006',
 'CUSTOMER', 'c988b8ed-dc8c-4167-999d-ebe37dca4761',
 'Payment webhooks failing — please replay missed events',
 'We had a clock skew on our server which caused HMAC verification to fail. Server is fixed now; please replay. — Bruno',
 NOW() - INTERVAL '2 days'),
('e0000002-0000-4000-8000-000000000009', 'bbbbbbbb-4444-4444-8444-000000000006',
 'AGENT', '44444444-4444-4444-4444-444444444406',
 'Re: Payment webhooks failing — please replay missed events',
 'Hi Bruno, I''ve replayed the 47 events from your retry queue. All delivered successfully. — Maja',
 NOW() - INTERVAL '45 minutes'),

('e0000002-0000-4000-8000-000000000010', 'bbbbbbbb-5555-4555-8555-000000000007',
 'CUSTOMER', '038d09e3-3c95-4cfc-bd63-48b933fc6b62',
 'URGENT — possible cross-tenant data leak in export',
 'When I exported my cases this morning, I see one entry that doesn''t belong to my tenant. — Eva',
 NOW() - INTERVAL '90 minutes'),
('e0000002-0000-4000-8000-000000000011', 'bbbbbbbb-5555-4555-8555-000000000007',
 'AGENT', '44444444-4444-4444-4444-444444444404',
 'Re: URGENT — possible cross-tenant data leak in export',
 'Hi Eva, escalated to security team immediately. Logs preserved, audit underway. — Ana',
 NOW() - INTERVAL '20 minutes'),

('e0000002-0000-4000-8000-000000000012', 'bbbbbbbb-6666-4666-8666-000000000008',
 'CUSTOMER', '195cbe93-92e8-4d6d-ae63-3fa07ffcab31',
 'How to rotate API key without downtime',
 'Need to rotate our production API key but worried about downtime. Best practice? — Cvita',
 NOW() - INTERVAL '5 days'),
('e0000002-0000-4000-8000-000000000013', 'bbbbbbbb-6666-4666-8666-000000000008',
 'AGENT', '44444444-4444-4444-4444-444444444405',
 'Re: How to rotate API key without downtime',
 'Hi Cvita, use the dual-key window: create the new key, deploy it, verify traffic, then revoke the old one. — Tomislav',
 NOW() - INTERVAL '3 days')
ON CONFLICT (communication_id) DO NOTHING;

-- Bilješke za PENDING_APPROVAL (agent → lead)
INSERT INTO case_notes (note_id, case_id, author_id, content, is_pinned, created_at) VALUES
('f0000001-0000-4000-8000-000000000001', 'aaaaaaaa-4444-4444-8444-000000000008',
 '44444444-4444-4444-4444-444444444401',
 E'Submitting for approval.\n\n- Customer reported damaged item with photo evidence (lamp shade cracked)\n- Replacement shipped tracking ZH9981 (free shipping per damaged-goods policy)\n- Customer not asked to return broken unit\n\nReady to mark RESOLVED on lead approval.',
 true,
 NOW() - INTERVAL '90 minutes'),

('f0000001-0000-4000-8000-000000000002', 'aaaaaaaa-4444-4444-8444-000000000009',
 '44444444-4444-4444-4444-444444444402',
 E'Submitting for approval.\n\n- Customer requested downgrade Business -> Standard\n- Calculated pro-rated refund: $148 (2.5 months unused)\n- Refund processed to original card, plan downgrade effective today\n\nReady to RESOLVE.',
 true,
 NOW() - INTERVAL '30 minutes'),

('f0000001-0000-4000-8000-000000000003', 'bbbbbbbb-4444-4444-8444-000000000006',
 '44444444-4444-4444-4444-444444444406',
 E'Submitting for approval.\n\n- Root cause: customer clock skew (~4 minutes) caused HMAC timestamp validation to fail\n- Helped customer adjust NTP sync\n- Replayed 47 missed events from retry queue, all 47 confirmed delivered\n\nReady to RESOLVE.',
 true,
 NOW() - INTERVAL '45 minutes')
ON CONFLICT (note_id) DO NOTHING;
