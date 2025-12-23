-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'professor', 'aluno', 'encarregado');

-- Create enum for gender
CREATE TYPE public.gender_type AS ENUM ('masculino', 'feminino', 'outro');

-- Create enum for attendance status
CREATE TYPE public.attendance_status AS ENUM ('presente', 'falta', 'justificado', 'atraso');

-- Create enum for grade period
CREATE TYPE public.grade_period AS ENUM ('1_trimestre', '2_trimestre', '3_trimestre', 'final');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    gender gender_type,
    birth_date DATE,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Create academic_years table
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes (turmas) table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
    room TEXT,
    capacity INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects (disciplinas) table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    credits INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers extended info
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    employee_number TEXT UNIQUE,
    department TEXT,
    hire_date DATE,
    specialization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students extended info
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    student_number TEXT UNIQUE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guardians (encarregados) extended info
CREATE TABLE public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    occupation TEXT,
    relationship TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guardian_students junction table
CREATE TABLE public.guardian_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (guardian_id, student_id)
);

-- Create class_subjects junction table (teacher assignments)
CREATE TABLE public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    schedule JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (class_id, subject_id)
);

-- Create grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    period grade_period NOT NULL,
    grade DECIMAL(5,2) CHECK (grade >= 0 AND grade <= 20),
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'presente',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_roles app_role[],
    target_classes UUID[],
    is_pinned BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for real-time chat
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contact_requests table for floating button
CREATE TABLE public.contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professors can view student profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'professor'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for academic_years
CREATE POLICY "All authenticated can view academic years" ON public.academic_years
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage academic years" ON public.academic_years
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for classes
CREATE POLICY "All authenticated can view classes" ON public.classes
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage classes" ON public.classes
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for subjects
CREATE POLICY "All authenticated can view subjects" ON public.subjects
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage subjects" ON public.subjects
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teachers
CREATE POLICY "Teachers can view own record" ON public.teachers
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage teachers" ON public.teachers
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated can view teachers" ON public.teachers
    FOR SELECT TO authenticated
    USING (TRUE);

-- RLS Policies for students
CREATE POLICY "Students can view own record" ON public.students
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage students" ON public.students
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professors can view students" ON public.students
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Guardians can view their students" ON public.students
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.guardian_students gs
            JOIN public.guardians g ON g.id = gs.guardian_id
            WHERE gs.student_id = students.id AND g.user_id = auth.uid()
        )
    );

-- RLS Policies for guardians
CREATE POLICY "Guardians can view own record" ON public.guardians
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage guardians" ON public.guardians
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for guardian_students
CREATE POLICY "Guardians can view own associations" ON public.guardian_students
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.guardians g
            WHERE g.id = guardian_students.guardian_id AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage guardian_students" ON public.guardian_students
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for class_subjects
CREATE POLICY "All authenticated can view class_subjects" ON public.class_subjects
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage class_subjects" ON public.class_subjects
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for grades
CREATE POLICY "Students can view own grades" ON public.grades
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = grades.student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Professors can view and manage grades" ON public.grades
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Admins can manage grades" ON public.grades
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Guardians can view their students grades" ON public.grades
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.guardian_students gs
            JOIN public.guardians g ON g.id = gs.guardian_id
            WHERE gs.student_id = grades.student_id AND g.user_id = auth.uid()
        )
    );

-- RLS Policies for attendance
CREATE POLICY "Students can view own attendance" ON public.attendance
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = attendance.student_id AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Professors can manage attendance" ON public.attendance
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'professor'));

CREATE POLICY "Admins can manage attendance" ON public.attendance
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Guardians can view their students attendance" ON public.attendance
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.guardian_students gs
            JOIN public.guardians g ON g.id = gs.guardian_id
            WHERE gs.student_id = attendance.student_id AND g.user_id = auth.uid()
        )
    );

-- RLS Policies for announcements
CREATE POLICY "All authenticated can view relevant announcements" ON public.announcements
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Professors can create announcements" ON public.announcements
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'professor'));

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own sent messages" ON public.messages
    FOR UPDATE TO authenticated
    USING (auth.uid() = receiver_id);

-- RLS Policies for contact_requests
CREATE POLICY "Users can create contact requests" ON public.contact_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view own contact requests" ON public.contact_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = sender_id);

CREATE POLICY "Admins can manage contact requests" ON public.contact_requests
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON public.grades
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();