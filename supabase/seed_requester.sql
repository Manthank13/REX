-- Seed a second demo user (Requester) from SRM
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'authenticated',
    'authenticated',
    'requester@rex-exchange.local',
    crypt('demo-password-do-not-use', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, email, institution_id, verified, created_at)
VALUES (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    'Demo Requester',
    'requester@rex-exchange.local',
    '11111111-1111-1111-1111-111111111111', -- SRM
    true,
    now()
) ON CONFLICT (id) DO NOTHING;
