"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
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

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  no_show: "Nicht erschienen",
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
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      onCancelled(bookingId);
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal open onClose={onClose} title="Termin stornieren">
      <p className="text-sm text-s-ink/60 mb-1">
        {salonName} — {new Date(startsAt).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}{" "}
        um {new Date(startsAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-s-ink/40 mb-4">Kostenlose Stornierung bis 24h vor dem Termin.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-s-ink/50 mb-1">Grund (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="z. B. persönlicher Termin, Krankheit..."
          className="w-full px-3 py-2 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60 hover:bg-s-bg-surface transition-colors">
          Abbrechen
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Spinner size="sm" invert />}
          Stornieren
        </button>
      </div>
    </GlassModal>
  );
}

// ─────────────────────────────────────────
// Mini calendar
// ─────────────────────────────────────────

function MiniCalendar({ bookingDates }: { bookingDates: Set<string> }) {
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
    <div className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium text-s-ink dark:text-s-dm-text capitalize">{monthName}</p>
        <button onClick={next} className="p-1 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
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
  const router = useRouter();
  const pathname = usePathname();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<BookingWithDetails | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        return fetch("/api/bookings?limit=100").then((r) => r.json());
      })
      .then((d) => {
        if (d) setBookings(d.bookings ?? []);
      })
      .catch(() => router.push(`/${locale}/auth/login`))
      .finally(() => setLoading(false));
  }, [locale, router, pathname]);

  const handleCancelled = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg px-4 py-8 max-w-lg mx-auto space-y-4">
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
          <Calendar size={20} className="text-s-coral" />
          Meine Termine
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
                Nächste Termine ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Keine anstehenden Termine"
                  message="Buche deinen nächsten Termin!"
                  illustration="no-results"
                  action={
                    <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs hover:underline">
                      Termin buchen →
                    </Link>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => {
                    const canCancel = hoursUntil(b.starts_at) > 24;
                    const tooLate = hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

                    return (
                      <div key={b.id} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">{b.salon_name}</p>
                            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">{b.service_name}</p>
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
                              Absagen
                            </button>
                          )}
                          {tooLate && (
                            <div className="relative group">
                              <button disabled className="px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/20 cursor-not-allowed">
                                Absagen
                              </button>
                              <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-s-ink text-white text-xs rounded-btn px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Stornierung nicht mehr möglich (weniger als 24h)
                              </div>
                            </div>
                          )}
                          {b.salon_slug && (
                            <Link
                              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&reschedule=${b.id}`}
                              className="px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/50 hover:text-s-coral hover:border-s-coral transition-colors"
                            >
                              Verschieben
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                <span>Vergangene Termine ({past.length})</span>
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
                      title="Keine vergangenen Termine"
                      className="py-6"
                    />
                  ) : (
                    past.map((b) => (
                      <div key={b.id} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">{b.salon_name}</p>
                            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">{b.service_name}</p>
                            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-1">
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
                              Nochmal buchen
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
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
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
