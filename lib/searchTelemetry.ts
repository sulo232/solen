// exists-check: net-new. Client telemetry that finally WIRES the existing /api/search/event route
// (it was built but had ZERO callers, so search_events was empty — the funnel source was dark). Fires
// the search funnel: an impression when results show, a click when a result is tapped. Consent-gated
// via the existing "solen-cookie-consent" localStorage (analytics opt-in). NOT a dup of lib/posthog-*
// (that's product analytics) — this feeds the search→book points/affinity funnel.
"use client";

type ClickType = "service" | "salon" | "stylist";

/** Behavioural logging is opt-in: only when the user accepted the analytics cookie category. */
function analyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem("solen-cookie-consent");
    if (!raw) return false;
    const p = JSON.parse(raw) as { analytics?: boolean };
    return p?.analytics === true;
  } catch {
    return false;
  }
}

/** Fire-and-forget. keepalive so a click event survives the navigation it triggers. Never throws. */
function post(body: Record<string, unknown>): void {
  try {
    void fetch("/api/search/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, consent_given: analyticsConsent() }),
      keepalive: true,
      credentials: "include",
    }).catch(() => {});
  } catch {
    /* telemetry must never break the UI */
  }
}

export function logSearchImpression(o: { query: string; locale: string; resultsCount: number }): void {
  post({ kind: "impression", query: o.query, locale: o.locale, results_count: o.resultsCount });
}

export function logSearchClick(o: {
  query: string;
  locale: string;
  clickedType: ClickType;
  clickedId: string;
  clickedPosition: number;
}): void {
  post({
    kind: "click",
    query: o.query,
    locale: o.locale,
    clicked_type: o.clickedType,
    clicked_id: o.clickedId,
    clicked_position: o.clickedPosition,
  });
}
