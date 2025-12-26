-- 1. Remove overly permissive policy on profiles that allows any authenticated user to read all profiles
-- The existing role-based policies (admin, professor, own profile) are sufficient
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- 2. Remove overly permissive policy on tuition_payments that allows any authenticated user to read all payments
-- The existing role-based policies (admin, guardian) are sufficient  
DROP POLICY IF EXISTS "Require authentication for tuition_payments" ON public.tuition_payments;

-- 3. Fix the messages UPDATE policy - currently allows receivers to modify messages
-- Change it so only senders can update their own sent messages
DROP POLICY IF EXISTS "Users can update own sent messages" ON public.messages;

CREATE POLICY "Users can update own sent messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);