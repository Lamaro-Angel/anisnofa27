-- Fix teachers table - drop existing policies first then recreate
DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Admins can view all teachers" ON public.teachers;

-- Policy for teachers to view their own full record
CREATE POLICY "Teachers can view own record"
ON public.teachers
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view all teachers
CREATE POLICY "Admins can view all teachers"
ON public.teachers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));