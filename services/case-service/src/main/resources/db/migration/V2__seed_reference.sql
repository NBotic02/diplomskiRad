-- V2: kategorije, SLA politike i kupci na koje se vežu test case-ovi u V3.

INSERT INTO case_categories (name, description, sort_order) VALUES
    ('Billing',           'Invoices, payments, refunds',           10),
    ('Technical',         'Bugs, errors, integration issues',      20),
    ('Account',           'Login, password, profile management',   30),
    ('Product',           'Feature requests, how-to questions',    40),
    ('Other',             'Uncategorised requests',                90);

INSERT INTO case_categories (name, parent_category_id, description, sort_order)
SELECT 'Refund request', category_id, 'Customer asks for money back', 11
  FROM case_categories WHERE name = 'Billing';
INSERT INTO case_categories (name, parent_category_id, description, sort_order)
SELECT 'Login problem', category_id, 'Cannot sign in or reset password', 31
  FROM case_categories WHERE name = 'Account';
INSERT INTO case_categories (name, parent_category_id, description, sort_order)
SELECT 'API integration', category_id, 'Issues with the public REST API', 21
  FROM case_categories WHERE name = 'Technical';

INSERT INTO sla_policies (name, priority, first_response_minutes, resolution_minutes, business_hours_only) VALUES
    ('Default — critical', 'CRITICAL',  15,  240, false),
    ('Default — high',     'HIGH',      60,  480, true),
    ('Default — medium',   'MEDIUM',   240, 1440, true),
    ('Default — low',      'LOW',      480, 4320, true);

INSERT INTO customers (customer_id, first_name, last_name, email, tier) VALUES
    ('243e0ade-39c4-46ee-862a-9498abf617b4', 'Ana',   'Antic',    'ana.antic@example.com',     'PREMIUM'),
    ('c988b8ed-dc8c-4167-999d-ebe37dca4761', 'Bruno', 'Brkic',    'bruno.brkic@example.com',   'STANDARD'),
    ('195cbe93-92e8-4d6d-ae63-3fa07ffcab31', 'Cvita', 'Cvitanic', 'cvita.cvitanic@example.com','STANDARD'),
    ('0f6de29b-ae8c-4da6-b166-25dd0cf0ddaa', 'Damir', 'Dujmic',   'damir.dujmic@example.com',  'ENTERPRISE'),
    ('038d09e3-3c95-4cfc-bd63-48b933fc6b62', 'Eva',   'Erjavec',  'eva.erjavec@example.com',   'ENTERPRISE');
