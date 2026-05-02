"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function SignIn() {
  const t = useTranslations("auth") as any;
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawRedirect = searchParams.get("redirect") ?? "/";
  // SECURITY: Only allow internal relative paths — block external redirects and protocol-relative URLs
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const supabase = createBrowserSupabaseClient();

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) toast(error.message, "error");
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
        toast(error.message || "Anmeldung fehlgeschlagen", "error");
        setLoading(false);
      } else if (data.session) {
        // Full page navigation to ensure middleware runs and session cookies propagate
        window.location.href = redirect;
      }
    } catch {
      toast("Netzwerkfehler", "error");
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
        toast(data.message || "Fehler beim Senden", "error");
      } else {
        setResetSent(true);
      }
    } catch {
      toast("Netzwerkfehler", "error");
    }
    setLoading(false);
  };

  // Password reset sent confirmation
  if (resetSent) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <Mail size={24} className="text-s-coral" />
        </div>
        <div>
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-coral mb-2">
            E-Mail gesendet
          </p>
          <p className="font-heading font-bold text-lg text-s-ink">Link gesendet</p>
          <p className="text-xs font-body text-s-ink/50 mt-1 leading-relaxed">
            Schau in deinem Postfach nach einem Link zum Zurücksetzen.
          </p>
        </div>
        <button
          onClick={() => { setResetMode(false); setResetSent(false); }}
          className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral/60 hover:text-s-coral transition-colors mt-2">
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
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/45 mb-2">
            Konto-Wiederherstellung
          </p>
          <p className="font-heading font-bold text-lg text-s-ink">Passwort vergessen?</p>
          <p className="text-xs font-body text-s-ink/50 mt-1">
            Gib deine E-Mail ein und wir senden dir einen Reset-Link.
          </p>
        </div>
        <form onSubmit={handlePasswordReset} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("email_placeholder")}
            required
            className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-4 rounded-btn bg-s-coral shadow-coral-glow text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Spinner size="sm" invert /> : <Mail size={15} />}
            Reset-Link senden
          </button>
        </form>
        <button
          onClick={() => setResetMode(false)}
          className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/45 hover:text-s-ink:text-s-dm-text text-center transition-colors">
          Zurück zur Anmeldung
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Google — primary */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-input border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/70 hover:border-s-ink/20 hover:bg-s-bg-base:bg-white/5 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {t("google_login")}
      </button>

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px bg-s-ink/[0.07]" />
        <span className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/50">{t("or")}</span>
        <div className="flex-1 h-px bg-s-ink/[0.07]" />
      </div>

      {/* Email + Password login */}
      <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          required
          className="w-full px-4 py-3.5 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            required
            className="w-full px-4 py-3.5 pr-10 rounded-input border border-s-ink/[0.08] bg-[--raised] text-sm font-body text-s-ink placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/50 hover:text-s-ink/60:text-s-dm-text/60 transition-colors"
            aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-4 rounded-btn bg-s-coral shadow-coral-glow text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Spinner size="sm" invert /> : null}
          Anmelden
        </button>
      </form>

      <button
        onClick={() => setResetMode(true)}
        className="text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/45 hover:text-s-coral transition-colors text-center">
        Passwort vergessen?
      </button>

      <p className="text-xs text-s-ink/50 text-center font-body">{t("terms")}</p>
    </div>
  );
}
