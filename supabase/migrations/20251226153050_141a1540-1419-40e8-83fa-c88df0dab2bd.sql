-- Add restrictive policy to require authentication for profiles table
-- This ensures unauthenticated users cannot access any profile data
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Add restrictive policy to require authentication for tuition_payments table
-- This ensures unauthenticated users cannot access financial data
CREATE POLICY "Require authentication for tuition_payments"
ON public.tuition_payments
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);