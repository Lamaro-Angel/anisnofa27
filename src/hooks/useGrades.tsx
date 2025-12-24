import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type GradePeriod = "1_trimestre" | "2_trimestre" | "3_trimestre" | "final";

export interface Grade {
  id: string;
  student_id: string;
  subject_id: string;
  class_id: string;
  period: GradePeriod;
  grade: number | null;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  student?: {
    id: string;
    profile?: {
      full_name: string;
    };
  };
  subject?: {
    name: string;
    code: string | null;
  };
  class?: {
    name: string;
  };
}

export function useGrades(filters?: { classId?: string; subjectId?: string; period?: GradePeriod }) {
  return useQuery({
    queryKey: ["grades", filters],
    queryFn: async () => {
      let query = supabase.from("grades").select("*");

      if (filters?.classId) {
        query = query.eq("class_id", filters.classId);
      }
      if (filters?.subjectId) {
        query = query.eq("subject_id", filters.subjectId);
      }
      if (filters?.period) {
        query = query.eq("period", filters.period);
      }

      const { data: grades, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related data
      const studentIds = [...new Set(grades.map((g) => g.student_id))];
      const subjectIds = [...new Set(grades.map((g) => g.subject_id))];
      const classIds = [...new Set(grades.map((g) => g.class_id))];

      const { data: students } = await supabase.from("students").select("id, user_id").in("id", studentIds);
      const userIds = students?.map((s) => s.user_id) || [];
      const { data: profiles } = userIds.length ? await supabase.from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
      const { data: subjects } = await supabase.from("subjects").select("id, name, code").in("id", subjectIds);
      const { data: classes } = await supabase.from("classes").select("id, name").in("id", classIds);

      const enrichedGrades: Grade[] = grades.map((grade) => {
        const student = students?.find((s) => s.id === grade.student_id);
        const profile = profiles?.find((p) => p.id === student?.user_id);
        return {
          ...grade,
          student: student ? { id: student.id, profile: profile ? { full_name: profile.full_name } : undefined } : undefined,
          subject: subjects?.find((s) => s.id === grade.subject_id),
          class: classes?.find((c) => c.id === grade.class_id),
        };
      });

      return enrichedGrades;
    },
  });
}

export function useStudentGrades(studentId: string | null) {
  return useQuery({
    queryKey: ["grades", "student", studentId],
    queryFn: async () => {
      if (!studentId) return [];

      const { data: grades, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const subjectIds = [...new Set(grades.map((g) => g.subject_id))];
      const { data: subjects } = await supabase.from("subjects").select("*").in("id", subjectIds);

      const enrichedGrades: Grade[] = grades.map((grade) => ({
        ...grade,
        subject: subjects?.find((s) => s.id === grade.subject_id),
      }));

      return enrichedGrades;
    },
    enabled: !!studentId,
  });
}

export function useCreateGrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { student_id: string; subject_id: string; class_id: string; period: GradePeriod; grade: number; description?: string }) => {
      const { error } = await supabase.from("grades").insert({
        ...data,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Nota registada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registar nota", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; grade?: number; description?: string }) => {
      const { error } = await supabase.from("grades").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Nota atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar nota", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      toast({ title: "Nota eliminada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar nota", description: error.message, variant: "destructive" });
    },
  });
}
