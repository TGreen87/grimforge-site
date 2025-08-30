-- Grant Admin Access Script
-- This script grants admin access to arg@obsidianriterecords.com
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
        RAISE NOTICE 'Please invite the user first through Supabase Dashboard > Authentication > Users';
        RAISE NOTICE 'Or have them sign up at your application first';
        RETURN;
    END IF;
    
    -- Check if user already has admin role
    IF EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = user_uuid AND role = 'admin'
    ) THEN
        RAISE NOTICE 'User % already has admin role', user_email;
        RETURN;
    END IF;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (user_uuid, 'admin');
    
    RAISE NOTICE 'SUCCESS: Admin role granted to user % (ID: %)', user_email, user_uuid;
    
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
