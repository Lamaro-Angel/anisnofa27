-- Drop the restrictive "Users can view profiles for messaging" policy
DROP POLICY IF EXISTS "Users can view profiles for messaging" ON public.profiles;

-- Create a new policy that allows all authenticated users to view all profiles
CREATE POLICY "All authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Also update user_roles to allow all authenticated users to view roles (needed for search badges)
DROP POLICY IF EXISTS "Users can view related roles" ON public.user_roles;

CREATE POLICY "All authenticated users can view roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);