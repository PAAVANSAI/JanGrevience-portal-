-- Script to generate 15 officers for each department
-- Run this in the Supabase SQL Editor.

DO $$
DECLARE
    dept RECORD;
    v_user_id UUID;
    v_email TEXT;
    v_name TEXT;
    v_phone TEXT;
    i INT;
    v_encrypted_password TEXT;
BEGIN
    -- Use a standard password for all generated officers (e.g., 'password123')
    -- Generating hash once to save time
    v_encrypted_password := crypt('password123', gen_salt('bf'));

    -- Loop through all active departments
    FOR dept IN SELECT id, name FROM public.departments WHERE is_active = true LOOP
        
        RAISE NOTICE 'Creating 15 officers for department: %', dept.name;

        -- Create 15 officers for this department
        FOR i IN 1..15 LOOP
            v_user_id := gen_random_uuid();
            
            -- Remove spaces and special chars from dept name for email
            v_email := lower(regexp_replace(dept.name, '[^a-zA-Z0-9]', '', 'g')) || '_officer_' || i || '@example.com';
            v_name := dept.name || ' Officer ' || i;
            v_phone := '9' || lpad((floor(random() * 1000000000))::text, 9, '0');

            -- 1. Insert into auth.users (This will trigger the handle_new_user trigger which creates a profile)
            INSERT INTO auth.users (
                id,
                instance_id,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                role
            ) VALUES (
                v_user_id,
                '00000000-0000-0000-0000-000000000000',
                v_email,
                v_encrypted_password,
                NOW(),
                '{"provider": "email", "providers": ["email"]}'::jsonb,
                jsonb_build_object('full_name', v_name, 'phone', v_phone),
                NOW(),
                NOW(),
                'authenticated'
            );

            -- 2. Update the profile to set the role to 'OFFICER' and assign the department_id
            -- (The profile was created automatically by the trigger with role 'CITIZEN' by default)
            UPDATE public.profiles
            SET 
                role = 'OFFICER',
                department_id = dept.id
            WHERE id = v_user_id;

        END LOOP;
        
    END LOOP;
    
    RAISE NOTICE 'Successfully created 15 officers per department.';
END $$;
