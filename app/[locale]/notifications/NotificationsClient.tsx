"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Bell, BellOff, Calendar, Check, Star, Gift, RotateCcw, AlertTriangle, Banknote, MessageSquare,
  type LucideIcon,
} from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";

/**
 * Customer notification inbox (mockup notifications-panel.html). Real rows from the
 * notifications table only — type-icon discs instead of the mockup's salon photos
 * (rows carry no imagery; rendering stock photos would be fabricated data).
 * Groups: HEUTE / FRÜHER. Unread = blue dot; "Alle gelesen" marks everything.
 */

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

// Universal-color icon mapping (LOCKFILE §14 semantics: success green, rating yellow, …)
const TYPE_ICON: Record<string, { Icon: LucideIcon; cls: string }> = {
  booking_confirmed: { Icon: Check, cls: "bg-s-success/10 text-s-success" },
  booking_approved: { Icon: Check, cls: "bg-s-success/10 text-s-success" },
  booking_pending: { Icon: Calendar, cls: "bg-s-bg-sunken text-s-ink-2" },
  booking_modified: { Icon: Calendar, cls: "bg-s-bg-sunken text-s-ink-2" },
  booking_rejected: { Icon: AlertTriangle, cls: "bg-s-error/10 text-s-error" },
  booking_cancelled_by_customer: { Icon: Calendar, cls: "bg-s-bg-sunken text-s-ink-2" },
  booking_cancelled_by_salon: { Icon: AlertTriangle, cls: "bg-s-warning/10 text-s-warning" },
  no_show_charge: { Icon: AlertTriangle, cls: "bg-s-warning/10 text-s-warning" },
  late_cancellation_fee: { Icon: AlertTriangle, cls: "bg-s-warning/10 text-s-warning" },
  refund_processed: { Icon: RotateCcw, cls: "bg-s-success/10 text-s-success" },
  upcharge_charged: { Icon: Banknote, cls: "bg-s-bg-sunken text-s-ink-2" },
  new_review: { Icon: Star, cls: "bg-s-star/15 text-s-star" },
  review_prompt: { Icon: Star, cls: "bg-s-star/15 text-s-star" },
  review_response: { Icon: MessageSquare, cls: "bg-s-accent-pale text-s-accent" },
  voucher_purchased: { Icon: Gift, cls: "bg-s-accent-pale text-s-accent" },
  payout_completed: { Icon: Banknote, cls: "bg-s-success/10 text-s-success" },
  payout_failed: { Icon: AlertTriangle, cls: "bg-s-error/10 text-s-error" },
};
const FALLBACK_ICON = { Icon: Bell, cls: "bg-s-bg-sunken text-s-ink-2" };

function relTime(iso: string, locale: string): string {
  const d = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - d) / 60000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 7) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale === "de" ? "de-CH" : locale, { day: "numeric", month: "short" });
}

export default function NotificationsClient() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [items, setItems] = React.useState<Notification[] | null>(null);
  const [unread, setUnread] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/profile/notifications")
      .then((r) => (r.ok ? r.json() : { items: [], unread: 0 }))
      .then((j) => { if (alive) { setItems(j.items ?? []); setUnread(j.unread ?? 0); } })
      .catch((e) => { console.error("[Notifications] load failed:", e); if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  const markAll = async () => {
    setItems((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
    setUnread(0);
    try {
      await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (e) {
      console.error("[Notifications] markAll failed:", e);
    }
  };

  const markOne = (id: string) => {
    const target = items?.find((n) => n.id === id);
    if (!target || target.read) return;
    setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? prev);
    setUnread((u) => Math.max(0, u - 1));
    fetch("/api/profile/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    }).catch((e) => console.error("[Notifications] markOne failed:", e));
  };

  const loading = items === null;
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const today = (items ?? []).filter((n) => new Date(n.created_at) >= startOfToday);
  const earlier = (items ?? []).filter((n) => new Date(n.created_at) < startOfToday);

  const Row = ({ n }: { n: Notification }) => {
    const { Icon, cls } = TYPE_ICON[n.type] ?? FALLBACK_ICON;
    const bookingId = typeof n.data?.booking_id === "string" ? (n.data.booking_id as string) : null;
    const salonSlug = typeof n.data?.salon_slug === "string" ? (n.data.salon_slug as string) : null;
    const inner = (
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${cls}`}>
          <Icon size={19} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`truncate text-[15px] ${n.read ? "font-medium text-s-ink" : "font-semibold text-s-ink"}`}>{n.title}</p>
            <span className="shrink-0 text-[12px] text-s-ink-3">{relTime(n.created_at, locale)}</span>
          </div>
          {/* Owner round-2 (2026-06-11): "too much text" — bodies clamp to ONE line. */}
          <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-s-ink-2">{n.body}</p>
        </div>
        {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-s-accent" aria-label={t("unreadDot")} />}
      </div>
    );
    const href =
      n.type === "review_prompt" && salonSlug
        ? `/${locale}/salon/${salonSlug}/reviews`
        : bookingId
        ? `/${locale}/profile/bookings`
        : null;

    return href ? (
      <Link href={href} onClick={() => markOne(n.id)} className="block transition active:opacity-70">
        {inner}
      </Link>
    ) : (
      <button type="button" onClick={() => markOne(n.id)} className="block w-full text-left transition active:opacity-70">
        {inner}
      </button>
    );
  };

  const Group = ({ label, list }: { label: string; list: Notification[] }) =>
    list.length === 0 ? null : (
      <section className="mt-5">
        <h2 className="px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">{label}</h2>
        <div className="mt-1.5 divide-y divide-s-border">
          {list.map((n) => <Row key={n.id} n={n} />)}
        </div>
      </section>
    );

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-s-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3.5">
          <div>
            <h1 className="font-heading text-[20px] font-bold tracking-[-0.01em] text-s-ink">{t("title")}</h1>
            {unread > 0 && (
              <p className="text-[13px] text-s-ink-3">
                <span className="font-semibold text-s-ink">{unread}</span> {t("unread")}
              </p>
            )}
          </div>
          {unread > 0 && (
            <button type="button" onClick={markAll} className="text-[14px] font-semibold text-s-accent transition-opacity active:opacity-60">
              {t("markAll")}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl pb-16">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : (items ?? []).length === 0 ? (
          <div className="flex flex-col items-center px-8 pb-14 pt-16 text-center">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-s-bg-sunken text-s-ink-3">
              <BellOff size={28} strokeWidth={1.8} aria-hidden />
            </div>
            <h2 className="font-heading text-[20px] font-bold text-s-ink">{t("emptyTitle")}</h2>
            <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-s-ink-2">{t("emptyBody")}</p>
          </div>
        ) : (
          <>
            <Group label={t("today")} list={today} />
            <Group label={t("earlier")} list={earlier} />
          </>
        )}
      </main>
    </div>
  );
}
