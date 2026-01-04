-- Fix: Restrict profiles visibility to prevent exposing all personal data
DROP POLICY IF EXISTS "Authenticated users can view profiles for messaging" ON public.profiles;

-- Only allow viewing profiles of users you have a legitimate relationship with
CREATE POLICY "Users can view profiles for messaging" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::app_role)
  -- Teachers can view students in their classes
  OR (has_role(auth.uid(), 'professor'::app_role) AND EXISTS (
    SELECT 1 FROM students s
    JOIN teachers t ON t.user_id = auth.uid()
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE s.user_id = profiles.id AND cs.class_id = s.class_id
  ))
  -- Guardians can view their students' profiles
  OR EXISTS (
    SELECT 1 FROM guardian_students gs
    JOIN guardians g ON g.id = gs.guardian_id
    JOIN students s ON s.id = gs.student_id
    WHERE g.user_id = auth.uid() AND s.user_id = profiles.id
  )
  -- Students can view profiles of students in same class
  OR (has_role(auth.uid(), 'aluno'::app_role) AND EXISTS (
    SELECT 1 FROM students my_student
    JOIN students other_student ON other_student.class_id = my_student.class_id
    WHERE my_student.user_id = auth.uid() AND other_student.user_id = profiles.id
  ))
  -- Students can view their teachers' profiles
  OR (has_role(auth.uid(), 'aluno'::app_role) AND EXISTS (
    SELECT 1 FROM students s
    JOIN class_subjects cs ON cs.class_id = s.class_id
    JOIN teachers t ON t.id = cs.teacher_id
    WHERE s.user_id = auth.uid() AND t.user_id = profiles.id
  ))
);

-- Fix: Restrict user_roles visibility
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

-- Only allow viewing own roles or if admin
CREATE POLICY "Users can view related roles" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix: Restrict student_rankings visibility to own ranking only (unless admin)
DROP POLICY IF EXISTS "Students can view rankings" ON public.student_rankings;

CREATE POLICY "Students can view own rankings" 
ON public.student_rankings 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM students s WHERE s.id = student_rankings.student_id AND s.user_id = auth.uid()
  )
  -- Guardians can view their students' rankings
  OR EXISTS (
    SELECT 1 FROM guardian_students gs
    JOIN guardians g ON g.id = gs.guardian_id
    WHERE g.user_id = auth.uid() AND gs.student_id = student_rankings.student_id
  )
);

-- Fix: Add more restrictive UPDATE policy for tuition_payments
-- Guardians should only be able to update payment_method and reference_number when status is pending
DROP POLICY IF EXISTS "Guardians can update their tuition payments" ON public.tuition_payments;

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
  -- Cannot set status to 'paid' - only pending_validation
  AND payment_status IN ('pending', 'pending_validation')
);