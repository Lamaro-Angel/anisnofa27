import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Student {
  id: string;
  user_id: string;
  student_number: string | null;
  class_id: string | null;
  enrollment_date: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  class?: {
    name: string;
    grade_level: string;
  };
}

export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles and classes
      const userIds = students.map((s) => s.user_id);
      const classIds = students.filter((s) => s.class_id).map((s) => s.class_id) as string[];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const { data: classes } = classIds.length
        ? await supabase.from("classes").select("*").in("id", classIds)
        : { data: [] };

      const enrichedStudents: Student[] = students.map((student) => ({
        ...student,
        profile: profiles?.find((p) => p.id === student.user_id),
        class: classes?.find((c) => c.id === student.class_id),
      }));

      return enrichedStudents;
    },
  });
}

export function useStudentsByClass(classId: string | null) {
  return useQuery({
    queryKey: ["students", "class", classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data: students, error } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId);

      if (error) throw error;

      const userIds = students.map((s) => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const enrichedStudents: Student[] = students.map((student) => ({
        ...student,
        profile: profiles?.find((p) => p.id === student.user_id),
      }));

      return enrichedStudents;
    },
    enabled: !!classId,
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; student_number?: string; class_id?: string | null }) => {
      const { error } = await supabase.from("students").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Aluno atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar aluno", description: error.message, variant: "destructive" });
    },
  });
}
