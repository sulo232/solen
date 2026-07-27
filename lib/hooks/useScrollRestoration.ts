'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ia-navigation-05: no scroll-restoration law or implementation existed anywhere in the
 * app. A list/grid page a user navigates away from (to a detail page) and back to
 * (browser back / an in-app back arrow) must restore the exact scroll position, not
 * reset to top, this is the NN/g "return-to-spot" task class, already identified as a
 * high-confidence fix in _design-system/research/PSYCH_CONVERSION.md:160 /
 * PSYCH_PSYCHOLOGY.md:199 but never implemented until now.
 *
 * Position is cached in sessionStorage keyed by pathname + querystring, so it survives
 * a client-side back-navigation within the tab but never leaks across tabs/sessions and
 * never resurrects a stale position on a genuinely fresh visit to the same URL.
 *
 * Pass `ready=true` only once the page's real content has rendered (loading finished,
 * items non-empty): restoring against an empty/skeleton layout would just no-op at 0.
 */
export function useScrollRestoration(ready: boolean) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const restoredRef = useRef(false);

  const qs = searchParams?.toString() ?? '';
  const key = `solen:scrollpos:${pathname}${qs ? `?${qs}` : ''}`;

  // Save continuously (rAF-throttled) so navigating away at any moment has a fresh value.
  useEffect(() => {
    let ticking = false;
    const save = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(key, String(window.scrollY));
        } catch {
          // sessionStorage can throw in locked-down/private contexts; scroll restoration
          // is a nicety, never worth surfacing an error for.
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [key]);

  // Restore once, the first time this mount has real content ready.
  useEffect(() => {
    if (!ready || restoredRef.current) return;
    restoredRef.current = true;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(key);
    } catch {
      raw = null;
    }
    const y = raw ? parseInt(raw, 10) : 0;
    if (Number.isFinite(y) && y > 0) {
      // rAF so this runs after the ready render's layout has committed real height.
      requestAnimationFrame(() => window.scrollTo(0, y));
    }
  }, [ready, key]);
}
