CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'professor',
    'aluno',
    'encarregado'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'presente',
    'falta',
    'justificado',
    'atraso'
);


--
-- Name: gender_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.gender_type AS ENUM (
    'masculino',
    'feminino',
    'outro'
);


--
-- Name: grade_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.grade_period AS ENUM (
    '1_trimestre',
    '2_trimestre',
    '3_trimestre',
    'final'
);


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: log_activity(text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_activity(p_action text, p_entity_type text DEFAULT NULL::text, p_entity_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    author_id uuid,
    target_roles public.app_role[],
    target_classes uuid[],
    is_pinned boolean DEFAULT false,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: assignment_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    student_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_type text,
    submitted_at timestamp with time zone DEFAULT now(),
    grade numeric(5,2),
    feedback text,
    graded_by uuid,
    graded_at timestamp with time zone
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    class_subject_id uuid NOT NULL,
    due_date timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    class_subject_id uuid NOT NULL,
    date date NOT NULL,
    status public.attendance_status DEFAULT 'presente'::public.attendance_status NOT NULL,
    notes text,
    recorded_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: class_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.class_subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    teacher_id uuid,
    schedule jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    grade_level text NOT NULL,
    academic_year_id uuid,
    room text,
    capacity integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    is_resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    period public.grade_period NOT NULL,
    grade numeric(5,2),
    description text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT grades_grade_check CHECK (((grade >= (0)::numeric) AND (grade <= (20)::numeric)))
);


--
-- Name: guardian_students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guardian_id uuid NOT NULL,
    student_id uuid NOT NULL,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: guardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    occupation text,
    relationship text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    gender public.gender_type,
    birth_date date,
    address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: student_rankings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.student_rankings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid NOT NULL,
    academic_year_id uuid,
    average_grade numeric(5,2),
    total_attendance_rate numeric(5,2),
    rank_position integer,
    points integer DEFAULT 0,
    calculated_at timestamp with time zone DEFAULT now()
);


--
-- Name: students; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    student_number text,
    enrollment_date date DEFAULT CURRENT_DATE,
    class_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text,
    description text,
    credits integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: teachers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teachers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    employee_number text,
    department text,
    hire_date date,
    specialization text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: assignment_submissions assignment_submissions_assignment_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_student_id_key UNIQUE (assignment_id, student_id);


--
-- Name: assignment_submissions assignment_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: class_subjects class_subjects_class_id_subject_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_class_id_subject_id_key UNIQUE (class_id, subject_id);


--
-- Name: class_subjects class_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: contact_requests contact_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_pkey PRIMARY KEY (id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: guardian_students guardian_students_guardian_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_students
    ADD CONSTRAINT guardian_students_guardian_id_student_id_key UNIQUE (guardian_id, student_id);


--
-- Name: guardian_students guardian_students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_students
    ADD CONSTRAINT guardian_students_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_key UNIQUE (user_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: student_rankings student_rankings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_rankings
    ADD CONSTRAINT student_rankings_pkey PRIMARY KEY (id);


--
-- Name: student_rankings student_rankings_student_id_academic_year_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_rankings
    ADD CONSTRAINT student_rankings_student_id_academic_year_id_key UNIQUE (student_id, academic_year_id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_student_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_student_number_key UNIQUE (student_number);


--
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- Name: subjects subjects_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_code_key UNIQUE (code);


--
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_employee_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_employee_number_key UNIQUE (employee_number);


--
-- Name: teachers teachers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_pkey PRIMARY KEY (id);


--
-- Name: teachers teachers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: assignments update_assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: grades update_grades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: assignment_submissions assignment_submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignment_submissions assignment_submissions_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES auth.users(id);


--
-- Name: assignment_submissions assignment_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_submissions
    ADD CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_class_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: attendance attendance_class_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_class_subject_id_fkey FOREIGN KEY (class_subject_id) REFERENCES public.class_subjects(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_recorded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id);


--
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: class_subjects class_subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.class_subjects
    ADD CONSTRAINT class_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;


--
-- Name: classes classes_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: contact_requests contact_requests_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: contact_requests contact_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_requests
    ADD CONSTRAINT contact_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: grades grades_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: grades grades_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: grades grades_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: grades grades_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;


--
-- Name: guardian_students guardian_students_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_students
    ADD CONSTRAINT guardian_students_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE CASCADE;


--
-- Name: guardian_students guardian_students_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_students
    ADD CONSTRAINT guardian_students_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: guardians guardians_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: student_rankings student_rankings_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_rankings
    ADD CONSTRAINT student_rankings_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: student_rankings student_rankings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.student_rankings
    ADD CONSTRAINT student_rankings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;


--
-- Name: students students_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: teachers teachers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teachers
    ADD CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: academic_years Admins can manage academic years; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage academic years" ON public.academic_years TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can manage all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all profiles" ON public.profiles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: announcements Admins can manage announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage announcements" ON public.announcements TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assignments Admins can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage assignments" ON public.assignments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: attendance Admins can manage attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage attendance" ON public.attendance TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: class_subjects Admins can manage class_subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage class_subjects" ON public.class_subjects TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: classes Admins can manage classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage classes" ON public.classes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contact_requests Admins can manage contact requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage contact requests" ON public.contact_requests TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: grades Admins can manage grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage grades" ON public.grades TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: guardian_students Admins can manage guardian_students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage guardian_students" ON public.guardian_students TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: guardians Admins can manage guardians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage guardians" ON public.guardians TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: student_rankings Admins can manage rankings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage rankings" ON public.student_rankings USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: students Admins can manage students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage students" ON public.students TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: subjects Admins can manage subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage subjects" ON public.subjects TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: assignment_submissions Admins can manage submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage submissions" ON public.assignment_submissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teachers Admins can manage teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage teachers" ON public.teachers TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: activity_logs Admins can view activity logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view activity logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: teachers Admins can view all teachers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all teachers" ON public.teachers FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: academic_years All authenticated can view academic years; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);


--
-- Name: class_subjects All authenticated can view class_subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated can view class_subjects" ON public.class_subjects FOR SELECT TO authenticated USING (true);


--
-- Name: classes All authenticated can view classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated can view classes" ON public.classes FOR SELECT TO authenticated USING (true);


--
-- Name: subjects All authenticated can view subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "All authenticated can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);


--
-- Name: teachers Authenticated users can view teacher basics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view teacher basics" ON public.teachers FOR SELECT USING (((auth.uid() IS NOT NULL) AND ((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR (EXISTS ( SELECT 1
   FROM (public.class_subjects cs
     JOIN public.students s ON ((s.class_id = cs.class_id)))
  WHERE ((cs.teacher_id = teachers.id) AND (s.user_id = auth.uid())))))));


--
-- Name: guardian_students Guardians can view own associations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guardians can view own associations" ON public.guardian_students FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.guardians g
  WHERE ((g.id = guardian_students.guardian_id) AND (g.user_id = auth.uid())))));


--
-- Name: guardians Guardians can view own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guardians can view own record" ON public.guardians FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: students Guardians can view their students; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guardians can view their students" ON public.students FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.guardian_students gs
     JOIN public.guardians g ON ((g.id = gs.guardian_id)))
  WHERE ((gs.student_id = students.id) AND (g.user_id = auth.uid())))));


--
-- Name: attendance Guardians can view their students attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guardians can view their students attendance" ON public.attendance FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.guardian_students gs
     JOIN public.guardians g ON ((g.id = gs.guardian_id)))
  WHERE ((gs.student_id = attendance.student_id) AND (g.user_id = auth.uid())))));


--
-- Name: grades Guardians can view their students grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Guardians can view their students grades" ON public.grades FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM (public.guardian_students gs
     JOIN public.guardians g ON ((g.id = gs.guardian_id)))
  WHERE ((gs.student_id = grades.student_id) AND (g.user_id = auth.uid())))));


--
-- Name: activity_logs Only admins can insert activity logs directly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Only admins can insert activity logs directly" ON public.activity_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: announcements Professors can create announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can create announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'professor'::public.app_role));


--
-- Name: assignments Professors can manage assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can manage assignments" ON public.assignments USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.teachers t
     JOIN public.class_subjects cs ON ((cs.teacher_id = t.id)))
  WHERE ((t.user_id = auth.uid()) AND (cs.id = assignments.class_subject_id))))));


--
-- Name: attendance Professors can manage attendance in their class subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can manage attendance in their class subjects" ON public.attendance USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.teachers t
     JOIN public.class_subjects cs ON ((cs.teacher_id = t.id)))
  WHERE ((t.user_id = auth.uid()) AND (cs.id = attendance.class_subject_id))))));


--
-- Name: grades Professors can manage grades in their class subjects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can manage grades in their class subjects" ON public.grades USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.teachers t
     JOIN public.class_subjects cs ON ((cs.teacher_id = t.id)))
  WHERE ((t.user_id = auth.uid()) AND (cs.class_id = grades.class_id) AND (cs.subject_id = grades.subject_id))))));


--
-- Name: assignment_submissions Professors can view and grade submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view and grade submissions" ON public.assignment_submissions USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM ((public.assignments a
     JOIN public.class_subjects cs ON ((cs.id = a.class_subject_id)))
     JOIN public.teachers t ON ((t.id = cs.teacher_id)))
  WHERE ((a.id = assignment_submissions.assignment_id) AND (t.user_id = auth.uid()))))));


--
-- Name: profiles Professors can view student profiles in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view student profiles in their classes" ON public.profiles FOR SELECT USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM ((public.students s
     JOIN public.teachers t ON ((t.user_id = auth.uid())))
     JOIN public.class_subjects cs ON ((cs.teacher_id = t.id)))
  WHERE ((s.user_id = profiles.id) AND (cs.class_id = s.class_id))))));


--
-- Name: students Professors can view students in their classes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Professors can view students in their classes" ON public.students FOR SELECT USING ((public.has_role(auth.uid(), 'professor'::public.app_role) AND (EXISTS ( SELECT 1
   FROM (public.teachers t
     JOIN public.class_subjects cs ON ((cs.teacher_id = t.id)))
  WHERE ((t.user_id = auth.uid()) AND (cs.class_id = students.class_id))))));


--
-- Name: assignment_submissions Students can submit and view own submissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can submit and view own submissions" ON public.assignment_submissions USING ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = assignment_submissions.student_id) AND (s.user_id = auth.uid())))));


--
-- Name: assignments Students can view assignments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view assignments" ON public.assignments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.students s
     JOIN public.class_subjects cs ON ((cs.class_id = s.class_id)))
  WHERE ((s.user_id = auth.uid()) AND (cs.id = assignments.class_subject_id)))));


--
-- Name: attendance Students can view own attendance; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = attendance.student_id) AND (s.user_id = auth.uid())))));


--
-- Name: grades Students can view own grades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own grades" ON public.grades FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.id = grades.student_id) AND (s.user_id = auth.uid())))));


--
-- Name: students Students can view own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view own record" ON public.students FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: student_rankings Students can view rankings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Students can view rankings" ON public.student_rankings FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: teachers Teachers can view own record; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Teachers can view own record" ON public.teachers FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: contact_requests Users can create contact requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create contact requests" ON public.contact_requests FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: messages Users can update own sent messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own sent messages" ON public.messages FOR UPDATE TO authenticated USING ((auth.uid() = receiver_id));


--
-- Name: contact_requests Users can view own contact requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own contact requests" ON public.contact_requests FOR SELECT TO authenticated USING ((auth.uid() = sender_id));


--
-- Name: messages Users can view own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: announcements Users can view targeted announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view targeted announcements" ON public.announcements FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR ((target_roles IS NULL) AND (target_classes IS NULL)) OR ((target_roles IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = ANY (announcements.target_roles)))))) OR ((target_classes IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.students s
  WHERE ((s.user_id = auth.uid()) AND (s.class_id = ANY (announcements.target_classes))))))));


--
-- Name: academic_years; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: attendance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

--
-- Name: class_subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: classes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_students ENABLE ROW LEVEL SECURITY;

--
-- Name: guardians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: student_rankings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.student_rankings ENABLE ROW LEVEL SECURITY;

--
-- Name: students; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

--
-- Name: subjects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

--
-- Name: teachers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;