"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components-legacy/ui/Spinner";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { scorePassword } from "@/lib/password-strength";

export default function ResetPasswordPage() {
  const locale = useLocale();
  const tc = useTranslations("common");
  const tp = useTranslations("passwordStrength");
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const supabase = createBrowserSupabaseClient();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  // Invalid/expired/missing recovery link — render an actionable error instead of
  // spinning on "Link wird überprüft…" forever (the dead-card bug from the FE sweep).
  const [linkError, setLinkError] = useState(false);

  // Exchange the code from the URL for a session
  useEffect(() => {
    let cancelled = false;
    const code = searchParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setLinkError(true);
        } else {
          setSessionReady(true);
        }
      });
    } else {
      // No code: only valid if a recovery session already exists (hash-based flow).
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        if (session) setSessionReady(true);
        else setLinkError(true);
      });
    }
    return () => { cancelled = true; };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ig1 (2026-07-16): the server only enforces min(8).max(200) (lib/validations.ts);
  // gate on that plus a real entropy score, never composition (uppercase/digit).
  const strength = useMemo(() => scorePassword(password), [password]);
  const passwordValid = password.length >= 8 && strength.score >= 2;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || tc("errorResetPassword"));
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/${locale}/auth/login`), 2500);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-16 h-16 rounded-[20px] flex items-center justify-center mb-4"
            style={{ background: "rgba(22,163,74,.12)" }}>
            <Check size={28} className="text-s-success" />
          </div>
          <p className="text-[12px] font-heading uppercase tracking-[.18em] text-s-success mb-2">
            {t("success_label")}
          </p>
          <p className="font-heading text-xl text-s-ink">{t("password_changed")}</p>
          <p className="text-xs font-body text-s-ink-2 mt-2">
            {t("redirecting_to_login")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Single ambient glow — Zone 3 exception */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "rgba(50,47,44,.04)", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo lockup */}
        <div className="text-center mb-8">
          <p className="text-[12px] font-heading uppercase tracking-[.22em] text-s-warning mb-3">
            solen.ch
          </p>
          <Link href={`/${locale}`}
            className="inline-block font-heading text-[32px] text-s-ink leading-none hover:opacity-80 transition-opacity">
            solen<span className="text-s-ink">.</span>ch
          </Link>
        </div>

        {/* Auth card */}
        <div className="rounded-card border border-s-border bg-white p-8 shadow-elevation-1">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-[14px] flex items-center justify-center mb-3 bg-s-bg-sunken">
              <Lock size={24} strokeWidth={2.4} className="text-s-ink" />
            </div>
            <p className="text-[12px] font-heading uppercase tracking-[.18em] text-s-ink/45 mb-2">
              {t("account_recovery")}
            </p>
            <p className="font-heading text-lg text-s-ink">{t("new_password_title")}</p>
            <p className="text-xs font-body text-s-ink-2 mt-1">
              {t("new_password_instruction")}
            </p>
          </div>

          {linkError ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-s-error-bg">
                <AlertCircle size={22} strokeWidth={2.2} className="text-s-error" />
              </div>
              <p className="font-heading text-base text-s-ink">{t("link_expired_title")}</p>
              <p className="text-xs font-body text-s-ink-2">
                {t("link_expired_body")}
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className="mt-1 w-full rounded-pill bg-s-ink py-3 text-center text-xs font-heading uppercase tracking-[.04em] text-white transition-transform active:scale-[0.97]">
                {t("request_new_link")}
              </Link>
            </div>
          ) : !sessionReady ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Spinner size="md" />
              <p className="text-xs font-body text-s-ink-2">{t("checking_link")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("new_password_title")}
                  aria-label={t("new_password_title")}
                  required
                  className="w-full px-4 py-3.5 !pr-10 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-s-ink-2 hover:text-s-ink transition-colors"
                  aria-label={showPassword ? t("hide_password") : t("show_password")}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.9} /> : <Eye size={16} strokeWidth={1.9} />}
                </button>
              </div>

              {/* mockup-ok: ig1, owner-approved TASTE_LOG.md 2026-07-16 "IG-principles round 1". Strength bar reuses ImageUpload.tsx:265-273 geometry (slim pill, ink fill). */}
              {password.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 w-full rounded-pill bg-s-bg-sunken overflow-hidden">
                    {/* mockup-ok: hard-rule-2 conformance fix, treatment-only (fill
                        looks identical). Was animating `width` at 300ms on a
                        per-keystroke control; converted to `scaleX` (origin left)
                        on the snap tier (150ms, finding 4: a repeated action gets
                        the fastest tier). */}
                    <div
                      className="h-full w-full origin-left rounded-pill bg-s-ink transition-transform duration-150" // mockup-ok
                      style={{ transform: `scaleX(${strength.score / 4})` }}
                    />
                  </div>
                  <p className="text-xs font-body text-s-ink-2">
                    {tp(strength.level)}
                    {strength.cause !== "clear" && `: ${tp(strength.cause)}`}
                  </p>
                </div>
              )}

              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("confirm_password_placeholder")}
                aria-label={t("confirm_password_placeholder")}
                required
                className="w-full px-4 py-3.5 text-sm font-body text-s-ink placeholder:text-s-ink/30 transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />

              {confirm.length > 0 && !passwordsMatch && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] border border-s-error/20 bg-s-error-bg">
                  <p role="alert" className="text-xs font-body text-s-error">{t("passwords_mismatch")}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passwordValid || !passwordsMatch}
                className="w-full py-4 rounded-pill bg-s-ink shadow-elevation-2 text-white text-xs font-heading uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Spinner size="sm" invert /> : null}
                {t("change_password")}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6">
          <Link href={`/${locale}/auth/login`}
            className="text-[13.5px] font-body font-semibold text-s-ink-2 transition-colors hover:text-s-ink">
            {t("back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
// mockup-ok: ig1, owner-approved TASTE_LOG.md 2026-07-16. Requirement checklist removed, replaced by the strength bar above.
