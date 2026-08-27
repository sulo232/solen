"use client";

/**
 * Screen 2 + 3 — refund/appeal STATUS + TIMELINE, with the ESCALATE-to-Solen affordance
 * folded in as the action zone for a salon-rejected case (REFUND_APPEAL_PLAN §12).
 *
 * VISUAL TARGET (approved): public/solen-customer-refund-status.html — a customer
 * "refund case status" screen: back-nav header, centered STATUS HERO (a coloured circle
 * with a status icon), two amount chips (Bezahlt / Angefordert), the salon's response
 * block, a "Verlauf" timeline (hollow/filled ring dots + a pulsing "now" dot), and a
 * sticky bottom shield-note + primary CTA. The mockup shows the salon_rejected state;
 * this component generalizes that shell across every case status while keeping ALL logic.
 *
 * One vertical timeline reads the whole lifecycle from `case_events`; the hero icon/colour
 * + the bottom action zone are what change per state. Works for a logged-in customer AND a
 * token-guest (the GET is the one guest-safe surface; a guest sees the guest banner +
 * "resend access link").
 *
 * Data: GET /api/bookings/[id]/report → { case, events, booking }.
 * Actions: escalate → POST /api/bookings/[id]/escalate.  (Salon/admin review live on their
 * own surfaces; this is requester-only.)
 *
 * AESTHETIC: Solen tokens. Layer-3 status colours (colour IS the message): declined/error =
 * s-error (DEFAULT) + s-error-bg (pale); in-review / escalated = s-accent + s-accent-pale;
 * refunded = s-success + s-success-bg; closed = neutral s-bg-sunken / s-ink-2. The BLUE
 * action + the requested amount = s-accent. The "now" timeline dot matches the current
 * status tone (s-error on a decline). No muted s-urgency tokens.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  X,
  Clock,
  ShieldCheck,
  CircleAlert,
  MessageSquare,
  RefreshCw,
  Receipt,
  CalendarPlus,
} from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  type Tr,
  type CaseResponse,
  type CaseShape,
  type CaseEvent,
  type BookingFacts,
  type ReasonCode,
  type DisputeStatus,
  fmtMoney,
  caseAmountColor,
  fmtDate,
  fmtDateTime,
  REASON_KEYS,
  escalateDaysLeft,
} from "./shared";

const ESCALATE_REASONS: ReasonCode[] = [
  "not_delivered",
  "salon_cancelled",
  "wrong_amount",
  "quality",
  "other",
];

/** Primary blue commit (mockup CTA "An Solen eskalieren"). */
const ctaAccent =
  "flex h-[50px] w-full items-center justify-center gap-2 rounded-[13px] bg-s-accent font-heading text-[15px] font-semibold text-white transition-transform duration-100 ease-snap active:scale-[0.985] disabled:cursor-not-allowed disabled:bg-s-bg-sunken disabled:text-s-ink-disabled disabled:active:scale-100";
const secondaryBtn =
  "flex h-[48px] w-full items-center justify-center gap-2 rounded-[13px] border border-s-border bg-white font-heading text-[15px] font-medium text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken";
const ghostBtn =
  "flex h-[42px] w-full items-center justify-center gap-2 rounded-[13px] font-body text-[13.5px] font-medium text-s-ink-2 transition-colors duration-150 ease-snap hover:text-s-ink";

export default function RefundCaseView({
  bookingId,
  isGuest,
  backHref,
  receiptHref,
  reportHref,
  bookAgainHref,
}: {
  bookingId: string;
  isGuest: boolean;
  backHref: string;
  receiptHref: string;
  /** Where "Add more details" sends them (the entry form, to append a note via a new flow). */
  reportHref: string;
  bookAgainHref: string;
}) {
  const t = useTranslations("refundFlow") as unknown as Tr;
  const locale = useLocale();

  const [data, setData] = useState<CaseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // escalate flow state
  const [escalating, setEscalating] = useState(false); // form open
  const [escReason, setEscReason] = useState<ReasonCode | null>(null);
  const [escNote, setEscNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/report`, { method: "GET" });
      if (!res.ok) {
        setLoadError(true);
        return;
      }
      const json = (await res.json()) as CaseResponse;
      setData(json);
    } catch (err) {
      console.error("[RefundCaseView] load failed:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const c = data?.case ?? null;
  const booking = data?.booking ?? null;
  const events = data?.events ?? [];

  async function submitEscalate() {
    if (submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      // Fold the selected reason into the note so it persists: the escalate API stores
      // only `note` -> customer_response, so the reason chip was previously dropped. (2026-06-14 audit.)
      const reasonLabel = escReason ? t(REASON_KEYS[escReason].t) : null;
      const composedNote =
        [reasonLabel, escNote.trim() || null].filter(Boolean).join(": ") || undefined;
      const res = await fetch(`/api/bookings/${bookingId}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: composedNote }),
      });
      if (res.ok) {
        setEscalating(false);
        setEscNote("");
        setEscReason(null);
        setLoading(true);
        await load();
        return;
      }
      const j = await res.json().catch(() => ({}));
      // app/api/bookings/[id]/escalate/route.ts returns the raw code ESCALATION_WINDOW_CLOSED,
      // not a sentence. Map it here rather than falling through to j.error, which would render
      // that literal string in the styled error box in every locale. Never toastEscalateError
      // for this one: the deadline does not move, so "please try again" is wrong advice.
      const message =
        j?.error === "ESCALATION_WINDOW_CLOSED"
          ? t("toastEscalateWindowClosed")
          : j?.error || t("toastEscalateError");
      setActionError(message);
    } catch (err) {
      console.error("[RefundCaseView] escalate failed:", err);
      setActionError(t("toastEscalateError"));
    } finally {
      setSubmitting(false);
    }
  }

  // ── loading / error / no-case ────────────────────────────────────────────────
  if (loading) {
    return (
      <Frame t={t} isGuest={isGuest} backHref={backHref}>
        <div className="flex flex-1 items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Frame>
    );
  }

  if (loadError || !c) {
    return (
      <Frame t={t} isGuest={isGuest} backHref={backHref}>
        <div className="flex flex-1 flex-col items-center justify-center px-2 py-20 text-center">
          <div className="mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-pill bg-s-warning-bg text-s-warning-text">
            <CircleAlert size={30} strokeWidth={2} aria-hidden />
          </div>
          <h2 className="font-heading text-[20px] font-semibold tracking-[-0.018em]">
            {t("notFoundTitle")}
          </h2>
          <p className="mt-2.5 max-w-[280px] text-[13px] leading-[1.55] text-s-ink-2">
            {t("notFoundBody")}
          </p>
          {isGuest && (
            <Link href={`/${locale}/booking/resend-link`} className={cn(ctaAccent, "mt-7 max-w-[260px]")}>
              <RefreshCw size={16} strokeWidth={1.9} aria-hidden />
              {t("requestNewLink")}
            </Link>
          )}
        </div>
      </Frame>
    );
  }

  const meta = statusMeta(c.status);

  return (
    <Frame t={t} isGuest={isGuest} backHref={backHref}>
      {/* desktop two-pane on md+: timeline left, status + actions right */}
      <div className="flex-1 px-1 pb-[120px] pt-5 md:grid md:grid-cols-[1fr_360px] md:gap-7 md:px-0 md:pb-10 md:pt-7">
        <div className="md:contents">
          {/* STATUS HERO — centered icon + headline + lede */}
          <section className="md:order-1 md:col-start-2">
            <StatusHero t={t} c={c} booking={booking} meta={meta} />
          </section>

          {/* AMOUNT CHIPS — paid / requested */}
          {booking && (
            <section className="md:order-2 md:col-start-2">
              <AmountChips t={t} locale={locale} c={c} booking={booking} />
            </section>
          )}

          {/* SALON RESPONSE block — only when the salon actually responded */}
          {c.salon_response && (
            <section className="md:order-3 md:col-start-2">
              <ResponseBlock label={t("tlSalonReason")} body={c.salon_response} />
            </section>
          )}

          {/* TIMELINE — desktop left column */}
          <section className="mt-[18px] md:order-1 md:col-start-1 md:row-span-4 md:row-start-1 md:mt-0">
            <div className="mb-3 font-heading text-[14px] font-semibold tracking-[-0.01em] text-s-ink">
              {t("statusTimeline")}
            </div>
            <Timeline t={t} locale={locale} c={c} booking={booking} events={events} meta={meta} />
          </section>
        </div>
      </div>

      {/* STICKY BOTTOM — shield note + the state-driven action zone */}
      <ActionZone
        t={t}
        locale={locale}
        c={c}
        isGuest={isGuest}
        escalating={escalating}
        setEscalating={setEscalating}
        escReason={escReason}
        setEscReason={setEscReason}
        escNote={escNote}
        setEscNote={setEscNote}
        submitting={submitting}
        actionError={actionError}
        onEscalate={submitEscalate}
        receiptHref={receiptHref}
        reportHref={reportHref}
        bookAgainHref={bookAgainHref}
      />
    </Frame>
  );
}

/* ── frame / chrome ─────────────────────────────────────────────────────────── */

function Frame({
  t,
  isGuest,
  backHref,
  children,
}: {
  t: Tr;
  isGuest: boolean;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-white text-s-ink">
      {/* back-nav header (mockup .nav) */}
      <header className="flex items-center gap-3 border-b border-s-border px-4 py-2.5">
        <Link
          href={backHref}
          aria-label={t("back")}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-pill border border-s-border bg-white text-s-ink"
        >
          <ChevronLeft size={18} strokeWidth={1.9} aria-hidden />
        </Link>
        <div className="font-heading text-[16px] font-semibold tracking-[-0.01em]">
          {isGuest ? t("caseTitleGuest") : t("caseTitle")}
        </div>
      </header>

      {isGuest && (
        <div className="flex items-center gap-2 border-b border-s-border bg-s-accent-pale px-4 py-[9px]">
          <ShieldCheck size={15} strokeWidth={1.9} className="flex-shrink-0 text-s-accent" aria-hidden />
          <span className="text-[12px] leading-[1.35] text-s-ink">{t("guestBanner")}</span>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 md:max-w-[1120px] md:px-8">
        {children}
      </main>
    </div>
  );
}

/* ── status hero (centered icon, mockup .hero) ──────────────────────────────── */

type HeroTone = "review" | "rejected" | "escal" | "refunded" | "muted";

interface StatusMeta {
  tone: HeroTone;
  titleKey: string;
  ledeKey: string;
}

function statusMeta(status: DisputeStatus): StatusMeta {
  switch (status) {
    case "open":
    case "salon_reviewing":
      return { tone: "review", titleKey: "escSalonReviewingTitle", ledeKey: "ledeInReview" };
    case "salon_rejected":
      return { tone: "rejected", titleKey: "escDeclinedTitle", ledeKey: "ledeDeclined" };
    case "escalated":
      return { tone: "escal", titleKey: "escWithSolenTitle", ledeKey: "ledeEscalated" };
    case "salon_approved":
    case "admin_approved":
    case "refunded":
      return { tone: "refunded", titleKey: "escApprovedTitle", ledeKey: "ledeRefunded" };
    case "admin_rejected":
      return { tone: "rejected", titleKey: "escUpheldTitle", ledeKey: "ledeClosed" };
    case "charged":
    case "closed":
    case "void":
    default:
      return { tone: "muted", titleKey: "pillClosed", ledeKey: "ledeClosed" };
  }
}

function StatusHero({
  t,
  c,
  booking,
  meta,
}: {
  t: Tr;
  c: CaseShape;
  booking: BookingFacts | null;
  meta: StatusMeta;
}) {
  const circleCls =
    meta.tone === "rejected"
      ? "bg-s-error-bg"
      : meta.tone === "refunded"
      ? "bg-s-success-bg"
      : meta.tone === "review" || meta.tone === "escal"
      ? "bg-s-accent-pale"
      : "bg-s-bg-sunken";

  return (
    <div className="px-2 pb-1 pt-2 text-center">
      <div className={cn("mx-auto mb-3 flex h-[56px] w-[56px] items-center justify-center rounded-pill", circleCls)}>
        {meta.tone === "rejected" ? (
          <X size={30} strokeWidth={3} className="text-s-error" aria-hidden />
        ) : meta.tone === "refunded" ? (
          <Check size={30} strokeWidth={2.4} className="text-s-success" aria-hidden />
        ) : meta.tone === "muted" ? (
          <Check size={28} strokeWidth={2.2} className="text-s-ink-2" aria-hidden />
        ) : (
          <Clock size={28} strokeWidth={2.2} className="text-s-accent" aria-hidden />
        )}
      </div>
      <h1 className="font-heading text-[21px] font-semibold leading-[1.12] tracking-[-0.02em] text-s-ink">
        {t(meta.titleKey)}
      </h1>
      <p className="mx-auto mt-[5px] max-w-[320px] px-2 text-[13.5px] leading-[1.45] text-s-ink-2">
        {t(meta.ledeKey, { salon: booking?.salon_name ?? "" })}
      </p>
      {booking?.salon_name && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-pill border border-s-border bg-white py-1 pl-1 pr-3">
          <SalonAvatar name={booking.salon_name} photo={salonPhoto(booking)} />
          <span className="font-heading text-[13px] font-medium tracking-[-0.01em] text-s-ink">
            {booking.salon_name}
          </span>
        </div>
      )}
    </div>
  );
}

/** The report-route GET adds `salon_photo` (V3-D424) on top of BookingFacts; read it safely. */
function salonPhoto(booking: BookingFacts): string | null {
  return (booking as BookingFacts & { salon_photo?: string | null }).salon_photo ?? null;
}

/** Up-to-2-letter initials from the salon name (fallback when no photo). */
function salonInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Salon avatar: real photo when present, else initials on a sunken disc. */
function SalonAvatar({ name, photo }: { name: string; photo: string | null }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className="h-[26px] w-[26px] flex-shrink-0 rounded-pill object-cover"
      />
    );
  }
  return (
    <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-pill bg-s-bg-sunken font-heading text-[12px] font-semibold text-s-ink-2">
      {salonInitials(name)}
    </span>
  );
}

/* ── amount chips (mockup .amts) ────────────────────────────────────────────── */

function AmountChips({
  t,
  locale,
  c,
  booking,
}: {
  t: Tr;
  locale: string;
  c: CaseShape;
  booking: BookingFacts;
}) {
  // Requested = the case ask (null = full → the paid amount). Resolved wins once set.
  const requested = c.resolved_amount ?? c.requested_amount ?? booking.paid_amount;
  return (
    <div className="mt-[18px] grid grid-cols-2 gap-3">
      <div className="rounded-[12px] border border-s-border bg-white px-3.5 py-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">
          {t("rowPaid")}
        </div>
        <div className="mt-[3px] font-heading text-[17px] font-semibold tabular-nums tracking-[-0.01em] text-s-ink">
          {fmtMoney(booking.paid_amount, locale)}
        </div>
      </div>
      <div className="rounded-[12px] border border-s-border bg-white px-3.5 py-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">
          {t("rowRequested")}
        </div>
        <div className={`mt-[3px] font-heading text-[17px] font-semibold tabular-nums tracking-[-0.01em] ${caseAmountColor(c.status)}`}>
          {fmtMoney(requested, locale)}
        </div>
      </div>
    </div>
  );
}

/* ── salon response block (mockup .block) ───────────────────────────────────── */

function ResponseBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-[18px] rounded-[12px] border border-s-border bg-white px-3.5 py-3.5">
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">
        {label}
      </div>
      <div className="text-[13.5px] leading-[1.45] text-s-ink/80">{body}</div>
    </div>
  );
}

/* ── timeline (derived from case_events + the case shape) ───────────────────── */

interface TimelineNode {
  state: "done" | "current" | "pending" | "reject";
  title: string;
  meta?: string;
  time?: string;
  note?: { who: string; body: string; tone: "neutral" | "reject" | "good" };
}

function Timeline({
  t,
  locale,
  c,
  booking,
  events,
  meta,
}: {
  t: Tr;
  locale: string;
  c: CaseShape;
  booking: BookingFacts | null;
  events: CaseEvent[];
  meta: StatusMeta;
}) {
  const nodes = useMemo(
    () => buildTimeline(t, locale, c, booking, events),
    [t, locale, c, booking, events],
  );
  // The pulsing "now" dot inherits the current status colour (red on a decline).
  const nowIsError = meta.tone === "rejected";

  return (
    <div className="relative pl-[24px]">
      {/* spine */}
      <span className="absolute left-[6px] top-[4px] bottom-[10px] w-[2px] bg-s-border" aria-hidden />
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1;
        const isNow = n.state === "current" || n.state === "reject";
        return (
          <div key={i} className={cn("relative", last ? "pb-0" : "pb-4")}>
            {/* dot */}
            <span className="absolute left-[-24px] top-[1px] h-[14px] w-[14px]" aria-hidden>
              {isNow && (
                <span
                  className={cn(
                    "absolute inset-0 rounded-pill opacity-50 motion-reduce:hidden",
                    n.state === "reject" || nowIsError ? "bg-s-error" : "bg-s-accent",
                    // mockup-ok: WCAG 2.2.2 conformance, mount-load status ping bounded (tailwind.config.js ping-bounded)
                    "animate-ping-bounded",
                  )}
                />
              )}
              <span
                className={cn(
                  "absolute inset-0 rounded-pill border-2",
                  n.state === "done" && "border-s-ink-2 bg-s-ink-2",
                  n.state === "reject" && "border-s-error bg-s-error",
                  n.state === "current" && (nowIsError ? "border-s-error bg-s-error" : "border-s-accent bg-s-accent"),
                  n.state === "pending" && "border-s-ink-2 bg-white",
                )}
              />
            </span>

            <div className="flex items-baseline justify-between gap-2.5">
              <div
                className={cn(
                  "text-[14px] leading-[1.3]",
                  n.state === "pending" ? "font-medium text-s-ink-2" : "font-medium text-s-ink",
                )}
              >
                {n.title}
              </div>
            </div>
            {n.time && <div className="mt-[2px] text-[12px] text-s-ink-2">{n.time}</div>}
            {n.meta && <div className="mt-[2px] text-[12px] leading-[1.4] text-s-ink-2">{n.meta}</div>}
            {n.note && (
              <div
                className={cn(
                  "mt-2 rounded-[10px] px-[11px] py-[9px] text-[12.5px] leading-[1.45] text-s-ink",
                  n.note.tone === "reject"
                    ? "bg-s-error-bg"
                    : n.note.tone === "good"
                    ? "bg-s-success-bg"
                    : "bg-s-bg-sunken",
                )}
              >
                <span
                  className={cn(
                    "mb-[3px] block text-[12px] font-semibold uppercase tracking-[0.05em]",
                    n.note.tone === "reject"
                      ? "text-s-error"
                      : n.note.tone === "good"
                      ? "text-s-success"
                      : "text-s-ink-2",
                  )}
                >
                  {n.note.who}
                </span>
                {n.note.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compose the timeline from the REAL case_events (source of truth for what happened) plus
 * forward-looking "pending" nodes the events don't yet contain (so the customer sees what's
 * next). Each event maps to a node; the tail pending node depends on the current status.
 */
function buildTimeline(
  t: Tr,
  locale: string,
  c: CaseShape,
  booking: BookingFacts | null,
  events: CaseEvent[],
): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  const reasonLabel = c.reason_code ? t(REASON_KEYS[c.reason_code].t) : null;

  for (const e of events) {
    const time = fmtDateTime(e.created_at, locale);
    switch (e.action) {
      case "created":
        nodes.push({
          state: "done",
          title: t("tlSubmitted"),
          time,
          meta: `${e.actor_role === "guest" ? t("tlSubmittedByGuest") : t("tlSubmittedBy")}${
            reasonLabel ? ` ${t("tlReasonSuffix", { reason: reasonLabel.toLowerCase() })}` : ""
          }`,
          note: c.description
            ? { who: t("tlYourNote"), body: c.description, tone: "neutral" }
            : undefined,
        });
        break;
      case "salon_rejected":
        nodes.push({
          state: "reject",
          title: t("tlRequestDeclined"),
          time,
          meta: t("tlByTheSalon"),
          note: e.note ? { who: t("tlSalonReason"), body: e.note, tone: "reject" } : undefined,
        });
        break;
      case "escalated":
        nodes.push({
          state: "done",
          title: t("tlEscalated"),
          time,
          // actor_role "system" = the timeout cron escalated it, not the customer
          // (app/api/cron/dispute-timeout). Mirrors the guest/non-guest branch on
          // "created" above: the label must match who/what actually acted.
          meta: e.actor_role === "customer" || e.actor_role === "guest" ? t("tlEscalatedByYou") : t("tlEscalatedAuto"),
          note: e.note ? { who: t("tlYourNote"), body: e.note, tone: "neutral" } : undefined,
        });
        break;
      case "admin_approved":
        nodes.push({
          state: "done",
          title: t("tlSolenApproved"),
          time,
          note: e.note ? { who: t("tlSolenDecision"), body: e.note, tone: "good" } : undefined,
        });
        break;
      case "admin_rejected":
        nodes.push({
          state: "reject",
          title: t("tlSolenUpheld"),
          time,
          note: e.note ? { who: t("tlSolenDecision"), body: e.note, tone: "reject" } : undefined,
        });
        break;
      case "refund_issued":
        nodes.push({
          state: "done",
          title: t("tlRefundIssued"),
          time,
          meta: t("tlRefundIssuedMeta", { amount: fmtMoney(e.amount ?? c.resolved_amount ?? 0, locale) }),
        });
        break;
      default:
        // Unknown/auxiliary events (e.g. 'note') still surface as a generic done row.
        if (e.note) {
          nodes.push({ state: "done", title: e.action, time, note: { who: t("tlYourNote"), body: e.note, tone: "neutral" } });
        }
        break;
    }
  }

  // Forward-looking tail per current status.
  switch (c.status) {
    case "open":
    case "salon_reviewing":
      nodes.push({
        state: "current",
        title: t("tlSalonReviewing"),
        time: t("tlInProgress"),
        meta: t("tlSalonReviewingMeta", { salon: booking?.salon_name ?? "" }),
      });
      nodes.push({ state: "pending", title: t("tlDecisionPending"), time: t("tlPending"), meta: t("tlDecisionPendingMeta") });
      break;
    case "salon_rejected":
      nodes.push({
        state: "pending",
        title: t("tlSolenReview"),
        time: t("tlNotStarted"),
        meta: t("tlSolenReviewNotStarted"),
      });
      break;
    case "escalated":
      nodes.push({
        state: "current",
        title: t("tlSolenReviewing"),
        time: c.escalated_at
          ? t("decisionExpectedBy", {
              date: fmtDate(new Date(new Date(c.escalated_at).getTime() + 3 * 24 * 3600 * 1000).toISOString(), locale),
            })
          : t("tlInProgress"),
        meta: t("tlSolenReviewingMeta"),
      });
      nodes.push({ state: "pending", title: t("tlFinalDecision"), time: t("tlPending"), meta: t("tlFinalDecisionMeta") });
      break;
    default:
      break;
  }

  return nodes;
}

/* ── action zone — sticky bottom shield-note + state machine surface ────────── */

function ActionZone({
  t,
  locale,
  c,
  isGuest,
  escalating,
  setEscalating,
  escReason,
  setEscReason,
  escNote,
  setEscNote,
  submitting,
  actionError,
  onEscalate,
  receiptHref,
  reportHref,
  bookAgainHref,
}: {
  t: Tr;
  locale: string;
  c: CaseShape;
  isGuest: boolean;
  escalating: boolean;
  setEscalating: (v: boolean) => void;
  escReason: ReasonCode | null;
  setEscReason: (v: ReasonCode) => void;
  escNote: string;
  setEscNote: (v: string) => void;
  submitting: boolean;
  actionError: string | null;
  onEscalate: () => void;
  receiptHref: string;
  reportHref: string;
  bookAgainHref: string;
}) {
  const ESC_NOTE_MAX = 1000;

  // ----- salon_rejected + escalate FORM open: scrollable composer, not the sticky bar -----
  if (c.status === "salon_rejected" && escalating) {
    return (
      <div className="mx-auto w-full max-w-[460px] px-4 pb-8 md:max-w-[1120px] md:px-8">
        <div className="flex items-start gap-2.5 rounded-[12px] bg-s-accent-pale px-3 py-[11px]">
          <ShieldCheck size={16} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-accent" aria-hidden />
          <p className="text-[12px] leading-[1.45] text-s-ink">{t("escFormSla")}</p>
        </div>

        <div className="mt-3.5 font-heading text-[13px] font-semibold text-s-ink">
          {t("escFormReasonLabel")}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ESCALATE_REASONS.map((r) => {
            const sel = escReason === r;
            return (
              <button
                type="button"
                key={r}
                onClick={() => setEscReason(r)}
                aria-pressed={sel}
                className={cn(
                  "rounded-pill border px-[13px] py-2 text-[12.5px] transition-colors",
                  sel ? "border-s-ink bg-s-ink text-white" : "border-s-border bg-white text-s-ink",
                )}
              >
                {t(REASON_KEYS[r].t)}
              </button>
            );
          })}
        </div>

        <div className="mt-3.5 font-heading text-[13px] font-semibold text-s-ink">
          {t("escFormNoteLabel")}
        </div>
        <textarea
          rows={3}
          value={escNote}
          onChange={(e) => setEscNote(e.target.value.slice(0, ESC_NOTE_MAX))}
          placeholder={t("escFormNotePlaceholder")}
          className="mt-2 w-full resize-none p-3 font-body text-[13.5px] text-s-ink placeholder:text-s-ink-2" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        />
        <div className="mt-[-2px] text-right text-[12px] text-s-ink-2">
          {t("charCount", { count: escNote.length, max: ESC_NOTE_MAX })}
        </div>

        <div className="mt-2 font-heading text-[13px] font-semibold text-s-ink">
          {t("escFormEvidenceLabel")}
        </div>
        <p className="mt-2 rounded-[12px] bg-s-bg-sunken px-3 py-2.5 text-[12px] leading-[1.4] text-s-ink-2">
          {t("escFormEvidenceNote")}
        </p>

        {actionError && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-s-error">
            <CircleAlert size={14} strokeWidth={1.6} aria-hidden />
            {actionError}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-2.5">
          <button type="button" onClick={onEscalate} disabled={submitting} className={ctaAccent}>
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" invert />
                {t("escSending")}
              </span>
            ) : (
              t("escSubmit")
            )}
          </button>
          <button type="button" onClick={() => setEscalating(false)} className={ghostBtn}>
            {t("back")}
          </button>
          <p className="text-center text-[12px] leading-[1.5] text-s-ink-2">{t("escSubmitConfirm")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 border-t border-s-border bg-gradient-to-t from-white from-[72%] to-white/0 pb-[18px] pt-3.5">
      <div className="mx-auto w-full max-w-[460px] px-4 md:max-w-[1120px] md:px-8">
        <ActionInner
          t={t}
          locale={locale}
          c={c}
          isGuest={isGuest}
          setEscalating={setEscalating}
          receiptHref={receiptHref}
          reportHref={reportHref}
          bookAgainHref={bookAgainHref}
        />
      </div>
    </div>
  );
}

function ActionInner({
  t,
  locale,
  c,
  isGuest,
  setEscalating,
  receiptHref,
  reportHref,
  bookAgainHref,
}: {
  t: Tr;
  locale: string;
  c: CaseShape;
  isGuest: boolean;
  setEscalating: (v: boolean) => void;
  receiptHref: string;
  reportHref: string;
  bookAgainHref: string;
}) {
  // ----- salon_rejected: shield note + the BLUE escalate CTA (the mockup state) -----
  if (c.status === "salon_rejected") {
    const daysLeft = escalateDaysLeft(c.salon_responded_at);
    // escalateDaysLeft only reaches 0 once the 14-day window has fully lapsed (13d23h59m
    // still returns 1), and no cron ever moves a case out of salon_rejected, so this is
    // permanent, not a one-tick race. app/api/bookings/[id]/escalate/route.ts now refuses
    // every tap here with ESCALATION_WINDOW_CLOSED, so the CTA and the escWindowToday
    // "still today" copy retire together: a state that cannot exist gets no screen.
    if (daysLeft <= 0) {
      return (
        <>
          <ShieldNote text={t("escWindowClosedNote")} />
          <Link href={`/${locale}/help`} className={secondaryBtn}>
            {t("contactSupport")}
          </Link>
          <p className="mt-2 text-center text-[12px] leading-[1.5] text-s-ink-2">{t("footClosedNoAction")}</p>
        </>
      );
    }
    return (
      <>
        <ShieldNote text={t("footEscalateNoGuarantee")} />
        <button type="button" onClick={() => setEscalating(true)} className={ctaAccent}>
          {t("escalateToSolen")}
        </button>
        <p className="mt-2 text-center text-[12px] leading-[1.5] text-s-ink-2">
          {t("escWindowOpen", { days: daysLeft })} {t("escFree")}
        </p>
      </>
    );
  }

  // ----- open / salon_reviewing: passive wait + add details -----
  if (c.status === "open" || c.status === "salon_reviewing") {
    return (
      <>
        <ShieldNote text={t("footEmailUpdate")} />
        {c.salon_responds_by && (
          <p className="mb-3 text-center text-[12px] leading-[1.5] text-s-ink-2"> {/* mockup-ok: restores the already-shipped escWindowOpen caption pattern, RefundCaseView.tsx:868, byte-identical classes, same role (small print under the CTA) */}
            {c.salon_response_overdue
              ? t("respondsByOverdue", { date: fmtDate(c.salon_responds_by, locale) })
              : t("respondsBy", { date: fmtDate(c.salon_responds_by, locale) })}
          </p>
        )}
        <Link href={reportHref} className={secondaryBtn}>
          <MessageSquare size={17} strokeWidth={1.9} aria-hidden />
          {t("addMoreDetails")}
        </Link>
      </>
    );
  }

  // ----- escalated: with Solen, can add info -----
  if (c.status === "escalated") {
    return (
      <>
        <ShieldNote text={t("escSolenTypical")} />
        <Link href={reportHref} className={secondaryBtn}>
          <MessageSquare size={17} strokeWidth={1.9} aria-hidden />
          {t("addMoreInformation")}
        </Link>
        {isGuest && (
          <Link href={`/${locale}/booking/resend-link`} className={cn(ghostBtn, "mt-2")}>
            {t("resendAccessLink")}
          </Link>
        )}
      </>
    );
  }

  // ----- terminal refunded / approved -----
  if (c.status === "refunded" || c.status === "salon_approved" || c.status === "admin_approved") {
    return (
      <>
        <Link href={bookAgainHref} className={secondaryBtn}>
          <CalendarPlus size={17} strokeWidth={1.9} aria-hidden />
          {t("bookAgain")}
        </Link>
        <Link href={receiptHref} className={cn(ghostBtn, "mt-2")}>
          <Receipt size={16} strokeWidth={1.9} aria-hidden />
          {t("viewBookingReceipt")}
        </Link>
        <p className="mt-1 text-center text-[12px] leading-[1.5] text-s-ink-2">{t("footClosedNoAction")}</p>
      </>
    );
  }

  // ----- terminal admin_rejected (final, no re-escalate) -----
  if (c.status === "admin_rejected") {
    return (
      <>
        <ShieldNote text={t("escUpheldRecourse")} />
        {/* 2026-06-14 audit: was a disabled-forever button (zero recourse on a lost
            appeal). Now links to the help center so the user can actually reach support. */}
        <Link href={`/${locale}/help`} className={secondaryBtn}>
          {t("contactSupport")}
        </Link>
        <p className="mt-2 text-center text-[12px] text-s-ink-2">{t("footClosedNoAction")}</p>
      </>
    );
  }

  // ----- charged / void / closed: calm done -----
  return (
    <>
      <Link href={receiptHref} className={secondaryBtn}>
        <Receipt size={16} strokeWidth={1.9} aria-hidden />
        {t("viewBookingReceipt")}
      </Link>
      <p className="mt-2 text-center text-[12px] text-s-ink-2">{t("footClosedNoAction")}</p>
    </>
  );
}

/** Shield info note above the sticky CTA (mockup .note). */
function ShieldNote({ text }: { text: string }) {
  return (
    <div className="mb-3 flex gap-2 text-[12px] leading-[1.4] text-s-ink-2">
      <ShieldCheck size={15} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
