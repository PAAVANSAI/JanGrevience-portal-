"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  grievance_id: string | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let subscription: any;

    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setNotifications(data);
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
        setUnreadCount(count || 0);
      }

      // Set up Realtime Subscription with a unique channel name to avoid StrictMode conflicts
      subscription = supabase
        .channel(`notifications-${user.id}-${Math.random()}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 5));
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    };

    fetchNotifications();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [supabase]);

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    
    if (!notif.is_read) {
      // Optimistically update
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setNotifications((prev) => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notif.id);
    }

    if (notif.grievance_id) {
      // Depending on the role, the URL might need to be /officer/grievances/ or /grievances/.
      // We can check role, or just blindly send them based on where they currently are since both exist.
      // Easiest robust way is to check the current pathname.
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/officer")) {
        router.push(`/officer/grievances/${notif.grievance_id}`);
      } else {
        router.push(`/grievances/${notif.grievance_id}`);
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-blue transition-colors relative"
        aria-label="Notifications"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-blue rounded-full px-1 shadow-sm transform scale-100 animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg">
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={async () => {
                    setUnreadCount(0);
                    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
                    }
                  }}
                  className="text-xs text-blue hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">
                  No notifications yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-bg transition-colors flex items-start gap-3 ${!notif.is_read ? 'bg-blue/5' : ''}`}
                    >
                      {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue mt-2 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-text-primary line-clamp-2 ${!notif.is_read ? 'font-medium' : ''}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-border text-center bg-bg">
              <Link 
                href="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium text-blue hover:underline"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
