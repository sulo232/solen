"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ShieldAlert, AlertTriangle, Star, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "cancellation" | "low_slots" | "review" | "booking" | "walkin" | "verification";
  title: string;
  body?: string;
  href?: string;
  created_at: string;
  read: boolean;
}

interface NotificationCenterProps {
  salonId?: string;
  unreadCount?: number;
  onCountChange?: (count: number) => void;
}

const TYPE_CONFIG: Record<string, { Icon: React.ElementType; iconBg: string; iconColor: string }> = {
  cancellation: { Icon: X, iconBg: "bg-s-amber/10", iconColor: "text-s-amber" },
  low_slots: { Icon: AlertTriangle, iconBg: "bg-s-amber/10", iconColor: "text-s-amber" },
  review: { Icon: Star, iconBg: "bg-s-blue/10", iconColor: "text-s-blue" },
  booking: { Icon: Calendar, iconBg: "bg-s-coral/10", iconColor: "text-s-coral" },
  walkin: { Icon: Calendar, iconBg: "bg-s-coral/10", iconColor: "text-s-coral" },
  verification: { Icon: ShieldAlert, iconBg: "bg-s-coral/10", iconColor: "text-s-coral" },
};

function makeRelativeTime(t: (key: string, opts?: Record<string, unknown>) => string) {
  return function relativeTime(dateStr: string): string {
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return t("justNow");
    if (diff < 3600) return t("minutesAgo", { count: Math.floor(diff / 60) });
    if (diff < 86400) return t("hoursAgo", { count: Math.floor(diff / 3600) });
    return t("daysAgo", { count: Math.floor(diff / 86400) });
  };
}

export default function NotificationCenter({ salonId, unreadCount = 0, onCountChange }: NotificationCenterProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const relativeTime = makeRelativeTime(t as any);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function fetchNotifications() {
    if (!salonId) return;
    setLoading(true);
    fetch(`/api/notifications?salon_id=${salonId}&limit=20`)
      .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then((d) => {
        setNotifications(d.notifications ?? []);
        const unread = (d.notifications ?? []).filter((n: Notification) => !n.read).length;
        onCountChange?.(unread);
      })
      .catch((err) => console.error("[NotificationCenter] failed to load notifications:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  function markAllRead() {
    if (!salonId) return;
    fetch(`/api/notifications?salon_id=${salonId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all_read: true }) })
      .then(() => {
        setNotifications((n) => n.map((x) => ({ ...x, read: true })));
        onCountChange?.(0);
      })
      .catch((err) => console.error("[NotificationCenter] failed to mark notifications as read:", err));
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchNotifications(); }}
        aria-label={t("notifications")}
        className="relative w-8 h-8 rounded-pill flex items-center justify-center hover:bg-s-ink/[0.05] dark:hover:bg-white/[0.06] transition-colors"
      >
        <Bell size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-pill bg-s-coral text-white text-[8px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Slide-over panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 12, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-s-dm-surface rounded-[14px] border border-s-ink/[0.08] dark:border-white/[0.08] shadow-warm-md z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-s-ink/[0.06] dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <p className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">{t("notifications")}</p>
                {unread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-bold bg-s-coral/10 text-s-coral">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[9px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/35 hover:text-s-coral transition-colors">
                    {t("markAllRead")}
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label={t("close")} className="p-1 rounded-pill hover:bg-s-ink/[0.05] transition-colors">
                  <X size={12} className="text-s-ink/40" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-3 py-2">
                      <div className="w-7 h-7 rounded-[8px] bg-s-ink/[0.05] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-40 bg-s-ink/[0.05] rounded" />
                        <div className="h-2.5 w-24 bg-s-ink/[0.04] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={20} className="mx-auto mb-2 text-s-ink/15" />
                  <p className="text-[11px] font-heading text-s-ink/30 uppercase tracking-[.10em]">
                    {t("noNotifications")}
                  </p>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => {
                    const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.booking;
                    const Icon = cfg.Icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex gap-3 px-4 py-3 border-b border-s-ink/[0.04] dark:border-white/[0.04] last:border-0 transition-colors ${!n.read ? "bg-s-coral/[0.03]" : ""}`}
                      >
                        <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                          <Icon size={13} className={cfg.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-heading font-semibold leading-snug ${!n.read ? "text-s-ink dark:text-s-dm-text" : "text-s-ink/60 dark:text-s-dm-text/60"}`}>
                            {n.title}
                          </p>
                          {n.body && (
                            <p className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35 mt-0.5 truncate">
                              {n.body}
                            </p>
                          )}
                          <p className="text-[9px] text-s-ink/25 dark:text-s-dm-text/25 mt-1">
                            {relativeTime(n.created_at)}
                          </p>
                        </div>
                        {n.href && (
                          <Link href={`/${locale}${n.href}`} className="shrink-0 mt-1" aria-label="Öffnen">
                            <ExternalLink size={11} className="text-s-ink/25 hover:text-s-coral transition-colors" />
                          </Link>
                        )}
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-s-coral shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
