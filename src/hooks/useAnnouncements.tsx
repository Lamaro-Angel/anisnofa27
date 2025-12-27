import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
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
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for announcements
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("announcements-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["announcements"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["announcements", role, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's class ID if they are a student
      let userClassId: string | null = null;
      if (role === "aluno") {
        const { data: student } = await supabase
          .from("students")
          .select("class_id")
          .eq("user_id", user.id)
          .maybeSingle();
        userClassId = student?.class_id || null;
      }

      const { data: announcements, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get author profiles
      const authorIds = [...new Set(announcements.filter((a) => a.author_id).map((a) => a.author_id))] as string[];
      const { data: profiles } = authorIds.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds)
        : { data: [] };

      // Filter by role and class if not admin
      const filteredAnnouncements = role === "admin"
        ? announcements
        : announcements.filter((a) => {
            // Check role filter
            const roleMatch = !a.target_roles || a.target_roles.length === 0 || (role && a.target_roles.includes(role));
            
            // Check class filter (only applies to students)
            let classMatch = true;
            if (role === "aluno" && a.target_classes && a.target_classes.length > 0) {
              classMatch = userClassId ? a.target_classes.includes(userClassId) : false;
            }
            
            return roleMatch && classMatch;
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
