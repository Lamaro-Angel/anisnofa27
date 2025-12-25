import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentLimited {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  birth_date: string | null;
  student_id: string;
  class_id: string | null;
  student_number: string | null;
  class_name: string | null;
  grade_level: string | null;
  age?: number;
}

function calculateAge(birthDate: string | null): number | undefined {
  if (!birthDate) return undefined;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Hook for professors to view limited student data
export function useStudentsLimited() {
  return useQuery({
    queryKey: ["students-limited"],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from("students")
        .select(`
          id,
          student_number,
          class_id,
          user_id,
          classes (name, grade_level)
        `);

      if (error) throw error;

      // Get profiles for these students (limited fields only)
      const userIds = students?.map((s) => s.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, birth_date")
        .in("id", userIds);

      const enriched: StudentLimited[] = (students || []).map((s) => {
        const profile = profiles?.find((p) => p.id === s.user_id);
        return {
          id: profile?.id || s.user_id,
          full_name: profile?.full_name || "",
          avatar_url: profile?.avatar_url || null,
          phone: profile?.phone || null,
          birth_date: profile?.birth_date || null,
          student_id: s.id,
          class_id: s.class_id,
          student_number: s.student_number,
          class_name: s.classes?.name || null,
          grade_level: s.classes?.grade_level || null,
          age: calculateAge(profile?.birth_date || null),
        };
      });

      return enriched;
    },
  });
}

// Hook for professors to view limited student data by class
export function useStudentsLimitedByClass(classId: string | null) {
  return useQuery({
    queryKey: ["students-limited", "class", classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data: students, error } = await supabase
        .from("students")
        .select(`
          id,
          student_number,
          class_id,
          user_id,
          classes (name, grade_level)
        `)
        .eq("class_id", classId);

      if (error) throw error;

      // Get profiles for these students
      const userIds = students?.map((s) => s.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, phone, birth_date")
        .in("id", userIds);

      const enriched: StudentLimited[] = (students || []).map((s) => {
        const profile = profiles?.find((p) => p.id === s.user_id);
        return {
          id: profile?.id || s.user_id,
          full_name: profile?.full_name || "",
          avatar_url: profile?.avatar_url || null,
          phone: profile?.phone || null,
          birth_date: profile?.birth_date || null,
          student_id: s.id,
          class_id: s.class_id,
          student_number: s.student_number,
          class_name: s.classes?.name || null,
          grade_level: s.classes?.grade_level || null,
          age: calculateAge(profile?.birth_date || null),
        };
      });

      return enriched;
    },
    enabled: !!classId,
  });
}
