"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Calendar, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  RotateCcw, Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import GlassModal from "@/components/ui/GlassModal";
import Spinner from "@/components/ui/Spinner";
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
  completed: "text-dark/50",
  no_show: "text-dark/30",
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
      <p className="text-sm text-dark/60 mb-1">
        {salonName} — {new Date(startsAt).toLocaleDateString("de-CH", { weekday: "short", day: "numeric", month: "short" })}{" "}
        um {new Date(startsAt).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="text-xs text-dark/40 mb-4">Kostenlose Stornierung bis 24h vor dem Termin.</p>

      <div className="mb-5">
        <label className="block text-xs font-medium text-dark/50 mb-1">Grund (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="z. B. persönlicher Termin, Krankheit..."
          className="w-full px-3 py-2 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-s-coral resize-none"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60 hover:bg-gray-50 transition-colors">
          Abbrechen
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="bg-white rounded-card border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 text-dark/40 hover:text-dark transition-colors">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-medium text-dark capitalize">{monthName}</p>
        <button onClick={next} className="p-1 text-dark/40 hover:text-dark transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((d) => (
          <span key={d} className="text-[10px] font-medium text-dark/30 py-1">{d}</span>
        ))}
        {days.map((d, i) => (
          <div key={i} className="relative flex items-center justify-center py-1">
            {d !== null ? (
              <>
                <span
                  className={[
                    "w-7 h-7 flex items-center justify-center rounded-full text-xs",
                    isToday(d) ? "bg-s-coral text-white font-bold" : "text-dark/70",
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
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
    <div className="min-h-screen bg-gray-50">
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
          className="font-heading font-bold text-xl text-dark mb-6 flex items-center gap-2"
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
              <h2 className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-3">
                Nächste Termine ({upcoming.length})
              </h2>
              {upcoming.length === 0 ? (
                <div className="bg-white rounded-card border border-gray-100 p-8 text-center text-dark/40">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Keine anstehenden Termine</p>
                  <Link href={`/${locale}/coiffeur`} className="text-s-coral text-xs mt-1 hover:underline inline-block">
                    Termin buchen →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((b) => {
                    const canCancel = hoursUntil(b.starts_at) > 24;
                    const tooLate = hoursUntil(b.starts_at) <= 24 && hoursUntil(b.starts_at) > 0;

                    return (
                      <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-dark">{b.salon_name}</p>
                            <p className="text-xs text-dark/50 mt-0.5">{b.service_name}</p>
                            {b.staff_name && (
                              <p className="text-xs text-dark/40 mt-0.5">mit {b.staff_name}</p>
                            )}
                            <p className="text-xs text-dark/40 mt-1 flex items-center gap-1">
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

                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                          {canCancel && (
                            <button
                              onClick={() => setCancelTarget(b)}
                              className="px-3 py-1.5 rounded-button border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
                            >
                              Absagen
                            </button>
                          )}
                          {tooLate && (
                            <div className="relative group">
                              <button disabled className="px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/20 cursor-not-allowed">
                                Absagen
                              </button>
                              <div className="absolute bottom-full left-0 mb-1.5 w-44 bg-dark text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Stornierung nicht mehr möglich (weniger als 24h)
                              </div>
                            </div>
                          )}
                          {b.salon_slug && (
                            <Link
                              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&reschedule=${b.id}`}
                              className="px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/50 hover:text-s-coral hover:border-s-coral transition-colors"
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
                className="w-full flex items-center justify-between text-sm font-bold text-dark/60 uppercase tracking-wide mb-3"
              >
                <span>Vergangene Termine ({past.length})</span>
                {pastOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {pastOpen && (
                <div className="space-y-3">
                  {past.length === 0 ? (
                    <p className="text-sm text-dark/40 py-4 text-center">Keine vergangenen Termine</p>
                  ) : (
                    past.map((b) => (
                      <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <p className="font-medium text-sm text-dark">{b.salon_name}</p>
                            <p className="text-xs text-dark/50 mt-0.5">{b.service_name}</p>
                            <p className="text-xs text-dark/40 mt-1">
                              {new Date(b.starts_at).toLocaleDateString("de-CH", {
                                weekday: "short", day: "numeric", month: "short",
                              })}{" "}
                              um {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <span className={["text-xs font-medium", STATUS_COLOR[b.status] ?? "text-dark/40"].join(" ")}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </div>
                        {b.salon_slug && b.status !== "cancelled" && (
                          <div className="mt-3 pt-3 border-t border-gray-50">
                            <Link
                              href={`/${locale}/salon/${b.salon_slug}?service=${b.service_id}&staff=${b.staff_member_id ?? ""}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/50 hover:text-s-coral hover:border-s-coral transition-colors w-fit"
                            >
                              <RotateCcw size={12} />
                              Nochmal buchen
                            </Link>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
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
