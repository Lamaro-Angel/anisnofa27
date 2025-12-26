import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface LogActivityParams {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Json;
}

// Hook to log activity by direct insert (RLS controlled)
export function useLogActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: LogActivityParams) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("activity_logs").insert([{
        user_id: user.id,
        action: params.action,
        entity_type: params.entity_type || null,
        entity_id: params.entity_id || null,
        details: params.details || null,
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
}

// Utility function to log activity without hook (for use in other hooks/functions)
export async function logActivity(userId: string, params: LogActivityParams): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert([{
    user_id: userId,
    action: params.action,
    entity_type: params.entity_type || null,
    entity_id: params.entity_id || null,
    details: params.details || null,
  }]);

  if (error) {
    console.error("Failed to log activity:", error);
  }
}
