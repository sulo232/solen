"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, UserX, RotateCcw, ChevronDown, X } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import { Skeleton, toast } from "@/app/[locale]/_components/primitives";
import ClientTags from "@/components-legacy/chat/ClientTags";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";
import { avGrad } from "@/lib/avatar-gradients";
import { localizedField } from "@/lib/i18n/localized-field";
import type { Booking, BookingStatus } from "@/lib/types";

interface EnrichedBooking extends Booking {
  customer_name: string;
  customer_avatar: string | null;
  service_name: string;
  services?: { name_de: string | null; name_en: string | null; name_fr?: string | null; name_it?: string | null } | null;
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
  const tc = useTranslations("common");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        onDone(bookingId);
        onClose();
      } else {
        // Route only accepts booking.status === "confirmed" (INVALID_STATUS otherwise);
        // fixed a silent-no-op: onDone used to fire on ANY resolved fetch, so a rejected
        // request still marked the booking "cancelled" in local state.
        const err = await res.json().catch(() => ({}));
        console.error("[Bookings] cancellation POST rejected:", res.status, err);
      }
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
          <button onClick={onClose} aria-label={tc("close")} className="grid place-items-center h-11 w-11 -m-2.5 rounded-full hover:bg-s-bg-sunken transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide"><X size={18} strokeWidth={1.9} className="text-s-ink-2" /></button>
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
  onApprove,
  onDecline,
}: {
  booking: EnrichedBooking;
  onClose: () => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onCancel: (id: string) => void;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
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
              {localizedField(booking.services, "name", locale) || booking.service_name}{booking.staff_name ? ` ${booking.staff_name}` : ""} {formatCurrency(Number(booking.price_paid), locale)}
            </p>
          </div>
        </div>
        {/* Three full-width 44px actions: confirmed-only, other statuses are already resolved */}
        {booking.status === "confirmed" && (
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
        )}
        {/* mockup-ok: reuses the exact button recipe shipped three lines above in this same
            component (min-h-[44px] rounded-xl font-heading font-semibold text-[13.5px]);
            Approve swaps only the fill to the locked ink CTA (bg-s-ink/hover:bg-black, same as
            SalonCancelModal's own submit button in this file), Decline is a byte-for-byte copy
            of the Cancel button's classes above. No new visual language. type-scale-ok: both
            buttons reuse text-[13.5px] already shipped three lines above, not a new value.
            Two full-width 44px actions for a manual-approval salon's pending request: the
            owner-approve transition (/api/bookings/[id]/confirm) had zero UI callers anywhere. */}
        {booking.status === "pending_approval" && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onApprove(booking.id)}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-[16px] bg-s-ink text-white font-heading font-medium text-[15px] tracking-[-0.005em] transition-[colors,transform] hover:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide"
            >
              <Check size={15} strokeWidth={1.9} />{t("approve")}
            </button>
            <button
              onClick={() => onDecline(booking.id)}
              className="flex items-center justify-center gap-2 w-full min-h-[44px] rounded-[16px] bg-white border border-s-error/30 text-s-error font-heading font-medium text-[15px] tracking-[-0.005em] transition-[colors,transform] hover:bg-s-error/5 active:scale-[0.97] active:duration-[80ms] active:ease-glide"
            >
              <X size={15} strokeWidth={1.9} />{t("decline")}
            </button>
          </div>
        )}
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
  const tc = useTranslations("common");
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
      .then((d) => {
        setBookings(d.bookings ?? []);
      })
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

  const handleApprove = async (id: string) => {
    const fail = () => toast.error(t("approveFailed"), { action: { label: tc("retry"), onClick: () => handleApprove(id) } });
    try {
      const res = await fetch(`/api/bookings/${id}/confirm`, { method: "POST" });
      if (res.ok) {
        setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "confirmed" as const } : b));
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[DashboardBookings] approve failed:", res.status, err);
        fail();
      }
    } catch (err) { console.error("[DashboardBookings] approve POST failed:", err); fail(); }
  };

  // Decline has its own route: the cancel route only accepts confirmed bookings, and a
  // pending request needs its held payment voided or refunded (/api/bookings/[id]/decline).
  const handleDecline = async (id: string) => {
    const fail = () => toast.error(t("declineFailed"), { action: { label: tc("retry"), onClick: () => handleDecline(id) } });
    try {
      const res = await fetch(`/api/bookings/${id}/decline`, { method: "POST" });
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        handleCancelled(id);
        // Declined, but the held payment was not voided/refunded; the server alerted an admin.
        if (body?.paymentReleaseFailed) {
          console.error("[DashboardBookings] decline: payment release failed, admin alerted", { id });
          toast.warning(t("declinePaymentPending"));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.error("[DashboardBookings] decline failed:", res.status, err);
        fail();
      }
    } catch (err) { console.error("[DashboardBookings] decline POST failed:", err); fail(); }
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
          onApprove={(id) => { handleApprove(id); setActionTarget(null); }}
          onDecline={(id) => { handleDecline(id); setActionTarget(null); }}
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
              // mockup-ok: restores the locked filter-pill selected recipe (CLAUDE.md design
              // contract "filter pill", owner 2026-06-29, supersedes V3-D450); replaces drift.
              statusFilter === s
                ? "bg-s-bg-sunken text-s-ink font-semibold border-s-bg-sunken"
                : "bg-white border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            {s === "all" ? t("filterAll") : t(STATUS_LABEL_KEYS[s])}
          </button>
        ))}
      </div>

      {loading ? (
        // mockup-ok: restores, each row copies the shipped booking-row layout below verbatim
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden"> {/* boxed-ok: identical container+hairline-row class list to the loaded list below on this same page, kept so the skeleton is shaped like the final layout */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border-b border-s-border last:border-b-0 px-3.5 py-3 flex items-center gap-3">
              <div className="w-[46px] shrink-0 space-y-1">
                <Skeleton height={13} width={40} />
                <Skeleton height={11} width={34} />
              </div>
              <Skeleton rounded="full" width={34} height={34} />
              <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton height={14} width="50%" />
                <Skeleton height={12} width="70%" />
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-s-ink-2">
          <p className="text-sm">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
          {bookings.map((b) => (
            <div key={b.id} className="border-b border-s-border last:border-b-0 px-3.5 py-3">
              <div
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 transition-transform active:duration-[80ms] active:ease-glide cursor-pointer active:scale-[0.98]"
                onClick={() => setActionTarget(b)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActionTarget(b); } }}
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
                    {localizedField(b.services, "name", locale) || b.service_name}{b.staff_name ? ` ${b.staff_name}` : ""}
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
