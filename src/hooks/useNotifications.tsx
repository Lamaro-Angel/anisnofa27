import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          setPermission(perm);
        });
      }
    }
  }, []);

  // Listen for new messages in real-time
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Get sender info
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || "Alguém";
          const messagePreview = newMessage.content.length > 50 
            ? newMessage.content.substring(0, 50) + "..." 
            : newMessage.content;

          // Show toast notification
          toast.info(`Nova mensagem de ${senderName}`, {
            description: messagePreview,
            action: {
              label: "Ver",
              onClick: () => {
                window.location.href = "/messages";
              },
            },
          });

          // Show browser notification if permitted
          if (permission === "granted" && document.hidden) {
            new Notification(`Nova mensagem de ${senderName}`, {
              body: messagePreview,
              icon: "/favicon.png",
              tag: `message-${newMessage.id}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, permission]);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    }
    return "denied" as NotificationPermission;
  };

  return {
    permission,
    requestPermission,
    isSupported: "Notification" in window,
  };
}
