"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, UserX, RotateCcw, ChevronDown, X } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import ClientTags from "@/components-legacy/chat/ClientTags";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";
import { avGrad } from "@/lib/avatar-gradients";
import type { Booking, BookingStatus } from "@/lib/types";

interface EnrichedBooking extends Booking {
  customer_name: string;
  customer_avatar: string | null;
  service_name: string;
  staff_name: string | null;
  fee_charge_status: string | null;
}

const STATUS_LABEL_KEYS = {
  pending: "statusPending",
  pending_approval: "statusPendingApproval",
  confirmed: "statusConfirmed",
  cancelled: "statusCancelled",
  completed: "statusCompleted",
  no_show: "statusNoShow",
} as const satisfies Record<BookingStatus, string>;
const STATUS_TONE: Record<BookingStatus, "success" | "warning" | "error" | "neutral"> = {
  pending: "warning",
  pending_approval: "warning",
  confirmed: "success",
  cancelled: "error",
  completed: "neutral",
  no_show: "neutral",
};

const FEE_CHARGE_LABEL_KEYS = { failed: "feeChargeFailed", requires_action: "feeChargeRequiresAction" } as const;

const CANCEL_REASONS = [
  { value: "illness", labelKey: "reasonIllness" },
  { value: "technical", labelKey: "reasonTechnical" },
  { value: "understaffed", labelKey: "reasonUnderstaffed" },
  { value: "other", labelKey: "reasonOther" },
] as const;

// Initials + deterministic avatar gradient (consistent colour per person), per the approved mobile skin.
const initials = (n: string) => {
  const p = n.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};
// ─────────────────────────────────────────
// Cancel Modal (salon-initiated)
// ─────────────────────────────────────────

function SalonCancelModal({
  bookingId,
  onClose,
  onDone,
}: { bookingId: string; onClose: () => void; onDone: (id: string) => void }) {
  const t = useTranslations("dashboard.bookingsPage");
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
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-s-ink">{t("cancelModalTitle")}</h3>
          {/* mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md, dash-ops), 18px raised to the locked 44px icon-button spec via a padded hit-area, no visual redesign */}
          <button onClick={onClose} className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide"><X size={18} strokeWidth={1.9} className="text-s-ink-2" /></button>
        </div>
        <p className="text-sm text-s-ink-2 mb-4">{t("cancelModalDescription")}</p>
        <div className="space-y-2 mb-5">
          {CANCEL_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-3 p-3 rounded-xl border border-s-border cursor-pointer hover:border-s-ink transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide">
              <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                onChange={() => setReason(r.value)} className="accent-s-ink" />
              <span className="text-sm">{t(r.labelKey)}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-full border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">{t("cancel")}</button>
          <button onClick={handleSubmit} disabled={!reason || loading}
            className="flex-1 py-2.5 rounded-full bg-s-ink text-white text-sm font-medium hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">
            {loading && <Spinner size="sm" invert />}{t("cancelBooking")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Action Sheet (tap a confirmed row → bottom-sheet, replaces the 3 cramped row icons)
// ─────────────────────────────────────────

function BookingActionSheet({
  booking,
  onClose,
  onComplete,
  onNoShow,
  onCancel,
}: {
  booking: EnrichedBooking;
  onClose: () => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("dashboard.bookingsPage");
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-s-ink/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white shadow-[0_-10px_30px_rgba(10,10,10,0.09)] px-4 pb-[18px]">
        <div className="mx-auto mt-2 mb-3.5 h-1 w-[38px] rounded-full bg-s-border" />
        {/* Header: gradient avatar + name·time, then service · staff · price */}
        <div className="flex items-center gap-3 mb-3.5">
          <span className={`grid place-items-center w-[38px] h-[38px] rounded-full bg-gradient-to-br ${avGrad(booking.customer_name)} text-white font-heading font-semibold text-[13px] shrink-0`}>
            {initials(booking.customer_name)}
          </span>
          <div className="min-w-0">
            <p className="font-heading font-bold text-[15px] text-s-ink leading-tight">
              {booking.customer_name} {new Date(booking.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-[12px] text-s-ink-2 truncate mt-0.5">
              {booking.service_name}{booking.staff_name ? ` ${booking.staff_name}` : ""} {formatCurrency(Number(booking.price_paid), locale)}
            </p>
          </div>
        </div>
        {/* Three full-width 44px actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onComplete(booking.id)}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-s-success text-white font-heading font-semibold text-[13.5px] transition-[opacity,transform] hover:opacity-90 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
          >
            <Check size={15} strokeWidth={1.9} />{t("complete")}
          </button>
          <button
            onClick={() => onNoShow(booking.id)}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-white border border-s-border text-s-ink font-heading font-semibold text-[13.5px] transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide"
          >
            <UserX size={15} strokeWidth={1.9} />{t("noShow")}
          </button>
          <button
            onClick={() => onCancel(booking.id)}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-xl bg-white border border-s-error/30 text-s-error font-heading font-semibold text-[13.5px] transition-[colors,transform] hover:bg-s-error/5 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
          >
            <X size={15} strokeWidth={1.9} />{t("cancelBooking")}
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
  const t = useTranslations("dashboard.bookingsPage");
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    (searchParams.get("status") as BookingStatus) ?? "all"
  );
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<EnrichedBooking | null>(null);

  // Owner's salon id (the bookings list is salon-scoped, not user-scoped).
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => { if (p?.salon_id) setSalonId(p.salon_id); else setLoading(false); })
      .catch((err) => { console.error("[DashboardBookings] Failed to fetch profile:", err); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!salonId) return;
    const params = new URLSearchParams();
    params.set("salon_id", salonId);
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("limit", "50");
    setLoading(true);
    fetch(`/api/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .catch((err) => console.error("[DashboardBookings] Failed to fetch bookings:", err))
      .finally(() => setLoading(false));
  }, [statusFilter, salonId]);

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

      {actionTarget && (
        <BookingActionSheet
          booking={actionTarget}
          onClose={() => setActionTarget(null)}
          onComplete={(id) => { updateStatus(id, "completed"); setActionTarget(null); }}
          onNoShow={(id) => { updateStatus(id, "no_show"); setActionTarget(null); }}
          onCancel={(id) => { setCancelTarget(id); setActionTarget(null); }}
        />
      )}

      <div className="mb-5">
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">{t("title")}</h1>
      </div>

      {/* Filters — light-blue active (approved skin) */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {(["all", "confirmed", "completed", "cancelled", "no_show"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={[
              "px-3.5 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border",
              statusFilter === s
                ? "bg-s-accent-bright/10 text-s-accent-bright border-transparent"
                : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            {s === "all" ? t("filterAll") : t(STATUS_LABEL_KEYS[s])}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-s-ink-2">
          <p className="text-sm">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
          {bookings.map((b) => (
            <div key={b.id} className="border-b border-s-border last:border-b-0 px-3.5 py-3">
              <div
                className={`flex items-center gap-3 transition-transform active:duration-[80ms] active:ease-glide${b.status === "confirmed" ? " cursor-pointer active:scale-[0.98]" : ""}`}
                onClick={b.status === "confirmed" ? () => setActionTarget(b) : undefined}
              >
                {/* Time */}
                <div className="w-[46px] shrink-0">
                  <p className="font-heading font-bold text-[13.5px] text-s-ink tabular-nums leading-none">
                    {new Date(b.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-[12px] font-semibold text-s-ink-2 tabular-nums mt-1">
                    {new Date(b.starts_at).toLocaleDateString(resolveSwissLocale(locale), { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
                {/* Avatar */}
                <span className={`grid place-items-center w-[34px] h-[34px] rounded-full bg-gradient-to-br ${avGrad(b.customer_name)} text-white font-heading font-semibold text-[12px] shrink-0`}>
                  {initials(b.customer_name)}
                </span>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-heading font-semibold text-[14.5px] text-s-ink leading-tight truncate">{b.customer_name}</p>
                    {b.is_first_visit && (
                      <span className="shrink-0 text-[12px] font-bold px-[7px] py-px rounded-full bg-s-accent-bright/10 text-s-accent-bright">{t("badgeNew")}</span>
                    )}
                    {b.is_recurring && <RotateCcw size={11} className="shrink-0 text-s-ink-2" aria-label={t("recurring")} />}
                  </div>
                  <p className="text-[12.5px] text-s-ink-2 truncate mt-0.5">
                    {b.service_name}{b.staff_name ? ` ${b.staff_name}` : ""}
                  </p>
                  {salonId && b.user_id && (
                    <div className="mt-1"><ClientTags salonId={salonId} customerId={b.user_id} compact /></div>
                  )}
                </div>
                {/* Price + status + quick actions */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="font-heading font-semibold text-[13.5px] text-s-ink tabular-nums">{formatCurrency(Number(b.price_paid), locale)}</span>
                  <DashStatusPill tone={STATUS_TONE[b.status]}>{t(STATUS_LABEL_KEYS[b.status])}</DashStatusPill>
                  {(b.fee_charge_status === "failed" || b.fee_charge_status === "requires_action") && (
                    <DashStatusPill tone="warning">{t(FEE_CHARGE_LABEL_KEYS[b.fee_charge_status])}</DashStatusPill>
                  )}
                </div>
              </div>
              {b.status === "cancelled" && b.cancellation_reason && (
                <p className="text-[12px] text-s-ink-2 mt-2">{t("cancellationReasonLabel", { reason: b.cancellation_reason })}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
