import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  schedule: any;
  created_at: string | null;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

export function useClassSubjects() {
  return useQuery({
    queryKey: ["class_subjects"],
    queryFn: async () => {
      const { data: classSubjects, error } = await supabase
        .from("class_subjects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get related data
      const { data: classes } = await supabase.from("classes").select("id, name");
      const { data: subjects } = await supabase.from("subjects").select("id, name");
      const { data: teachers } = await supabase.from("teachers").select("id, user_id");
      const { data: profiles } = await supabase.from("profiles").select("id, full_name");

      const enriched: ClassSubject[] = classSubjects.map((cs) => {
        const teacher = teachers?.find((t) => t.id === cs.teacher_id);
        const teacherProfile = teacher ? profiles?.find((p) => p.id === teacher.user_id) : null;

        return {
          ...cs,
          class_name: classes?.find((c) => c.id === cs.class_id)?.name,
          subject_name: subjects?.find((s) => s.id === cs.subject_id)?.name,
          teacher_name: teacherProfile?.full_name,
        };
      });

      return enriched;
    },
  });
}

export function useTeachers() {
  return useQuery({
    queryKey: ["teachers_list"],
    queryFn: async () => {
      const { data: teachers, error } = await supabase
        .from("teachers")
        .select("*");

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email");

      return teachers.map((t) => ({
        ...t,
        profile: profiles?.find((p) => p.id === t.user_id),
      }));
    },
  });
}

export function useCreateClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { class_id: string; subject_id: string; teacher_id?: string }) => {
      const { error } = await supabase.from("class_subjects").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_subjects"] });
      toast({ title: "Atribuição criada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar atribuição", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, teacher_id }: { id: string; teacher_id: string | null }) => {
      const { error } = await supabase
        .from("class_subjects")
        .update({ teacher_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_subjects"] });
      toast({ title: "Professor atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteClassSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class_subjects"] });
      toast({ title: "Atribuição eliminada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar", description: error.message, variant: "destructive" });
    },
  });
}
