
-- Create a function to handle new user registration
-- This runs with SECURITY DEFINER to bypass RLS and create the necessary records
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  user_gender gender_type;
BEGIN
  -- Get the role from user metadata (default to 'aluno' if not specified)
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'aluno'::app_role
  );
  
  -- Get gender if provided
  user_gender := NULLIF(NEW.raw_user_meta_data->>'gender', '')::gender_type;
  
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, phone, birth_date, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date,
    user_gender
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
    gender = COALESCE(EXCLUDED.gender, profiles.gender);
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create role-specific record
  IF user_role = 'professor' THEN
    INSERT INTO public.teachers (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  ELSIF user_role = 'aluno' THEN
    INSERT INTO public.students (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  ELSIF user_role = 'encarregado' THEN
    INSERT INTO public.guardians (user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Add unique constraint on students.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'students_user_id_key' AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add unique constraint on teachers.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teachers_user_id_key' AND conrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add unique constraint on guardians.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'guardians_user_id_key' AND conrelid = 'public.guardians'::regclass
  ) THEN
    ALTER TABLE public.guardians ADD CONSTRAINT guardians_user_id_key UNIQUE (user_id);
  END IF;
END $$;
