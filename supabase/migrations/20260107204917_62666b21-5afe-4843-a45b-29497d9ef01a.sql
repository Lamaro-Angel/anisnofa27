-- Drop ALL existing policies on profiles first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Guardians can view profiles of their students" ON public.profiles;
DROP POLICY IF EXISTS "Guardians can view their children profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anon access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- ============================================
-- 1) PROFILES: Create public view + fix RLS
-- ============================================

-- Create a secure view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  full_name,
  avatar_url
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT SELECT ON public.profiles_public TO anon;

-- Create strict RLS policies for profiles

-- 1. Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Guardians can view profiles of their children (students linked to them)
CREATE POLICY "Guardians can view their children profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'encarregado') AND
  EXISTS (
    SELECT 1 FROM public.guardian_students gs
    JOIN public.guardians g ON gs.guardian_id = g.id
    JOIN public.students s ON gs.student_id = s.id
    WHERE g.user_id = auth.uid() AND s.user_id = profiles.id
  )
);

-- 4. Block anonymous access
CREATE POLICY "Block anon access to profiles"
ON public.profiles FOR SELECT
TO anon
USING (false);

-- 5. Users can update their own profile only
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 2) ACTIVITY_LOGS: IP Anonymization + Retention
-- ============================================

-- Add columns for IP anonymization
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS ip_anonymized boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS anonymized_at timestamp with time zone;

-- Drop existing policies on activity_logs
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Only admins can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Block anon access to activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Only super admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert own activity logs" ON public.activity_logs;

-- Create super_admin role check function
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Only super admins can view activity logs
CREATE POLICY "Only super admins can view activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- System can insert activity logs
CREATE POLICY "Authenticated users can insert own activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Block anonymous access
CREATE POLICY "Block anon access to activity_logs"
ON public.activity_logs FOR SELECT
TO anon
USING (false);

-- Function to anonymize IP addresses (mask last octet for IPv4)
CREATE OR REPLACE FUNCTION public.anonymize_ip(ip_addr text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ip_addr IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- For IPv4: Replace last octet with 0
  IF ip_addr ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' THEN
    RETURN regexp_replace(ip_addr, '\.[0-9]+$', '.0');
  END IF;
  
  -- For IPv6: Truncate
  IF ip_addr ~ ':' THEN
    RETURN split_part(ip_addr, ':', 1) || ':' || split_part(ip_addr, ':', 2) || '::';
  END IF;
  
  RETURN 'anonymized';
END;
$$;

-- Function to anonymize old IPs and delete old logs
CREATE OR REPLACE FUNCTION public.cleanup_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize IPs older than 7 days
  UPDATE public.activity_logs
  SET 
    ip_address = public.anonymize_ip(ip_address),
    ip_anonymized = true,
    anonymized_at = now()
  WHERE 
    created_at < now() - interval '7 days'
    AND (ip_anonymized IS NULL OR ip_anonymized = false)
    AND ip_address IS NOT NULL;
  
  -- Delete logs older than 90 days
  DELETE FROM public.activity_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- ============================================
-- 3) ASSIGNMENT_SUBMISSIONS STORAGE SECURITY
-- ============================================

-- Update assignments bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'assignments';

-- Drop existing permissive storage policies for assignments
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students upload own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students view own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students delete own submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins access all submissions" ON storage.objects;

-- Students can upload to their own folder
CREATE POLICY "Students upload own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can view their own submissions
CREATE POLICY "Students view own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can delete their own submissions
CREATE POLICY "Students delete own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can access all submissions
CREATE POLICY "Admins access all submissions"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'assignments' AND
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'assignments' AND
  public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- 4) ASSIGN GUARDIAN ROLE TO kavenafilipe@gmail.com
-- ============================================

-- First remove any existing roles
DELETE FROM public.user_roles WHERE user_id = '8a40d8fd-15ee-4c99-9910-25a552759499';

-- Insert guardian role
INSERT INTO public.user_roles (user_id, role)
VALUES ('8a40d8fd-15ee-4c99-9910-25a552759499', 'encarregado');

-- Create guardian record if not exists
INSERT INTO public.guardians (user_id)
VALUES ('8a40d8fd-15ee-4c99-9910-25a552759499')
ON CONFLICT (user_id) DO NOTHING;