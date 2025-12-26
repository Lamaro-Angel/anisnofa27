import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LogActivityParams {
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
}

// Hook to log activity using the secure database function
export function useLogActivity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: LogActivityParams) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("log_activity", {
        p_action: params.action,
        p_entity_type: params.entity_type || null,
        p_entity_id: params.entity_id || null,
        p_details: params.details || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity_logs"] });
    },
  });
}

// Utility function to log activity without hook (for use in other hooks/functions)
export async function logActivity(params: LogActivityParams): Promise<void> {
  const { error } = await supabase.rpc("log_activity", {
    p_action: params.action,
    p_entity_type: params.entity_type || null,
    p_entity_id: params.entity_id || null,
    p_details: params.details || null,
  });

  if (error) {
    console.error("Failed to log activity:", error);
  }
}
