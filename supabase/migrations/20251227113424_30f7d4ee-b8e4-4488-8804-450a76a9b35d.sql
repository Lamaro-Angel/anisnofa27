-- Allow admins to view all profiles for messaging and enrollment
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow all authenticated users to view basic profile info for messaging
CREATE POLICY "Authenticated users can view profiles for messaging"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow admins to view all user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));