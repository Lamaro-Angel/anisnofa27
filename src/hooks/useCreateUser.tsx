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
      const safeEmail = data.email.trim().replace(/\s+/g, "");
      const safeFullName = data.full_name.trim();

      // Create user through Supabase Auth
      // The database trigger handle_new_user_registration will automatically:
      // 1. Create the profile
      // 2. Create the user_roles record
      // 3. Create the role-specific record (students, teachers, guardians)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: safeEmail,
        password: data.password,
        options: {
          data: {
            full_name: safeFullName,
            role: data.role,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar utilizador");

      // Small delay to ensure trigger completes
      await new Promise((resolve) => setTimeout(resolve, 500));

      return authData.user.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["available_users"] });
      queryClient.invalidateQueries({ queryKey: ["searchable-users"] });
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
