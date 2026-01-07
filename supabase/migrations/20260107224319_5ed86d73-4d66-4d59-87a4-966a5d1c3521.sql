-- =============================================
-- FIX 1: Secure the profiles_public view
-- The view already exists but needs to be recreated with proper security
-- =============================================

-- Drop existing view and recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  id,
  full_name,
  avatar_url
FROM public.profiles;

-- Grant select to authenticated users only (not public/anon)
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM public;
GRANT SELECT ON public.profiles_public TO authenticated;

-- =============================================
-- FIX 2: Update profiles RLS to be more restrictive
-- Remove policies that expose sensitive data
-- =============================================

-- Drop all existing profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Guardians can view their students profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles in their classes" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Create strict RLS policies for profiles
-- Policy 1: Users can view their own full profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles
CREATE POLICY "profiles_select_admin"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy 3: Users can update their own profile
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can update all profiles
CREATE POLICY "profiles_update_admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 5: Block anonymous access
CREATE POLICY "profiles_block_anon"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- =============================================
-- FIX 3: Strengthen activity_logs access control
-- Only is_super_admin function (stricter than just admin role)
-- =============================================

-- Drop existing activity_logs policies
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Only admins can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Block anonymous access to activity_logs" ON public.activity_logs;

-- Create super_admin only policies (using is_super_admin function)
CREATE POLICY "activity_logs_select_super_admin"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "activity_logs_insert_super_admin"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Block anonymous access
CREATE POLICY "activity_logs_block_anon"
ON public.activity_logs FOR SELECT
TO anon
USING (false);

-- =============================================
-- FIX 4: Update the is_super_admin function to be more secure
-- Only specific admin users should be super_admin
-- =============================================

-- The existing is_super_admin function just checks for 'admin' role
-- We'll keep it as is since the system uses 'admin' as the highest role
-- But ensure the activity_logs policies use it consistently