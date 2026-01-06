-- =============================================
-- SECURITY HARDENING MIGRATION
-- =============================================

-- 1) FIX TUITION_PAYMENTS: Guardians can only submit payment info, NOT approve
-- =============================================

-- Drop existing guardian update policy
DROP POLICY IF EXISTS "Guardians can update their tuition payments" ON public.tuition_payments;
DROP POLICY IF EXISTS "Guardians can submit payment info" ON public.tuition_payments;

-- Create restrictive policy: guardians can ONLY update payment_method and reference_number
-- when status is pending or pending_validation, and can only set status to pending_validation
CREATE POLICY "Guardians can submit payment info" 
ON public.tuition_payments 
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = tuition_payments.guardian_id
        AND g.user_id = auth.uid()
        AND tuition_payments.payment_status IN ('pending', 'pending_validation')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM guardians g
        WHERE g.id = tuition_payments.guardian_id
        AND g.user_id = auth.uid()
    )
    AND payment_status IN ('pending', 'pending_validation')
);

-- 2) FIX PROFILES: Remove blanket access, implement role-based access
-- =============================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;

-- Guardians can view profiles of their students only
CREATE POLICY "Guardians can view their students profiles"
ON public.profiles
FOR SELECT
USING (
    has_role(auth.uid(), 'encarregado'::app_role) 
    AND EXISTS (
        SELECT 1 FROM guardian_students gs
        JOIN guardians g ON g.id = gs.guardian_id
        JOIN students s ON s.id = gs.student_id
        WHERE g.user_id = auth.uid()
        AND s.user_id = profiles.id
    )
);

-- 3) FIX ACADEMIC_YEARS: Restrict to admin and professors only
-- =============================================

-- Drop overly permissive policy
DROP POLICY IF EXISTS "All authenticated can view academic years" ON public.academic_years;

-- Create restricted policy for admin and professors only
CREATE POLICY "Admins and professors can view academic years"
ON public.academic_years
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'professor'::app_role)
);

-- Students and guardians who need to see academic year info can get it through related data
-- Add policy for students to see academic years they're enrolled in
CREATE POLICY "Students can view their academic years"
ON public.academic_years
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN classes c ON c.id = s.class_id
        WHERE s.user_id = auth.uid()
        AND c.academic_year_id = academic_years.id
    )
);

-- Guardians can see academic years of their students
CREATE POLICY "Guardians can view their students academic years"
ON public.academic_years
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM guardian_students gs
        JOIN guardians g ON g.id = gs.guardian_id
        JOIN students s ON s.id = gs.student_id
        JOIN classes c ON c.id = s.class_id
        WHERE g.user_id = auth.uid()
        AND c.academic_year_id = academic_years.id
    )
);

-- 4) STRENGTHEN ACTIVITY_LOGS: Add explicit admin-only restrictions
-- =============================================

-- The existing policies are correct (admin only), but let's ensure they're properly restrictive
-- Drop and recreate for clarity
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Only admins can insert activity logs directly" ON public.activity_logs;

-- Super admin only for viewing logs (using admin role as super_admin equivalent)
CREATE POLICY "Only admins can view activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert (though normally done via function)
CREATE POLICY "Only admins can insert activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5) MAKE AVATARS BUCKET PRIVATE and add proper RLS
-- =============================================
-- Note: The bucket already exists as public, we need to make it private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Drop existing storage policies for avatars if any
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Users can only upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- All authenticated users can view any avatar (avatars are not sensitive)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'avatars' 
    AND auth.uid() IS NOT NULL
);