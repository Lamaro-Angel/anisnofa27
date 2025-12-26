import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TeacherClass {
  id: string;
  name: string;
  grade_level: string;
  room: string | null;
  capacity: number | null;
  academic_year_id: string | null;
  class_subject_id: string;
  subject_id: string;
  subject_name: string;
}

// Hook to get classes that the current teacher teaches
export function useTeacherClasses() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["teacher-classes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First, get the teacher record for this user
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) return [];

      // Get class_subjects where this teacher teaches
      const { data: classSubjects, error: csError } = await supabase
        .from("class_subjects")
        .select("id, class_id, subject_id")
        .eq("teacher_id", teacher.id);

      if (csError) throw csError;
      if (!classSubjects || classSubjects.length === 0) return [];

      // Get unique class IDs
      const classIds = [...new Set(classSubjects.map((cs) => cs.class_id))];
      const subjectIds = [...new Set(classSubjects.map((cs) => cs.subject_id))];

      // Fetch classes and subjects
      const [{ data: classes }, { data: subjects }] = await Promise.all([
        supabase.from("classes").select("*").in("id", classIds),
        supabase.from("subjects").select("id, name").in("id", subjectIds),
      ]);

      // Build enriched list
      const teacherClasses: TeacherClass[] = [];
      
      for (const cs of classSubjects) {
        const cls = classes?.find((c) => c.id === cs.class_id);
        const subject = subjects?.find((s) => s.id === cs.subject_id);
        
        if (cls) {
          teacherClasses.push({
            id: cls.id,
            name: cls.name,
            grade_level: cls.grade_level,
            room: cls.room,
            capacity: cls.capacity,
            academic_year_id: cls.academic_year_id,
            class_subject_id: cs.id,
            subject_id: cs.subject_id,
            subject_name: subject?.name || "Sem nome",
          });
        }
      }

      return teacherClasses;
    },
    enabled: !!user && role === "professor",
  });
}

// Hook to get unique classes that teacher teaches (without subject duplicates)
export function useTeacherUniqueClasses() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["teacher-unique-classes", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First, get the teacher record for this user
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) return [];

      // Get class_subjects where this teacher teaches
      const { data: classSubjects, error: csError } = await supabase
        .from("class_subjects")
        .select("class_id")
        .eq("teacher_id", teacher.id);

      if (csError) throw csError;
      if (!classSubjects || classSubjects.length === 0) return [];

      // Get unique class IDs
      const classIds = [...new Set(classSubjects.map((cs) => cs.class_id))];

      // Fetch classes
      const { data: classes, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds)
        .order("name");

      if (classesError) throw classesError;

      return classes || [];
    },
    enabled: !!user && role === "professor",
  });
}

// Hook to get class subjects that the teacher teaches for a specific class
export function useTeacherClassSubjects(classId: string | null) {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["teacher-class-subjects", user?.id, classId],
    queryFn: async () => {
      if (!user || !classId) return [];

      // First, get the teacher record for this user
      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (teacherError) throw teacherError;
      if (!teacher) return [];

      // Get class_subjects where this teacher teaches in this class
      const { data: classSubjects, error: csError } = await supabase
        .from("class_subjects")
        .select("*")
        .eq("teacher_id", teacher.id)
        .eq("class_id", classId);

      if (csError) throw csError;
      if (!classSubjects || classSubjects.length === 0) return [];

      // Get subject details
      const subjectIds = classSubjects.map((cs) => cs.subject_id);
      const { data: subjects } = await supabase
        .from("subjects")
        .select("*")
        .in("id", subjectIds);

      return classSubjects.map((cs) => ({
        ...cs,
        subject: subjects?.find((s) => s.id === cs.subject_id),
      }));
    },
    enabled: !!user && role === "professor" && !!classId,
  });
}
