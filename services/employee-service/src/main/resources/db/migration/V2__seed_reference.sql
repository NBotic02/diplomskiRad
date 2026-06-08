-- V2: vještine, smjene i odjeli.

INSERT INTO skills (skill_id, name, category, description) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Billing',         'category', 'Handles billing-category cases'),
    ('11111111-1111-1111-1111-111111111102', 'Technical',       'category', 'Handles technical-category cases'),
    ('11111111-1111-1111-1111-111111111103', 'Account',         'category', 'Handles account-category cases'),
    ('11111111-1111-1111-1111-111111111104', 'Product',         'category', 'Handles product-category cases'),
    ('11111111-1111-1111-1111-111111111105', 'English',         'language', 'Communicates in English'),
    ('11111111-1111-1111-1111-111111111106', 'Croatian',        'language', 'Communicates in Croatian'),
    ('11111111-1111-1111-1111-111111111107', 'Other',           'category', 'Handles uncategorised cases'),
    ('11111111-1111-1111-1111-111111111108', 'Refund request',  'category', 'Handles refund-request cases'),
    ('11111111-1111-1111-1111-111111111109', 'Login problem',   'category', 'Handles login-problem cases'),
    ('11111111-1111-1111-1111-11111111110A', 'API integration', 'category', 'Handles API-integration cases');

-- ISO 8601: ponedjeljak=1, nedjelja=7
INSERT INTO shifts (shift_id, name, start_time, end_time, days_of_week, timezone, is_overnight) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Morning',       '08:00', '16:00', ARRAY[1,2,3,4,5], 'Europe/Zagreb', false),
    ('22222222-2222-2222-2222-222222222202', 'Evening',       '14:00', '22:00', ARRAY[1,2,3,4,5], 'Europe/Zagreb', false),
    ('33333333-3333-3333-3333-333333333301', 'Night Weekday', '22:00', '06:00', ARRAY[1,2,3,4,5], 'Europe/Zagreb', true),
    ('33333333-3333-3333-3333-333333333302', 'Weekend Day',   '10:00', '18:00', ARRAY[6,7],       'Europe/Zagreb', false),
    ('33333333-3333-3333-3333-333333333303', 'Weekend Night', '22:00', '06:00', ARRAY[6,7],       'Europe/Zagreb', true);

-- Lead-ovi se postavljaju u V3 nakon unosa agenata.
INSERT INTO departments (department_id, name, description) VALUES
    ('33333333-3333-3333-3333-333333333301', 'Customer Support',
     'First-line and escalation support'),
    ('33333333-3333-3333-3333-333333333302', 'Technical Operations',
     'Backend integrations, API support and incident escalation');
