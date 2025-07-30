-- Fix for users table when auth.users exist but public.users don't

-- First, check if there are any auth.users without corresponding public.users
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Create missing users in public.users table
INSERT INTO public.users (id, email, name, organization_id)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    '550e8400-e29b-41d4-a716-446655440000' -- Default organization ID
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT COUNT(*) as total_auth_users FROM auth.users;
SELECT COUNT(*) as total_public_users FROM public.users;

-- Show all users
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    o.name as organization_name
FROM public.users u
LEFT JOIN public.organizations o ON u.organization_id = o.id;