'use client';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

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
