"use client";

/**
 * Resend my access link — app/[locale]/booking/resend-link  (master plan §10b.10)
 *
 * Guest-facing, account-less. A guest who lost their private access link asks for a fresh
 * one here. Wired to the REAL backend: POST /api/bookings/resend-access { code, email | phone }.
 * That endpoint is fully opaque (byte-identical 200 for match / no-match / bad-code) so this
 * UI NEVER branches on whether a booking exists — it always shows the same uniform "sent"
 * state. A 429 swaps to the rate-limited lockout with a live countdown driven by Retry-After.
 *
 * STRUCTURE: Fresha / Treatwell account-recovery (mockup public/solen-refund-resend-access-link.html).
 * AESTHETIC: Solen tokens only — ink CTA, s-accent strictly on input focus, amber Layer-3 for
 * the rate-limit warning, s-closed for the genuine format-validation error. No off-token hexes.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  ChevronLeft,
  Send,
  Mail,
  Lock,
  Clock,
  AlertTriangle,
  CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = "email" | "phone";
type View = "form" | "sent" | "limited";

// Mirror of the backend normalizer's user-facing contract: 5 chars after SOL-.
const CODE_BODY_RE = /^[A-Z0-9]{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s]{6,20}$/;

// Resend cool-down between successful sends (UI affordance; the server is the real gate).
const RESEND_COOLDOWN_S = 60;

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function ResendAccessLinkPage() {
  const t = useTranslations("resendAccess");
  const locale = useLocale();

  const [channel, setChannel] = useState<Channel>("email");
  const [codeBody, setCodeBody] = useState(""); // the part after "SOL-"
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<View>("form");

  // countdowns
  const [resendLeft, setResendLeft] = useState(0); // sent-state resend cool-down
  const [lockLeft, setLockLeft] = useState(0); // rate-limit lockout
  const [lockTotal, setLockTotal] = useState(0);

  const fullCode = `SOL-${codeBody.trim().toUpperCase()}`;

  // ---- validation (client-side format only; submit response stays uniform) ----
  const errors = useMemo(() => {
    const e: { code?: string; contact?: string } = {};
    if (!CODE_BODY_RE.test(codeBody.trim().toUpperCase())) e.code = t("orderError");
    if (channel === "email") {
      if (!EMAIL_RE.test(email.trim())) e.contact = t("emailError");
    } else {
      if (!PHONE_RE.test(phone.trim())) e.contact = t("phoneError");
    }
    return e;
  }, [codeBody, channel, email, phone, t]);

  const isValid = Object.keys(errors).length === 0;

  // ---- single interval that ticks whichever countdown is active ----
  useEffect(() => {
    if (resendLeft <= 0 && lockLeft <= 0) return;
    const id = setInterval(() => {
      setResendLeft((v) => (v > 0 ? v - 1 : 0));
      setLockLeft((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendLeft, lockLeft]);

  // when the lockout clears, return to the form
  useEffect(() => {
    if (view === "limited" && lockLeft <= 0 && lockTotal > 0) {
      setView("form");
      setLockTotal(0);
    }
  }, [view, lockLeft, lockTotal]);

  const submit = useCallback(async () => {
    setTouched(true);
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const body: Record<string, string> =
        channel === "email"
          ? { code: fullCode, email: email.trim() }
          : { code: fullCode, phone: phone.trim() };

      const res = await fetch("/api/bookings/resend-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After")) || 9 * 60;
        setLockTotal(retryAfter);
        setLockLeft(retryAfter);
        setView("limited");
        return;
      }

      // Any other outcome → the opaque success state (the endpoint always 200s on a
      // well-formed body; even a 400/500 we surface as the uniform message so we never
      // leak whether a booking exists). Start the resend cool-down.
      setResendLeft(RESEND_COOLDOWN_S);
      setView("sent");
    } catch (err) {
      console.error("[resend-link] request failed:", err);
      // Network error: still show the uniform sent state (no enumeration surface).
      setResendLeft(RESEND_COOLDOWN_S);
      setView("sent");
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, channel, fullCode, email, phone]);

  // masked destination for the sent card, e.g. l•••a@bluewin.ch / +41 79 •• •• 214
  const maskedDest = useMemo(() => {
    if (channel === "email") {
      const v = email.trim();
      const at = v.indexOf("@");
      if (at <= 0) return v;
      const local = v.slice(0, at);
      const domain = v.slice(at);
      const head = local[0] ?? "";
      const tail = local.length > 1 ? local[local.length - 1] : "";
      return `${head}•••${tail}${domain}`;
    }
    const v = phone.replace(/\s/g, "");
    const last3 = v.slice(-3);
    const cc = v.startsWith("+") ? v.slice(0, 3) : "";
    return `${cc} •• •• ${last3}`.trim();
  }, [channel, email, phone]);

  // ===================================================================== //
  return (
    <div className="min-h-[100dvh] bg-white text-s-ink">
      {/* top app bar */}
      <header className="sticky top-0 z-10 flex h-[52px] items-center gap-3 border-b border-s-border bg-white px-4">
        <Link
          href={`/${locale}/booking/lookup`}
          aria-label={t("back")}
          // mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md) , 34px raised
          // to the locked 44px icon-button floor, fits the 52px header, no redesign.
          className="flex h-11 w-11 items-center justify-center rounded-pill border border-s-border bg-white text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken"
        >
          <ChevronLeft size={18} strokeWidth={1.9} aria-hidden />
        </Link>
        <span className="font-display text-[15px] font-semibold tracking-[-0.01em]">
          {t("appBarTitle")}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-[460px] flex-col px-5 pb-10 pt-6 md:max-w-[1100px] md:flex-row md:gap-12 md:px-8 md:pt-14">
        {/* ---------------- left: form / states ---------------- */}
        <section className="w-full md:max-w-[440px] md:flex-1">
          {view === "form" && (
            <FormView
              t={t}
              channel={channel}
              setChannel={setChannel}
              codeBody={codeBody}
              setCodeBody={setCodeBody}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              errors={errors}
              touched={touched}
              onTouch={() => setTouched(true)}
              isValid={isValid}
              submitting={submitting}
              onSubmit={submit}
              locale={locale}
            />
          )}

          {view === "sent" && (
            <SentView
              t={t}
              code={fullCode}
              maskedDest={maskedDest}
              channel={channel}
              resendLeft={resendLeft}
              onResend={() => setView("form")}
            />
          )}

          {view === "limited" && (
            <LimitedView t={t} lockLeft={lockLeft} lockTotal={lockTotal} />
          )}
        </section>

        {/* ---------------- right: how-it-works rail (desktop only) ---------------- */}
        <aside className="mt-10 hidden md:mt-0 md:flex md:w-[380px] md:flex-col md:justify-center">
          {view === "limited" ? <HurryRail t={t} /> : <HowItWorksRail t={t} />}
        </aside>
      </main>
    </div>
  );
}

/* ===================================================================== */
/* shared styles                                                          */
/* ===================================================================== */

const inputBase = // mockup-ok: dead-class removal only, base input law (globals.css) already renders this fill/border/radius; no visual change (V3-D-input-fill-2026-07-17)
  "w-full h-[50px] px-[15px] font-body text-[14px] text-s-ink placeholder:text-s-ink-disabled transition-[border-color,box-shadow] duration-150 ease-snap appearance-none";
/* !important: the base input law in globals.css (2026-07-17) now covers this bare
   `<input>` too and out-specifies a plain border-color utility at rest; `!` keeps the
   red error edge visible instead of silently losing to the transparent resting border. */
const inputErr = "!border-s-closed"; // mockup-ok: keeps existing error-red visible under the widened base rule, not a new look
const labelCls = "block text-[12.5px] font-medium text-s-ink mb-[7px]";
const hintCls = "mt-1.5 text-[12px] leading-[1.4] text-s-ink-2";
const ctaInk =
  "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-btn bg-s-ink font-body text-[15px] font-medium tracking-[-0.005em] text-white transition-transform duration-100 ease-snap active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-s-ink-disabled disabled:active:scale-100";

/* ===================================================================== */
/* state 1 — request form                                                 */
/* ===================================================================== */

function FormView(props: {
  t: ReturnType<typeof useTranslations>;
  channel: Channel;
  setChannel: (c: Channel) => void;
  codeBody: string;
  setCodeBody: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  errors: { code?: string; contact?: string };
  touched: boolean;
  onTouch: () => void;
  isValid: boolean;
  submitting: boolean;
  onSubmit: () => void;
  locale: string;
}) {
  const {
    t,
    channel,
    setChannel,
    codeBody,
    setCodeBody,
    email,
    setEmail,
    phone,
    setPhone,
    errors,
    touched,
    onTouch,
    isValid,
    submitting,
    onSubmit,
    locale,
  } = props;

  const showCodeErr = touched && !!errors.code;
  const showContactErr = touched && !!errors.contact;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <div className="hidden md:mb-5 md:flex md:items-center md:gap-1.5 md:text-[12px] md:text-s-ink-2">
        <span>{t("crumbManage")}</span>
        <ChevronLeft size={13} className="rotate-180" aria-hidden />
        <span>{t("crumbResend")}</span>
      </div>

      <h1 className="font-display text-[22px] font-semibold leading-[1.18] tracking-[-0.02em] md:text-[30px]">
        {t("title")}
      </h1>
      <p className="mt-[9px] max-w-[430px] text-[13.5px] leading-[1.5] text-s-ink-2 md:text-[14.5px] md:leading-[1.55]">
        {t("lead")}
      </p>

      {/* order number */}
      <div className="mt-[18px]">
        <label htmlFor="resend-code" className={labelCls}>
          {t("orderLabel")}
        </label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 font-mono-code text-[15px] font-medium tracking-[0.04em] text-s-ink-disabled"
          >
            SOL-
          </span>
          <input
            id="resend-code"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={5}
            value={codeBody}
            onChange={(e) =>
              setCodeBody(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())
            }
            onBlur={onTouch}
            placeholder={t("orderPlaceholder")}
            aria-invalid={showCodeErr}
            aria-describedby={showCodeErr ? "resend-code-error" : "resend-code-hint"}
            className={cn(
              inputBase,
              // !important: the widened base input law (globals.css, 2026-07-17) now matches
              // this bare `<input>` too and out-specifies pl-[58px]/text-[15px]/font-mono-code
              // at rest; `!` keeps the code clear of the "SOL-" prefix in the locked Inter Tight
              // tabular code font instead of losing to the base rule's Inter body font.
              "!pl-[58px] !font-display tabular-nums !text-[15px] font-medium uppercase tracking-[0.04em]",
              showCodeErr && inputErr,
            )}
          />
        </div>
        {showCodeErr ? (
          <p
            id="resend-code-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-s-closed"
          >
            <CircleAlert size={13} aria-hidden />
            {errors.code}
          </p>
        ) : (
          <p id="resend-code-hint" className={hintCls}>
            {t("orderHint")}
          </p>
        )}
      </div>

      {/* channel + contact */}
      <div className="mt-[18px]">
        <label className={labelCls}>{t("channelLabel")}</label>
        <div
          role="tablist"
          aria-label={t("channelLabel")}
          className="mb-[7px] flex rounded-[12px] bg-s-bg-sunken p-[3px]"
        >
          {(["email", "phone"] as Channel[]).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={channel === c}
              onClick={() => setChannel(c)}
              className={cn(
                "h-[34px] flex-1 rounded-[9px] font-body text-[12.5px] font-medium transition-colors duration-150 ease-snap",
                channel === c
                  ? "bg-white text-s-ink shadow-card"
                  : "bg-transparent text-s-ink-2",
              )}
            >
              {c === "email" ? t("channelEmail") : t("channelPhone")}
            </button>
          ))}
        </div>

        {channel === "email" ? (
          <input
            id="resend-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={onTouch}
            placeholder={t("emailPlaceholder")}
            aria-invalid={showContactErr}
            aria-describedby={showContactErr ? "resend-contact-error" : "resend-contact-hint"}
            className={cn(inputBase, showContactErr && inputErr)}
          />
        ) : (
          <input
            id="resend-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={onTouch}
            placeholder={t("phonePlaceholder")}
            aria-invalid={showContactErr}
            aria-describedby={showContactErr ? "resend-contact-error" : "resend-contact-hint"}
            className={cn(inputBase, showContactErr && inputErr)}
          />
        )}
        {showContactErr ? (
          <p
            id="resend-contact-error"
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-s-closed"
          >
            <CircleAlert size={13} aria-hidden />
            {errors.contact}
          </p>
        ) : (
          <p id="resend-contact-hint" className={hintCls}>
            {channel === "email" ? t("emailHint") : t("phoneHint")}
          </p>
        )}
      </div>

      <button type="submit" disabled={!isValid || submitting} className={cn(ctaInk, "mt-[22px]")}>
        {submitting ? (
          <span className="h-[17px] w-[17px] animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/35 border-t-white" />
        ) : (
          <Send size={17} strokeWidth={1.9} aria-hidden />
        )}
        {t("submit")}
      </button>

      <p className="mt-auto pt-[22px] text-center text-[12px] leading-[1.5] text-s-ink-2">
        {t("findInstead")}{" "}
        <Link href={`/${locale}/booking/lookup`} className="font-semibold text-s-ink">
          {t("findInsteadLink")}
        </Link>
      </p>
    </form>
  );
}

/* ===================================================================== */
/* state 2 — uniform "sent"                                                */
/* ===================================================================== */

function SentView(props: {
  t: ReturnType<typeof useTranslations>;
  code: string;
  maskedDest: string;
  channel: Channel;
  resendLeft: number;
  onResend: () => void;
}) {
  const { t, code, maskedDest, resendLeft, onResend } = props;
  const canResend = resendLeft <= 0;

  return (
    <div className="flex flex-col">
      <div className="my-[6px] mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-pill bg-s-success-bg text-s-success">
        <Send size={30} strokeWidth={2.2} aria-hidden />
      </div>
      <h2 className="font-display text-[22px] font-semibold leading-[1.18] tracking-[-0.02em]">
        {t("sentTitle")}
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.55] text-s-ink-2">
        {t("sentBody", { code })}
      </p>

      {/* destination card */}
      <div className="mt-[18px] flex items-center gap-3 rounded-card border border-s-border bg-white px-[15px] py-3.5">
        <span className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[11px] bg-s-bg-sunken text-s-ink">
          <Mail size={19} strokeWidth={2.2} aria-hidden />
        </span>
        <div>
          <div className="text-[12px] text-s-ink-2">{t("sentToLabel")}</div>
          <div className="mt-[1px] text-[14px] font-medium text-s-ink">{maskedDest}</div>
        </div>
      </div>

      {/* privacy / anti-enumeration note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-s-bg-sunken px-3.5 py-3">
        <Lock size={15} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("privacyNote")}</p>
      </div>

      <p className="mt-[18px] text-center text-[12px] leading-[1.5] text-s-ink-2">
        {t("resendMeta", { time: fmtClock(resendLeft) })}
      </p>

      <button
        type="button"
        onClick={onResend}
        disabled={!canResend}
        className={cn(
          "mt-[18px] flex h-[52px] w-full items-center justify-center rounded-btn border border-s-border bg-white font-body text-[15px] font-medium text-s-ink transition-colors duration-150 ease-snap hover:bg-s-bg-sunken disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white",
        )}
      >
        {t("resend")}
      </button>
    </div>
  );
}

/* ===================================================================== */
/* state 3 — rate-limited lockout                                          */
/* ===================================================================== */

function LimitedView(props: {
  t: ReturnType<typeof useTranslations>;
  lockLeft: number;
  lockTotal: number;
}) {
  const { t, lockLeft, lockTotal } = props;
  const pct = lockTotal > 0 ? Math.max(0, Math.min(100, (lockLeft / lockTotal) * 100)) : 0;
  const minsLeft = Math.max(1, Math.ceil(lockLeft / 60));

  return (
    <div className="flex flex-col">
      {/* warning banner — Layer-3 amber, refined pastel (pastel bg + ink text + saturated icon) */}
      <div className="my-[6px] mb-[18px] flex h-[60px] w-[60px] items-center justify-center rounded-pill bg-s-warning-bg text-s-warning-text">
        <Clock size={28} strokeWidth={2.2} aria-hidden />
      </div>
      <h2 className="font-display text-[22px] font-semibold leading-[1.18] tracking-[-0.02em]">
        {t("limitTitle")}
      </h2>
      <p className="mt-2.5 text-[13.5px] leading-[1.55] text-s-ink-2">{t("limitLead")}</p>

      <div className="mt-[18px] flex items-start gap-2.5 rounded-card border border-s-warning/30 bg-s-warning-bg px-[15px] py-3.5">
        <AlertTriangle size={19} strokeWidth={2.2} className="mt-[1px] flex-shrink-0 text-s-warning-text" aria-hidden />
        <div>
          <div className="text-[13px] font-semibold text-s-ink">{t("limitTitle")}</div>
          <div className="mt-[3px] text-[12px] leading-[1.45] text-s-warning-text">
            {t("countdownHelp")}
          </div>
        </div>
      </div>

      {/* countdown */}
      <div className="mt-5 rounded-card-lg border border-s-border bg-white p-5 text-center">
        <div className="text-[12px] font-medium uppercase tracking-[0.06em] text-s-ink-2">
          {t("tryAgainIn")}
        </div>
        <div className="mt-[9px] font-mono-code text-[40px] font-semibold leading-none tracking-[-0.02em] text-s-ink">
          {fmtClock(lockLeft)}
        </div>
        <div className="mt-4 h-[5px] overflow-hidden rounded-pill bg-s-bg-sunken">
          <div
            className="h-full rounded-pill bg-s-ink transition-[width] duration-1000 ease-linear"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-[9px] text-[12px] text-s-ink-2">{t("countdownHelp")}</div>
      </div>

      <button
        type="button"
        disabled
        className={cn(ctaInk, "mt-[22px]")}
        aria-live="polite"
      >
        {/* mockup-ok: WCAG 2.2.2 conformance fix, not a taste change. Static lock glyph
            replaces a spinner that ran for the whole lockout (minutes) on a DISABLED button
            with nothing in flight: an unbounded auto-motion loop past the 5s bound with no
            user mechanism to stop it, and fabricated feedback (implied work happening when
            it wasn't). The real live signal is the countdown clock and progress bar above,
            tied to actual state. */}
        <Lock size={17} strokeWidth={1.9} className="shrink-0" aria-hidden />
        {t("lockedCta", { minutes: minsLeft })}
      </button>

      {/* in-a-hurry hints (mobile shows them inline; desktop has them in the rail) */}
      <div className="mt-[18px] md:hidden">
        <div className="mb-[9px] text-[12.5px] font-semibold text-s-ink">{t("hurryTitle")}</div>
        <ul className="flex flex-col gap-2.5">
          {[t("hurryGotLink"), t("hurryReply")].map((line, i) => (
            <li key={i} className="flex gap-2.5 text-[12px] leading-[1.45] text-s-ink-2">
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ===================================================================== */
/* desktop rails                                                          */
/* ===================================================================== */

function HowItWorksRail({ t }: { t: ReturnType<typeof useTranslations> }) {
  const steps = [
    { h: t("step1Title"), d: t("step1Desc") },
    { h: t("step2Title"), d: t("step2Desc") },
    { h: t("step3Title"), d: t("step3Desc") },
  ];
  return (
    <div className="max-w-[380px] rounded-card-lg border border-s-border bg-white p-[26px]">
      <div className="font-display text-[16px] font-semibold tracking-[-0.01em]">
        {t("howItWorks")}
      </div>
      <div className="mt-[18px] flex flex-col gap-[18px]">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3.5">
            <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-pill bg-s-ink font-display text-[12px] font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <div className="text-[13.5px] font-medium text-s-ink">{s.h}</div>
              <div className="mt-[2px] text-[12.5px] leading-[1.45] text-s-ink-2">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[22px] flex items-start gap-2.5 border-t border-s-border pt-[18px]">
        <Lock size={16} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("railSecurity")}</p>
      </div>
    </div>
  );
}

function HurryRail({ t }: { t: ReturnType<typeof useTranslations> }) {
  const steps = [
    { h: t("hurryTitle"), d: t("hurryGotLink") },
    { h: t("crumbResend"), d: t("hurryReply") },
  ];
  return (
    <div className="max-w-[380px] rounded-card-lg border border-s-border bg-white p-[26px]">
      <div className="font-display text-[16px] font-semibold tracking-[-0.01em]">
        {t("hurryTitle")}
      </div>
      <div className="mt-[18px] flex flex-col gap-[18px]">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-3.5">
            <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-pill bg-s-ink font-display text-[12px] font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <div className="text-[13.5px] font-medium text-s-ink">{s.h}</div>
              <div className="mt-[2px] text-[12.5px] leading-[1.45] text-s-ink-2">{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[22px] flex items-start gap-2.5 border-t border-s-border pt-[18px]">
        <Lock size={16} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("railSecurity")}</p>
      </div>
    </div>
  );
}
