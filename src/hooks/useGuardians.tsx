import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface Guardian {
  id: string;
  user_id: string;
  relationship: string | null;
  occupation: string | null;
  created_at: string | null;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  };
  students?: {
    id: string;
    student_id: string;
    is_primary: boolean;
    student: {
      id: string;
      student_number: string | null;
      profile: {
        full_name: string;
      } | null;
    };
  }[];
}

export function useGuardians() {
  return useQuery({
    queryKey: ["guardians"],
    queryFn: async () => {
      const { data: guardians, error } = await supabase
        .from("guardians")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = guardians.map((g) => g.user_id);
      const guardianIds = guardians.map((g) => g.id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url")
        .in("id", userIds);

      const { data: guardianStudents } = await supabase
        .from("guardian_students")
        .select(`
          id,
          guardian_id,
          student_id,
          is_primary,
          student:students(
            id,
            student_number,
            user_id
          )
        `)
        .in("guardian_id", guardianIds);

      // Get student profiles
      const studentUserIds = guardianStudents?.map((gs) => gs.student?.user_id).filter(Boolean) || [];
      const { data: studentProfiles } = studentUserIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", studentUserIds)
        : { data: [] };

      const enrichedGuardians: Guardian[] = guardians.map((guardian) => {
        const students = guardianStudents
          ?.filter((gs) => gs.guardian_id === guardian.id)
          .map((gs) => ({
            ...gs,
            student: {
              ...gs.student,
              profile: studentProfiles?.find((p) => p.id === gs.student?.user_id) || null,
            },
          })) || [];

        return {
          ...guardian,
          profile: profiles?.find((p) => p.id === guardian.user_id),
          students,
        };
      });

      return enrichedGuardians;
    },
  });
}

export function useUpdateGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; relationship?: string; occupation?: string }) => {
      const { error } = await supabase.from("guardians").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
      toast({ title: "Encarregado atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar encarregado", description: error.message, variant: "destructive" });
    },
  });
}

export function useLinkStudentToGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guardianId, studentId, isPrimary }: { guardianId: string; studentId: string; isPrimary?: boolean }) => {
      const { error } = await supabase.from("guardian_students").insert({
        guardian_id: guardianId,
        student_id: studentId,
        is_primary: isPrimary || false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
      queryClient.invalidateQueries({ queryKey: ["guardian-students"] });
      toast({ title: "Educando associado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao associar educando", description: error.message, variant: "destructive" });
    },
  });
}

export function useUnlinkStudentFromGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guardianStudentId: string) => {
      const { error } = await supabase.from("guardian_students").delete().eq("id", guardianStudentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guardians"] });
      queryClient.invalidateQueries({ queryKey: ["guardian-students"] });
      toast({ title: "Educando desassociado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao desassociar educando", description: error.message, variant: "destructive" });
    },
  });
}
