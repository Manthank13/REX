-- supabase/seed.sql

-- Define fixed UUIDs for idempotency
-- Institutions
-- 1. SRM: 11111111-1111-1111-1111-111111111111
-- 2. IITM: 22222222-2222-2222-2222-222222222222
-- 3. Anna Univ: 33333333-3333-3333-3333-333333333333
-- 4. VIT Chennai: 44444444-4444-4444-4444-444444444444
-- 5. SSN: 55555555-5555-5555-5555-555555555555

-- Demo User
-- Demo User ID: dddddddd-dddd-dddd-dddd-dddddddddddd

-- 1. Institutions
INSERT INTO public.institutions (id, name, institution_type, state, district, city, address, website, latitude, longitude, source)
VALUES 
('11111111-1111-1111-1111-111111111111', 'SRM Institute of Science and Technology', 'Private University', 'Tamil Nadu', 'Kanchipuram', 'Chennai', 'Kattankulathur, Chennai, Tamil Nadu 603203', 'srmist.edu.in', 12.8231, 80.0453, 'DEMO_SEED'),
('22222222-2222-2222-2222-222222222222', 'IIT Madras', 'Public Technical University', 'Tamil Nadu', 'Chennai', 'Chennai', 'Indian Institute Of Technology, Chennai, Tamil Nadu 600036', 'iitm.ac.in', 12.9915, 80.2337, 'DEMO_SEED'),
('33333333-3333-3333-3333-333333333333', 'Anna University', 'Public University', 'Tamil Nadu', 'Chennai', 'Chennai', 'Sardar Patel Road, Guindy, Chennai, Tamil Nadu 600025', 'annauniv.edu', 13.0102, 80.2354, 'DEMO_SEED'),
('44444444-4444-4444-4444-444444444444', 'VIT Chennai', 'Private Deemed University', 'Tamil Nadu', 'Kanchipuram', 'Chennai', 'Kelambakkam - Vandalur Rd, Rajan Nagar, Chennai, Tamil Nadu 600127', 'chennai.vit.ac.in', 12.8406, 80.1534, 'DEMO_SEED'),
('55555555-5555-5555-5555-555555555555', 'SSN College of Engineering', 'Private Engineering College', 'Tamil Nadu', 'Kanchipuram', 'Chennai', 'Rajiv Gandhi Salai, Kalavakkam, Tamil Nadu 603110', 'ssn.edu.in', 12.7509, 80.1972, 'DEMO_SEED')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;


-- 2. Demo User (auth.users)
-- We insert directly into auth.users to simulate an identity, bypassing email verification.
-- We must make sure the UUID matches the one we want for our profile.
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'authenticated',
    'authenticated',
    'demo@rex-exchange.local',
    crypt('demo-password-do-not-use', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Account"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;


-- Update the profile that was auto-created by the trigger to be explicitly a demo profile.
-- (Or insert if trigger didn't fire due to replication settings or permissions)
INSERT INTO public.profiles (id, name, email, institution_id, department, year, verified)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd', 
    'Demo Account', 
    'demo@rex-exchange.local', 
    '22222222-2222-2222-2222-222222222222', -- IIT Madras
    'Demo Department', 
    'Senior', 
    true
)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    institution_id = EXCLUDED.institution_id;


-- 3. Meetup Locations
INSERT INTO public.meetup_locations (id, institution_id, name, description, latitude, longitude, is_public)
VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'SRM Main Library', 'Main university library near central block.', 12.8235, 80.0450, true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'SRM Student Activity Center', 'Student activity center and food court.', 12.8240, 80.0460, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'IIT Madras Main Library', 'Central library on campus.', 12.9918, 80.2340, true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name;


-- 4. Resources
-- Resource 1: Raspberry Pi 4 @ IIT Madras
INSERT INTO public.resources (id, owner_id, institution_id, title, description, category, brand, condition, price, exchange_type, status)
VALUES (
    'f1111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222', -- IIT Madras
    'Raspberry Pi 4',
    '8GB Model. Good condition. (This is a DEMO RESOURCE for testing network expansion.)',
    'Electronics',
    'Raspberry Pi Foundation',
    'Good',
    800.00,
    'SELL',
    'ACTIVE'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, institution_id = EXCLUDED.institution_id;

-- Resource 2: Arduino Uno @ SRM
INSERT INTO public.resources (id, owner_id, institution_id, title, description, category, brand, condition, price, exchange_type, status)
VALUES (
    'f2222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111', -- SRM
    'Arduino Uno R3',
    'Genuine board, lightly used. (Demo data)',
    'Electronics',
    'Arduino',
    'Good',
    500.00,
    'SELL',
    'ACTIVE'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, institution_id = EXCLUDED.institution_id;

-- Resource 3: DBMS Textbook @ Anna University
INSERT INTO public.resources (id, owner_id, institution_id, title, description, category, condition, price, exchange_type, status)
VALUES (
    'f3333333-3333-3333-3333-333333333333',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '33333333-3333-3333-3333-333333333333', -- Anna Univ
    'DBMS Textbook',
    'Database Management Systems by Raghu Ramakrishnan. Used for 1 semester. (Demo data)',
    'Books',
    'Good',
    300.00,
    'SELL',
    'ACTIVE'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, institution_id = EXCLUDED.institution_id;

-- Resource 4: Scientific Calculator @ VIT Chennai
INSERT INTO public.resources (id, owner_id, institution_id, title, description, category, brand, condition, price, exchange_type, status)
VALUES (
    'f4444444-4444-4444-4444-444444444444',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444', -- VIT
    'Scientific Calculator',
    'Casio fx-991EX. Borrowing only for exams. (Demo data)',
    'Academic',
    'Casio',
    'Good',
    600.00,
    'BORROW',
    'ACTIVE'
) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, institution_id = EXCLUDED.institution_id;
