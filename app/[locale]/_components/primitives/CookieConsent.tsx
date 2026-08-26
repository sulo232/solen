"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Cookie, Settings2 } from "lucide-react";
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

/**
 * Mirror the analytics choice to the server so SERVER-side PostHog capture
 * (lib/posthog-server.ts) can honour it: the banner's localStorage record is unreadable
 * from the server. Fire-and-forget, never blocks or throws into the banner UI.
 * A 401 is EXPECTED for an anonymous visitor (no profile row) and is not logged;
 * anything else is a real failure of the consent mirror and IS logged.
 */
async function mirrorConsentToServer(analytics: boolean): Promise<void> {
  try {
    const res = await fetch("/api/me/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analytics }),
    });
    if (!res.ok && res.status !== 401) {
      console.error("[CookieConsent] server consent mirror rejected:", res.status);
    }
  } catch (err) {
    console.error("[CookieConsent] server consent mirror request failed:", err);
  }
}
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
      // Notify same-tab listeners (PostHogProvider opts analytics in/out immediately on this).
      window.dispatchEvent(new Event("solen-consent-changed"));
    } catch {
      // localStorage may fail in private browsing, accept silently: consent state stays in memory
    }
    // Mirror the analytics choice to the server (profiles.analytics_consent) so SERVER-side
    // PostHog capture (lib/posthog-server.ts) can honour it too: localStorage is unreadable from
    // the server. This lives in persist(), NOT only in savePreferences, so the primary banner
    // buttons (acceptAll / acceptNecessary) sync too. Most visitors never open the settings
    // modal, so wiring it only there would leave analytics_consent NULL and the server gate inert.
    void mirrorConsentToServer(next.analytics);
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
      // The server mirror runs inside persist() above, so every path (acceptAll,
      // acceptNecessary, and this one) syncs consent to the server.
    },
    [persist],
  );

  const withdrawConsent = React.useCallback(() => {
    setConsent(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // PostHogProvider listens for this and opts the browser SDK back out immediately.
      window.dispatchEvent(new Event("solen-consent-changed"));
    } catch {
      // ignore
    }
    // A withdrawal must reach the server too, otherwise server-side capture would keep
    // running on a stale analytics_consent=true for this user.
    void mirrorConsentToServer(false);
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

/**
 * True while a sheet, modal, or full-screen overlay owns the screen.
 *
 * Reuses the ONE signal every overlay in this codebase already sets, the body-scroll lock,
 * rather than adding a second global: SearchOverlay pins `body{position:fixed;overflow:hidden}`,
 * MobileMenu / SalonLightbox / SalonImageGallery / SearchTemplate's map overlay set
 * `body{overflow:hidden}`, and react-aria's Modal + Sheet primitives (usePreventScroll) set
 * `documentElement{overflow:hidden}`. SalonMobileBookBar.tsx already names this as THE DOM signal
 * for "an overlay is open" and notes it is an inline style, so a MutationObserver is the only way
 * to read it declaratively. That is exactly what this does, and it means every current and future
 * overlay is covered without touching a single overlay component.
 */
function useOverlayOwnsScreen(): boolean {
  const [owned, setOwned] = React.useState(false);
  React.useEffect(() => {
    const read = () =>
      document.body.style.overflow === "hidden" ||
      document.body.style.position === "fixed" ||
      document.documentElement.style.overflow === "hidden";
    setOwned(read());
    const observer = new MutationObserver(() => setOwned(read()));
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, []);
  return owned;
}

function CookieBanner() {
  const { acceptAll, acceptNecessary, openSettings } = useCookieConsent();
  const pathname = usePathname() ?? "/";
  const overlayOwnsScreen = useOverlayOwnsScreen();

  // Display-only suppression on focused flows: the fixed bottom strip covered the
  // pay CTA on /walk-in-pay, and on the owner /dashboard it overlapped page content
  // + intercepted taps (the dashboard has its own chrome). Consent STATE is untouched
  // — analytics stays off (necessary-only) until the user consents on any other page,
  // so this is DSG/GDPR-safe. Mirrors HideInBooking's "no global chrome in self-contained flows" rule.
  if (pathname && (/\/walk-in-pay\/?$/.test(pathname) || /\/dashboard(\/|$)/.test(pathname))) return null;

  // S1 (owner decision 2026-08-03): same display-only suppression while a sheet or modal owns the
  // screen, and the banner returns the moment that closes. This z-tooltip (700) strip sat over the
  // search sheet (z-index 101): measured on a first visit at 375x812, the banner box [12,656,351,144]
  // covered the sheet's own footer, so `document.elementFromPoint` at the Suchen button's centre
  // (292.5, 779.5) returned the banner's "Alle akzeptieren" and at Zuruecksetzen's centre
  // (66.5, 779.5) returned "Nur notwendige". A real tap on Suchen therefore GRANTED cookie consent
  // and never searched. Consent STATE is untouched here exactly as in the route suppression above:
  // nothing is auto-accepted, nothing is pre-seeded, analytics stays off until the visitor answers
  // the banner once the overlay is closed, so this stays DSG/GDPR-safe. No search control ever
  // doubles as a consent button.
  if (overlayOwnsScreen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie-Einwilligung"
      className={cn(
        "fixed z-tooltip",
        // V2-D49o-fu (2026-05-10): mobile gets a rounded floating card with
        // viewport-edge margins; desktop keeps the full-bleed bottom strip
        // (cards-everywhere on desktop would feel out-of-context against
        // the data-dense layout above). Mobile changes:
        //   • inset from edges (left-3 right-3 bottom-3)
        //   • rounded-3xl on the whole card (24px corners)
        //   • soft shadow on all sides (was upward-only strip shadow)
        //   • Anpassen text-button → Settings icon-button top-right (rare
        //     action collapsed to a glyph; "Nur notwendige" + "Alle
        //     akzeptieren" become the visual hierarchy)
        "left-3 right-3 bottom-3 rounded-3xl",
        "md:left-0 md:right-0 md:bottom-0 md:rounded-none",
        // V2-D64 (2026-05-15): match the header's glass treatment (white-ish
        // translucent + heavy backdrop blur) instead of the cream `s-bg-base`
        // slab. The cream was reading as a third surface color that didn't
        // match anything else; white-glass mirrors the header so the page
        // feels bookended by the same material at top + bottom.
        "bg-white/80 backdrop-blur-[22px] backdrop-saturate-[1.7] border border-s-border",
        "md:border-t md:border-l-0 md:border-r-0 md:border-b-0",
        "shadow-[0_8px_32px_rgba(50,47,44,0.12)]",
        "md:shadow-[0_-4px_16px_rgba(50,47,44,0.08)]",
        "transition-transform duration-[400ms] ease-glide",
      )}
    >
      <div
        className={cn(
          "max-w-[1240px] mx-auto",
          // Mobile padding tightened (was px-5 py-4 → px-4 py-3.5)
          "px-4 py-3.5 md:px-6 md:py-5",
          "flex flex-col md:flex-row md:items-center gap-3 md:gap-6",
        )}
      >
        {/* Top row: cookie glyph + title/subtitle block + settings icon button.
            Desktop: this whole block becomes the left flex-1 child. */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#A1672F]/15 text-[#A1672F]"
          >
            <Cookie size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-body font-semibold text-[15px] md:text-[16px] leading-[1.3] text-s-ink mb-0.5">
              Wir verwenden Cookies
            </div>
            <p className="font-body font-normal text-[13px] md:text-[14px] leading-[1.45] text-s-ink-2">
              Analyse &amp; Marketing nur mit Ihrem OK.
            </p>
          </div>
          {/* V2-D49o-fu: Anpassen text → Settings icon button on the far
              right. Visible on both viewports for consistency, but on
              mobile it lives in the top row (next to title); on desktop
              moves into the right cluster via the order/flex below. */}
          <button
            type="button"
            onClick={openSettings}
            aria-label="Cookie-Einstellungen anpassen"
            className={cn(
              "shrink-0 grid h-9 w-9 place-items-center rounded-full",
              "bg-white border border-s-border text-s-ink-2 cursor-pointer",
              "hover:bg-s-bg-sunken hover:text-s-ink transition-[colors,transform] duration-150 ease-snap",
              "active:scale-95 active:duration-[80ms]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              "md:hidden",
            )}
          >
            <Settings2 size={16} strokeWidth={1.9} aria-hidden />
          </button>
        </div>

        {/* Action buttons row. Mobile: 2 buttons take full width split equally
            (50/50). Desktop: original cluster with Anpassen text button
            preserved. */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop-only Anpassen text button */}
          <button
            type="button"
            onClick={openSettings}
            className={cn(
              "hidden md:inline-flex font-body font-semibold text-[14px] text-s-ink",
              "bg-transparent border-0 cursor-pointer px-2 py-2",
              "hover:text-s-ink transition-colors duration-150 ease-snap",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 rounded-md",
            )}
          >
            Anpassen
          </button>
          <button
            type="button"
            onClick={acceptNecessary}
            className={cn(
              "flex-1 md:flex-none font-body font-semibold text-[14px] text-s-ink",
              "bg-white border border-s-border cursor-pointer",
              "px-4 py-2.5 md:px-5 md:py-3 rounded-full",
              "hover:bg-s-bg-sunken transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            )}
          >
            Nur notwendige
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className={cn(
              "flex-1 md:flex-none font-body font-semibold text-[14px] text-white",
              "bg-s-ink border-0 cursor-pointer",
              "px-4 py-2.5 md:px-5 md:py-3 rounded-full",
              "hover:bg-black transition-[colors,transform] duration-150 ease-snap",
              "active:scale-[0.97] active:duration-[80ms]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
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
          Notwendige Cookies sind immer aktiv. Sie entscheiden, ob wir auch Analyse + Marketing-Cookies
          setzen dürfen.
        </p>

        <div className="bg-s-bg-base border border-s-border rounded-[12px] px-4">
          <div className="flex items-center justify-between gap-4 py-[14px] border-b border-s-border">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Notwendig</span>
              <span className="font-body font-normal text-[13px] text-s-ink-2 mt-1">
                Auth-Session, Sprachpräferenz, dieser Cookie-Banner selbst. Immer aktiv (legitime
                Interessen).
              </span>
            </div>
            <Switch checked disabled aria-label="Notwendige Cookies (immer aktiv)" />
          </div>

          <div className="flex items-center justify-between gap-4 py-[14px] border-b border-s-border">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Analyse</span>
              <span className="font-body font-normal text-[13px] text-s-ink-2 mt-1">
                Anonyme Nutzungsstatistiken via PostHog — hilft uns zu verstehen, welche Stores
                gefunden werden und wo Buchungen abbrechen.
              </span>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} aria-label="Analyse-Cookies" />
          </div>

          <div className="flex items-center justify-between gap-4 py-[14px]">
            <div className="flex flex-col">
              <span className="font-body font-semibold text-[15px] text-s-ink">Marketing</span>
              <span className="font-body font-normal text-[13px] text-s-ink-2 mt-1">
                Konversions-Tracking + Retargeting (Meta, Google) — damit wir relevante Anzeigen
                ausspielen und neue Kund:innen erreichen.
              </span>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} aria-label="Marketing-Cookies" />
          </div>
        </div>

        <p className="text-[13px] text-s-ink-2 mt-4">
          Sie können Ihre Einstellungen jederzeit über den Footer-Link
          "Cookie-Einstellungen" ändern. Mehr in unserer{" "}
          <a href="/datenschutz" className="text-s-ink hover:text-s-ink transition-colors">
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
            "bg-s-bg-base border border-s-border cursor-pointer",
            "px-5 py-3 rounded-full",
            "hover:bg-s-bg-sunken transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide",
          )}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => savePreferences({ analytics, marketing })}
          className={cn(
            "font-body font-semibold text-[14px] text-white",
            "bg-s-ink border-0 cursor-pointer",
            "px-5 py-3 rounded-full",
            "hover:bg-black transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide",
          )}
        >
          Auswahl speichern
        </button>
      </ModalFooter>
    </Modal>
  );
}
