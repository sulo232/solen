"use client";

import * as React from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "./Modal";
import { Switch } from "./Switch";
import { cn } from "@/lib/utils";

/**
 * V3 Cookie consent — LIVE_TRUTH §F.8.
 *
 * GDPR / Swiss DSG compliant cookie consent banner + settings modal.
 * Non-negotiable for DACH market launch — analytics + marketing require
 * active opt-in.
 *
 * Architecture (V2-D31):
 * - <CookieConsentProvider> at app root manages state + persistence
 * - <CookieBanner> renders sticky-bottom strip (auto-mounted by provider)
 * - useCookieConsent() hook exposes consent state to other components
 * - Persistence via localStorage (cookies-for-cookie-consent = chicken-and-egg)
 * - 12-month consent expiry — banner re-shows after that
 *
 * Categories (v1):
 * - necessary  — always on (auth session, language pref, consent record itself)
 * - analytics  — opt-in (PostHog event tracking)
 * - marketing  — opt-in (conversion pixels, retargeting)
 */

const STORAGE_KEY = "solen-cookie-consent";
const CONSENT_VALID_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

export type CookieCategory = "necessary" | "analytics" | "marketing";

export interface CookieConsentState {
  necessary: true; // always true — never editable
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of when consent was given. */
  timestamp: string;
}

export interface CookieConsentContextValue {
  /** Current consent state. Null if user hasn't consented yet. */
  consent: CookieConsentState | null;
  /** True if user has made a consent choice (banner should be hidden). */
  hasConsented: boolean;
  /** Show the settings modal (used by footer link). */
  openSettings: () => void;
  /** Accept all categories (banner primary CTA). */
  acceptAll: () => void;
  /** Accept only necessary (banner secondary CTA). */
  acceptNecessary: () => void;
  /** Save custom selections (settings modal CTA). */
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
  /** Withdraw all consent (used in tests + privacy page). */
  withdrawConsent: () => void;
}

const CookieContext = React.createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = React.useContext(CookieContext);
  if (!ctx) {
    throw new Error("useCookieConsent() must be called inside <CookieConsentProvider>");
  }
  return ctx;
}

/* ================================================================================
   Provider — manages state + persistence + renders Banner + Settings modal
   ================================================================================ */

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = React.useState<CookieConsentState | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Hydrate from localStorage on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CookieConsentState;
        const age = Date.now() - new Date(parsed.timestamp).getTime();
        if (age < CONSENT_VALID_MS) {
          setConsent(parsed);
        } else {
          // Expired — remove + re-show banner
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // Bad JSON or localStorage unavailable — banner shows anyway
    }
    setHydrated(true);
  }, []);

  const persist = React.useCallback((next: CookieConsentState) => {
    setConsent(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may fail in private browsing — accept silently, consent state still in memory
    }
  }, []);

  const acceptAll = React.useCallback(() => {
    persist({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  }, [persist]);

  const acceptNecessary = React.useCallback(() => {
    persist({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  }, [persist]);

  const savePreferences = React.useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      persist({
        necessary: true,
        analytics: prefs.analytics,
        marketing: prefs.marketing,
        timestamp: new Date().toISOString(),
      });
      setSettingsOpen(false);
    },
    [persist],
  );

  const withdrawConsent = React.useCallback(() => {
    setConsent(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const openSettings = React.useCallback(() => setSettingsOpen(true), []);

  const value = React.useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      hasConsented: consent !== null,
      openSettings,
      acceptAll,
      acceptNecessary,
      savePreferences,
      withdrawConsent,
    }),
    [consent, openSettings, acceptAll, acceptNecessary, savePreferences, withdrawConsent],
  );

  return (
    <CookieContext.Provider value={value}>
      {children}
      {/* Don't render banner until hydrated — prevents SSR/CSR flash */}
      {hydrated && !consent && <CookieBanner />}
      <CookieSettingsModal isOpen={settingsOpen} onOpenChange={setSettingsOpen} />
    </CookieContext.Provider>
  );
}

/* ================================================================================
   Banner — sticky-bottom strip, mounts when no consent yet
   ================================================================================ */

function CookieBanner() {
  const { acceptAll, acceptNecessary, openSettings } = useCookieConsent();

  return (
    <div
      role="region"
      aria-label="Cookie-Einwilligung"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-tooltip",
        "bg-s-bg-base border-t border-s-ink/10",
        "shadow-[0_-4px_16px_rgba(50,47,44,0.08)]",
        // motion: slide up from bottom on first paint
        "transition-transform duration-[400ms] ease-glide",
      )}
    >
      <div
        className={cn(
          "max-w-[1240px] mx-auto",
          "px-5 py-4 md:px-6 md:py-5",
          "flex flex-col md:flex-row md:items-center gap-4 md:gap-6",
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-[16px] leading-[1.3] text-s-ink mb-1">
            Wir verwenden Cookies
          </div>
          <p className="font-body font-normal text-[14px] leading-[1.55] text-s-ink-2">
            Analyse &amp; Marketing nur mit deinem OK.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 md:flex-nowrap">
          <button
            type="button"
            onClick={openSettings}
            className={cn(
              "font-body font-semibold text-[14px] text-s-brand",
              "bg-transparent border-0 cursor-pointer px-2 py-2",
              "hover:text-s-ink transition-colors duration-150 ease-snap",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 rounded-md",
            )}
          >
            Anpassen
          </button>
          <button
            type="button"
            onClick={acceptNecessary}
            className={cn(
              "font-body font-semibold text-[14px] text-s-ink",
              "bg-s-bg-base border border-s-ink/10 cursor-pointer",
              "px-5 py-3 rounded-full",
              "hover:bg-s-bg-sunken transition-colors duration-150 ease-snap",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
            )}
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className={cn(
              "font-body font-semibold text-[14px] text-white",
              "bg-s-brand border-0 cursor-pointer",
              "px-5 py-3 rounded-full",
              "hover:bg-s-brand-mid transition-colors duration-150 ease-snap",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
            )}
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================================
   Settings modal — §F.2 modal lg, 3 category rows w switches
   ================================================================================ */

interface CookieSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function CookieSettingsModal({ isOpen, onOpenChange }: CookieSettingsModalProps) {
  const { consent, savePreferences } = useCookieConsent();
  const [analytics, setAnalytics] = React.useState(consent?.analytics ?? false);
  const [marketing, setMarketing] = React.useState(consent?.marketing ?? false);

  // Sync local state with consent when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setAnalytics(consent?.analytics ?? false);
      setMarketing(consent?.marketing ?? false);
    }
  }, [isOpen, consent]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <ModalHeader
        title="Cookie-Einstellungen"
        eyebrow="Datenschutz"
        size="lg"
        onClose={() => onOpenChange(false)}
      />
      <ModalBody size="lg">
        <p className="text-s-ink-2 mb-4">
          Wir nutzen Cookies und ähnliche Technologien, um Solen zu betreiben und zu verbessern.
          Notwendige Cookies sind immer aktiv. Du entscheidest, ob wir auch Analyse + Marketing-Cookies
          setzen dürfen.
        </p>

        <div className="bg-s-bg-base border border-s-ink/[0.06] rounded-[12px] px-4">
          <div className="flex items-center justify-between gap-4 py-[14px] border-b border-s-ink/[0.05]">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Notwendig</span>
              <span className="font-body font-normal text-[13px] text-s-ink-3 mt-1">
                Auth-Session, Sprachpräferenz, dieser Cookie-Banner selbst. Immer aktiv (legitime
                Interessen).
              </span>
            </div>
            <Switch checked disabled aria-label="Notwendige Cookies (immer aktiv)" />
          </div>

          <div className="flex items-center justify-between gap-4 py-[14px] border-b border-s-ink/[0.05]">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Analyse</span>
              <span className="font-body font-normal text-[13px] text-s-ink-3 mt-1">
                Anonyme Nutzungsstatistiken via PostHog — hilft uns zu verstehen, welche Salons
                gefunden werden und wo Buchungen abbrechen.
              </span>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analyse-Cookies" />
          </div>

          <div className="flex items-center justify-between gap-4 py-[14px]">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Marketing</span>
              <span className="font-body font-normal text-[13px] text-s-ink-3 mt-1">
                Konversions-Tracking + Retargeting (Meta, Google) — damit wir relevante Anzeigen
                ausspielen und neue Kund:innen erreichen.
              </span>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing-Cookies" />
          </div>
        </div>

        <p className="text-[13px] text-s-ink-3 mt-4">
          Du kannst deine Einstellungen jederzeit über den Footer-Link
          "Cookie-Einstellungen" ändern. Mehr in unserer{" "}
          <a href="/datenschutz" className="text-s-brand hover:text-s-ink transition-colors">
            Datenschutzerklärung
          </a>
          .
        </p>
      </ModalBody>
      <ModalFooter size="lg">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className={cn(
            "font-body font-semibold text-[14px] text-s-ink",
            "bg-s-bg-base border border-s-ink/10 cursor-pointer",
            "px-5 py-3 rounded-full",
            "hover:bg-s-bg-sunken transition-colors",
          )}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => savePreferences({ analytics, marketing })}
          className={cn(
            "font-body font-semibold text-[14px] text-white",
            "bg-s-brand border-0 cursor-pointer",
            "px-5 py-3 rounded-full",
            "hover:bg-s-brand-mid transition-colors",
          )}
        >
          Auswahl speichern
        </button>
      </ModalFooter>
    </Modal>
  );
}
