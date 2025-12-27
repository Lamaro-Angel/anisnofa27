-- Allow all authenticated users to view roles for searching/messaging
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);