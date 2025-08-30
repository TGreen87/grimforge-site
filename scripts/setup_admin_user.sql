-- Setup Admin User Script
-- This script sets up arg@obsidianriterecords.com as an admin user
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT := 'arg@obsidianriterecords.com';
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE NOTICE 'User with email % not found in auth.users', user_email;
        RAISE NOTICE 'Creating user invitation...';
        
        -- Insert user into auth.users (this simulates user signup)
        -- In production, the user should sign up through your app first
        INSERT INTO auth.users (
            id,
            email,
            email_confirmed_at,
            created_at,
            updated_at,
            aud,
            role
        ) VALUES (
            gen_random_uuid(),
            user_email,
            NOW(),
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        ) RETURNING id INTO user_uuid;
        
        RAISE NOTICE 'User created with ID: %', user_uuid;
    ELSE
        RAISE NOTICE 'User found with ID: %', user_uuid;
    END IF;
    
    -- Check if user already has admin role
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    ) THEN
        RAISE NOTICE 'User % already has admin role', user_email;
    ELSE
        -- Insert admin role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_uuid, 'admin'::public.app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'SUCCESS: Admin role granted to user % (ID: %)', user_email, user_uuid;
    END IF;
    
    -- Verify the role was added
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    ) THEN
        RAISE NOTICE 'VERIFIED: Admin role successfully added';
    ELSE
        RAISE NOTICE 'ERROR: Failed to add admin role';
    END IF;
    
END $$;

-- Show current admin users for verification
SELECT 
    u.email,
    ur.role,
    ur.created_at as role_granted_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY ur.created_at DESC;

-- Test the has_role function
SELECT 
    u.email,
    public.has_role(u.id, 'admin'::public.app_role) as is_admin
FROM auth.users u
WHERE u.email = 'arg@obsidianriterecords.com';
