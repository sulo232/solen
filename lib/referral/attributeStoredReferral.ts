// lib/referral/attributeStoredReferral.ts
//
// GAP #49: the ONE place that reads a pending referral code out of localStorage, calls
// POST /api/referral/complete, and decides whether to keep or clear the stored code based
// on the response. Two client hooks call this, so the logic can never drift between them:
//   - app/[locale]/onboarding/OnboardingFlow.tsx: fires right after signup. A brand new
//     user has 0 bookings, so this almost always hits the "book first" anti-farming gate
//     below and correctly leaves the code stored.
//   - components-legacy/booking/BookingConfirmation.tsx: fires once a booking exists, the
//     point where that gate is actually meant to pass (see the call site for the auth
//     guard and the booking-status caveats).
import { REFERRAL_STORAGE_KEY } from "./storage";

export async function attributeStoredReferral(): Promise<void> {
  const code = typeof window !== "undefined" ? localStorage.getItem(REFERRAL_STORAGE_KEY) : null;
  if (!code) return;

  try {
    const res = await fetch("/api/referral/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referral_code: code }),
    });

    if (res.ok) {
      // Attributed: referrer credited server-side, code consumed. Clear so neither hook
      // can ever re-fire it.
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return;
    }

    // 404 = code not found / already claimed, 409 = this user already redeemed a
    // different code (or lost a concurrent-completion race to the server's CAS update).
    // Both are permanent for this stored code.
    if (res.status === 404 || res.status === 409) {
      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      return;
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => null);
      // Self-referral, or the stored value itself failed validation: neither will ever
      // succeed on retry, so clear it. Any other 400 here is the anti-farming "complete a
      // booking first" gate (app/api/referral/complete/route.ts): the code is still
      // valid, there is just no qualifying booking yet, so it must stay stored for the
      // other hook (or a later retry) to pick up.
      if (body?.code === "VALIDATION_ERROR" || body?.error === "Du kannst dich nicht selbst empfehlen") {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
      return;
    }

    // 401/429/5xx: transient (session race, rate limit, server hiccup). Leave the code
    // stored so a later attempt can retry.
    console.error("[Referral] attribution attempt did not complete, status:", res.status);
  } catch (err) {
    // Network error: leave the code stored for a later retry.
    console.error("[Referral] attribution attempt failed:", err);
  }
}
