-- =============================================
-- STORAGE: Políticas para assignments
-- =============================================

CREATE POLICY "Students can upload assignments storage" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'assignments' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Students can view own assignments storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers can view student assignments storage" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'assignments' 
  AND has_role(auth.uid(), 'professor'::app_role)
);

CREATE POLICY "Admins can manage all assignments files storage" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'assignments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- STORAGE: Políticas para avatares
-- =============================================

CREATE POLICY "Avatar images are publicly accessible storage" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar storage" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar storage" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar storage" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);