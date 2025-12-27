import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AppRole } from "./useUsers";

interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      // Create user through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar utilizador");

      const userId = authData.user.id;

      // Insert role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: data.role,
      });

      if (roleError) throw roleError;

      // Create role-specific record
      if (data.role === "professor") {
        await supabase.from("teachers").insert({ user_id: userId });
      } else if (data.role === "aluno") {
        await supabase.from("students").insert({ user_id: userId });
      } else if (data.role === "encarregado") {
        await supabase.from("guardians").insert({ user_id: userId });
      }

      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Utilizador criado com sucesso" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar utilizador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
