-- Corrigir recursão infinita em RLS (teachers ↔ students) e dar acesso total de mensagens para admin

-- 1) Função SECURITY DEFINER para evitar joins diretos a students dentro de políticas (evita recursão)
CREATE OR REPLACE FUNCTION public.can_view_teacher(_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_subjects cs
    JOIN public.students s ON s.class_id = cs.class_id
    WHERE cs.teacher_id = _teacher_id
      AND s.user_id = auth.uid()
  );
$$;

-- 2) Substituir a policy problemática em teachers (antes fazia JOIN em students)
DROP POLICY IF EXISTS "Authenticated users can view teacher basics" ON public.teachers;

CREATE POLICY "Authenticated users can view teacher basics"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
  OR public.can_view_teacher(id)
);

-- 3) Acesso global para admin em messages (SELECT/INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;

CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all messages"
ON public.messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
