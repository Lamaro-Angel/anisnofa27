-- =============================================
-- Políticas de segurança RLS
-- =============================================

-- Restringir professores a ver apenas alunos das suas turmas
DROP POLICY IF EXISTS "Professors can view students" ON public.students;

CREATE POLICY "Professors can view students in their classes" 
ON public.students 
FOR SELECT 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid() AND cs.class_id = students.class_id
  )
);

-- Restringir professores a gerir notas
DROP POLICY IF EXISTS "Professors can view and manage grades" ON public.grades;

CREATE POLICY "Professors can manage grades in their class subjects" 
ON public.grades 
FOR ALL 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid() 
    AND cs.class_id = grades.class_id 
    AND cs.subject_id = grades.subject_id
  )
);

-- Restringir professores a gerir presenças
DROP POLICY IF EXISTS "Professors can manage attendance" ON public.attendance;

CREATE POLICY "Professors can manage attendance in their class subjects" 
ON public.attendance 
FOR ALL 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid() 
    AND cs.id = attendance.class_subject_id
  )
);

-- Restringir professores a ver perfis
DROP POLICY IF EXISTS "Professors can view student profiles" ON public.profiles;

CREATE POLICY "Professors can view student profiles in their classes" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM students s
    JOIN teachers t ON t.user_id = auth.uid()
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE s.user_id = profiles.id AND cs.class_id = s.class_id
  )
);

-- Restringir acesso à tabela teachers
DROP POLICY IF EXISTS "All authenticated can view teachers" ON public.teachers;

CREATE POLICY "Authenticated users can view teacher basics" 
ON public.teachers 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM class_subjects cs
      JOIN students s ON s.class_id = cs.class_id
      WHERE cs.teacher_id = teachers.id AND s.user_id = auth.uid()
    )
  )
);

-- Anúncios filtrados (target_roles é app_role[], target_classes é uuid[])
DROP POLICY IF EXISTS "All authenticated can view relevant announcements" ON public.announcements;

CREATE POLICY "Users can view targeted announcements" 
ON public.announcements 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (target_roles IS NULL AND target_classes IS NULL)
  OR (
    target_roles IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY(target_roles)
    )
  )
  OR (
    target_classes IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM students s 
      WHERE s.user_id = auth.uid() 
      AND s.class_id = ANY(target_classes)
    )
  )
);