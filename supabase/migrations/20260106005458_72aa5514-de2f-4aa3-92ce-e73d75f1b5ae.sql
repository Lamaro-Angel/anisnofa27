-- =============================================
-- BLOCK ANONYMOUS ACCESS TO ALL SENSITIVE TABLES
-- These policies ensure unauthenticated users cannot access any data
-- =============================================

-- PROFILES: Block anonymous access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- STUDENTS: Block anonymous access  
CREATE POLICY "Block anonymous access to students"
ON public.students
FOR SELECT
TO anon
USING (false);

-- TEACHERS: Block anonymous access
CREATE POLICY "Block anonymous access to teachers"
ON public.teachers
FOR SELECT
TO anon
USING (false);

-- GRADES: Block anonymous access
CREATE POLICY "Block anonymous access to grades"
ON public.grades
FOR SELECT
TO anon
USING (false);

-- ATTENDANCE: Block anonymous access
CREATE POLICY "Block anonymous access to attendance"
ON public.attendance
FOR SELECT
TO anon
USING (false);

-- ASSIGNMENT_SUBMISSIONS: Block anonymous access
CREATE POLICY "Block anonymous access to assignment_submissions"
ON public.assignment_submissions
FOR SELECT
TO anon
USING (false);

-- TUITION_PAYMENTS: Block anonymous access
CREATE POLICY "Block anonymous access to tuition_payments"
ON public.tuition_payments
FOR SELECT
TO anon
USING (false);

-- MESSAGES: Block anonymous access
CREATE POLICY "Block anonymous access to messages"
ON public.messages
FOR SELECT
TO anon
USING (false);

-- CONTACT_REQUESTS: Block anonymous access
CREATE POLICY "Block anonymous access to contact_requests"
ON public.contact_requests
FOR SELECT
TO anon
USING (false);

-- ACTIVITY_LOGS: Block anonymous access
CREATE POLICY "Block anonymous access to activity_logs"
ON public.activity_logs
FOR SELECT
TO anon
USING (false);

-- GUARDIANS: Block anonymous access
CREATE POLICY "Block anonymous access to guardians"
ON public.guardians
FOR SELECT
TO anon
USING (false);

-- GUARDIAN_STUDENTS: Block anonymous access
CREATE POLICY "Block anonymous access to guardian_students"
ON public.guardian_students
FOR SELECT
TO anon
USING (false);

-- USER_ROLES: Block anonymous access
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);

-- ANNOUNCEMENTS: Block anonymous access
CREATE POLICY "Block anonymous access to announcements"
ON public.announcements
FOR SELECT
TO anon
USING (false);

-- ASSIGNMENTS: Block anonymous access
CREATE POLICY "Block anonymous access to assignments"
ON public.assignments
FOR SELECT
TO anon
USING (false);

-- CLASS_SUBJECTS: Block anonymous access
CREATE POLICY "Block anonymous access to class_subjects"
ON public.class_subjects
FOR SELECT
TO anon
USING (false);

-- CLASSES: Block anonymous access
CREATE POLICY "Block anonymous access to classes"
ON public.classes
FOR SELECT
TO anon
USING (false);

-- SUBJECTS: Block anonymous access
CREATE POLICY "Block anonymous access to subjects"
ON public.subjects
FOR SELECT
TO anon
USING (false);

-- ACADEMIC_YEARS: Block anonymous access
CREATE POLICY "Block anonymous access to academic_years"
ON public.academic_years
FOR SELECT
TO anon
USING (false);

-- STUDENT_RANKINGS: Block anonymous access
CREATE POLICY "Block anonymous access to student_rankings"
ON public.student_rankings
FOR SELECT
TO anon
USING (false);