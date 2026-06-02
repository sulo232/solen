"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, UserX, RotateCcw, ChevronDown, X } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import ClientTags from "@/components-legacy/chat/ClientTags";
import { formatCurrency } from "@/lib/format-currency";
import type { Booking, BookingStatus } from "@/lib/types";

interface EnrichedBooking extends Booking {
  customer_name: string;
  customer_avatar: string | null;
  service_name: string;
  staff_name: string | null;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Ausstehend",
  pending_approval: "Warte auf Bestätigung",
  confirmed: "Bestätigt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
  no_show: "Nicht erschienen",
};
const STATUS_TONE: Record<BookingStatus, "success" | "warning" | "error" | "neutral"> = {
  pending: "warning",
  pending_approval: "warning",
  confirmed: "success",
  cancelled: "error",
  completed: "neutral",
  no_show: "neutral",
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
      // V3-D334 (overnight T2): error handling per CLAUDE.md (was silent catch).
    } catch (err) { console.error("[Bookings] cancellation POST failed:", err); } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-s-ink">Termin stornieren</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink-2" /></button>
        </div>
        <p className="text-sm text-s-ink-2 mb-4">Bitte wähle einen Grund. Der Kunde wird automatisch per E-Mail informiert.</p>
        <div className="space-y-2 mb-5">
          {CANCEL_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-s-border cursor-pointer hover:border-s-ink transition-colors">
              <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                onChange={() => setReason(r.value)} className="accent-s-ink" />
              <span className="text-sm">{r.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">Abbrechen</button>
          <button onClick={handleSubmit} disabled={!reason || loading}
            className="flex-1 py-2.5 rounded-full bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
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
  const [salonId, setSalonId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    (searchParams.get("status") as BookingStatus) ?? "all"
  );
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "50");
    setLoading(true);
    fetch(`/api/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const items = d.bookings ?? [];
        setBookings(items);
        if (items.length > 0 && !salonId) setSalonId(items[0].salon_id);
      })
      .catch((err) => console.error("[DashboardBookings] Failed to fetch bookings:", err))
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
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">Termine</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {(["all", "confirmed", "completed", "cancelled", "no_show"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              "px-3.5 py-1.5 rounded-full text-[14px] font-medium whitespace-nowrap transition-colors",
              statusFilter === s ? "bg-s-ink text-white" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            {s === "all" ? "Alle" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-s-ink/30">
          <p className="text-sm">Keine Termine gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-s-border p-4">
              <div className="flex items-start gap-4">
                {/* Time */}
                <div className="shrink-0 text-center w-14">
                  <p className="data-text font-semibold text-sm text-s-ink">
                    {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-[10px] text-s-ink/30">
                    {new Date(b.starts_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-s-ink">{b.customer_name}</p>
                    {b.is_first_visit && (
                      <span className="px-2 py-0.5 rounded-full bg-s-bg-sunken border border-s-border text-s-ink-2 text-[10px] font-semibold uppercase tracking-[0.06em]">Neukunde</span>
                    )}
                    {b.is_recurring && (
                      <span className="flex items-center gap-0.5 text-[10px] text-s-ink/40">
                        <RotateCcw size={10} /> Wiederkehrend
                      </span>
                    )}
                  </div>
                  {salonId && b.user_id && (
                    <div className="mt-1">
                      <ClientTags salonId={salonId} customerId={b.user_id} compact />
                    </div>
                  )}
                  <p className="text-xs text-s-ink/50 mt-0.5">{b.service_name}</p>
                  {b.staff_name && <p className="text-xs text-s-ink/30">{b.staff_name}</p>}
                  <p className="text-xs data-text text-s-ink/50 mt-1">{formatCurrency(Number(b.price_paid), locale)}</p>
                </div>

                {/* Status + actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <DashStatusPill tone={STATUS_TONE[b.status]}>{STATUS_LABELS[b.status]}</DashStatusPill>
                  {b.status === "confirmed" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateStatus(b.id, "completed")}
                        className="p-1.5 rounded-full bg-s-bg-sunken text-s-ink hover:bg-s-border transition-colors"
                        title="Abgeschlossen"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => updateStatus(b.id, "no_show")}
                        className="p-1.5 rounded-full bg-s-bg-sunken text-s-ink-2 hover:bg-s-border hover:text-s-ink transition-colors"
                        title="Nicht erschienen"
                      >
                        <UserX size={13} />
                      </button>
                      <button
                        onClick={() => setCancelTarget(b.id)}
                        className="p-1.5 rounded-full bg-s-bg-sunken text-s-error hover:bg-s-error-bg transition-colors"
                        title="Stornieren"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                  {b.status === "cancelled" && b.cancellation_reason && (
                    <p className="text-[10px] text-s-ink/30 max-w-24 text-right">{b.cancellation_reason}</p>
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
