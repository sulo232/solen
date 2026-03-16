"use client";

// Phase 5 — Auth UI
// Full implementation in roadmap Phase 5 (Auth UI).
// Google primary (large, top). Magic link secondary.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";

export default function SignIn() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirect)}` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl mb-2">📬</p>
        <p className="font-heading font-semibold text-dark">{t("magic_link_sent")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      {/* Google — primary */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-button border border-gray-200 bg-white hover:bg-gray-50 transition-colors font-medium text-dark shadow-card disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {t("google_login")}
      </button>

      <div className="flex items-center gap-3 text-xs text-dark/30">
        <div className="flex-1 h-px bg-gray-100" />
        {t("or")}
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Magic link — secondary */}
      <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("email_placeholder")}
          required
          className="w-full px-4 py-2.5 rounded-button border border-gray-200 text-sm text-dark outline-none focus:border-teal transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Spinner size="sm" invert /> : null}
          {t("continue_with_email")}
        </button>
      </form>

      {error && <p className="text-xs text-coral text-center">{error}</p>}

      <p className="text-xs text-dark/30 text-center">{t("terms")}</p>
    </div>
  );
}
