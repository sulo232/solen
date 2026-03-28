"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar, X, Star, MessageCircle, Users, ChevronDown
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface FeedEvent {
  type: string;
  id: string;
  created_at: string;
  meta?: Record<string, unknown>;
}

const EVENT_CONFIG: Record<string, {
  label: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}> = {
  booking_new: {
    label: "Neuer Termin",
    Icon: Calendar,
    iconBg: "bg-s-coral/10",
    iconColor: "text-s-coral",
  },
  booking_cancelled: {
    label: "Termin storniert",
    Icon: X,
    iconBg: "bg-s-amber/10",
    iconColor: "text-s-amber",
  },
  review_new: {
    label: "Neue Bewertung",
    Icon: Star,
    iconBg: "bg-s-amber/10",
    iconColor: "text-s-amber",
  },
  message_new: {
    label: "Neue Nachricht",
    Icon: MessageCircle,
    iconBg: "bg-s-blue/10",
    iconColor: "text-s-blue",
  },
  walkin_new: {
    label: "Walk-In eingereiht",
    Icon: Users,
    iconBg: "bg-s-coral/10",
    iconColor: "text-s-coral",
  },
};

function relativeTime(dateStr: string): string {
  const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Gerade eben";
  if (diff < 3600) return `Vor ${Math.floor(diff / 60)} Min.`;
  if (diff < 86400) return `Vor ${Math.floor(diff / 3600)} Std.`;
  return `Vor ${Math.floor(diff / 86400)} Tagen`;
}

interface ActivityFeedProps {
  salonId: string;
}

const PREVIEW_COUNT = 8;
const MOBILE_PREVIEW = 4;

export default function ActivityFeed({ salonId }: ActivityFeedProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const channelRef = useRef<ReturnType<typeof createClientComponentClient>["channel"] | null>(null);

  function loadFeed() {
    fetch(`/api/dashboard/activity-feed?salon_id=${salonId}&limit=20`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadFeed();

    // Realtime subscription — refresh feed on any relevant change
    const supabase = createClientComponentClient();
    const channel = supabase
      .channel(`activity-feed-${salonId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `salon_id=eq.${salonId}` }, () => loadFeed())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews", filter: `salon_id=eq.${salonId}` }, () => loadFeed())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `salon_id=eq.${salonId}` }, () => loadFeed())
      .subscribe();

    channelRef.current = channel as unknown as ReturnType<typeof createClientComponentClient>["channel"];
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  const mobileLimit = expanded ? PREVIEW_COUNT : MOBILE_PREVIEW;
  const visibleEvents = events.slice(0, mobileLimit);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 py-2.5 border-b border-s-ink/[0.04]">
            <div className="w-7 h-7 rounded-[8px] bg-s-ink/[0.05] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-36 bg-s-ink/[0.05] rounded" />
              <div className="h-2.5 w-20 bg-s-ink/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-[11px] font-heading text-s-ink/30 uppercase tracking-[.10em]">
          {t("noRecentActivity")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-0">
        {visibleEvents.map((event) => {
          const cfg = EVENT_CONFIG[event.type] ?? EVENT_CONFIG.booking_new;
          const Icon = cfg.Icon;
          return (
            <div key={`${event.type}-${event.id}`} className="flex gap-3 py-2.5 border-b border-s-ink/[0.04] dark:border-white/[0.04] last:border-0">
              <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
                <Icon size={13} className={cfg.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text leading-snug">
                  {cfg.label}
                  {event.type === "review_new" && event.meta?.rating && (
                    <span className="ml-1 text-s-amber">{"★".repeat(Number(event.meta.rating))}</span>
                  )}
                </p>
                <p className="text-[10px] text-s-ink/35 dark:text-s-dm-text/35 mt-0.5">
                  {relativeTime(event.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile expand/collapse */}
      {events.length > MOBILE_PREVIEW && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] font-heading font-bold text-s-ink/35 hover:text-s-coral transition-colors py-1.5 md:hidden"
          aria-label={expanded ? t("showLess") : t("showMore")}
        >
          <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? t("showLess") : `${events.length - MOBILE_PREVIEW} ${t("moreEvents")}`}
        </button>
      )}
    </div>
  );
}
