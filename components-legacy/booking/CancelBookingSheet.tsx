"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { HelpCircle, RotateCcw } from "lucide-react";
import { Sheet } from "@/app/[locale]/_components/primitives/Sheet";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import type { Booking } from "./BookingCard";

interface RefundPreview {
  base_cents: number;
  fee_cents: number;
  refund_cents: number;
  within_free_window: boolean;
  free_cancel_hours: number;
  currency: string;
}

/**
 * CancelBookingSheet — money-moving self-cancel confirmation (audit #7), built from the
 * approved mockup `public/_mockups/restraint/cancel-confirm-sheet.html`. Replaces the raw
 * window.confirm() in BookingsList with a styled bottom sheet (Sheet primitive) that shows
 * the REAL refund (fetched read-only from GET /api/bookings/[id]/cancel) before the customer
 * commits — never the gross price. Honest about the cases: free-window full refund, a
 * deducted cancellation fee, or a not-prepaid booking (nothing to refund).
 */
export default function CancelBookingSheet({
  booking,
  isOpen,
  onOpenChange,
  onConfirm,
  cancelling,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  cancelling: boolean;
}) {
  const t = useTranslations("bookingsList");
  const locale = useLocale();
  const [preview, setPreview] = React.useState<RefundPreview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showPolicy, setShowPolicy] = React.useState(false);

  // Fetch the read-only refund preview each time the sheet opens for a booking.
  React.useEffect(() => {
    if (!isOpen || !booking) return;
    let alive = true;
    setPreview(null);
    setShowPolicy(false);
    setLoading(true);
    fetch(`/api/bookings/${booking.id}/cancel`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive) setPreview(j?.data ?? null); })
      .catch((e) => { console.error("[CancelBookingSheet] refund preview failed:", e); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isOpen, booking]);

  if (!booking) return null;

  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  const serviceName = (() => {
    if (!booking.service) return "";
    const key = `name_${locale}` as keyof NonNullable<Booking["service"]>;
    return (booking.service[key] as string) || booking.service.name_de || booking.service.name_en || "";
  })();
  const dateStr = new Date(booking.starts_at).toLocaleDateString(localeCode, {
    weekday: "short", day: "numeric", month: "short",
  });

  const hasRefund = preview != null && preview.refund_cents > 0;
  const hasFee = preview != null && preview.fee_cents > 0;
  // Refund is in Rappen (integer cents); formatCurrency expects CHF.
  const refundChf = preview ? preview.refund_cents / 100 : 0;
  const feeChf = preview ? preview.fee_cents / 100 : 0;

  return (
    <Sheet isOpen={isOpen} onOpenChange={onOpenChange} height="auto" aria-label={t("cancelTitle")}>
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
        {/* Header — title + policy help (not an X; backdrop / Behalten dismiss) */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-heading text-[22px] font-bold leading-[1.2] tracking-[-0.01em] text-s-ink">
            {t("cancelTitle")}
          </h2>
          <button
            type="button"
            onClick={() => setShowPolicy((v) => !v)}
            aria-label={t("cancelPolicyHelpAria")}
            aria-expanded={showPolicy}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2 transition active:scale-90"
          >
            <HelpCircle size={19} strokeWidth={2.2} aria-hidden />
          </button>
        </div>

        {/* Policy note — toggled by the help icon, from the real free-cancel window */}
        {showPolicy && preview && (
          <p className="mt-2 rounded-[12px] bg-s-bg-sunken px-3.5 py-2.5 text-[13px] leading-relaxed text-s-ink-2">
            {t("cancelPolicyNote", { hours: preview.free_cancel_hours })}
          </p>
        )}

        {/* Refund focal block — cool-grey sunken, leads with the amount */}
        {loading ? (
          <div className="mt-4 flex h-[120px] items-center justify-center rounded-card bg-s-bg-sunken">
            <Spinner size="sm" />
          </div>
        ) : hasRefund ? (
          <div className="mt-4 rounded-card bg-s-bg-sunken p-[18px]">
            <div className="font-body text-[11.5px] font-semibold uppercase tracking-[0.07em] text-s-ink-2">
              {t("refundEyebrow")}
            </div>
            <div className="mt-1.5 font-heading text-[34px] font-bold leading-[1.05] tracking-[-0.02em] tabular-nums text-s-ink">
              {formatCurrency(refundChf)}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-s-border pt-3 text-[13.5px] font-medium text-s-ink-2">
              <RotateCcw size={16} strokeWidth={1.9} className="shrink-0 text-s-success" aria-hidden />
              <span>{t("refundEta")}</span>
            </div>
            {hasFee && (
              <div className="mt-2 text-[12.5px] text-s-ink-2">
                {t("cancelFeeNote", { fee: formatCurrency(feeChf) })}
              </div>
            )}
          </div>
        ) : (
          // Not prepaid (or full fee) → no refund to promise. State it plainly.
          <p className="mt-4 rounded-card bg-s-bg-sunken px-[18px] py-4 text-[14px] leading-relaxed text-s-ink-2">
            {hasFee ? t("noRefundFee") : t("noRefundFree")}
          </p>
        )}

        {/* Salon + service mini-row */}
        <div className="mt-4 flex items-center gap-3">
          {booking.salon?.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={booking.salon.cover_photo_url} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover" />
          ) : (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken font-heading text-base font-semibold text-s-ink">
              {booking.salon?.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-heading text-[15px] font-semibold text-s-ink">{booking.salon?.name ?? "-"}</div>
            <div className="truncate text-[13px] text-s-ink-2">
              {serviceName}{serviceName && dateStr ? ", " : ""}{dateStr}
            </div>
          </div>
        </div>

        {/* Stacked actions — destructive (red outline) then keep (neutral outline) */}
        <button
          type="button"
          onClick={onConfirm}
          disabled={cancelling}
          className="mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-btn border border-s-error/40 text-[15px] font-semibold text-s-error transition active:scale-[0.98] disabled:opacity-50"
        >
          {cancelling && <Spinner size="sm" />}
          {t("confirmCancelBtn")}
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={cancelling}
          className="mt-3 flex h-[52px] w-full items-center justify-center rounded-btn border border-s-border text-[15px] font-semibold text-s-ink transition active:scale-[0.98] disabled:opacity-50"
        >
          {t("keepBtn")}
        </button>
      </div>
    </Sheet>
  );
}
