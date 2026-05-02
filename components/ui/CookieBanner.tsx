"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { X, Settings, Cookie } from "lucide-react";
import Link from "next/link";

type ConsentState = {
  necessary: true;
  analytics: boolean;
};

const CONSENT_KEY = "solen_cookie_consent";

function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeConsent(consent: ConsentState) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}

export default function CookieBanner() {
  const locale = useLocale();
  const t = useTranslations("cookies") as any;
  const [visible, setVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const accept = (consent: ConsentState) => {
    storeConsent(consent);
    setVisible(false);
    setSettingsOpen(false);

    // Send consent to PostHog if analytics accepted
    if (consent.analytics && typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.opt_in_capturing();
    }
  };

  const acceptAll = () => {
    accept({ necessary: true, analytics: true });
  };

  const rejectAll = () => {
    accept({ necessary: true, analytics: false });
    if (typeof window !== "undefined" && (window as any).posthog) {
      (window as any).posthog.opt_out_capturing();
    }
  };

  const saveSettings = () => {
    accept({ necessary: true, analytics });
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      {!settingsOpen && (
        <div className="fixed bottom-0 inset-x-0 z-70 p-4 sm:p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-[12px] shadow-warm-lg border border-s-ink/5 p-5">
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-s-coral shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-s-ink font-medium mb-1">
                  {t("title")}
                </p>
                <p className="text-xs text-s-ink/60 leading-relaxed">
                  {t("description")}{" "}
                  <Link href={`/${locale}/privacy`} className="text-s-coral hover:underline">
                    {t("privacyLink")}
                  </Link>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={acceptAll}
                className="flex-1 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] duration-150"
                aria-label={t("accept")}
              >
                {t("accept")}
              </button>
              <button
                onClick={rejectAll}
                className="flex-1 py-2.5 rounded-pill border border-s-ink/10 text-sm font-medium text-s-ink/70 hover:bg-s-bg-surface:bg-white/5 transition-colors duration-150"
                aria-label={t("reject")}
              >
                {t("reject")}
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-pill border border-s-ink/10 text-s-ink/50 hover:bg-s-bg-surface:bg-white/5 transition-colors duration-150"
                aria-label={t("settings")}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[12px] shadow-warm-lg p-6">
            <button
              onClick={() => setSettingsOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-s-ink/40 hover:bg-s-bg-sunken:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-heading font-semibold text-lg text-s-ink mb-4">
              {t("settingsTitle")}
            </h3>

            <div className="space-y-4">
              {/* Necessary — always on */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-s-ink">{t("necessary")}</p>
                  <p className="text-xs text-s-ink/40">{t("necessaryDesc")}</p>
                </div>
                <div className="w-10 h-5 rounded-full bg-s-coral flex items-center justify-end px-0.5 opacity-60 cursor-not-allowed">
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-s-ink">{t("analytics")}</p>
                  <p className="text-xs text-s-ink/40">{t("analyticsDesc")}</p>
                </div>
                <button
                  onClick={() => setAnalytics(!analytics)}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    analytics ? "bg-s-coral justify-end" : "bg-s-sand justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-warm-sm" />
                </button>
              </div>

            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={saveSettings}
                className="flex-1 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-[transform,filter] duration-150"
              >
                {t("saveSettings")}
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 py-2.5 rounded-pill border border-s-ink/10 text-sm font-medium text-s-ink/70 hover:bg-s-bg-surface:bg-white/5 transition-colors duration-150"
              >
                {t("acceptAll")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
