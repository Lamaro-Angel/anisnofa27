import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  sender?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
  receiver?: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(messages.flatMap((m) => [m.sender_id, m.receiver_id]))].filter(
        (id) => id !== user.id
      );

      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);

      // Group by conversation partner
      const conversationsMap = new Map<string, Conversation>();

      messages.forEach((msg) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const partner = profiles?.find((p) => p.id === partnerId);

        if (!partner) return;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId,
            full_name: partner.full_name,
            email: partner.email,
            avatar_url: partner.avatar_url,
            last_message: msg.content,
            last_message_at: msg.created_at || "",
            unread_count: 0,
          });
        }

        const conv = conversationsMap.get(partnerId)!;
        if (!msg.is_read && msg.receiver_id === user.id) {
          conv.unread_count++;
        }
      });

      return Array.from(conversationsMap.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
    },
    enabled: !!user,
  });
}

export function useMessages(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user || !partnerId) return;

    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (
            (newMessage.sender_id === user.id && newMessage.receiver_id === partnerId) ||
            (newMessage.sender_id === partnerId && newMessage.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ["messages", partnerId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, partnerId, queryClient]);

  return useQuery({
    queryKey: ["messages", partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];

      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", [user.id, partnerId]);

      const enrichedMessages: Message[] = messages.map((msg) => ({
        ...msg,
        sender: profiles?.find((p) => p.id === msg.sender_id),
        receiver: profiles?.find((p) => p.id === msg.receiver_id),
      }));

      return enrichedMessages;
    },
    enabled: !!user && !!partnerId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao enviar mensagem", description: error.message, variant: "destructive" });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (senderId: string) => {
      if (!user) throw new Error("Utilizador não autenticado");

      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", senderId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: (_, senderId) => {
      queryClient.invalidateQueries({ queryKey: ["messages", senderId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useAvailableUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["available_users", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .neq("id", user.id)
        .order("full_name");

      if (error) throw error;

      const { data: roles } = await supabase.from("user_roles").select("user_id, role");

      return profiles.map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.id)?.role,
      }));
    },
    enabled: !!user,
  });
}
