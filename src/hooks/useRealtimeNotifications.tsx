import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "message" | "announcement";
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export function useRealtimeNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        async (payload) => {
          const newMessage = payload.new as { id: string; content: string; sender_id: string; created_at: string };
          
          // Fetch sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();

          const notification: Notification = {
            id: `msg-${newMessage.id}`,
            type: "message",
            title: `Nova mensagem de ${senderProfile?.full_name || 'Utilizador'}`,
            content: newMessage.content.substring(0, 100),
            createdAt: newMessage.created_at,
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);

          toast({
            title: notification.title,
            description: notification.content,
          });
        }
      )
      .subscribe();

    // Subscribe to new announcements
    const announcementsChannel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements'
        },
        async (payload) => {
          const newAnnouncement = payload.new as { id: string; title: string; content: string; created_at: string; is_pinned: boolean };

          const notification: Notification = {
            id: `ann-${newAnnouncement.id}`,
            type: "announcement",
            title: newAnnouncement.is_pinned ? `📌 ${newAnnouncement.title}` : newAnnouncement.title,
            content: newAnnouncement.content.substring(0, 100),
            createdAt: newAnnouncement.created_at,
            read: false
          };

          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);

          toast({
            title: "Novo anúncio",
            description: newAnnouncement.title,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [user, toast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}
