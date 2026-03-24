"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Lock, Eye, EyeOff, Check } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const supabase = createBrowserSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Exchange the code from the URL for a session
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          toast("Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.", "error");
        } else {
          setSessionReady(true);
        }
      });
    } else {
      // If no code, check if already authenticated (e.g. hash-based flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true);
      });
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast(error.message || "Fehler beim Zurücksetzen", "error");
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/auth/login`), 2500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-card bg-s-coral/10 flex items-center justify-center mb-4">
            <Check size={28} className="text-s-coral" />
          </div>
          <p className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Passwort geändert</p>
          <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-2">
            Du wirst zur Anmeldung weitergeleitet…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-s-coral/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-s-coral/8 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <a
            href={`/${locale}`}
            className="inline-block font-heading font-bold text-3xl text-s-ink dark:text-s-dm-text tracking-tight hover:opacity-80 transition-opacity"
          >
            solen<span className="text-s-coral">.</span>ch
          </a>
        </div>

        {/* Glass card */}
        <div className="rounded-card border border-white/60 dark:border-white/10 bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-glass shadow-glass p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-card bg-s-coral/10 flex items-center justify-center mb-3">
              <Lock size={24} className="text-s-coral" />
            </div>
            <p className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">Neues Passwort</p>
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-1">
              Wähle ein neues Passwort für dein Konto.
            </p>
          </div>

          {!sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner size="md" />
              <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body">Link wird überprüft…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Neues Passwort"
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface font-body outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-ink/60 dark:hover:text-s-dm-text/60 transition-colors"
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password requirements */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1 text-xs font-body">
                  <Requirement met={password.length >= 8} text="Mindestens 8 Zeichen" />
                  <Requirement met={/[A-Z]/.test(password)} text="Mindestens ein Grossbuchstabe" />
                  <Requirement met={/[0-9]/.test(password)} text="Mindestens eine Zahl" />
                </div>
              )}

              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Passwort bestätigen"
                required
                className="w-full px-4 py-2.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-sm text-s-ink dark:text-s-dm-text bg-white dark:bg-s-dm-surface font-body outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/10 transition-all"
              />

              {confirm.length > 0 && !passwordsMatch && (
                <p className="text-xs text-s-error font-body">Passwörter stimmen nicht überein</p>
              )}

              <button
                type="submit"
                disabled={loading || !passwordValid || !passwordsMatch}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-btn bg-s-coral text-white text-sm font-body font-medium hover:bg-s-coral/90 transition-colors disabled:opacity-50 shadow-warm-sm"
              >
                {loading ? <Spinner size="sm" invert /> : <Lock size={15} />}
                Passwort ändern
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 font-body mt-6">
          <a href={`/${locale}/auth/login`} className="text-s-coral hover:underline">
            Zurück zur Anmeldung
          </a>
        </p>
      </div>
    </div>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <span className={`flex items-center gap-1.5 ${met ? "text-s-sage" : "text-s-ink/40 dark:text-s-dm-text/40"}`}>
      <Check size={12} className={met ? "text-s-sage" : "text-s-ink/20 dark:text-s-dm-text/20"} />
      {text}
    </span>
  );
}
