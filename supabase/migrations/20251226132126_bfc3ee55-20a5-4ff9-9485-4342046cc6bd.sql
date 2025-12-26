-- =============================================
-- PARTE 1: Funções e tabelas principais
-- =============================================

DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

CREATE OR REPLACE FUNCTION public.log_activity(
  p_action text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

CREATE POLICY "Only admins can insert activity logs directly" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Tabela de ranking de alunos
-- =============================================

CREATE TABLE IF NOT EXISTS public.student_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES public.academic_years(id),
  average_grade numeric(5,2),
  total_attendance_rate numeric(5,2),
  rank_position integer,
  points integer DEFAULT 0,
  calculated_at timestamp with time zone DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

ALTER TABLE public.student_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view rankings" 
ON public.student_rankings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage rankings" 
ON public.student_rankings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- Repositório de trabalhos
-- =============================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  class_subject_id uuid NOT NULL REFERENCES public.class_subjects(id) ON DELETE CASCADE,
  due_date timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  submitted_at timestamp with time zone DEFAULT now(),
  grade numeric(5,2),
  feedback text,
  graded_by uuid REFERENCES auth.users(id),
  graded_at timestamp with time zone,
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professors can manage assignments" 
ON public.assignments 
FOR ALL 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM teachers t
    JOIN class_subjects cs ON cs.teacher_id = t.id
    WHERE t.user_id = auth.uid() AND cs.id = assignments.class_subject_id
  )
);

CREATE POLICY "Students can view assignments" 
ON public.assignments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN class_subjects cs ON cs.class_id = s.class_id
    WHERE s.user_id = auth.uid() AND cs.id = assignments.class_subject_id
  )
);

CREATE POLICY "Admins can manage assignments" 
ON public.assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can submit and view own submissions" 
ON public.assignment_submissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = assignment_submissions.student_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Professors can view and grade submissions" 
ON public.assignment_submissions 
FOR ALL 
USING (
  has_role(auth.uid(), 'professor'::app_role) 
  AND EXISTS (
    SELECT 1 FROM assignments a
    JOIN class_subjects cs ON cs.id = a.class_subject_id
    JOIN teachers t ON t.id = cs.teacher_id
    WHERE a.id = assignment_submissions.assignment_id AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage submissions" 
ON public.assignment_submissions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STORAGE: Buckets
-- =============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignments', 
  'assignments', 
  false,
  10485760,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;