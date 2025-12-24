import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  credits: number | null;
  created_at: string | null;
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Subject[];
    },
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; code?: string; description?: string; credits?: number }) => {
      const { error } = await supabase.from("subjects").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({ title: "Disciplina criada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar disciplina", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; code?: string; description?: string; credits?: number }) => {
      const { error } = await supabase.from("subjects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({ title: "Disciplina atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar disciplina", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast({ title: "Disciplina eliminada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar disciplina", description: error.message, variant: "destructive" });
    },
  });
}
