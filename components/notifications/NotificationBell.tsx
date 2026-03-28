"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { NotificationItem } from "./NotificationItem";
import { NotificationType } from "@/lib/notifications";

interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data: Record<string, any>;
}

export function NotificationBell({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserSupabaseClient();

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data as NotificationData[]);
      setUnreadCount(data.filter((n) => !n.read).length);
    };

    fetchNotifications();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationData;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setUnreadCount((count) => count + 1);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotif = payload.new as NotificationData;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
          if (updatedNotif.read) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return;
    
    const supabase = createBrowserSupabaseClient();
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    // Optimistic UI update
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({...n, read: true})));

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in('id', unreadIds);
      
    if (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  if (!userId) {
    return (
      <button className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors">
        <Bell className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            markAllAsRead();
          }
        }}
        className="relative p-2 text-zinc-600 hover:text-zinc-900 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-lg dark:bg-s-dm-surface/90 rounded-[12px] shadow-warm-lg border border-s-ink/5 dark:border-white/10 z-50 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-s-ink/5 dark:border-white/5 flex justify-between items-center bg-s-bg-surface dark:bg-s-dm-bg">
              <h3 className="font-semibold text-s-ink dark:text-s-dm-text">Benachrichtigungen</h3>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-s-ink/50 dark:text-s-dm-text/50">
                  <p className="text-sm">Keine neuen Benachrichtigungen</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
