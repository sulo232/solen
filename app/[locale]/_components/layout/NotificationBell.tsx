"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * NotificationBell — header entry to /notifications (restored per the V3-D removal
 * note "restore when the panel + data source ship"; both now exist — audit gap #4).
 * Logged-out (401) renders NOTHING, so it's never a dead control for guests.
 * Unread count comes from the real /api/profile/notifications endpoint; badge only
 * when > 0 (no fabricated counts).
 */
export default function NotificationBell({ hidden }: { hidden?: boolean }) {
  const locale = useLocale();
  const [unread, setUnread] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    // Local session read first (no network) — guests skip the fetch entirely,
    // otherwise every anonymous page view logs a 401 console error.
    createBrowserSupabaseClient().auth.getSession().then(({ data }) => {
      if (!alive || !data.session) return;
      fetch("/api/profile/notifications")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => { if (alive && j) setUnread(j.unread ?? 0); })
        .catch(() => { /* offline — stay hidden */ });
    });
    return () => { alive = false; };
  }, []);

  if (unread === null) return null; // guest or not yet known — no dead control

  return (
    <Link
      href={`/${locale}/notifications`}
      aria-label={unread > 0 ? `Benachrichtigungen, ${unread} ungelesen` : "Benachrichtigungen"}
      className={cn(
        "relative grid h-10 w-10 place-items-center text-s-ink transition-[opacity,transform] duration-150 ease-snap active:scale-[0.94] active:duration-[80ms] active:ease-glide",
        hidden && "opacity-0 pointer-events-none",
      )}
    >
      <Bell size={21} strokeWidth={2.2} aria-hidden />
      {unread > 0 && (
        <span className="absolute right-1 top-1 grid h-[16px] min-w-[16px] place-items-center rounded-full bg-s-accent px-[3px] text-[10px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
