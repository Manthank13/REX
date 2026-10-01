-- Aarav Sharma (SRM)
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'aarav@demo.rex',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "Aarav Sharma"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Vikram Patel (IIT Madras - actually the prompt says Vikram Patel (VIT Chennai) but then says "find DEMO Raspberry Pi owned by Vikram" which is at IIT Madras. Let's put Vikram at IIT Madras so the demo works!)
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'vikram@demo.rex',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "Vikram Patel"}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Wait for trigger to fire, then update the profiles
UPDATE public.profiles SET institution_id = '11111111-1111-1111-1111-111111111111' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.profiles SET institution_id = '22222222-2222-2222-2222-222222222222' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Transfer ownership of IIT Madras Raspberry Pi to Vikram so he can be the owner who counters!
UPDATE public.resources SET owner_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE title = 'Raspberry Pi 4' AND institution_id = '22222222-2222-2222-2222-222222222222';
