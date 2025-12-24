import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type AppRole = "admin" | "professor" | "aluno" | "encarregado";

export interface UserWithProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole | null;
  created_at: string | null;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const users: UserWithProfile[] = profiles.map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        role: roles.find((r) => r.user_id === profile.id)?.role as AppRole | null,
        created_at: profile.created_at,
      }));

      return users;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First, delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);

      // Then insert new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });

      if (error) throw error;

      // Create/update role-specific records
      if (role === "professor") {
        const { data: existing } = await supabase
          .from("teachers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existing) {
          await supabase.from("teachers").insert({ user_id: userId });
        }
      } else if (role === "aluno") {
        const { data: existing } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existing) {
          await supabase.from("students").insert({ user_id: userId });
        }
      } else if (role === "encarregado") {
        const { data: existing } = await supabase
          .from("guardians")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existing) {
          await supabase.from("guardians").insert({ user_id: userId });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Papel atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar papel", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Delete profile (cascades to other tables)
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilizador eliminado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar utilizador", description: error.message, variant: "destructive" });
    },
  });
}
