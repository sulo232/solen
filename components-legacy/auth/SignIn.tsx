"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components-legacy/ui/Spinner";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { WELCOME_FLAG } from "@/app/[locale]/_components/primitives/WelcomeToast";

/** Mark a successful login so WelcomeToast greets on the destination page. */
function markWelcome() {
  try {
    window.sessionStorage.setItem(WELCOME_FLAG, "1");
  } catch {
    /* private mode / blocked storage — skip the greeting, not the login */
  }
}
function clearWelcome() {
  try {
    window.sessionStorage.removeItem(WELCOME_FLAG);
  } catch {
    /* best-effort */
  }
}

export default function SignIn() {
  const t = useTranslations("auth") as any;
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const locale = useLocale();
  // The fallback carries the LOCALE. A bare "/" resolves to the default language, so signing in on
  // the German site landed you on the English one (measured 2026-08-27: /de, /fr and /it login all
  // ended on /en, while the register route kept each language).
  const home = `/${locale}`;
  const rawRedirect = searchParams.get("redirect") ?? home;
  // SECURITY: Only allow internal relative paths — block external redirects and protocol-relative URLs
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : home;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // Already signed in (e.g. browser-back onto this page) -> leave immediately.
  // Without this the form renders again and reads as "you got logged out".
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(redirect);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogle = async () => {
    setLoading(true);
    markWelcome(); // survives the OAuth round-trip; WelcomeToast guards on a real session
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) { clearWelcome(); toast.error(error.message); }
    setLoading(false);
  };

  const handleApple = async () => {
    setLoading(true);
    markWelcome(); // survives the OAuth round-trip; WelcomeToast guards on a real session
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) { clearWelcome(); toast.error(error.message); }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sign in directly via browser client so cookies are properly set
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        // Friendly, localized copy instead of leaking the raw Supabase string.
        const m = (error.message || "").toLowerCase();
        toast.error(
          /invalid login credentials/.test(m) ? "E-Mail oder Passwort stimmt nicht"
          : /email not confirmed/.test(m) ? "Bitte bestätigen Sie zuerst Ihre E-Mail"
          : /rate|too many|after \d+ second|security purposes/.test(m) ? "Zu viele Versuche. Bitte warten Sie einen Moment."
          : "Anmeldung fehlgeschlagen"
        );
        setLoading(false);
      } else if (data.session) {
        markWelcome(); // greet on the destination after the full-page nav
        // Full-page nav (middleware runs, session cookies propagate) via REPLACE, not href:
        // the login page must NOT stay in history, else Back returns to login (the back-trap).
        // Benchmark (IG/Airbnb/Uber): auth is always dropped from history on success. (2026-07-21)
        window.location.replace(redirect);
      }
    } catch {
      toast.error("Netzwerkfehler");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetPassword: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Don't surface the raw English Supabase string in the German UI; localize
        // the common rate-limit case + a German generic fallback.
        const raw = String(data.message || "").toLowerCase();
        const rateLimited = res.status === 429 || /rate limit|too many|after \d+ second|security purposes/.test(raw);
        toast.error(
          rateLimited
            ? "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."
            : "Fehler beim Senden. Bitte versuchen Sie es erneut."
        );
      } else {
        setResetSent(true);
      }
    } catch {
      toast.error("Netzwerkfehler");
    }
    setLoading(false);
  };

  // Password reset sent confirmation
  if (resetSent) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center bg-s-success-bg">
          <Mail size={24} strokeWidth={2.4} className="text-s-success" />
        </div>
        <div>
          <p className="text-[13px] text-s-ink-2 mb-2">
            E-Mail gesendet
          </p>
          <p className="font-heading text-lg text-s-ink">Link gesendet</p>
          <p className="text-xs font-body text-s-ink-2 mt-1 leading-relaxed">
            Schauen Sie in Ihrem Postfach nach einem Link zum Zurücksetzen.
          </p>
        </div>
        <button
          onClick={() => { setResetMode(false); setResetSent(false); }}
          className="text-[13px] text-s-ink-2 hover:text-s-ink transition-colors mt-2">
          Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  // Password reset form
  if (resetMode) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="text-center mb-2">
          <p className="text-[13px] text-s-ink-2 mb-2">
            Konto-Wiederherstellung
          </p>
          <p className="font-heading text-lg text-s-ink">Passwort vergessen?</p>
          <p className="text-xs font-body text-s-ink-2 mt-1">
            Geben Sie Ihre E-Mail ein und wir senden Ihnen einen Reset-Link.
          </p>
        </div>
        <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email_placeholder")}
            required
            autoComplete="email"
            inputMode="email"
            className="w-full px-4 py-3.5 bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" invert /> : <Mail size={15} strokeWidth={1.9} />}
            Reset-Link senden
          </button>
        </form>
        <button
          onClick={() => setResetMode(false)}
          className="text-[13px] text-s-ink-2 hover:text-s-ink text-center transition-colors">
          Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* Email + Password, primary */}
      <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          required
          autoComplete="email"
          inputMode="email"
          className="w-full h-14 px-5 text-[15px] text-s-ink placeholder:text-s-ink-2 !bg-s-bg-sunken !border-transparent focus:outline-none transition-colors" // mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes" panel, owner-approved (!bg/!border beat the unlayered focus-visible !important in globals.css so the fill stays grey at rest AND on focus, no new focus treatment)
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            required
            autoComplete="current-password"
            className="w-full h-14 px-5 !pr-12 text-[15px] text-s-ink placeholder:text-s-ink-2 !bg-s-bg-sunken !border-transparent focus:outline-none transition-colors" // mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes" panel, owner-approved (!bg/!border beat the unlayered focus-visible !important in globals.css so the fill stays grey at rest AND on focus, no new focus treatment)
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-s-ink-2 hover:text-s-ink transition-colors"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff size={18} strokeWidth={1.9} /> : <Eye size={18} strokeWidth={1.9} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full h-14 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-[transform,opacity] duration-[80ms] disabled:opacity-50 flex items-center justify-center gap-2 mt-1">
          {loading ? <Spinner size="sm" invert /> : null}
          Anmelden
        </button>
      </form>

      <button
        onClick={() => setResetMode(true)}
        className="mt-3 text-[13px] font-medium text-s-ink underline underline-offset-[3px] transition-colors text-center py-1">
        Passwort vergessen?
      </button>

      {/* mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes"
          panel, owner-approved. Fixed 120px gap to the ways-in block below, not flex-grow to the
          floor (item 7). Isolated from the parent's gap-3 by rejoining a fresh flex group after it. */}
      <div className="h-[120px]" aria-hidden="true" />

      {/* Social, Apple + Google */}
      <button
        onClick={handleApple}
        disabled={loading}
        // mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes" panel, owner-approved
        className="relative w-full h-14 rounded-btn bg-s-ink text-white text-[15px] font-medium disabled:opacity-50 flex items-center justify-center"
      >
        <span className="absolute left-5 flex items-center" aria-hidden>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 12.04c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.88 2.65 3.22 2.6 1.29-.05 1.78-.83 3.34-.83 1.56 0 2 .83 3.37.81 1.39-.03 2.27-1.27 3.12-2.53.98-1.45 1.39-2.85 1.41-2.92-.03-.01-2.71-1.04-2.74-4.13zM14.69 4.5c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z"/>
          </svg>
        </span>
        Mit Apple anmelden
      </button>
      <button
        onClick={handleGoogle}
        disabled={loading}
        // mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes" panel, owner-approved
        className="relative w-full h-14 rounded-btn bg-s-bg-sunken text-[15px] font-medium text-s-ink disabled:opacity-50 flex items-center justify-center mt-3"
      >
        <span className="absolute left-5 flex items-center" aria-hidden>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </span>
        {t("google_login")}
      </button>
      {/* mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html "B, with your three changes" panel, owner-approved (terms line removed, item 5) */}
    </div>
  );
}
