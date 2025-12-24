import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  target_roles: AppRole[] | null;
  target_classes: string[] | null;
  is_pinned: boolean | null;
  expires_at: string | null;
  created_at: string | null;
  author?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export function useAnnouncements() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["announcements", role],
    queryFn: async () => {
      let query = supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      const { data: announcements, error } = await query;

      if (error) throw error;

      // Get author profiles
      const authorIds = [...new Set(announcements.filter((a) => a.author_id).map((a) => a.author_id))] as string[];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds)
        : { data: [] };

      // Filter by role if not admin
      const filteredAnnouncements = role === "admin"
        ? announcements
        : announcements.filter((a) => {
            // If no target roles, it's for everyone
            if (!a.target_roles || a.target_roles.length === 0) return true;
            // Check if user's role is in target roles
            return role && a.target_roles.includes(role);
          });

      // Filter expired announcements
      const now = new Date();
      const activeAnnouncements = filteredAnnouncements.filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > now;
      });

      const enrichedAnnouncements: Announcement[] = activeAnnouncements.map((ann) => ({
        ...ann,
        author: profiles?.find((p) => p.id === ann.author_id),
      }));

      return enrichedAnnouncements;
    },
    enabled: !!user,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content: string;
      target_roles?: AppRole[];
      target_classes?: string[];
      is_pinned?: boolean;
      expires_at?: string;
    }) => {
      const { error } = await supabase.from("announcements").insert({
        ...data,
        author_id: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Aviso criado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar aviso", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      content?: string;
      target_roles?: AppRole[];
      is_pinned?: boolean;
      expires_at?: string | null;
    }) => {
      const { error } = await supabase.from("announcements").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Aviso atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar aviso", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      toast({ title: "Aviso eliminado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao eliminar aviso", description: error.message, variant: "destructive" });
    },
  });
}
