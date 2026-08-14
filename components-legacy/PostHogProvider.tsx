'use client';
import posthog from 'posthog-js';
import type { CaptureResult } from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

// SEC-09 backstop: query params that must never reach PostHog verbatim (the guest-access
// bearer token today, `lib/bookings/guest-access.ts`). Add the NEXT secret param here, one
// line, nothing else in this file needs to change.
const SECRET_URL_PARAMS = ['t', 'access_token'] as const;

// URL-shaped properties posthog-js's autocapture/pageview attaches to every event. `$pathname`
// is deliberately NOT in this list: confirmed against the installed posthog-js@1.362.0 source
// (node_modules/posthog-js/dist/array.full.js, function `mr`) that it is always
// `new URL(href).pathname` alone, so it can never carry a query string.
const URL_PROPERTIES_TO_SCRUB = ['$current_url', '$referrer', '$initial_referrer'] as const;

/** Redact denylisted query params inside one captured URL string. Fails toward `<redacted>`
 *  on a parse error rather than passing the raw value through, so a malformed value can never
 *  accidentally carry a secret past this check. */
function redactSecretParams(raw: string): string {
  if (!SECRET_URL_PARAMS.some((param) => raw.includes(`${param}=`))) return raw;
  try {
    const url = new URL(raw);
    let changed = false;
    for (const param of SECRET_URL_PARAMS) {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, '<redacted>');
        changed = true;
      }
    }
    return changed ? url.toString() : raw;
  } catch (err) {
    console.error('[PostHogProvider] could not parse a captured URL for redaction:', err);
    return '<redacted>';
  }
}

// `before_send` is the CURRENT api (checked against the installed posthog-js@1.362.0 types:
// node_modules/@posthog/types/dist/posthog-config.d.ts:1126-1128 marks `sanitize_properties`
// `@deprecated - use before_send instead`). It runs on every captured event, including
// autocapture + capture_pageview (both default `true`), so this is the project-wide backstop:
// it REDACTS the leaked param from the event properties in place rather than dropping the
// whole event (returning null would drop it and analytics would lose the pageview entirely).
function scrubSecretUrlParams(cr: CaptureResult | null): CaptureResult | null {
  if (!cr || !cr.properties) return cr;
  for (const key of URL_PROPERTIES_TO_SCRUB) {
    const value = cr.properties[key];
    if (typeof value === 'string') cr.properties[key] = redactSecretParams(value);
  }
  return cr;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    // DSG/GDPR (DACH launch gate): NO analytics capture until the user opts in via the cookie
    // banner. Init opted-OUT by default, then opt in only when consent.analytics === true. We read
    // the CookieConsent localStorage record directly because this provider mounts ABOVE
    // CookieConsentProvider and can't use the useCookieConsent() hook.
    const analyticsConsented = () => {
      try {
        const raw = localStorage.getItem('solen-cookie-consent');
        return raw ? JSON.parse(raw)?.analytics === true : false;
      } catch { return false; }
    };
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: 'https://eu.i.posthog.com',
      person_profiles: 'identified_only',
      opt_out_capturing_by_default: true, // suppress ALL capture until opt-in
      capture_performance: { web_vitals: true }, // R6: web-vitals RUM, gated by the same opt-in/opt-out toggle below
      before_send: scrubSecretUrlParams, // SEC-09: redact secret query params before they leave the browser
    });
    const sync = () => {
      if (analyticsConsented()) posthog.opt_in_capturing();
      else posthog.opt_out_capturing();
    };
    sync();
    window.addEventListener('solen-consent-changed', sync); // same-tab grant/withdraw
    window.addEventListener('storage', sync);                // cross-tab
    return () => {
      window.removeEventListener('solen-consent-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
