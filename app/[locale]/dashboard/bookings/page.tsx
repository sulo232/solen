"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, UserX, RotateCcw, ChevronDown, X, BadgeCheck } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import type { Booking, BookingStatus } from "@/lib/types";

interface EnrichedBooking extends Booking {
  customer_name: string;
  customer_avatar: string | null;
  service_name: string;
  staff_name: string | null;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  no_show: "Nicht erschienen",
};
const STATUS_COLORS: Record<BookingStatus, string> = {
  confirmed: "bg-teal/10 text-teal",
  cancelled: "bg-coral/10 text-coral",
  completed: "bg-gray-100 text-dark/50",
  no_show: "bg-gray-100 text-dark/30",
};

const CANCEL_REASONS = [
  { value: "illness", label: "Krankheit" },
  { value: "technical", label: "Technisches Problem" },
  { value: "understaffed", label: "Personalmangel" },
  { value: "other", label: "Sonstiges" },
];

// ─────────────────────────────────────────
// Cancel Modal (salon-initiated)
// ─────────────────────────────────────────

function SalonCancelModal({
  bookingId,
  onClose,
  onDone,
}: { bookingId: string; onClose: () => void; onDone: (id: string) => void }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      onDone(bookingId);
      onClose();
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading font-bold text-base">Termin stornieren</h3>
          <button onClick={onClose}><X size={18} className="text-dark/30" /></button>
        </div>
        <p className="text-sm text-dark/50 mb-4">Bitte wähle einen Grund. Der Kunde wird automatisch per E-Mail informiert.</p>
        <div className="space-y-2 mb-5">
          {CANCEL_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-button border border-gray-200 cursor-pointer hover:border-teal transition-colors">
              <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                onChange={() => setReason(r.value)} className="accent-teal" />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-gray-200 text-sm text-dark/60">Abbrechen</button>
          <button onClick={handleSubmit} disabled={!reason || loading}
            className="flex-1 py-2.5 rounded-button bg-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Spinner size="sm" invert />}Stornieren
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function BookingsPage() {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    (searchParams.get("status") as BookingStatus) ?? "all"
  );
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [confirmingPrice, setConfirmingPrice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "50");
    setLoading(true);
    fetch(`/api/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const updateStatus = async (id: string, status: "completed" | "no_show") => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  };

  const handleCancelled = (id: string) => {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b));
  };

  const confirmPrice = async (id: string) => {
    setConfirmingPrice(id);
    try {
      await fetch(`/api/stripe/confirm-price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id }),
      });
    } catch { /* ignore */ } finally {
      setConfirmingPrice(null);
    }
  };

  return (
    <DashboardLayout>
      {cancelTarget && (
        <SalonCancelModal
          bookingId={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onDone={handleCancelled}
        />
      )}

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-heading font-bold text-2xl text-dark">Termine</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {(["all", "confirmed", "completed", "cancelled", "no_show"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              "px-3 py-1.5 rounded-pill text-sm font-medium whitespace-nowrap transition-colors",
              statusFilter === s ? "bg-teal text-white" : "bg-white border border-gray-200 text-dark/60 hover:border-teal",
            ].join(" ")}
          >
            {s === "all" ? "Alle" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-dark/30">
          <p className="text-sm">Keine Termine gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-card border border-gray-100 p-4">
              <div className="flex items-start gap-4">
                {/* Time */}
                <div className="shrink-0 text-center w-14">
                  <p className="font-data font-bold text-sm text-teal">
                    {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-[10px] text-dark/30">
                    {new Date(b.starts_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-dark">{b.customer_name}</p>
                    {b.is_first_visit && (
                      <span className="px-1.5 py-0.5 rounded-pill bg-coral/10 text-coral text-[10px] font-bold">NEUKUNDE</span>
                    )}
                    {b.is_recurring && (
                      <span className="flex items-center gap-0.5 text-[10px] text-dark/40">
                        <RotateCcw size={10} /> Wiederkehrend
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-dark/50 mt-0.5">{b.service_name}</p>
                  {b.staff_name && <p className="text-xs text-dark/30">{b.staff_name}</p>}
                  <p className="text-xs font-data text-dark/50 mt-1">CHF {b.price_paid}</p>
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={["px-2 py-0.5 rounded-pill text-[11px] font-medium", STATUS_COLORS[b.status]].join(" ")}>
                    {STATUS_LABELS[b.status]}
                  </span>
                  {b.status === "confirmed" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(b.id, "completed")}
                        className="p-1.5 rounded-button bg-teal/10 text-teal hover:bg-teal/20 transition-colors"
                        title="Abgeschlossen"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "no_show")}
                        className="p-1.5 rounded-button bg-gray-100 text-dark/40 hover:bg-gray-200 transition-colors"
                        title="Nicht erschienen"
                      >
                        <UserX size={13} />
                      </button>
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="p-1.5 rounded-button bg-coral/10 text-coral hover:bg-coral/20 transition-colors"
                        title="Stornieren"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  {b.status === "completed" && (
                    <button
                      onClick={() => confirmPrice(b.id)}
                      disabled={confirmingPrice === b.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-button bg-teal/10 text-teal text-[11px] font-medium hover:bg-teal/20 transition-colors disabled:opacity-50"
                      title="Preis bestätigen"
                    >
                      <BadgeCheck size={12} />
                      {confirmingPrice === b.id ? "…" : "Preis bestätigen"}
                    </button>
                  )}
                  {b.status === "cancelled" && b.cancellation_reason && (
                    <p className="text-[10px] text-dark/30 max-w-24 text-right">{b.cancellation_reason}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
