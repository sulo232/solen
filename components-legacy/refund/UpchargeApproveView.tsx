"use client";

/**
 * Customer/guest UPCHARGE approve-or-decline screen (REFUND_APPEAL_PLAN §11 Lane A / §12
 * item 10, decisions D8 / D13). The CUSTOMER half of the mockup
 * public/solen-refund-salon-upcharge.html (views 3 "approve / decline", 4 "approved",
 * 5 "declined"). The salon-side request form (views 1/2) is PAUSED and NOT built here.
 *
 * A salon asked for more on a completed booking. The customer reviews original vs requested
 * amount + the salon's reason, then EXPLICITLY approves (charges the saved-card difference
 * off-session) or declines (no charge, booking stays at the original total). No silent
 * auto-approve — an open upcharge past its window is void server-side.
 *
 * Data:
 *   - GET  /api/bookings/[id]/dispute  → { dispute }  (direction='upcharge'; requested_amount
 *     Rappen, salon_reason, status, expires_at). This is the upcharge contract.
 *   - GET  /api/bookings/[id]/report   → { booking }  (the ONLY guest-safe booking-facts
 *     surface: salon name, service, appointment, paid_amount Rappen, reference_code). Its
 *     `case` is the REFUND-direction dispute (ignored here).
 * Action:
 *   - PATCH /api/bookings/[id]/dispute { action: 'approve'|'decline', customer_response? }
 *     → 'charged' | { status:'salon_approved', charge_status } | 'void' (decline / expired).
 *
 * Works identically for a logged-in customer (session) and a token-guest (httpOnly access
 * cookie) — the server's resolveBookingActor decides entitlement; the fetch is the same.
 *
 * AESTHETIC: Solen tokens only (LOCKFILE §1-§6). Primary commit (Approve) = bg-s-ink.
 * s-accent strictly on the textarea focus ring (§1.5). Decline = error-text ghost, not a red
 * fill. Money math is computed against booking.paid_amount (Rappen) → CHF at the FE boundary.
 * The mockup's #d32f2f / #ffebee / faked "Visa ·· 4242" are NOT used — no card PAN/last4
 * exists on the booking row, so the charge target is described generically.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  X,
  Lock,
  Info,
  CircleAlert,
  CreditCard,
  MessageSquare,
  Receipt,
} from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  type Tr,
  type BookingFacts,
  type CaseResponse,
  type DisputeStatus,
  fmtMoney,
  fmtDate,
  fmtDateTime,
  serviceName,
} from "./shared";

/** The upcharge shape returned by GET /api/bookings/[id]/dispute (`shapeUpcharge`). */
interface UpchargeShape {
  id: string;
  booking_id: string;
  direction: "upcharge";
  status: DisputeStatus;
  requested_amount: number | null; // Rappen — the EXTRA, not the new total
  salon_reason: string | null; // stored in salon_response
  customer_response: string | null;
  customer_responded_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// Primary "pay the surcharge" commit = solid VIVID orange (s-surcharge), NOT ink — the
// surcharge IS the message (V3-D424, mockup .btn-primary). Caution=orange, not happy-blue.
const ctaSurcharge =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-btn bg-s-surcharge font-display text-[15px] font-medium tracking-[-0.005em] text-white transition-transform duration-100 ease-snap active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-disabled disabled:active:scale-100";
const secondaryBtn =
  "flex h-[48px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white font-display text-[15px] font-medium text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken";
// "Ablehnen" = calm outline secondary: hairline + muted ink, never a red fill (mockup
// .btn-secondary). Declining costs nothing — it shouldn't read as destructive.
const declineBtn =
  "flex h-[46px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white font-display text-[14px] font-medium text-s-ink-2 transition-colors duration-150 ease-snap hover:bg-s-bg-sunken disabled:cursor-not-allowed disabled:opacity-50";

/** Post-action outcome the FE renders (mockup views 4 / 5). */
type Outcome = "approved" | "declined";

export default function UpchargeApproveView({
  bookingId,
  isGuest,
  backHref,
  receiptHref,
  reportHref,
}: {
  bookingId: string;
  isGuest: boolean;
  backHref: string;
  /** Locale-prefixed href to the booking receipt (approved view "View receipt"). */
  receiptHref: string;
  /** Locale-prefixed href to the report-a-problem entry (declined view "Report a problem"). */
  reportHref: string;
}) {
  const t = useTranslations("refundFlow") as unknown as Tr;
  const locale = useLocale();

  const [dispute, setDispute] = useState<UpchargeShape | null>(null);
  const [booking, setBooking] = useState<BookingFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [submitting, setSubmitting] = useState<null | "approve" | "decline">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  // Set after a successful PATCH so we render the confirmed view without a reload.
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const load = useCallback(async () => {
    try {
      // The upcharge contract + the guest-safe booking facts come from two surfaces.
      const [dRes, bRes] = await Promise.all([
        fetch(`/api/bookings/${bookingId}/dispute`, { method: "GET" }),
        fetch(`/api/bookings/${bookingId}/report`, { method: "GET" }),
      ]);
      if (!dRes.ok) {
        setLoadError(true);
        return;
      }
      const dJson = (await dRes.json()) as { dispute: UpchargeShape | null };
      setDispute(dJson.dispute ?? null);
      if (bRes.ok) {
        const bJson = (await bRes.json()) as CaseResponse;
        setBooking(bJson.booking ?? null);
      }
    } catch (err) {
      console.error("[UpchargeApproveView] load failed:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  // The EXTRA (difference) in Rappen, and the math the screen shows.
  const extra = dispute?.requested_amount ?? 0;
  const original = booking?.paid_amount ?? 0; // Rappen, the already-paid total
  const newTotal = original + extra;

  const expiresAt = dispute?.expires_at ? new Date(dispute.expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  // Which screen: a fresh post-action outcome wins; otherwise derive from the live status.
  const view = useMemo<"pending" | "approved" | "declined" | "gone">(() => {
    if (outcome) return outcome;
    const s = dispute?.status;
    if (!dispute) return "gone";
    if (s === "open") return isExpired ? "gone" : "pending";
    // charged / salon_approved = the customer approved (charge may be pursued out-of-band).
    if (s === "charged" || s === "salon_approved" || s === "admin_approved") return "approved";
    // void = declined or expired-without-response. We treat a void with a customer response
    // as a decline; a bare void (no response) is "no longer open".
    if (s === "void") return dispute.customer_responded_at ? "declined" : "gone";
    return "gone";
  }, [outcome, dispute, isExpired]);

  async function respond(action: "approve" | "decline") {
    if (submitting) return;
    setSubmitting(action);
    setActionError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/dispute`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setOutcome(action === "approve" ? "approved" : "declined");
        // Refresh the row so the confirmed view reads real persisted values.
        await load();
        return;
      }
      // 409 with status 'void' = expired while the page was open → show the gone state.
      if (res.status === 409 && j?.status === "void") {
        await load();
        setActionError(t("upExpired"));
        return;
      }
      setActionError(j?.error || t("upActionError"));
    } catch (err) {
      console.error("[UpchargeApproveView] respond failed:", err);
      setActionError(t("upActionError"));
    } finally {
      setSubmitting(null);
    }
  }

  const subtitle = booking?.salon_name
    ? `${booking.salon_name}${booking.starts_at ? ` · ${fmtDate(booking.starts_at, locale)}` : ""}`
    : null;

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Frame t={t} isGuest={isGuest} backHref={backHref} title={t("upTitle")} subtitle={subtitle}>
        <div className="flex flex-1 items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Frame>
    );
  }

  // ── error / no upcharge / expired-or-closed (mockup has no explicit empty, use the
  //    refund flow's not-found pattern) ─────────────────────────────────────────
  if (loadError || view === "gone") {
    const closed = !loadError && !!dispute; // a real-but-no-longer-actionable upcharge
    return (
      <Frame t={t} isGuest={isGuest} backHref={backHref} title={t("upTitle")} subtitle={subtitle}>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-20 text-center">
          <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-pill bg-s-bg-sunken text-s-ink-2">
            {closed ? <Receipt size={28} strokeWidth={2} aria-hidden /> : <CircleAlert size={30} strokeWidth={2} aria-hidden />}
          </div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.018em]">
            {closed ? t("upNoneTitle") : t("notFoundTitle")}
          </h2>
          <p className="mt-2.5 max-w-[280px] text-[13px] leading-[1.55] text-s-ink-2">
            {closed ? t("upNoneBody") : t("notFoundBody")}
          </p>
          <Link href={receiptHref} className={cn(secondaryBtn, "mt-7 max-w-[260px]")}>
            <Receipt size={16} aria-hidden />
            {t("viewBookingReceipt")}
          </Link>
        </div>
      </Frame>
    );
  }

  // ── confirmed: approved (mockup view 4) ───────────────────────────────────────
  if (view === "approved") {
    return (
      <Frame
        t={t}
        isGuest={isGuest}
        backHref={backHref}
        title={t("upApprovedTitle")}
        subtitle={subtitle}
        statusBar={{ tone: "approved", label: t("upBarApproved", { amount: fmtMoney(extra, locale) }) }}
      >
        <div className="flex-1 overflow-y-auto pb-8 pt-[18px] md:pt-7">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="flex flex-col items-center pb-1.5 pt-3.5 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-s-success-bg">
                <Check size={30} strokeWidth={2.4} className="text-s-success" aria-hidden />
              </span>
              <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em]">
                {t("upApprovedHead")}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-s-ink-2">{t("upApprovedSub")}</p>
              <div className="mt-5 font-mono-code text-[30px] font-semibold tracking-[-0.01em] text-s-ink">
                <span className="mr-1.5 text-[16px] font-medium text-s-ink-2">CHF</span>
                {amountOnly(extra, locale)}
              </div>
            </div>

            <KvCard t={t}>
              {booking?.salon_name && <Kv k={t("upKvSalon")} v={salonLine(booking, locale)} />}
              <Kv k={t("rowAppointment")} v={appointmentLine(t, booking, locale)} />
              <Kv k={t("upKvNewTotal")} v={fmtMoney(newTotal, locale)} mono last={!booking?.reference_code} />
              {booking?.reference_code && <Kv k={t("orderNumber")} v={booking.reference_code} mono last />}
            </KvCard>

            <div className="mt-4">
              <Link href={receiptHref} className={cn(secondaryBtn, "md:max-w-[260px]")}>
                <Receipt size={17} aria-hidden />
                {t("upViewReceipt")}
              </Link>
            </div>
            <p className="mt-4 text-[12px] leading-[1.5] text-s-ink-2">{t("upReportWithin")}</p>
          </div>
        </div>
      </Frame>
    );
  }

  // ── confirmed: declined (mockup view 5) ───────────────────────────────────────
  if (view === "declined") {
    return (
      <Frame
        t={t}
        isGuest={isGuest}
        backHref={backHref}
        title={t("upDeclinedTitle")}
        subtitle={subtitle}
        statusBar={{ tone: "declined", label: t("upBarDeclined") }}
      >
        <div className="flex-1 overflow-y-auto pb-8 pt-[18px] md:pt-7">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="flex flex-col items-center pb-1.5 pt-3.5 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-s-closed/[0.08]">
                <X size={28} strokeWidth={2.4} className="text-s-closed" aria-hidden />
              </span>
              <h2 className="font-display text-[22px] font-semibold tracking-[-0.015em]">
                {t("upDeclinedHead")}
              </h2>
              <p className="mt-2 text-[14px] leading-[1.5] text-s-ink-2">
                {t("upDeclinedSub", { amount: fmtMoney(original, locale) })}
              </p>
            </div>

            <KvCard t={t}>
              {booking?.salon_name && <Kv k={t("upKvSalon")} v={salonLine(booking, locale)} />}
              <Kv k={t("upKvRequestedExtra")} v={t("upDeclinedAmount", { amount: fmtMoney(extra, locale) })} mono />
              <Kv k={t("upKvYouPaid")} v={fmtMoney(original, locale)} mono last />
            </KvCard>

            <div className="mt-4 flex items-start gap-2.5 rounded-card bg-s-accent-pale px-3.5 py-[13px]">
              <Info size={17} className="mt-[1px] flex-shrink-0 text-s-accent" aria-hidden />
              <p className="text-[12.5px] leading-[1.5] text-s-ink">{t("upDeclinedNote")}</p>
            </div>

            <div className="mt-4">
              <Link href={reportHref} className={cn(secondaryBtn, "md:max-w-[260px]")}>
                <MessageSquare size={17} aria-hidden />
                {t("upReportProblem")}
              </Link>
            </div>
          </div>
        </div>
      </Frame>
    );
  }

  // ── pending: approve / decline (mockup public/solen-customer-upcharge.html) ──────
  const photo = salonPhoto(booking);
  return (
    <Frame t={t} isGuest={isGuest} backHref={backHref} title={t("upTitle")}>
      {/* scrollable body — leaves room for the pinned CTA bar */}
      <div className="flex-1 overflow-y-auto px-1 pb-6 pt-5">
        <div className="mx-auto w-full max-w-[460px]">
          {/* salon hero: photo (or initials) + name + "asks for a surcharge · {code}" */}
          <div className="flex items-center gap-3">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote salon cover, unknown host; no Image config
              <img
                src={photo}
                alt=""
                className="h-11 w-11 flex-shrink-0 rounded-[12px] object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[12px] bg-s-bg-sunken font-display text-[15px] font-semibold text-s-ink">
                {salonInitials(booking?.salon_name)}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
                {booking?.salon_name ?? t("upTheSalon")}
              </div>
              <div className="mt-[2px] truncate text-[12.5px] text-s-ink-2">
                {booking?.reference_code
                  ? `${t("upBarNeedsApproval")} · ${booking.reference_code}`
                  : t("upBarNeedsApproval")}
              </div>
            </div>
          </div>

          {/* FOCAL surcharge band — light orange card, vivid-orange label + big number */}
          <div className="mt-5 rounded-card bg-s-surcharge-bg p-[18px] text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-s-surcharge">
              {t("upCalcExtra")}
            </div>
            <div className="mt-1 font-display text-[38px] font-bold leading-none tracking-[-0.02em] text-s-surcharge [font-variant-numeric:tabular-nums]">
              + {fmtMoney(extra, locale)}
            </div>
          </div>

          {/* breakdown: already paid → surcharge → new total (neutral ink) */}
          <div className="mt-3.5 overflow-hidden rounded-card border border-s-border">
            <div className="flex items-center justify-between px-3.5 py-3 text-[14px]">
              <span className="text-s-ink-2">{t("upCalcOriginal")}</span>
              <span className="font-display font-semibold text-s-ink [font-variant-numeric:tabular-nums]">
                {fmtMoney(original, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-s-border px-3.5 py-3 text-[14px]">
              <span className="text-s-ink-2">{t("upCalcExtra")}</span>
              <span className="font-display font-semibold text-s-ink [font-variant-numeric:tabular-nums]">
                + {fmtMoney(extra, locale)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-s-border bg-s-bg-sunken px-3.5 py-3 text-[14px]">
              <span className="font-display font-semibold text-s-ink">{t("upCalcNewTotal")}</span>
              <span className="font-display font-semibold text-s-ink [font-variant-numeric:tabular-nums]">
                {fmtMoney(newTotal, locale)}
              </span>
            </div>
          </div>

          {/* the salon's reason */}
          {dispute?.salon_reason && (
            <div className="mt-[18px] rounded-card border border-s-border px-3.5 py-[13px]">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-s-ink/40">
                {t("upWhy")}
              </div>
              <p className="text-[13.5px] leading-[1.45] text-s-ink/[0.72]">“{dispute.salon_reason}”</p>
            </div>
          )}
        </div>
      </div>

      {/* sticky CTA bar — charge note + orange pay + outline decline (mockup .cta-bar) */}
      <div className="sticky bottom-0 mt-auto border-t border-s-border bg-gradient-to-t from-white from-[78%] to-transparent px-4 pb-[18px] pt-3.5 md:px-8">
        <div className="mx-auto w-full max-w-[460px]">
          {actionError && (
            <p role="alert" className="mb-3 flex items-center gap-1.5 text-[12.5px] font-medium text-s-closed">
              <CircleAlert size={14} aria-hidden />
              {actionError}
            </p>
          )}

          {/* what gets charged — no card last4 exists on the row, so describe the saved
              card generically (NEVER fabricate a •••• number). Composed from existing
              translated fragments rather than a new hardcoded sentence. The whole line is
              subdued grey (mockup's connective text); only the AMOUNT carries weight
              (mockup emphasizes the charge amount, not a label). */}
          <div className="mb-3 flex items-center gap-2 text-[12px] text-s-ink/50">
            <CreditCard size={16} className="flex-shrink-0 text-s-ink/40" aria-hidden />
            <span>
              {t("upSavedCard")}
              {" · "}
              {emphasizeAmount(t("upOnlyDifference", { amount: fmtMoney(extra, locale) }), fmtMoney(extra, locale))}
            </span>
          </div>

          <button
            type="button"
            onClick={() => respond("approve")}
            disabled={submitting !== null}
            className={cn(ctaSurcharge, "mb-2")}
          >
            {submitting === "approve" ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" invert />
                {t("upApproving")}
              </span>
            ) : (
              t("upApprovePay", { amount: fmtMoney(extra, locale) })
            )}
          </button>
          <button
            type="button"
            onClick={() => respond("decline")}
            disabled={submitting !== null}
            className={declineBtn}
          >
            {submitting === "decline" ? <Spinner size="sm" /> : t("upDecline")}
          </button>
        </div>
      </div>
    </Frame>
  );
}

/* ── frame / chrome (shared shell: app bar + optional guest banner + optional status bar) ── */

type StatusTone = "pending" | "approved" | "declined";

function Frame({
  t,
  isGuest,
  backHref,
  title,
  subtitle,
  statusBar,
  children,
}: {
  t: Tr;
  isGuest: boolean;
  backHref: string;
  title: string;
  subtitle?: string | null;
  statusBar?: { tone: StatusTone; label: string; trailing?: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-s-ink">
      <header className="flex items-center gap-2.5 border-b border-s-border px-4 py-2.5 md:px-8">
        <Link
          href={backHref}
          aria-label={t("back")}
          className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-pill bg-s-bg-sunken text-s-ink"
        >
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
        </Link>
        <div className="min-w-0">
          <div className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">
            {title}
          </div>
          {subtitle && (
            <div className="mt-[1px] truncate font-body text-[11.5px] font-normal text-s-ink-2">
              {subtitle}
            </div>
          )}
        </div>
      </header>

      {isGuest && (
        <div className="flex items-center gap-2 border-b border-s-border bg-s-accent-pale px-4 py-[9px] md:px-8">
          <Lock size={15} className="flex-shrink-0 text-s-accent" aria-hidden />
          <span className="text-[11.5px] leading-[1.35] text-s-ink">{t("guestBanner")}</span>
        </div>
      )}

      {statusBar && <StatusBar tone={statusBar.tone} label={statusBar.label} trailing={statusBar.trailing} />}

      <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 md:max-w-[680px] md:px-8">
        {children}
      </main>
    </div>
  );
}

/** Top status strip — Layer-3 semantic (color IS the message): pending=warning, approved=
 *  success, declined=closed (red). Mirrors the mockup .statusbar. */
function StatusBar({ tone, label, trailing }: { tone: StatusTone; label: string; trailing?: string }) {
  const surface =
    tone === "approved"
      ? "bg-s-success-bg text-s-success"
      : tone === "declined"
      ? "bg-s-closed/[0.08] text-s-closed"
      : "bg-s-warning-bg text-s-warning-text";
  const dot = tone === "approved" ? "bg-s-success" : tone === "declined" ? "bg-s-closed" : "bg-s-warning";
  return (
    <div className={cn("flex items-center gap-2.5 border-b border-s-border px-4 py-3 md:px-8", surface)}>
      <span className={cn("h-[7px] w-[7px] flex-shrink-0 rounded-pill", dot)} aria-hidden />
      <span className="text-[13px] font-medium">{label}</span>
      {trailing && (
        <span className="ml-auto font-mono-code text-[12.5px] font-medium">{trailing}</span>
      )}
    </div>
  );
}

/* ── small presentational helpers ─────────────────────────────────────────────── */

function KvCard({ t: _t, children }: { t: Tr; children: React.ReactNode }) {
  return (
    <div className="mt-[22px] overflow-hidden rounded-card border border-s-border bg-white">
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function Kv({
  k,
  v,
  mono,
  last,
}: {
  k: string;
  v: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 px-4 py-3", !last && "border-b border-s-border/60")}>
      <span className="flex-shrink-0 text-[13.5px] text-s-ink-2">{k}</span>
      <span className={cn("text-right text-[13.5px] font-medium text-s-ink", mono && "font-mono-code")}>{v}</span>
    </div>
  );
}

/* ── data → display string helpers ────────────────────────────────────────────── */

/**
 * Render a translated sentence with the formatted money substring bolded (ink), the rest
 * subdued. Keeps copy fully in i18n while matching the mockup's amount-emphasis. Falls back
 * to the plain string if the amount isn't found (e.g. a locale that reorders it).
 */
function emphasizeAmount(sentence: string, amount: string): React.ReactNode {
  const i = sentence.indexOf(amount);
  if (i === -1) return sentence;
  return (
    <>
      {sentence.slice(0, i)}
      <span className="font-semibold text-s-ink">{amount}</span>
      {sentence.slice(i + amount.length)}
    </>
  );
}

/** "CHF 45.00" → "45.00" (the amount without the currency prefix, for split rendering). */
function amountOnly(rappen: number, locale: string): string {
  const chf = (rappen ?? 0) / 100;
  return new Intl.NumberFormat(locale === "en" ? "en-CH" : `${locale}-CH`, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(chf);
}

function salonInitials(name?: string | null): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "·";
}

/**
 * The salon cover photo URL the report route hands back (V3-D424). `BookingFacts` doesn't
 * declare it (shared.ts is owned by the refund flow), so read it via a local narrowing —
 * runtime-honest: GET /api/bookings/[id]/report returns `salon_photo` (cover_photo_url, or
 * null). Returns null when absent so the hero falls back to initials.
 */
function salonPhoto(booking: BookingFacts | null): string | null {
  const url = (booking as (BookingFacts & { salon_photo?: string | null }) | null)?.salon_photo;
  return url && url.trim() !== "" ? url : null;
}

function salonLine(booking: BookingFacts | null, _locale: string): string {
  if (!booking?.salon_name) return "-";
  return booking.salon_city ? `${booking.salon_name} · ${booking.salon_city}` : booking.salon_name;
}

function appointmentLine(t: Tr, booking: BookingFacts | null, locale: string): string {
  if (!booking) return "-";
  const svc = serviceName(booking.service_name, locale);
  const when = booking.starts_at ? fmtDateTime(booking.starts_at, locale) : null;
  const withStaff = booking.staff_name ? t("rowAppointmentWith", { staff: booking.staff_name }) : null;
  return [svc, when, withStaff].filter(Boolean).join(" · ") || "-";
}
