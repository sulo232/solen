"use client";

/**
 * Screen 1 — the SINGLE report-a-problem / request-a-refund entry (master plan §10b.2).
 * One form, not two: pick a reason, add details, optionally toggle "I want money back"
 * + set an amount, review, send. Posts the unified case to POST /api/bookings/[id]/report
 * ({ reason_code, description, wants_refund, requested_amount? } — Rappen). Works for a
 * logged-in customer (session cookie) AND a token-guest (httpOnly access cookie); the
 * fetch is identical, the server's resolveBookingActor decides.
 *
 * STRUCTURE + AESTHETIC: single-page report form — mockup public/solen-customer-report.html
 * (booking summary → reason rows → description → refund switch + amount → sticky send).
 * Solen tokens only. Mockup #276EF1 → s-accent: the primary CTA, the selected reason
 * (border-s-accent + bg-s-accent/10 + blue radio), the ON toggle, and the amount value.
 * Neutrals → s-ink / s-ink-2 / s-bg-sunken / s-border. The success ("sent") + guard
 * screens below are out of the mockup's scope and keep their existing treatment.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Spinner from "@/components-legacy/ui/Spinner";
import {
  X,
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  Send,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";
import {
  type Tr,
  type BookingFacts,
  type CaseResponse,
  type ReasonCode,
  fmtMoney,
  remainingRefundable,
  serviceName,
  fmtDate,
  REASON_KEYS,
} from "./shared";

type Step = "reason" | "details" | "review" | "sent";

const DESC_MAX = 1000;
const DESC_MIN = 20;

/**
 * GET /api/bookings/[id]/report returns `booking.salon_photo` (the salon's
 * cover_photo_url, V3-D424) but the shared BookingFacts type predates it. Read it
 * type-safely here without touching shared.ts.
 */
type BookingFactsWithPhoto = BookingFacts & { salon_photo?: string | null };

/** First letter of up to two words of the salon name, uppercased — the avatar fallback. */
function salonInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase() || "•"
  );
}

const REASON_ORDER: ReasonCode[] = [
  "salon_cancelled",
  "not_delivered",
  "wrong_amount",
  "double_charge",
  "quality",
  "other",
];

// The mockup's reason rows are radio + label only — no per-reason icon tile.

/** Report screen's primary commit action — blue per the mockup (#276EF1 → s-accent). */
const ctaAccent =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-[13px] bg-s-accent font-heading text-[15px] font-semibold tracking-[-0.005em] text-white transition-transform duration-100 ease-snap active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-disabled disabled:active:scale-100";
const ctaInk =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-display text-[14.5px] font-semibold tracking-[-0.005em] text-white transition-transform duration-100 ease-snap active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-disabled disabled:active:scale-100";
const ghostBtn =
  "flex h-[46px] w-full items-center justify-center gap-2 rounded-btn border border-s-border bg-white font-display text-[13.5px] font-semibold text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken";

export default function ReportRefundEntry({
  bookingId,
  caseHref,
}: {
  bookingId: string;
  /** Locale-prefixed href to the status/timeline screen. */
  caseHref: string;
}) {
  const t = useTranslations("refundFlow") as unknown as Tr;
  const locale = useLocale();
  const router = useRouter();

  // Self-fetch the booking facts + any existing case via the one guest-safe surface
  // (GET /api/bookings/[id]/report). Same fetch works for a logged-in customer and a
  // token-guest; the server's resolveBookingActor decides entitlement.
  const [booking, setBooking] = useState<BookingFactsWithPhoto | null>(null);
  const [hasOpenCase, setHasOpenCase] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/report`, { method: "GET" });
        if (!res.ok) {
          if (alive) setBootError(true);
          return;
        }
        const json = (await res.json()) as CaseResponse;
        if (!alive) return;
        setBooking(json.booking ?? null);
        // An OPEN (not-yet-closed/rejected) refund case means the user should be routed
        // to the case view, not file a duplicate (route enforces one-open-per-booking).
        const open =
          !!json.case &&
          !["refunded", "charged", "void", "closed", "salon_rejected", "admin_rejected"].includes(
            json.case.status,
          );
        setHasOpenCase(open);
      } catch (err) {
        console.error("[ReportRefundEntry] boot fetch failed:", err);
        if (alive) setBootError(true);
      } finally {
        if (alive) setBootLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bookingId]);

  // `step` is retained only to render the success ("sent") screen after a 201; the form
  // body is single-page (the mockup shows reason + description + refund all at once), so
  // there is no reason/details/review navigation.
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<ReasonCode | null>(null);
  const [description, setDescription] = useState("");
  const [touchedDesc, setTouchedDesc] = useState(false);
  const [wantsRefund, setWantsRefund] = useState(false);
  const [partialAmount, setPartialAmount] = useState(""); // CHF string the user types; empty = full
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdCaseRef, setCreatedCaseRef] = useState<string | null>(null);

  const remaining = remainingRefundable(booking); // Rappen
  const salonLabel = booking?.salon_name ?? "";

  // Typed amount → Rappen. Empty/invalid = null (= request the full remaining; the server
  // resolves it). Matches the mockup's single field + "leave empty for the full amount".
  const partialRappen = useMemo(() => {
    const n = parseFloat(partialAmount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }, [partialAmount]);

  // Only an OVER-the-remaining typed amount is invalid; empty is valid (= full).
  const partialInvalid =
    wantsRefund && partialRappen != null && remaining > 0 && partialRappen > remaining;

  const descTooShort = description.trim().length < DESC_MIN;
  const cannotSend = !reason || descTooShort || partialInvalid;

  const reasonTitle = (r: ReasonCode) => t(REASON_KEYS[r].t);

  async function submit() {
    setTouchedDesc(true);
    if (!reason || submitting || descTooShort || partialInvalid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: {
        reason_code: ReasonCode;
        description: string;
        wants_refund: boolean;
        requested_amount?: number;
      } = {
        reason_code: reason,
        description: description.trim(),
        wants_refund: wantsRefund,
      };
      // Typed a (valid) amount → send the explicit Rappen partial; empty → omit (server
      // resolves the full remaining). Body shape is unchanged.
      if (wantsRefund && partialRappen != null) {
        body.requested_amount = partialRappen;
      }

      const res = await fetch(`/api/bookings/${bookingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        // Case id is the durable ref; show its short tail as the case code chip.
        const data = await res.json().catch(() => ({}));
        const id: string | undefined = data?.case?.id;
        setCreatedCaseRef(id ? id.slice(0, 5).toUpperCase() : null);
        setStep("sent");
        return;
      }
      if (res.status === 409) {
        // One open case per booking — route them to the existing case.
        router.push(caseHref);
        return;
      }
      const data = await res.json().catch(() => ({}));
      console.error("[ReportRefundEntry] submit error:", data?.error);
      setSubmitError(t("genericError")); // friendly, not the raw server string
    } catch (err) {
      console.error("[ReportRefundEntry] submit failed:", err);
      setSubmitError(t("toastSendError"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── boot loading / error ──────────────────────────────────────────────────────
  if (bootLoading) {
    return (
      <Shell t={t} title={t("entryTitle")} onBack={() => router.back()}>
        <div className="flex flex-1 items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Shell>
    );
  }
  if (bootError) {
    return (
      <Shell t={t} title={t("entryTitle")} onBack={() => router.back()}>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-20 text-center">
          <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-pill bg-s-warning-bg text-s-warning-text">
            <CircleAlert size={30} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.018em]">
            {t("notFoundTitle")}
          </h2>
          <p className="mt-2.5 max-w-[280px] text-[13px] leading-[1.55] text-s-ink-2">
            {t("notFoundBody")}
          </p>
          {/* A guest whose link expired recovers via resend; a logged-in user just goes back. */}
          <Link href={`/${locale}/booking/resend-link`} className={cn(ghostBtn, "mt-7 max-w-[260px]")}>
            {t("requestNewLink")}
          </Link>
        </div>
      </Shell>
    );
  }

  // ── already-open guard ──────────────────────────────────────────────────────
  if (hasOpenCase && step !== "sent") {
    return (
      <Shell t={t} title={t("entryTitle")} onClose={() => router.push(caseHref)}>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-10 text-center">
          <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-pill bg-s-warning-bg text-s-warning-text">
            <Clock size={30} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-display text-[20px] font-semibold tracking-[-0.018em]">
            {t("alreadyOpenTitle")}
          </h2>
          <p className="mt-2.5 max-w-[280px] text-[13px] leading-[1.55] text-s-ink-2">
            {t("alreadyOpenBody")}
          </p>
          <Link href={caseHref} className={cn(ctaInk, "mt-7 max-w-[260px]")}>
            {t("viewCase")}
            <ArrowRight size={17} strokeWidth={1.9} aria-hidden />
          </Link>
        </div>
      </Shell>
    );
  }

  // ── success ─────────────────────────────────────────────────────────────────
  if (step === "sent") {
    return (
      <Shell t={t} title={null} onClose={() => router.push(caseHref)} closeIcon>
        <div className="flex flex-1 flex-col items-center px-2 py-6 text-center">
          <div className="mb-5 flex h-[74px] w-[74px] items-center justify-center rounded-pill bg-s-success-bg">
            <Check size={34} strokeWidth={2.4} className="text-s-success" aria-hidden />
          </div>
          <h2 className="font-display text-[21px] font-bold tracking-[-0.02em]">{t("sentTitle")}</h2>
          <p className="mt-2.5 max-w-[260px] text-[13px] leading-[1.55] text-s-ink-2">
            {wantsRefund
              ? t("sentBodyRefund", { salon: salonLabel })
              : t("sentBodyReport", { salon: salonLabel })}
          </p>
          {(createdCaseRef || booking?.reference_code) && (
            <div className="mt-[18px] rounded-[10px] bg-s-bg-sunken px-3.5 py-2.5 font-mono-code text-[13px] font-semibold tracking-[0.02em] text-s-ink">
              {t("sentCaseRef", {
                case: createdCaseRef ? `CR-${createdCaseRef}` : "-",
                order: booking?.reference_code || "-",
              })}
            </div>
          )}

          {/* 3-step status preview (submitted → reviewing → decision) */}
          <div className="mt-[22px] w-full rounded-[14px] border border-s-border p-3.5 text-left">
            <SuccessStep
              tone="done"
              title={t("sentStepSubmitted")}
              meta={
                wantsRefund
                  ? t("sentStepSubmittedMetaRefund", {
                      amount: fmtMoney(partialRappen ?? remaining, locale),
                    })
                  : t("sentStepSubmittedMetaReport")
              }
            />
            <SuccessStep tone="now" title={t("sentStepReviewing")} meta={t("sentStepReviewingMeta")} />
            <SuccessStep tone="next" title={t("sentStepDecision")} meta={t("sentStepDecisionMeta")} last />
          </div>

          <div className="flex-1" />
          <Link href={caseHref} className={cn(ghostBtn, "mt-[22px]")}>
            {t("viewOnBooking")}
          </Link>
        </div>
      </Shell>
    );
  }

  // ── single-page report form (mockup: public/solen-customer-report.html) ─────────
  const svc = serviceName(booking?.service_name ?? null, locale);
  const apptDate = fmtDate(booking?.starts_at, locale);
  const orderCode = booking?.reference_code ?? "";
  const photo = booking?.salon_photo ?? null;
  // service · date · order-code — only the parts we actually have, joined by " · ".
  const summaryMeta = [svc, apptDate, orderCode].filter(Boolean).join(" ");

  return (
    <Shell t={t} title={t("entryTitle")} onBack={() => router.back()}>
      <div className="flex-1 overflow-y-auto px-1 pb-4 pt-[18px]">
        {/* booking summary */}
        <div className="mb-[22px] flex items-center gap-3 rounded-[14px] bg-s-bg-sunken px-[14px] py-3">
          {photo ? (
            <img
              src={photo}
              alt={salonLabel}
              className="h-[42px] w-[42px] flex-shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-s-bg-sunken font-heading text-[15px] font-semibold text-s-ink">
              {salonInitials(salonLabel)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-heading text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
              {salonLabel}
            </div>
            {summaryMeta && (
              <div className="mt-[2px] truncate text-[12px] text-s-ink-2">{summaryMeta}</div>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">
              {t("reviewPaid")}
            </div>
            <div className="mt-[1px] font-heading text-[14px] font-semibold tabular-nums tracking-[-0.01em] text-s-ink">
              {fmtMoney(booking?.paid_amount ?? 0, locale)}
            </div>
          </div>
        </div>

        {/* trust-04: the 14-day reporting window, surfaced before the customer decides to
            file rather than only discovered on a rejected submit. mockup-ok: /dev/report-window-note */}
        <div className="mb-5 flex gap-2 text-[12px] leading-[1.4] text-s-ink-2">
          <Info size={15} className="mt-[1px] flex-shrink-0 text-s-ink-2 opacity-70" aria-hidden />
          <span>{t("reportWindowNote")}</span>
        </div>

        {/* reason */}
        <h1 className="mb-[10px] font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
          {t("reasonQuestion")}
        </h1>
        <div className="mb-6 flex flex-col gap-2">
          {REASON_ORDER.map((r) => {
            const sel = reason === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => setReason(r)}
                aria-pressed={sel}
                className={cn(
                  "flex items-center gap-3 rounded-[12px] border bg-white px-[14px] py-[13px] text-left transition-colors duration-150 ease-snap",
                  sel
                    ? "border-[1.5px] border-s-accent bg-s-accent/10"
                    : "border-s-border hover:bg-s-bg-sunken",
                )}
              >
                <span
                  className={cn(
                    "relative flex h-[19px] w-[19px] flex-shrink-0 items-center justify-center rounded-pill border-2",
                    sel ? "border-s-accent" : "border-s-border",
                  )}
                  aria-hidden
                >
                  {sel && <span className="h-[9px] w-[9px] rounded-pill bg-s-accent" />}
                </span>
                <span className="min-w-0 flex-1 text-[14px] font-medium text-s-ink">
                  {reasonTitle(r)}
                </span>
              </button>
            );
          })}
        </div>

        {/* description */}
        <h2 className="mb-[3px] font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
          {t("descriptionLabel")}
        </h2>
        <p className="mb-3 text-[12px] leading-[1.5] text-s-ink-2">{t("reasonHint")}</p>
        <textarea
          id="report-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
          onBlur={() => setTouchedDesc(true)}
          placeholder={t("descriptionPlaceholder")}
          aria-invalid={touchedDesc && descTooShort}
          className={cn(
            "min-h-[92px] w-full resize-none rounded-[12px] border bg-white px-[14px] py-3 font-body text-[14px] leading-[1.5] text-s-ink placeholder:text-s-ink-2/60 focus:outline-none",
            touchedDesc && descTooShort
              ? "border-s-closed"
              : "border-s-border",
          )}
        />
        <div className="mb-6 mt-[5px] flex items-center justify-between">
          {touchedDesc && descTooShort ? (
            <span className="flex items-center gap-1 text-[12px] font-medium text-s-closed">
              <CircleAlert size={12} aria-hidden />
              {t("descriptionMin")}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[12px] text-s-ink-2">
            {t("charCount", { count: description.length, max: DESC_MAX })}
          </span>
        </div>

        {/* refund toggle + amount */}
        <h2 className="mb-[10px] font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
          {t("moneyTitle")}
        </h2>
        <div className="rounded-[14px] border border-s-border p-[14px]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-heading text-[14px] font-semibold text-s-ink">
                {t("moneyTitle")}
              </div>
              <div className="mt-[1px] text-[12px] leading-[1.4] text-s-ink-2">
                {wantsRefund ? t("moneyOnDesc") : t("moneyOffDesc")}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={wantsRefund}
              aria-label={t("moneyTitle")}
              onClick={() => setWantsRefund((v) => !v)}
              className={cn(
                "relative h-[26px] w-[44px] flex-shrink-0 rounded-pill transition-colors duration-200",
                wantsRefund ? "bg-s-accent" : "bg-s-border",
              )}
            >
              <span
                className={cn(
                  "absolute left-[3px] top-[3px] h-5 w-5 rounded-pill bg-white shadow-elevation-1 transition-transform duration-200 ease-spring",
                  wantsRefund && "translate-x-[18px]",
                )}
                aria-hidden
              />
            </button>
          </div>

          {wantsRefund && (
            <>
              <div className="mt-[14px] flex items-center gap-[10px] border-t border-s-border pt-[14px]">
                <label htmlFor="refund-amt" className="text-[13px] text-s-ink-2">
                  {t("rowRequested")}
                </label>
                <div
                  // mockup-ok: halo deleted to match the unlayered global focus law (app/globals.css); per-component halos are blocked by ~/.claude/hooks/no-focus-ring-gate.py
                  className={cn(
                    "ml-auto flex items-center gap-[6px] rounded-[10px] border bg-white px-3 py-2 focus-within:border-s-ink",
                    partialInvalid ? "border-s-closed" : "border-s-border",
                  )}
                >
                  <span className="text-[13px] text-s-ink-2">CHF</span>
                  {/* mockup-ok: !important prevents a look change, not a new one. The wrapper
                      row above owns the visible chrome (its own border+bg, incl. the
                      partialInvalid error color); this input must stay invisible AND compact
                      inside it, or the widened base input law (globals.css, 2026-07-17) paints
                      a second box AND balloons the row (V3-D-input-fill-2026-07-17). */}
                  <input
                    id="refund-amt"
                    inputMode="decimal"
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                    placeholder={(remaining / 100).toFixed(2)}
                    aria-label={t("rowRequested")}
                    aria-invalid={partialInvalid}
                    className="w-[64px] !border-0 !bg-transparent !min-h-0 !px-0 text-right font-heading !text-[15px] font-semibold tabular-nums text-s-accent outline-none placeholder:text-s-accent/45"
                  />
                </div>
              </div>
              {partialInvalid ? (
                <p className="mt-2 flex items-center gap-1 text-[12px] font-medium text-s-closed">
                  <CircleAlert size={12} aria-hidden />
                  {t("moneyAmountError", { amount: fmtMoney(remaining, locale) })}
                </p>
              ) : (
                <p className="mt-[10px] text-[12px] leading-[1.4] text-s-ink-2">
                  {t.rich("moneyPaidCap", {
                    amount: fmtMoney(booking?.paid_amount ?? 0, locale),
                    b: (chunks: React.ReactNode) => (
                      <b className="font-semibold text-s-ink">{chunks}</b>
                    ),
                  })}
                </p>
              )}
            </>
          )}
        </div>

        {submitError && (
          <p
            role="alert"
            className="mt-3.5 flex items-center gap-1.5 rounded-[10px] bg-s-closed/[0.06] px-3 py-2.5 text-[12px] font-medium text-s-closed"
          >
            <CircleAlert size={14} strokeWidth={1.6} aria-hidden />
            {submitError}
          </p>
        )}
      </div>

      {/* sticky CTA bar */}
      <div className="flex-shrink-0 border-t border-s-border bg-white px-1 pb-1 pt-3">
        <div className="mb-3 flex gap-2 text-[12px] leading-[1.4] text-s-ink-2">
          <Info size={15} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2 opacity-70" aria-hidden />
          <span>{t("reviewTimelineNote")}</span>
        </div>
        <button type="button" onClick={submit} disabled={cannotSend || submitting} className={ctaAccent}>
          {submitting ? (
            <span className="h-[17px] w-[17px] animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/35 border-t-white" />
          ) : (
            <>
              <Send size={17} strokeWidth={1.9} aria-hidden />
              {t("sendRequest")}
            </>
          )}
        </button>
      </div>
    </Shell>
  );
}

/* ── sub-components ─────────────────────────────────────────────────────────── */

function Shell({
  t,
  title,
  onBack,
  onClose,
  closeIcon,
  children,
}: {
  t: Tr;
  title: string | null;
  onBack?: () => void;
  onClose?: () => void;
  closeIcon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[460px] flex-col px-4 pb-4 pt-3">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-s-border pb-2.5">
        {onBack && (
          // mockup-ok: restores the shipped NAV CONTROLS look (LOCKFILE.md, 2026-08-10), already
          // live via BackButton in SalonStickyTabNav.tsx; this hand-drawn button had drifted from
          // it (no shadow-elevation-2). Composing the registered primitive per FLOORS LAW 9.
          <BackButton variant="flat" label={t("back")} onClick={onBack} />
        )}
        {title && (
          <span className="font-heading text-[16px] font-semibold tracking-[-0.01em]">{title}</span>
        )}
        <span className="ml-auto" />
        {(onClose || closeIcon) && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-9 w-9 items-center justify-center rounded-pill border border-s-border bg-white text-s-ink"
          >
            <X size={20} strokeWidth={2.2} aria-hidden />
          </button>
        )}
      </header>
      {children}
    </div>
  );
}

function SuccessStep({
  tone,
  title,
  meta,
  last,
}: {
  tone: "done" | "now" | "next";
  title: string;
  meta: string;
  last?: boolean;
}) {
  return (
    <div className={cn("flex items-start gap-2.5 py-[7px]")}>
      <span
        className={cn(
          "mt-[1px] flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-pill",
          tone === "done" && "bg-s-success",
          tone === "now" && "bg-s-ink",
          tone === "next" && "border-[1.5px] border-s-border bg-white",
        )}
        aria-hidden
      >
        {tone === "done" && <Check size={10} strokeWidth={3} className="text-white" />}
      </span>
      <span>
        <span className="block font-display text-[12.5px] font-semibold tracking-[-0.005em]">
          {title}
        </span>
        <span className="mt-[1px] block text-[12px] text-s-ink-2">{meta}</span>
      </span>
    </div>
  );
}
