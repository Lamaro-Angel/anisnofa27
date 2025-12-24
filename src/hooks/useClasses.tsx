import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Class {
  id: string;
  name: string;
  grade_level: string;
  room: string | null;
  capacity: number | null;
  academic_year_id: string | null;
  created_at: string | null;
  student_count?: number;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean | null;
}

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) throw error;

      // Get student counts
      const { data: students } = await supabase
        .from("students")
        .select("class_id");

      const classesWithCounts: Class[] = classes.map((cls) => ({
        ...cls,
        student_count: students?.filter((s) => s.class_id === cls.id).length || 0,
      }));

      return classesWithCounts;
    },
  });
}

export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic_years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as AcademicYear[];
    },
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; grade_level: string; room?: string; capacity?: number; academic_year_id?: string }) => {
      const { error } = await supabase.from("classes").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Turma criada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar turma", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; grade_level?: string; room?: string; capacity?: number }) => {
      const { error } = await supabase.from("classes").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Turma atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar turma", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({ title: "Turma eliminada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar turma", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; start_date: string; end_date: string; is_current?: boolean }) => {
      // If setting as current, unset others
      if (data.is_current) {
        await supabase.from("academic_years").update({ is_current: false }).eq("is_current", true);
      }
      const { error } = await supabase.from("academic_years").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic_years"] });
      toast({ title: "Ano letivo criado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar ano letivo", description: error.message, variant: "destructive" });
    },
  });
}
