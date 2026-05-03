"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  RotateCcw, Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import type { Booking } from "@/lib/types";

type BookingWithDetails = Booking & {
  salon_name: string;
  service_name: string;
  salon_slug?: string;
  staff_name?: string;
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: "text-s-coral",
  cancelled: "text-s-coral",
  completed: "text-s-ink/50",
  no_show: "text-s-ink/30",
};

function hoursUntil(startsAt: string) {
  return (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
}

// ─────────────────────────────────────────
// Cancel modal
// ─────────────────────────────────────────

function CancelModal({
  bookingId,
  salonName,
  startsAt,
  onClose,
  onCancelled,
}: {
  bookingId: string;
  salonName: string;
  startsAt: string;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
  const t = useTranslations("termine");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancel = async () => {
    setLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? t("cancelError"));
      }
      onCancelled(bookingId);
      onClose();
    } catch {
      setCancelError(t("cancelError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal open onClose={onClose} title={t("cancelModalTitle")}>
      <p className="text-sm text-s-ink/60 mb-1">
        {salonName} — {new Date(startsAt).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}{" "}
        um {new Date(startsAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-s-ink/40 mb-4">{t("cancelPolicy")}</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-s-ink/50 mb-1">{t("cancelReasonLabel")}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={t("cancelReasonPlaceholder")}
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
        />
      </div>

      {cancelError && (
        <p className="text-xs text-red-500 mb-3 px-1">{cancelError}</p>
      )}

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60 hover:bg-s-bg-surface transition-colors">
          {t("cancelBack")}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-btn active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" invert />}
          {t("cancelConfirm")}
        </button>
      </div>
    </GlassModal>
  );
}

// ─────────────────────────────────────────
// Mini calendar
// ─────────────────────────────────────────

function MiniCalendar({ bookingDates }: { bookingDates: Set<string> }) {
  const t = useTranslations("termine");
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const days = useMemo(() => {
    const { year, month } = current;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [current]);

  const monthName = new Date(current.year, current.month).toLocaleDateString("de-CH", {
    month: "long",
    year: "numeric",
  });

  const prev = () => {
    setCurrent((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const next = () => {
    setCurrent((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };

  const today = new Date();
  const isToday = (d: number) =>
    d === today.getDate() && current.month === today.getMonth() && current.year === today.getFullYear();

  const hasBooking = (d: number) => {
    const dateStr = `${current.year}-${String(current.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return bookingDates.has(dateStr);
  };

  return (
    <div className="bg-white rounded-[12px] border border-s-ink/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 text-s-ink/40 hover:text-s-ink transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium text-s-ink capitalize">{monthName}</p>
        <button onClick={next} className="p-1 text-s-ink/40 hover:text-s-ink transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {[t("daysMo"), t("daysDi"), t("daysMi"), t("daysDo"), t("daysFr"), t("daysSa"), t("daysSo")].map((d) => (
          <span key={d} className="text-[10px] font-medium text-s-ink/30 py-1">{d}</span>
        ))}
        {days.map((d, i) => (
          <div key={i} className="relative flex items-center justify-center py-1">
            {d !== null ? (
              <>
                <span
                  className={[
                    "w-7 h-7 flex items-center justify-center rounded-full text-xs",
                    isToday(d) ? "bg-s-coral text-white font-bold" : "text-s-ink/70",
                  ].join(" ")}
                >
                  {d}
                </span>
                {hasBooking(d) && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-s-coral" />
                )}
              </>
            ) : (
              <span className="w-7 h-7" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main TerminePage
// ─────────────────────────────────────────

export default function TerminePage() {
  const locale = useLocale();
  const tc = useTranslations("common");
  const t = useTranslations("termine");
  const router = useRouter();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingWithDetails | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const STATUS_LABEL: Record<string, string> = {
    confirmed: t("statusConfirmed"),
    cancelled: t("statusCancelled"),
    completed: t("statusCompleted"),
    no_show: t("statusNoShow"),
    pending: t("statusPending"),
    pending_confirmation: t("statusPendingConfirmation"),
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) {
          // Any non-200 means not authenticated — redirect to login
          if (!cancelled) router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return null;
        }
        return r.json();
      })
      .then((p) => {
        if (cancelled || !p) return;
        if (!p.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        return fetch("/api/bookings?limit=100").then((r) => r.ok ? r.json() : null);
      })
      .then((d) => {
        if (cancelled) return;
        if (d) setBookings(d.bookings ?? []);
      })
      .catch((err) => {
        console.error("[TerminePage] Auth/booking fetch error:", err);
        if (!cancelled) router.push(`/${locale}/auth/login`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [locale, router, pathname]);

  const handleCancelled = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.starts_at).getTime() > now
  );
  const past = bookings.filter(
    (b) => b.status !== "confirmed" || new Date(b.starts_at).getTime() <= now
  );

  // Dates with bookings for the calendar dots
  const bookingDates = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach((b) => {
      if (b.status !== "cancelled") {
        const d = new Date(b.starts_at);
        dates.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        );
      }
    });
    return dates;
  }, [bookings]);

  return (
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {/* Cancel modal */}
        {cancelTarget && (
          <CancelModal
            bookingId={cancelTarget.id}
            salonName={cancelTarget.salon_name}
            startsAt={cancelTarget.starts_at}
            onClose={() => setCancelTarget(null)}
            onCancelled={handleCancelled}
          />
        )}

        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-heading font-bold text-xl text-s-ink mb-6 flex items-center gap-2"
        >
          <Calendar size={20} className="text-s-ink/60" />
          {t("title")}
        </motion.h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Upcoming */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-6"
            >
              <h2 className="text-sm font-bold text-s-ink/60 uppercase tracking-wide mb-3">
                {t("upcoming")} ({upcoming.length})
              </h2>
              <AnimatePresence mode="wait">
              {upcoming.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <EmptyState
                    icon={Calendar}
                    title={tc("noUpcoming")}
                    message={t("emptyMessage")}
                    illustration="no-results"
                    action={
                      <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs hover:underline">
                        {t("bookCta")}
                      </Link>
                    }
                  />
                </motion.div>
              ) : (
                <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="space-y-3">
                  {upcoming.map((b) => {
                    const canCancel = hoursUntil(b.starts_at) > 24;
                    const tooLate = hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

                    return (
                      <div key={b.id} className="bg-white rounded-[12px] border border-s-ink/5 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-s-ink">{b.salon_name}</p>
                            <p className="text-xs text-s-ink/50 mt-0.5">{b.service_name}</p>
                            {b.staff_name && (
                              <p className="text-xs text-s-ink/40 mt-0.5">mit {b.staff_name}</p>
                            )}
                            <p className="text-xs text-s-ink/40 mt-1 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(b.starts_at).toLocaleDateString("de-CH", {
                                weekday: "short", day: "numeric", month: "short",
                              })}{" "}
                              um {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-s-coral">
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-s-ink/5">
                          {canCancel && (
                            <button
                              onClick={() => setCancelTarget(b)}
                              className="px-3 py-1.5 rounded-btn border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
                            >
                              {t("cancel")}
                            </button>
                          )}
                          {tooLate && (
                            <div className="relative group">
                              <button disabled className="px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/20 cursor-not-allowed">
                                {t("cancel")}
                              </button>
                              <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-s-ink text-white text-xs rounded-btn px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {t("cancelNotPossible")}
                              </div>
                            </div>
                          )}
                          {b.salon_slug && (
                            <Link
                              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&reschedule=${b.id}`}
                              className="px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/50 hover:text-s-coral hover:border-s-coral transition-colors"
                            >
                              {t("reschedule")}
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </motion.section>

            {/* Past bookings (collapsible) */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
            >
              <button
                onClick={() => setPastOpen(!pastOpen)}
                className="w-full flex items-center justify-between text-sm font-bold text-s-ink/60 uppercase tracking-wide mb-3"
              >
                <span>{t("past")} ({past.length})</span>
                {pastOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <AnimatePresence mode="wait">
              {pastOpen && (
                <motion.div
                  key="past-bookings"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {past.length === 0 ? (
                    <EmptyState
                      icon={Clock}
                      title={tc("noPast")}
                      className="py-6"
                    />
                  ) : (
                    past.map((b) => (
                      <div key={b.id} className="bg-white rounded-[12px] border border-s-ink/5 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-s-ink">{b.salon_name}</p>
                            <p className="text-xs text-s-ink/50 mt-0.5">{b.service_name}</p>
                            <p className="text-xs text-s-ink/40 mt-1">
                              {new Date(b.starts_at).toLocaleDateString("de-CH", {
                                weekday: "short", day: "numeric", month: "short",
                              })}{" "}
                              um {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={["text-xs font-medium", STATUS_COLOR[b.status] ?? "text-s-ink/40"].join(" ")}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </div>
                        {b.salon_slug && b.status !== "cancelled" && (
                          <div className="mt-3 pt-3 border-t border-s-ink/5">
                            <Link
                              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/50 hover:text-s-coral hover:border-s-coral transition-colors w-fit"
                            >
                              <RotateCcw size={12} />
                              {t("rebook")}
                            </Link>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </motion.div>
              )}
              </AnimatePresence>
            </motion.section>
          </div>

          {/* ── Sidebar: Mini calendar ── */}
          <motion.aside
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="lg:w-64 shrink-0"
          >
            <MiniCalendar bookingDates={bookingDates} />
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
