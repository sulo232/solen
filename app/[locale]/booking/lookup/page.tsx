"use client";

/**
 * Guest booking lookup — app/[locale]/booking/lookup  (master plan §10b.7)
 *
 * One route, two jobs:
 *
 *  (A) NO token in the URL → the "find your booking" FORM. The order number alone is
 *      never a credential; this form asks for order number + email and POSTs the REAL
 *      opaque endpoint POST /api/bookings/resend-access { code, email } which emails a
 *      one-time access link. The UI then shows the uniform "check your email" state — it
 *      NEVER reveals whether a booking exists (anti-enumeration).
 *
 *  (B) ?code=…&t=… present (the guest clicked the emailed link) → exchange the raw token
 *      ONCE via GET /api/bookings/guest-lookup?code=&t=. On 200 the server sets the
 *      httpOnly access cookie and returns { booking_id }; we then show the "booking opened"
 *      state with the order number + the single entry into the report/refund flow. On the
 *      uniform 404 we show a calm "link can't be opened — request a fresh one" state.
 *
 * STRUCTURE: Treatwell / Fresha "find your booking" (mockup public/solen-refund-guest-lookup.html).
 * AESTHETIC: Solen tokens only — ink CTA, s-accent strictly on input focus, success-green
 * Layer-3 for the opened badge, s-closed only on the genuine format-validation error. No
 * off-token hexes. The emailed token is consumed by the GET and never echoed by this page.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  X,
  Send,
  Lock,
  Mail,
  Clock,
  Copy,
  Check,
  CircleAlert,
  TriangleAlert,
  ShieldAlert,
} from "lucide-react";
// ArrowRight intentionally not imported — no chevron-link affordance in this flow.
import { cn } from "@/lib/utils";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";

type View = "form" | "sent" | "exchanging" | "opened" | "linkInvalid";

const CODE_BODY_RE = /^[A-Z0-9]{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_S = 60;

function fmtClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function GuestLookupPage() {
  const t = useTranslations("bookingLookup");
  const locale = useLocale();
  const params = useSearchParams() ?? new URLSearchParams();

  const urlCode = params.get("code");
  const urlToken = params.get("t");
  const hasToken = !!urlCode && !!urlToken;

  const [view, setView] = useState<View>(hasToken ? "exchanging" : "form");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [openedCode, setOpenedCode] = useState<string>(urlCode ?? "");

  // form state
  const [codeBody, setCodeBody] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [resendLeft, setResendLeft] = useState(0);

  const fullCode = `SOL-${codeBody.trim().toUpperCase()}`;

  // ---- (B) token exchange, runs once on mount when a token is present ----
  const exchangedRef = useRef(false);
  useEffect(() => {
    if (!hasToken || exchangedRef.current) return;
    exchangedRef.current = true;

    (async () => {
      try {
        const res = await fetch(
          `/api/bookings/guest-lookup?code=${encodeURIComponent(urlCode as string)}&t=${encodeURIComponent(
            urlToken as string,
          )}`,
          { method: "GET" },
        );
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setBookingId(data?.booking_id ?? null);
          setView("opened");
          // SEC-09: the raw token has now been exchanged for the httpOnly guest cookie
          // (setGuestCookie, called inside GET /api/bookings/guest-lookup), so this browser no
          // longer needs it in the URL to stay authenticated. Strip it from the address bar with
          // a history REPLACE, never push, so a Back-button press can't resurrect it into
          // history, and so any pageview captured from this point on can't see it either. `code`
          // stays (it is not a secret, just the display order number, and keeping it is what
          // makes a reload/share of this URL still work). Done ONLY on success, deliberately: on
          // failure (the branches below) the exchange never happened, and the catch branch in
          // particular can mean a transient network blip rather than a genuinely bad token, so we
          // leave `t` in place there rather than stranding the guest with an unretryable link.
          const clean = new URL(window.location.href);
          clean.searchParams.delete("t");
          clean.searchParams.delete("access_token");
          window.history.replaceState(null, "", clean.pathname + clean.search + clean.hash);
        } else {
          // Uniform 404 (bad code / bad token / expired) → calm recovery state.
          setView("linkInvalid");
        }
      } catch (err) {
        console.error("[guest-lookup] token exchange failed:", err);
        setView("linkInvalid");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  // ---- resend cool-down tick (sent state) ----
  useEffect(() => {
    if (resendLeft <= 0) return;
    const id = setInterval(() => setResendLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendLeft]);

  // ---- (A) form validation ----
  const errors = useMemo(() => {
    const e: { code?: string; email?: string } = {};
    if (!CODE_BODY_RE.test(codeBody.trim().toUpperCase())) e.code = t("orderError");
    if (!EMAIL_RE.test(email.trim())) e.email = t("emailError");
    return e;
  }, [codeBody, email, t]);
  const isValid = Object.keys(errors).length === 0;

  const submit = useCallback(async () => {
    setTouched(true);
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings/resend-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode, email: email.trim() }),
      });
      // The endpoint is opaque: any well-formed body returns the same 200. We surface the
      // uniform "check your email" state regardless of outcome (incl. 429 / network) so
      // the page never leaks whether a booking exists.
      if (res.status === 429) {
        // Rate-limited: still uniform, but skip the cool-down promise we can't honor.
        setSentEmail(email.trim());
        setResendLeft(RESEND_COOLDOWN_S);
        setView("sent");
        return;
      }
      setSentEmail(email.trim());
      setResendLeft(RESEND_COOLDOWN_S);
      setView("sent");
    } catch (err) {
      console.error("[guest-lookup] resend request failed:", err);
      setSentEmail(email.trim());
      setResendLeft(RESEND_COOLDOWN_S);
      setView("sent");
    } finally {
      setSubmitting(false);
    }
  }, [isValid, submitting, fullCode, email]);

  // ===================================================================== //
  return (
    <div className="min-h-[100dvh] bg-white text-s-ink">
      <AppBar
        t={t}
        locale={locale}
        closeMode={view === "opened"}
      />

      {/* Token-landing states (opened / exchanging / invalid) are single-column.
          The form + sent states use the desktop split-hero. */}
      {view === "exchanging" && <ExchangingView t={t} />}
      {view === "opened" && (
        <OpenedView t={t} locale={locale} bookingId={bookingId} code={openedCode} />
      )}
      {view === "linkInvalid" && <LinkInvalidView t={t} locale={locale} />}

      {(view === "form" || view === "sent") && (
        <main className="mx-auto grid w-full max-w-[460px] grid-cols-1 px-5 pb-12 pt-6 md:max-w-[1180px] md:grid-cols-2 md:gap-0 md:px-0 md:pt-0">
          {/* left pane */}
          <section className="flex flex-col md:px-14 md:py-16">
            {view === "form" && (
              <FormView
                t={t}
                locale={locale}
                codeBody={codeBody}
                setCodeBody={setCodeBody}
                email={email}
                setEmail={setEmail}
                errors={errors}
                touched={touched}
                onTouch={() => setTouched(true)}
                isValid={isValid}
                submitting={submitting}
                onSubmit={submit}
              />
            )}
            {view === "sent" && (
              <SentView
                t={t}
                locale={locale}
                email={sentEmail}
                resendLeft={resendLeft}
                onTryDifferent={() => {
                  setView("form");
                  setTouched(false);
                }}
                onResend={() => {
                  setView("form");
                }}
              />
            )}
          </section>

          {/* right pane — salon photo (desktop split-hero). Decorative, hidden on mobile. */}
          <aside className="relative hidden min-h-[560px] overflow-hidden bg-s-bg-sunken md:block">
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80"
              alt=""
              aria-hidden
              className="h-full w-full object-cover"
            />
          </aside>
        </main>
      )}
    </div>
  );
}

/* ===================================================================== */
/* shared                                                                 */
/* ===================================================================== */

const inputBase = // mockup-ok: dead-class removal only, base input law (globals.css) already renders this fill/border/radius; no visual change (V3-D-input-fill-2026-07-17)
  "w-full h-[52px] px-[15px] font-body text-[15px] text-s-ink placeholder:text-s-ink-disabled transition-[border-color,box-shadow] duration-150 ease-snap appearance-none";
/* !important: the base input law in globals.css (2026-07-17) now covers this bare
   `<input>` too and out-specifies a plain border-color utility at rest; `!` keeps the
   red error edge visible instead of silently losing to the transparent resting border. */
const inputErr = "!border-s-closed"; // mockup-ok: keeps existing error-red visible under the widened base rule, not a new look
const labelCls = "block text-[12px] font-medium text-s-ink-2 mb-[7px]";
const hintCls = "mt-2 text-[12px] leading-[1.5] text-s-ink-2";
const ctaInk =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-medium tracking-[-0.005em] text-white transition-transform duration-100 ease-snap active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-s-ink-disabled disabled:active:scale-100";
const ghostBtn =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-bg-sunken font-body text-[15px] font-medium text-s-ink transition-colors duration-150 ease-snap hover:brightness-[0.97]";

function AppBar({
  t,
  locale,
  closeMode,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  closeMode: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-4 pb-2.5 pt-[15px]">
      {closeMode ? (
        <Link
          href={`/${locale}`}
          aria-label={t("close")}
          className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-s-bg-sunken text-s-ink transition-colors duration-150 ease-snap hover:brightness-[0.97]"
        >
          <X size={19} strokeWidth={2.2} aria-hidden />
        </Link>
      ) : (
        // mockup-ok: NAV CONTROLS lock (_design-system/LOCKFILE.md:2096-2104, owner-measured
        // 2026-08-10): back = 44 circle, ChevronLeft never ArrowLeft, white fill, shadow only.
        // Composes the registered BackButton (FLOORS LAW 9) in place of the hand-drawn Link
        // this replaces; same /${locale} destination, same accessible name (t("back")).
        <BackButton href={`/${locale}`} label={t("back")} variant="flat" />
      )}
      <span className="flex items-center gap-[7px] font-display text-[15px] font-bold tracking-[-0.02em]">
        <span className="h-2 w-2 rounded-pill bg-s-ink" aria-hidden />
        Solen
      </span>
      <span className="w-9" aria-hidden />
    </header>
  );
}

/* ===================================================================== */
/* (A) state 1 — find form                                                */
/* ===================================================================== */

function FormView(props: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  codeBody: string;
  setCodeBody: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  errors: { code?: string; email?: string };
  touched: boolean;
  onTouch: () => void;
  isValid: boolean;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const {
    t,
    locale,
    codeBody,
    setCodeBody,
    email,
    setEmail,
    errors,
    touched,
    onTouch,
    isValid,
    submitting,
    onSubmit,
  } = props;
  const showCodeErr = touched && !!errors.code;
  const showEmailErr = touched && !!errors.email;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
      className="flex flex-1 flex-col"
    >
      {/* Tracked-uppercase eyebrow deleted (A21, 2026-06-11 mockup-15 sweep) */}
      <h1 className="font-display text-[21px] font-semibold leading-[1.2] tracking-[-0.018em] md:text-[38px] md:font-bold md:leading-[1.1] md:tracking-[-0.02em]">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-[380px] text-[13.5px] leading-[1.55] text-s-ink-2 md:mt-3.5 md:text-[15px]">
        <span className="md:hidden">{t("lead")}</span>
        <span className="hidden md:inline">{t("deskLead")}</span>
      </p>

      {/* order number */}
      <div className="mt-[18px]">
        <label htmlFor="lookup-code" className={labelCls}>
          {t("orderLabel")}
        </label>
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 font-mono-code text-[18px] font-semibold tracking-[0.10em] text-s-ink-disabled"
          >
            SOL-
          </span>
          <input
            id="lookup-code"
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
            aria-label={t("orderLabel")}
            aria-invalid={showCodeErr}
            aria-describedby={showCodeErr ? "lookup-code-error" : "lookup-code-hint"}
            className={cn(
              inputBase,
              // !important: the widened base input law (globals.css, 2026-07-17) now matches
              // this bare `<input>` too and out-specifies pl-[62px]/text-[18px]/font-mono-code
              // at rest; `!` keeps the code clear of the "SOL-" prefix in the locked Inter Tight
              // tabular code font instead of losing to the base rule's Inter body font.
              "!pl-[62px] !font-display tabular-nums !text-[18px] font-semibold uppercase tracking-[0.10em]",
              showCodeErr && inputErr,
            )}
          />
        </div>
        {showCodeErr ? (
          <p
            id="lookup-code-error"
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-s-closed"
          >
            <CircleAlert size={13} aria-hidden />
            {errors.code}
          </p>
        ) : (
          <p id="lookup-code-hint" className={hintCls}>
            {t("orderHint")}
          </p>
        )}
      </div>

      {/* email */}
      <div className="mt-[18px]">
        <label htmlFor="lookup-email" className={labelCls}>
          {t("emailLabel")}
        </label>
        <input
          id="lookup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={onTouch}
          placeholder={t("emailPlaceholder")}
          aria-invalid={showEmailErr}
          aria-describedby={showEmailErr ? "lookup-email-error" : "lookup-email-hint"}
          className={cn(inputBase, showEmailErr && inputErr)}
        />
        {showEmailErr ? (
          <p
            id="lookup-email-error"
            role="alert"
            className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-s-closed"
          >
            <CircleAlert size={13} aria-hidden />
            {errors.email}
          </p>
        ) : (
          <p id="lookup-email-hint" className={hintCls}>
            {t("emailHint")}
          </p>
        )}
      </div>

      {/* security note */}
      <div className="mt-4 flex gap-2.5 rounded-[14px] bg-s-bg-sunken px-3.5 py-3.5">
        <Lock size={18} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("securityNote")}</p>
      </div>

      <div className="flex-1" />

      <button type="submit" disabled={!isValid || submitting} className={cn(ctaInk, "mt-4")}>
        {submitting ? (
          <span className="h-[17px] w-[17px] animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/35 border-t-white" />
        ) : (
          <Send size={17} strokeWidth={1.9} aria-hidden />
        )}
        {t("submit")}
      </button>
      <Link
        // ia-navigation-03: preserve the return destination so a signed-in guest
        // lands back on the lookup page instead of the homepage after auth.
        href={`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/booking/lookup`)}`}
        className="w-full py-3 text-center font-body text-[13.5px] font-medium text-s-ink"
      >
        {t("loginInstead")}
      </Link>
    </form>
  );
}

/* ===================================================================== */
/* (A) state 2 — uniform "check your email"                               */
/* ===================================================================== */

function SentView(props: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  email: string;
  resendLeft: number;
  onTryDifferent: () => void;
  onResend: () => void;
}) {
  const { t, email, resendLeft, onTryDifferent, onResend } = props;
  const canResend = resendLeft <= 0;

  return (
    <div className="flex flex-1 flex-col items-center pt-[18px] text-center">
      <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-pill bg-s-success-bg text-s-success">
        <Mail size={32} strokeWidth={2} aria-hidden />
      </div>
      <h2 className="font-display text-[21px] font-semibold tracking-[-0.018em]">
        {t("sentTitle")}
      </h2>
      <p className="mt-2.5 max-w-[300px] text-[13.5px] leading-[1.55] text-s-ink-2">
        {t("sentBody", { email })}
      </p>

      <div className="mt-[22px] flex gap-2.5 rounded-[14px] bg-s-bg-sunken px-3.5 py-3.5 text-left">
        <Clock size={18} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">{t("sentValidity")}</p>
      </div>

      <p className="mt-[18px] text-[12.5px] text-s-ink-2">
        {t("resendIn", { time: fmtClock(resendLeft) })}
      </p>

      <div className="flex-1" />

      <button
        type="button"
        onClick={onResend}
        disabled={!canResend}
        className={cn(ghostBtn, "mt-4 disabled:cursor-not-allowed disabled:opacity-50")}
      >
        {t("resend")}
      </button>
      <button
        type="button"
        onClick={onTryDifferent}
        className="w-full py-3 text-center font-body text-[13.5px] font-medium text-s-ink"
      >
        {t("tryDifferent")}
      </button>
    </div>
  );
}

/* ===================================================================== */
/* (B) exchanging — brief loading while the token is consumed             */
/* ===================================================================== */

function ExchangingView({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col items-center justify-center px-5 py-24 text-center">
      <span
        className="mb-4 h-8 w-8 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-s-border border-t-s-ink/60"
        role="status"
        aria-label={t("opening")}
      />
      <p className="text-[13.5px] text-s-ink-2">{t("opening")}</p>
    </main>
  );
}

/* ===================================================================== */
/* (B) link invalid / expired                                             */
/* ===================================================================== */

function LinkInvalidView({
  t,
  locale,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[460px] flex-col px-5 pb-12 pt-6">
      <div className="flex flex-col items-center pt-[18px] text-center">
        <div className="mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-pill bg-s-warning-bg text-s-warning-text">
          <ShieldAlert size={32} strokeWidth={2} aria-hidden />
        </div>
        <h2 className="font-display text-[21px] font-semibold tracking-[-0.018em]">
          {t("linkInvalidTitle")}
        </h2>
        <p className="mt-2.5 max-w-[300px] text-[13.5px] leading-[1.55] text-s-ink-2">
          {t("linkInvalidBody")}
        </p>
      </div>
      <div className="mt-7">
        <Link href={`/${locale}/booking/resend-link`} className={ctaInk}>
          <Send size={17} strokeWidth={1.9} aria-hidden />
          {t("requestNewLink")}
        </Link>
      </div>
    </main>
  );
}

/* ===================================================================== */
/* (B) state 3 — booking opened                                           */
/* ===================================================================== */

function OpenedView({
  t,
  locale,
  bookingId,
  code,
}: {
  t: ReturnType<typeof useTranslations>;
  locale: string;
  bookingId: string | null;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    try {
      if (navigator.clipboard && code) navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("[guest-lookup] clipboard copy failed:", err);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  }, [code]);

  return (
    <main className="mx-auto flex w-full max-w-[460px] flex-col px-5 pb-12 pt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[21px] font-semibold tracking-[-0.018em]">
          {t("yourBooking")}
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-s-success-bg px-2.5 py-[5px] text-[12px] font-semibold text-s-success">
          <span className="h-1.5 w-1.5 rounded-pill bg-s-success" aria-hidden />
          {t("statusCompleted")}
        </span>
      </div>

      {/* order-number strip with copy */}
      <div className="mt-3.5 flex items-center justify-between gap-2.5 rounded-[14px] bg-s-bg-sunken px-3.5 py-[11px]">
        <div>
          <div className="text-[12px] font-medium text-s-ink-2">
            {t("orderNumber")}
          </div>
          <div className="mt-[2px] font-mono-code text-[16px] font-semibold tracking-[0.04em] text-s-ink">
            {code || "SOL-•••••"}
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? t("copied") : t("copy")}
          // mockup-ok: a11y touch-target fix (FRONTEND_AUDIT_2026-07-08.md) , 34px raised
          // to the locked 44px floor, fits the strip's own height, no redesign.
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[10px] border border-s-border bg-white"
        >
          {copied ? (
            <Check size={16} strokeWidth={1.9} className="text-s-success" aria-hidden />
          ) : (
            <Copy size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
          )}
        </button>
      </div>

      {/* refund-window note */}
      <div className="mt-4 flex gap-2.5 rounded-[14px] bg-s-bg-sunken px-3.5 py-3.5">
        <Clock size={18} strokeWidth={1.9} className="mt-[1px] flex-shrink-0 text-s-ink-2" aria-hidden />
        <p className="text-[12px] leading-[1.5] text-s-ink-2">
          {t("refundWindow", { days: 14 })}
        </p>
      </div>

      {/* the ONE entry point: report a problem / request a refund (master plan §10b.2) */}
      <div className="mt-4 flex flex-col gap-2.5">
        {bookingId ? (
          <Link href={`/${locale}/bookings/${bookingId}/report`} className={ctaInk}>
            <TriangleAlert size={17} strokeWidth={1.9} aria-hidden />
            {t("reportOrRefund")}
          </Link>
        ) : (
          <button type="button" disabled className={ctaInk}>
            <TriangleAlert size={17} strokeWidth={1.9} aria-hidden />
            {t("reportOrRefund")}
          </button>
        )}
        {/* "View receipt" removed (2026-06-14 audit): it linked to /bookings/[id],
            which has no page (serves the home shell), and /profile/bookings is
            auth-gated so it's wrong for a guest lookup. The booking details already
            render above. Revive only with a real guest-accessible receipt route. */}
      </div>
    </main>
  );
}
