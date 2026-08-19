"use client";

// mockup-ok: P12 owner-approved 2026-07-16 ("and p twelve two", TASTE_LOG.md "reference-probe
// picks round 1"), applied from public/_mockups/taste-round2/dashboard.html #bellstack demo , the
// bell now toggles a small in-place stack (white card, border-s-border, rounded-[14px],
// shadow-elevation-3) instead of navigating or the old dead /api/notifications panel.

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface FeedEvent {
  type: string;
  id: string;
  created_at: string;
  meta?: Record<string, unknown>;
}

interface NotificationCenterProps {
  salonId?: string;
}

const PREVIEW_COUNT = 3;

// The stack reads the SAME data ActivityFeed.tsx reads (the /api/dashboard/activity-feed
// endpoint + the "dashboard" event_*/time* i18n keys it already uses), not the old
// /api/notifications read/unread model , that model has no counterpart on this data (no read
// flag on a booking/review/message event), so the unread badge + mark-all-read are dropped.
export default function NotificationCenter({ salonId }: NotificationCenterProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard.notificationCenter");
  const tActivity = useTranslations("dashboard") as any;
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  function relativeTime(dateStr: string): string {
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return tActivity("timeJustNow");
    if (diff < 3600) return tActivity("timeMinAgo", { n: Math.floor(diff / 60) });
    if (diff < 86400) return tActivity("timeHoursAgo", { n: Math.floor(diff / 3600) });
    return tActivity("timeDaysAgo", { n: Math.floor(diff / 86400) });
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function fetchEvents() {
    if (!salonId) return;
    setLoading(true);
    fetch(`/api/dashboard/activity-feed?salon_id=${salonId}&limit=${PREVIEW_COUNT}`)
      .then((r) => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then((d) => setEvents((d.events ?? []).slice(0, PREVIEW_COUNT)))
      .catch((err) => console.error("[NotificationCenter] failed to load activity:", err))
      .finally(() => setLoading(false));
  }

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger , unchanged visual, only the tap behavior changed below */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) fetchEvents(); }}
        aria-label={t("notifications")}
        className="relative w-8 h-8 rounded-pill flex items-center justify-center hover:bg-s-bg-sunken:bg-white/[0.06] transition-colors"
      >
        <Bell size={16} strokeWidth={1.9} className="text-s-ink-2" />
      </button>

      {/* In-place stack */}
      <AnimatePresence>
        {open && (
          <motion.div
            // motion-ok: panel open/close chrome carried over unmodified from the pre-existing
            // NotificationCenter recipe (opacity+scale, no blur) , not part of the P12 row spec below.
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-[14px] border border-s-border bg-white p-3 shadow-elevation-3 z-50"
          >
            {loading ? (
              <div className="space-y-3 p-1 animate-pulse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-32 bg-s-bg-sunken rounded" />
                    <div className="h-2.5 w-20 bg-s-bg-sunken rounded" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="py-3 text-center text-[12.5px] font-heading text-s-ink-2">
                {tActivity("noRecentActivity")}
              </p>
            ) : (
              <div>
                {events.map((event, i) => {
                  const labelKey = `event_${event.type}`;
                  return (
                    <motion.div
                      key={`${event.type}-${event.id}`}
                      initial={{ opacity: 0, y: -6 }} // motion-ok: P12 approved row recipe (dashboard.html #bellstack .n), lighter tier than ENTER_RECIPE, TASTE_LOG 2026-07-16
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut", delay: i * 0.07 }}
                      className="px-1 py-2 border-b border-s-ink/[0.04] last:border-0"
                    >
                      <p className="text-[13px] font-heading text-s-ink leading-snug">{tActivity(labelKey)}</p>
                      <p className="text-[12px] text-s-ink-2 mt-0.5">{relativeTime(event.created_at)}</p>
                    </motion.div>
                  );
                })}
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setOpen(false)}
                  className="mt-1 flex min-h-11 w-full items-center justify-center text-[12.5px] font-heading font-semibold text-s-accent"
                >
                  {t("viewAll")}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
