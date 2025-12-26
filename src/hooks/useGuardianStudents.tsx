import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface GuardianStudent {
  id: string;
  student_id: string;
  guardian_id: string;
  is_primary: boolean;
  student: {
    id: string;
    user_id: string;
    class_id: string | null;
    student_number: string | null;
    profile: {
      full_name: string;
      email: string;
      avatar_url: string | null;
    } | null;
    class: {
      id: string;
      name: string;
      grade_level: string;
    } | null;
  };
}

export function useGuardianStudents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["guardian-students", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the guardian record
      const { data: guardian, error: guardianError } = await supabase
        .from("guardians")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (guardianError) throw guardianError;
      if (!guardian) return [];

      // Then get all students linked to this guardian
      const { data, error } = await supabase
        .from("guardian_students")
        .select(`
          id,
          student_id,
          guardian_id,
          is_primary,
          student:students(
            id,
            user_id,
            class_id,
            student_number,
            profile:profiles(full_name, email, avatar_url),
            class:classes(id, name, grade_level)
          )
        `)
        .eq("guardian_id", guardian.id);

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        student: {
          ...item.student,
          profile: Array.isArray(item.student?.profile) 
            ? item.student.profile[0] 
            : item.student?.profile,
          class: Array.isArray(item.student?.class) 
            ? item.student.class[0] 
            : item.student?.class,
        }
      })) as unknown as GuardianStudent[];
    },
    enabled: !!user,
  });
}