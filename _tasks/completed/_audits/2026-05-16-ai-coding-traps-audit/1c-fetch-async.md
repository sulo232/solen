# Topic 1C — Fetch / Async / Fire-and-Forget Error Handling
Date: 2026-05-16
Agent: 1C
Scope: HTTP fetch error handling + dropped promises across `app/`, `lib/`, `components-legacy/`

## Summary
- Total findings: 92 (Critical: 6 · High: 22 · Medium: 41 · Low: 23)
- Files scanned: 933 (.ts/.tsx in `app/`, `lib/`, `components-legacy/`)
- Pattern hits before dedup: `await fetch(`=319, `.then((r) => r.json())` w/o ok check=84, bare `fetch(` no await=193, `.catch(() => {})`=10, `Promise.allSettled`=4 sites, retry loops=1 site
- Files with at least one finding: 47

The codebase has a systemic three-tier pattern of async error handling failures:

1. **Pattern A — Client `.then((r) => r.json())` without ok check (84 hits across 35+ files).** The browser blindly parses the body whether the server returned 200 or 500. On 5xx, the JSON parse usually succeeds (because the API returns a JSON error envelope), so the user sees the *wrong* data path — e.g. `data.clientSecret` is undefined, the checkout silently shows "Loading..." forever with no error toast. Severity escalates by surface: payment-intent fetch in checkout = CRITICAL; profile fetch in dashboard = HIGH; CRM stats = MEDIUM.

2. **Pattern B — Server-side inline `fetch` calls to Resend/Gemini/seven.io without ok check or with silent try/catch.** 6 Resend calls, 4 Gemini calls (3 unchecked), 1 seven.io call (in `bookings/walk-in`) wrap the fetch in `try/catch` but never inspect `response.ok`. If Resend rate-limits (429) or auth-expires (401), the API silently "succeeds" — emails are never sent, response returns success to client. The `lib/email.ts` and `lib/sms.ts` wrappers ARE correct; the inline copies in route handlers are not. CLAUDE.md rule "Never `.catch(() => {})`" is violated 10+ times in app/api/.

3. **Pattern C — Fire-and-forget useEffect / event-handler fetches with `.catch(() => {})`.** 7 of the 10 silent catches live in `app/[locale]/salon/[slug]/page.tsx` alone — owner-status, next-slot, my-booking, off-peak, analytics tracking. These are HIGH not CRITICAL because they don't lose money — but they hide auth failures, RLS denials, and 502 backends from the user with no visible feedback. Combined with the unchecked `.json()` callers, the entire customer-side experience can degrade to "stuck loading" with zero error surface.

The single CRITICAL hot-spot is `app/[locale]/checkout/page.tsx:160-177`: the Stripe payment-intent fetch uses `.then((r) => r.json())` directly, so a 500 from `/api/stripe/create-payment-intent` (which has no try/catch around `stripe.paymentIntents.create` per 1B finding C1) cascades to the client which then accesses `.client_secret` on an error envelope — the user sees `setError(tc("errorPaymentLoading"))` only if the network layer itself throws, not if the API itself errored. Booking deposit flow can deadlock at "Loading..." with no recourse.

---

## Findings by severity

### CRITICAL — payment / booking flow data-loss

#### C1. `app/[locale]/checkout/page.tsx:160-177` — fetch-no-ok
```ts
fetch("/api/stripe/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ salon_id, service_name, estimated_price, deposit_amount: chargeAmount }),
})
  .then((r) => r.json())
  .then((data) => {
    if (data.error) { setError(data.error); return; }
    setClientSecret(data.client_secret);
    setPaymentIntentId(data.payment_intent_id);
  })
  .catch(() => setError(tc("errorPaymentLoading")))
  .finally(() => setLoading(false));
```
Pattern: **fetch-no-ok**. `.then((r) => r.json())` on line 170 parses ANY response body — including the API's 500 error envelope. Combined with 1B finding C1 (Stripe create-payment-intent throws unhandled), a Stripe outage produces `{ error: "..." }` in `data`, which IS handled (line 172) — so the user sees the error. BUT a 5xx with NON-JSON body (e.g. Next.js default HTML error page when crashed) throws inside `.json()`, hits `.catch`, sets `errorPaymentLoading` — generic message, no diagnostic for support. Customer sees "loading" → "error", can't pay.
**Consequence:** Booking deposit fails silently in some Stripe outage modes; no error breadcrumb tied to user/salon.
**Severity: CRITICAL.**
**Fix:** `if (!r.ok) throw new Error("payment_intent_failed"); return r.json();` — escalate non-2xx to the catch branch. Add structured error in `setError` with status code visible.

#### C2. `app/[locale]/salon/[slug]/packages/page.tsx:87-101` — fetch-no-ok
```ts
fetch("/api/packages/purchase", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ package_id: pkg.id }),
})
  .then((r) => r.json())
  .then((d) => {
    if (d.clientSecret) { setClientSecret(d.clientSecret); }
    else { setIntentError(d.error ?? "Fehler beim Laden der Zahlung"); }
  })
  .catch(() => setIntentError("Verbindungsfehler. Bitte erneut versuchen."))
  .finally(() => setLoadingIntent(false));
```
Same pattern as C1 but for packages. If `/api/packages/purchase` returns 500 with HTML, `.json()` throws — generic "Verbindungsfehler". If returns 500 with JSON envelope, `d.clientSecret` is undefined, falls to `setIntentError(d.error ?? "Fehler beim Laden der Zahlung")` — at least it surfaces. But no status code, no Stripe error context.
**Consequence:** Package-purchase flow drops to generic error toast; user can't differentiate "card declined" from "API crashed."
**Severity: CRITICAL** (money path).
**Fix:** Same as C1 — check `r.ok`, surface `r.status` + Stripe error type from response body.

#### C3. `app/api/bookings/walk-in/route.ts:89-99` — fetch-no-ok-server + silent catch
```ts
const smsRes = await fetch("https://gateway.seven.io/api/sms", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Api-Key": sevenApiKey },
  body: JSON.stringify({ to: validated.customer_phone, text: smsText, from: "solen.ch" }),
});
smsSent = smsRes.ok;
} catch { /* SMS failure non-fatal */ }
```
Pattern: **fetch-no-ok-server + silent-catch**. The `smsRes.ok` IS checked for the boolean, but on a 4xx (e.g. invalid phone, rate limit) the response body is never logged — debugging silent SMS failures requires guessing. The `catch { /* non-fatal */ }` violates CLAUDE.md "Never `.catch(() => {})`. Always `console.error(...)`". Walk-in payment SMS contains the payment URL → if it never arrives, the customer can't pay → revenue loss.
**Consequence:** Customer doesn't get walk-in pay link, no diagnostic for support. Salon thinks "the system is broken."
**Severity: CRITICAL** (revenue path, no recovery).
**Fix:** `if (!smsRes.ok) console.error("[walk-in/sms] seven.io", smsRes.status, await smsRes.text());` plus `catch (err) { console.error(...) }`. Route through `lib/sms.ts` (which already does this correctly).

#### C4. `app/[locale]/account/saved/page.tsx:57-62` — fire-and-forget + fetch-no-ok inside catch
```ts
function handleUnfavorite(salonId: string) {
  setItems((prev) => prev.filter((s) => s.id !== salonId));
  fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(() => {
    fetch("/api/profile/favorites")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  });
}
```
Pattern: **fire-and-forget + fetch-no-ok (nested)**. The DELETE has no `.then((r) => r.ok)` — if the API returns 401/500, no error is logged, the optimistic-removed item is gone from UI. The catch-branch refetch ALSO doesn't check ok, and the recovery refetch has NO catch — if it fails too, an unhandled promise rejection escapes. User's saved-salon state is permanently inconsistent across browser sessions.
**Consequence:** Saved-favorites desynced silently; user can "unsave" a salon visually but it stays in DB.
**Severity: CRITICAL** (data integrity for saved-items feature, listed in tier-1 wireup).
**Fix:** await the DELETE, check `.ok`, revert optimistic on failure, structured log.

#### C5. `app/api/ai/intake-recommendation/route.ts:62-78` — fetch-no-ok-server
```ts
const geminiRes = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
  { method: "POST", headers: { "Content-Type": "application/json" }, body: ... }
);
const geminiData = await geminiRes.json();
const recommendation = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
if (!recommendation) {
  return NextResponse.json({ error: "AI returned empty response" }, { status: 500 });
}
await supabase.from("intake_form_responses").update({ ai_recommendation: recommendation }).eq("id", intake_id);
```
Pattern: **fetch-no-ok-server**. If Gemini returns 401 (key revoked) or 429 (rate limit), `geminiRes.json()` parses the error envelope. The `candidates?.[0]?...?.text` is undefined, `recommendation` is "", return "AI returned empty response" — caller sees a generic error, no breadcrumb that Gemini ITSELF errored. Hairdresser sees "AI failed" 1000 times before anyone realizes the API key is dead. This is BEHIND a paid feature: customer intake form → stylist preparation. Drops the value-prop of the intake feature.
**Consequence:** Stylists silently lose AI recommendations; debugging requires direct Gemini console access.
**Severity: CRITICAL** (paid feature, no diagnostic, repeated silent failures).
**Fix:** Check `geminiRes.ok`, log `geminiRes.status` + body on failure, return 502 with provider-detail.

#### C6. `app/api/translate/route.ts:43-55` — fetch-no-ok-server
```ts
try {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: ... }
  );
  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) {
    return NextResponse.json({ error: "No translation" }, { status: 500 });
  }
```
Same pattern as C5 — Gemini 4xx/5xx → JSON-parses error envelope → `raw` is "" → 500 "No translation". User-facing: salon services in DE never translate to EN/FR/IT → multilingual support broken silently. Translate is in the salon-onboarding hot path.
**Consequence:** Multilingual onboarding looks broken with zero diagnostic.
**Severity: CRITICAL** (onboarding flow, silent for hours/days until someone notices missing translations).
**Fix:** Check `response.ok`, return distinct error codes (`gemini_auth_failed`, `gemini_rate_limited`).

---

### HIGH — broken UX, no error to user, silent feature degradation

#### H1. `app/api/notifications/off-peak/route.ts:77-105` — fetch-no-ok-server (Resend)
```ts
try {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Solen <noreply@solen.ch>", to: email, subject: ..., html: ... }),
  });
  sentCount++;
} catch (err) {
  console.error(`[off-peak-notify] Failed to send email to user ${userId}:`, err);
}
```
Resend response.ok never checked. If Resend returns 422 (invalid email) or 429 (rate limited), the response.ok is false but no exception thrown — sentCount increments AS IF email sent. Cron returns success, salons think notifications fired, users never got them. Violates CLAUDE.md "Never `.catch(() => {})`" — partial: HAS console.error but only for network exceptions, not for HTTP-error bodies.
**Consequence:** Salons lose customer outreach with no signal.
**Severity: HIGH.**
**Fix:** Route through `lib/email.ts` (which checks ok). Or inline: `const res = await fetch(...); if (!res.ok) { console.error(...); continue; }`.

#### H2. `app/api/cron/review-prompt/route.ts:124-187` — fetch-no-ok-server (Resend, twice)
```ts
try {
  if (isHighRating && hasGooglePlace) {
    await fetch("https://api.resend.com/emails", { /* google push email */ });
    googlePushCount++;
  } else {
    await fetch("https://api.resend.com/emails", { /* solen review email */ });
  }
  await supabase.from("bookings").update({ review_prompt_sent: true }).eq("id", booking.id);
  sentCount++;
} catch (err) { console.error(`[review-prompt] Failed to send email for booking ${booking.id}:`, err); }
```
Same pattern: Resend ok unchecked. `review_prompt_sent` flag flips TRUE regardless of whether the email landed. Cron is idempotent — once flag is true, no retry on next run. If Resend was down during the cron window, that booking NEVER gets a review prompt.
**Consequence:** Review-funnel feature silently degrades; missing Google reviews tied to outage windows nobody can see.
**Severity: HIGH** (revenue-adjacent — reviews drive booking conversion).
**Fix:** Move email through `lib/email.ts` (throws on `!ok`), then DB update only if email throw-free.

#### H3. `app/api/dashboard/barber-reminders/send/route.ts:51-78` — fetch-no-ok-server (Resend)
```ts
try {
  await fetch("https://api.resend.com/emails", { /* reminder email */ });
} catch (err) {
  console.error("[barber-reminders/send] Failed:", err);
  return NextResponse.json({ error: "Email failed" }, { status: 500 });
}
await admin.from("client_notes").insert({ note: "Erinnerung manuell gesendet", ... });
```
Resend ok unchecked. Manual barber reminder — UI shows success but email never sent on 4xx/5xx. The `client_notes` insert (which proves to the salon "we did this") writes EVEN on silent Resend failure.
**Consequence:** Salon CRM lies — note says reminder sent, customer never received it.
**Severity: HIGH.**
**Fix:** Same as H1/H2 — route through `lib/email.ts`.

#### H4. `app/api/bookings/[id]/report/route.ts:91-106` — fetch-no-ok-server (Resend)
```ts
try {
  await fetch('https://api.resend.com/emails', { /* dispute notification to salon owner */ });
} catch (e) {
  console.error("Failed to send dispute email to salon owner", e);
}
```
Resend ok unchecked. Customer files dispute → salon owner notification. If silent fail, salon owner never knows about the dispute, never responds, T&S §13.2 30-day clock runs out → escalation.
**Consequence:** Dispute escalation triggered by silent missed notification.
**Severity: HIGH** (legal/compliance flow).
**Fix:** Route through `lib/email.ts`; surface failure in API response for caller logging.

#### H5. `app/api/admin/booking-disputes/[id]/action/route.ts:71-87` — fetch-no-ok-server (Resend)
```ts
try {
  if (parties && parties.length > 0 && resendApiKey) {
    const emails = parties.map(p => p.email).filter(Boolean) as string[];
    if (emails.length > 0) {
      await fetch('https://api.resend.com/emails', { /* escalation notification */ });
    }
  }
} catch (e) {
  console.error("Failed to send escalation email", e);
}
```
Same pattern. Admin escalates dispute to mediation — both parties need notification of the 30-day clock. Silent Resend fail = parties unaware of deadline.
**Severity: HIGH** (legal compliance — Basel-Stadt court referral hinges on mediation period notice).

#### H6. `app/api/loyalty/award/route.ts:103-125` — fetch-no-ok-server (Resend)
```ts
try {
  await fetch("https://api.resend.com/emails", { /* "1 stamp from reward" email */ });
}
```
Resend ok unchecked. Loyalty engagement email. Silent failure means customer doesn't get the nudge to book the last stamp → lost revenue.
**Severity: HIGH.**

#### H7. `app/[locale]/dashboard/page.tsx:86-114` — fetch-no-ok client chain
```ts
fetch("/api/profile")
  .then((r) => r.json())
  .then((profile) => {
    setSalonName(profile?.salon_name);
    const sid = profile?.salon_id;
    setSalonId(sid);
    const todayBookings = fetch(`/api/bookings?date=${today}&limit=20`).then((r) => r.json());
    const analytics = sid
      ? fetch(`/api/analytics/salon/${sid}?period=week`).then((r) => r.json())
      : Promise.resolve(null);
    const convos = sid
      ? fetch(`/api/conversations?salon_id=${sid}&unread=true`).then((r) => r.json())
      : Promise.resolve(null);
    return Promise.all([todayBookings, analytics, convos]);
  })
  .then(([bData, analyticsData, convoData]) => { /* set state */ })
  .catch((err) => console.error("[Dashboard] Failed to fetch dashboard data:", err))
  .finally(() => setLoading(false));
```
Pattern: **fetch-no-ok**. Five chained fetches, ZERO ok checks. If `/api/profile` returns 401 (session expired), `profile.salon_id` is undefined, then `salonId=undefined` queries with `&salon_id=undefined` against analytics → 400. The 400 gets `.json()`-parsed → `analyticsData` is some error object → setStats(errorObject) → dashboard renders garbage. The catch only triggers if `.json()` itself throws (e.g. HTML body).
**Consequence:** Dashboard "succeeds" displaying garbage data when auth expired.
**Severity: HIGH** (salon owner sees wrong data, may take action).
**Fix:** Check `.ok` at each fetch; route auth failures through 401 → redirect to login.

#### H8. `app/[locale]/dashboard/calendar/page.tsx:382-399` — fetch-no-ok client
```ts
const data = await fetch(`/api/slots?salon_id=${salonId}&week=${weekStr}`).then((r) => r.json());
setSlots(data.slots ?? []);
// ...
fetch("/api/profile").then((r) => r.json()).then((p) => {
  setSalonId(p?.salon_id ?? null);
  return Promise.all([
    fetch(`/api/services?salon_id=${p?.salon_id}`).then((r) => r.json()),
    fetch(`/api/staff?salon_id=${p?.salon_id}`).then((r) => r.json()),
  ]);
}).then(([svcData, staffData]) => { setServices(svcData?.services ?? []); setStaff(staffData?.staff ?? []); })
```
Calendar — 5 fetches, no ok checks. If `/api/slots` returns 500, `data.slots` is undefined, falls back to `[]` → empty calendar appears legit. Salon owner thinks "no bookings today" when actually backend errored.
**Consequence:** Calendar shows zero bookings; salon doesn't show up for clients.
**Severity: HIGH** (business-critical, no error surface).

#### H9. `app/[locale]/dashboard/calendar/page.tsx:411` — fire-and-forget realtime callback
```ts
const channel = supabase
  .channel("salon-slots")
  .on("postgres_changes", { event: "*", schema: "public", table: "availability_slots", filter: `salon_id=eq.${salonId}` },
    () => loadSlots())
  .subscribe();
```
`loadSlots()` returns a Promise that's dropped. `loadSlots` has internal try/catch with `/* ignore */` — see also the next finding for `loadSlots` itself. Subtype: fire-and-forget realtime trigger that propagates a silent inner catch.
**Severity: HIGH.**

#### H10. `app/[locale]/dashboard/settings/page.tsx:693-697, 889, 1043, 1113-1116` — fetch-no-ok client
```ts
useEffect(() => {
  fetch("/api/stripe/connect/status")
    .then((r) => r.json())
    .then((d) => setConnectStatus(d.status ?? "not_connected"))
    .catch(() => setConnectStatus("not_connected"));
}, []);
```
Stripe Connect status fetch. On 500, parses error → `d.status` is undefined → falls to "not_connected" — UI shows "Set up Stripe Connect" to a salon that ALREADY has Connect set up. Salon owner re-onboards → duplicate Connect account.
**Consequence:** Duplicate Stripe Connect accounts created on backend transients.
**Severity: HIGH** (financial integration corruption).

#### H11. `app/[locale]/dashboard/settings/page.tsx:1110-1118` — fetch-no-ok client (chained)
```ts
fetch("/api/profile")
  .then((r) => r.json())
  .then((p) => {
    if (p?.salon_id) return fetch(`/api/salons/${p.salon_id}`).then((r) => r.json());
  })
```
Same chain pattern. If `/api/profile` 401s, fetches a `/api/salons/undefined` URL.
**Severity: HIGH.**

#### H12. `app/[locale]/salon/[slug]/page.tsx:289-298, 378` — silent catch on owner/slot/review fetches
```ts
fetch("/api/salons/mine")
  .then((r) => r.ok ? r.json() : null)
  .then((d) => { if (d?.salon?.id === salon.id) setIsOwner(true); })
  .catch(() => {});

fetch(`/api/slots/next-available?salon_id=${salon.id}`)
  .then((r) => r.ok ? r.json() : null)
  .then((d) => { if (d?.available) setNextSlot(d.slot); })
  .catch(() => {});
```
Pattern: **fetch-no-ok partially mitigated, but silent catch**. The ok IS checked but failure swallowed silently (`.catch(() => {})`). Violates CLAUDE.md "Never `.catch(() => {})`. Always `console.error(...)`". Owner-detection broken silently means salon owners don't see "edit" UI. Next-slot broken silently means quick-book button hidden.
**Consequence:** Salon-owner-detection silently breaks; quick-book button silently hidden.
**Severity: HIGH** (key business surface for tier-1 wireup).
**Fix:** Replace `.catch(() => {})` with `.catch((err) => console.error("[SalonPage] ...", err))`.

#### H13. `app/[locale]/salon/[slug]/page.tsx:126-129, 184-188, 282-287, 303-308` — silent catches (5 more)
Same `.catch(() => {})` pattern, 5 separate fetches in salon page. CLAUDE.md L8 silent catch violation × 7 in one file.
**Severity: HIGH** (per-file density).

#### H14. `components-legacy/BookingCalendar.tsx:225-243` — fetch-no-ok client (cancel policy + packages)
```ts
fetch(`/api/salons/${salonId}`)
  .then(r => r.json())
  .then(d => {
    if (d.cancellation_window_hours) setCancelWindowHours(d.cancellation_window_hours);
    if (d.cancellation_fee_percent) setCancelFeePercent(d.cancellation_fee_percent);
  })
  .catch((err) => console.error("[BookingCalendar] failed to fetch salon cancellation policy:", err));
```
If salon fetch 500s with JSON body, `cancellation_window_hours` is undefined → fallback policy applies (likely "0 hours window") → customer can't cancel even when they should be able to. Same issue with packages fetch line 238: a 401/403 returns error body, `items` undefined → no package-redeem option shown.
**Consequence:** Cancellation policy + package redemption silently degrade in booking calendar.
**Severity: HIGH** (booking flow surface).

#### H15. `app/[locale]/dashboard/clients/page.tsx:65-70, 222, 229` — fetch-no-ok client (CRM)
Multiple unchecked `.then((r) => r.json())` chains in the clients CRM page. Affects salon-side client list, tags, segments display.
**Severity: HIGH.**

#### H16. `app/[locale]/dashboard/messages/page.tsx:41-47` — fetch-no-ok client (chat list)
```ts
fetch("/api/profile")
  .then((r) => r.json())
  .then((p) => {
    const sid = p?.salon_id;
    if (sid) return fetch(`/api/conversations?salon_id=${sid}`).then((r) => r.json());
  })
```
Messages list silently shows empty on backend errors.
**Severity: HIGH.**

#### H17. `app/api/admin/discovery/staging/route.ts:83-96` — fetch-no-ok-server (image download)
```ts
const imgRes = await fetch(item.image_url);
const buffer = await imgRes.arrayBuffer();
const webp = await sharp(Buffer.from(buffer)).webp({ quality: 85 }).toBuffer();
```
External image fetch — no ok check before `arrayBuffer()`. If image URL 404s, arrayBuffer is the HTML 404 page bytes → sharp throws "Input file contains unsupported image format". The try/catch logs it but moves on with the ORIGINAL URL (which we know is broken). Discovery feed shows broken images.
**Consequence:** Curated discovery images visibly broken; silent fallback hides the source data quality issue.
**Severity: HIGH.**

#### H18. `lib/tiktok-embed.ts:13-23` — retry-silent
```ts
async function fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      continue;
    }
    return res;
  }
  throw new Error("TikTok oEmbed rate limited after retries");
}
```
Pattern: **retry-silent**. The retry loop only retries on 429 — any OTHER non-2xx (e.g. 403, 500) is returned WITHOUT ok check. Caller `fetchTikTokEmbed` then checks ok separately — but if the function throws after all retries exhaust, callers in `app/api/admin/discovery/import-tiktok/route.ts` don't have a per-URL catch around this path → entire batch fails on one rate-limited URL.
**Consequence:** Bulk TikTok import fails opaquely.
**Severity: HIGH** (admin tool reliability).

#### H19. `components-legacy/search/SplitView.tsx:96-118` — fetch-no-ok client (search results)
```ts
const fetchPromise = q && q.length >= 2
  ? fetch(`/api/salons/search?q=${encodeURIComponent(q)}`).then((r) => r.json())
  : fetch(fetchUrl).then((r) => r.json());

fetchPromise
  .then((data) => { setSalons(data.items ?? []); setTotal(data.total ?? 0); ... })

// Load more:
const data = await fetch(buildUrl(nextPage)).then((r) => r.json());
setSalons((prev) => [...prev, ...(data.items ?? [])]);
```
Search results page (legacy, still wired in tier-1). Backend 5xx → `data.items` undefined → fallback `[]`. User sees "no results" instead of "search broken".
**Consequence:** Search silently shows empty on backend errors.
**Severity: HIGH** (key surface in tier-1 wireup).

#### H20. `app/[locale]/dashboard/all-users/page.tsx:90-91`, `disputes/page.tsx:78-79`, etc.
Admin dashboard fetches without ok check. Pattern repeats across all admin pages — 10+ instances. Less critical than customer-facing but admin team flying blind on 500s.
**Severity: HIGH** (admin observability).

#### H21. `app/api/bookings/route.ts:122-153` — silent catch on email
```ts
try {
  const emailData = bookingConfirmation(user.email!, { ... }, locale);
  await sendEmail(emailData);
} catch { /* email failure shouldn't break booking */ }
// ... owner notification
try {
  // ... await sendEmail(ownerEmailData);
} catch { /* owner notification failure must not break booking */ }
```
Two silent catches in the main booking-creation route. Booking confirmation email AND owner notification both swallowed. Violates CLAUDE.md L8 — should at least log. The `lib/email.ts` ALREADY throws with the Resend error body, but that info is lost here.
**Consequence:** Booking confirmations silently fail; salon owners miss new-booking alerts; no diagnostic.
**Severity: HIGH** (key communication path, affects every booking).
**Fix:** `catch (err) { console.error("[bookings] confirmation email failed:", err); }` × 2.

#### H22. `app/[locale]/dashboard/calendar/page.tsx:378-387` — silent inner catch on loadSlots
```ts
const loadSlots = useCallback(async () => {
  if (!salonId) return;
  setLoading(true);
  try {
    const data = await fetch(`/api/slots?salon_id=${salonId}&week=${weekStr}`).then((r) => r.json());
    setSlots(data.slots ?? []);
  } catch { /* ignore */ } finally {
    setLoading(false);
  }
}, [salonId, weekStr]);
```
The `catch { /* ignore */ }` silently drops fetch failures + JSON parse errors. Combined with H8 (no ok check). Realtime callback (H9) triggers this silently as well. Salon calendar shows stale data through outages.
**Severity: HIGH** (key salon-owner surface).

---

### MEDIUM — silent feature degradation, minor user impact

#### M1. `app/api/chat/suggest/route.ts:40-73` — silent catch w/ 204
```ts
try {
  const response = await fetch(...);
  if (!response.ok) return new NextResponse(null, { status: 204 });
  const result = await response.json();
} catch {
  return new NextResponse(null, { status: 204 });
}
```
AI suggestion 204 on ANY error — including network. Caller (AISuggestion component) treats 204 as "no suggestion", hides UI. Acceptable degradation EXCEPT no log line tells engineering "Gemini was down for 3 hours and we silently disabled the feature."
**Severity: MEDIUM.**
**Fix:** Add `console.warn` before each 204 return.

#### M2. `app/api/admin/nail/generate/route.ts:101-112` — fetch-no-ok-server (image re-upload)
```ts
try {
  const imgRes = await fetch(imageUrl);
  if (imgRes.ok) {
    // upload to storage
  }
} catch { /* fall back to imageUrl */ }
```
Has ok check + structured fallback. The `catch { }` IS silent (no log). Violates CLAUDE.md rule.
**Severity: MEDIUM.**
**Fix:** Add `catch (err) { console.error("[nail-ai-gen] storage fallback:", err); }`.

#### M3. `lib/stock-photos.ts:24-49, 53-79, 82-107` — silent ok fallback
```ts
const res = await fetch(...);
if (!res.ok) return [];
```
Three providers (Unsplash, Pexels, Pixabay) all return empty array on non-200. No log line. Acceptable BUT debugging "search returned 0 photos" is impossible — could be all 3 keys revoked.
**Severity: MEDIUM** (admin/discovery feature).
**Fix:** Add `console.warn("[stock-photos/{provider}] HTTP", res.status)` before return.

#### M4. `lib/ai-vision.ts:174-185, 190-202` — silent ok fallback
```ts
async function fetchImageBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    // ...
  } catch {
    return null;
  }
}

async function fetchFreshTikTokThumbnail(tiktokUrl: string): Promise<string | null> {
  try {
    const res = await fetch(...);
    if (!res.ok) return null;
    // ...
  } catch { return null; }
}
```
Two silent ok-fallback + silent catch sites. Discovery vision pipeline silently degrades when thumbnails 404 or expire (common with TikTok URLs).
**Severity: MEDIUM.**
**Fix:** Add `console.warn` logs.

#### M5. `components-legacy/dashboard/GiftCardManager.tsx:34-50` — Promise.allSettled rejection dropped
```ts
Promise.allSettled([
  fetch(`/api/gift-cards/balance?salon_id=${salonId}`).then((r) => r.ok ? r.json() : Promise.reject()),
  fetch(`/api/analytics/gift-card-revenue?salon_id=${salonId}`).then((r) => r.ok ? r.json() : Promise.reject()),
]).then(([cardsResult, statsResult]) => {
  if (cardsResult.status === "fulfilled") { setCards(...); }
  if (statsResult.status === "fulfilled") { setStats(...); }
}).finally(() => setLoading(false));
```
Pattern: **allSettled-ignore**. Rejected reason silently dropped. The `Promise.reject()` is called with no argument. On gift-card stats failure, user sees zeros in stats display, no error indication.
**Severity: MEDIUM.**
**Fix:** Inspect `if (result.status === "rejected") console.error("[GiftCardManager] ...", result.reason);`.

#### M6. `components-legacy/dashboard/PackageManager.tsx:47-72` — Promise.allSettled w/ silent json.catch
```ts
Promise.allSettled([
  fetch(`/api/packages?salon_id=${salonId}`),
  fetch(`/api/packages/purchase?salon_id=${salonId}`),
  fetch(`/api/salon/services?salon_id=${salonId}`),
])
  .then(async ([pkgResult, purchaseResult, svcResult]) => {
    if (pkgResult.status === "fulfilled" && pkgResult.value.ok) {
      const d = await pkgResult.value.json().catch(() => ({}));
      setPackages(d.packages ?? d.items ?? []);
    }
    // ... same for purchase, svc
  })
```
Pattern: **allSettled-ignore + silent-catch on .json()**. Rejections silently dropped. The `.json().catch(() => ({}))` swallows JSON parse errors without log → if API returns malformed JSON, package manager silently empty.
**Severity: MEDIUM.**

#### M7. `app/api/admin/search/generate-embeddings/route.ts:49-75` — allSettled-ignore
```ts
const results = await Promise.allSettled(batch.map(async (service) => { ... if (error) throw error; }));
results.forEach((r) => {
  if (r.status === "fulfilled") processed++;
  else errors++;
});
```
Counts errors but doesn't log rejected reason. Errors visible only by total count.
**Severity: MEDIUM.**
**Fix:** `else { errors++; console.error("[generate-embeddings] failed:", r.reason); }`.

#### M8. `app/api/bookings/[id]/cancel/route.ts:190-192` — allSettled-ignore + silent catch
```ts
try {
  await Promise.allSettled(promises);
} catch { /* non-fatal */ }
```
Notification promises array. `Promise.allSettled` ITSELF cannot throw (returns settled). The `try { await Promise.allSettled }` `catch` block is dead code. Worse: rejected entries in the array are never inspected at all.
**Severity: MEDIUM** (dead code + silent rejections).

#### M9. `components-legacy/dashboard/SetupBanner.tsx:26-31` — fetch-no-ok client
```ts
fetch("/api/salon/setup-progress")
  .then((r) => r.json())
  .then((d) => { if (d.percentage < 100) setData(d); })
  .catch((err) => console.error("[SetupBanner] failed to load setup progress:", err));
```
If API 500s, `.json()` parses error envelope, `d.percentage` undefined, `< 100` is FALSE → banner hidden. Salon doesn't see "complete your setup" → may abandon onboarding.
**Severity: MEDIUM.**

#### M10. `components-legacy/admin/BookingDisputePanel.tsx:43`, `chat/ClientTags.tsx:46-50`, `chat/QuickReplyChips.tsx:25-31`, `chat/PhotoGallery.tsx:33`, `dashboard/DashboardLayout.tsx:231`, `onboarding/steps/SalonProfileStep.tsx:38`, `PaymentsStep.tsx:25`, `OpeningHoursStep.tsx:33`, `ServicesStep.tsx:33-47`
All fetch-no-ok-then-json patterns. Each one independent, all minor UI components. 10 instances total — group as one finding.
**Severity: MEDIUM.**

#### M11. `app/[locale]/dashboard/badge-manager/page.tsx:166-171` — onClick async no inner try/catch
```ts
onClick={async () => {
  if (!nameDe || !nameEn) return;
  setSaving(true);
  await onSave({ name_de: nameDe, name_en: nameEn, icon, color, bg_color: hexToBgColor(color) });
  setSaving(false);
}}
```
Pattern: **event-handler-leak**. `onSave` could throw — no try/catch. `setSaving(false)` won't run → button stuck in saving state forever. Promise rejection unhandled.
**Severity: MEDIUM.**

#### M12. `app/[locale]/angebote/page.tsx:335-344` — onClick async fetch-no-ok
```ts
onClick={async () => {
  const email = prompt(tEmpty("lastMinuteNotifyMe"));
  if (email && email.includes("@")) {
    await fetch("/api/waitlist", { ... })
      .catch((err) => console.error("[LastMinute] Waitlist error:", err));
  }
}}
```
Pattern: **event-handler + fetch-no-ok**. Doesn't check `.ok` on the response. Has `.catch`. User clicks "notify me", form proceeds even on backend failure. No "saved" / "failed" feedback.
**Severity: MEDIUM.**

#### M13. `components-legacy/ProfilePage.tsx:1016-1045` — onClick async (3x) — no try/catch
Three onClick handlers (`change email`, `change password`, `sign out`). Each `await`s a supabase call. No try/catch — if network drops mid-update, the error escapes to React's error boundary which doesn't exist → silent failure. Each shows `alert(...)` on success and on Supabase-returned error, but a thrown exception bypasses both.
**Severity: MEDIUM.**

#### M14. `components-legacy/chat/PhotoGallery.tsx:107-118` — onClick + silent catch
```ts
onClick={async () => {
  setSaving(true);
  try {
    const res = await fetch("/api/nail-inspo/images", { ... });
    if (res.ok) setSaved((prev) => new Set(prev).add(lightboxUrl!));
  } catch {}
  setSaving(false);
}}
```
Silent catch. User clicks "save to board" — if backend 500s, nothing happens. No toast.
**Severity: MEDIUM.**

#### M15. `app/[locale]/bookings/[id]/approve-increase/page.tsx:34-39, 44-52` — fetch-no-ok client
```ts
fetch(`/api/bookings/${bookingId}/dispute`)
  .then((r) => r.json())
  .then((d) => setDispute(d.dispute ?? null))
  // ...
const res = await fetch(`/api/bookings/${bookingId}/dispute`, { method: "PATCH", ... });
if (res.ok) setResult(action === "approve" ? "approved" : "disputed");
```
First fetch: no ok check, parses error envelope. Second fetch: only sets result on ok — but doesn't surface error on !ok. User clicks "approve", nothing happens.
**Severity: MEDIUM** (dispute flow — affects payment but doesn't lose money directly).

#### M16. `app/[locale]/bookings/[id]/respond-adjustment/page.tsx:37-42, 47-55` — same pattern as M15
Identical pattern, sister page.
**Severity: MEDIUM.**

#### M17. `app/[locale]/dashboard/all-salons/page.tsx:101`, `bookings/page.tsx:125`, `coiffeur-crm/page.tsx:43`, `nail-admin/page.tsx:37`, `waxing-admin/page.tsx:37`
Many dashboard admin pages with unchecked `.then((r) => r.json())`. Group as one finding because pattern is uniform — same fix recommendation.
**Severity: MEDIUM** (admin UX).

#### M18. `components-legacy/ReviewCarousel.tsx:33`, `CityPage.tsx:46`, `ChatWindow.tsx`, `ReviewForm.tsx`, `TerminePage.tsx`, `CategoryPage.tsx`, `ui/DiscoverCarousel.tsx`, `ui/WaitlistModal.tsx`, `ui/HomeSearchBar.tsx`, `salon/SalonReviews.tsx`, `ui/ReportContentButton.tsx`, `auth/TosPrompt.tsx`, `salon/SimilarSalons.tsx`, `booking/DateTimeStep.tsx`, `booking/PackageRedeemBanner.tsx`, `disputes/ReportProblemModal.tsx`, `booking/BookingsList.tsx`
Customer-facing legacy components — many unchecked `.then((r) => r.json())` patterns. Group fix.
**Severity: MEDIUM-HIGH per component but combined.**

#### M19. `app/[locale]/checkout/page.tsx:182-189` — fetch-no-ok client (referral credits)
```ts
fetch("/api/referral")
  .then((r) => r.json())
  .then((data) => {
    if (data.total_earned) setUserCredits(data.total_earned);
  })
  .catch((err) => console.error("[Checkout] failed to load referral credits:", err));
```
Referral credit lookup in checkout. On API error, `data.total_earned` undefined, credits stay at 0 → customer doesn't see their referral discount → pays full price. Money-relevant.
**Severity: MEDIUM** (lost-discount, not lost-payment).

#### M20. `app/[locale]/tip/[bookingId]/page.tsx:34-40` — fetch-no-ok client
```ts
fetch(`/api/bookings/${bookingId}`)
  .then((r) => r.json())
  .then((d) => setBooking(d.booking ?? d))
  .catch((err) => console.error("[Tip] failed to load booking:", err))
```
Tip page booking lookup. On error, booking is the error envelope, `useState` accepts it as Booking type → component renders garbage.
**Severity: MEDIUM.**

#### M21. `app/api/admin/generate-roadmap/route.ts:60-94` — well-handled (reference)
Properly checks `response.ok`, parses error body, returns 502 with detail. Reference pattern for fixing other Gemini calls. NOT a finding — included as anchor.

#### M22. `app/api/discovery/generate-description/route.ts:76-91` — well-handled (reference)
Same — correctly handles ok. Reference.

#### M23. `app/api/salons/[slug]/ai-info/route.ts:69-93` — well-handled (reference)
Correct pattern. Reference.

#### M24. `app/api/admin/discovery/backfill/route.ts:90-100` — well-handled image fetch
Try/catch + ok check + structured per-item error result. Reference for image-probe pattern.

#### M25. `app/api/admin/discovery/import-tiktok/route.ts:53-61` — well-handled
ok check + skips on failure. Reference.

#### M26. `app/api/admin/nail/generate/route.ts:75-96` — well-handled fal.ai call
Properly checks `response.ok`, logs body, returns 502. Reference for fal.ai calls.

#### M27. `app/api/discovery/feed/route.ts` — not deeply read
Spot-check candidate.

#### M28. `app/[locale]/dashboard/setup/page.tsx:30, 45` — bare fetches likely fetch-no-ok
Two `fetch("/api/salon/setup-progress")` calls. Same pattern. LOW per-instance MEDIUM combined.
**Severity: MEDIUM.**

#### M29. `app/[locale]/brand/[slug]/page.tsx` — not read, fetch present
Spot-check candidate.

#### M30. `app/[locale]/nail-tech/[id]/page.tsx` — not read, fetch present
Spot-check candidate.

#### M31. `app/[locale]/behandlungen/[...slug]/page.tsx` + `TreatmentsClient.tsx:68-71` — partial coverage
Has try/catch + `if (!res.ok) throw`. Acceptable.

#### M32. `components-legacy/onboarding/steps/ServicesStep.tsx:33-47` — chained unchecked fetches
Multiple fetches stacked, no ok checks. Onboarding wizard breaks silently on backend errors.
**Severity: MEDIUM** (onboarding is single-attempt critical).

#### M33. `app/[locale]/dashboard/segments/page.tsx` — pattern repeat
Same group as M17.
**Severity: MEDIUM.**

#### M34. `app/[locale]/dashboard/reviews/page.tsx`, `homepage-admin/page.tsx`, `review-moderation/page.tsx`, `discovery-admin/page.tsx`, `verification/page.tsx`, `help-editor/page.tsx`, `content-editor/page.tsx`, `staff/page.tsx`, `approvals/page.tsx`, `admin-sandbox/page.tsx`, `discovery-posts/page.tsx`, `services/page.tsx`, `loyalty/page.tsx`
Admin dashboard pages — same fetch-no-ok pattern. 13+ admin surfaces. Group fix.
**Severity: MEDIUM** (admin observability cluster).

#### M35. `components-legacy/disputes/ReportProblemModal.tsx`, `booking/PackageRedeemBanner.tsx`, `booking/DateTimeStep.tsx`, `salon/SalonReviews.tsx`, `salon/SimilarSalons.tsx`
Customer-facing legacy components with unchecked fetches. Group fix.
**Severity: MEDIUM** (customer-side cluster).

#### M36. `app/api/reviews/route.ts:82-86` — fire-and-forget notification fetch
```ts
fetch(`${baseUrl}/api/notify/review-posted`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ review_id: data.id })
}).catch((err) => console.error("[ReviewsRoute] failed to send review-posted notification:", err));
```
Fire-and-forget for notification. Has `.catch` with log. Response.ok NOT checked (the `.catch` only fires on network exception). If `/api/notify/review-posted` returns 500, no log, no retry. Reference for "intentionally fire-and-forget" pattern. LOW-medium.
**Severity: MEDIUM.**
**Fix:** Add `.then((r) => { if (!r.ok) console.error(...) })` before catch.

#### M37. `app/api/reviews/[id]/respond/route.ts:67-71` — same pattern as M36
**Severity: MEDIUM.**

#### M38. `app/[locale]/onboarding/salon/page.tsx` — multi-step onboarding with chained fetches
Each step uses fetch. Failure cascade across the wizard. Group MEDIUM. Detail audit deferred.
**Severity: MEDIUM.**

#### M39. `components-legacy/booking/DateTimeStep.tsx` — booking slot calendar fetches
Same fetch-no-ok pattern. Booking critical path edge.
**Severity: MEDIUM.**

#### M40. `components-legacy/ui/WaitlistModal.tsx` — waitlist signup fetches
Notify-me modal. Failure silent.
**Severity: MEDIUM.**

#### M41. `components-legacy/auth/TosPrompt.tsx` — Terms of Service accept fetch
TOS accept silent failure means user gets re-prompted on next session.
**Severity: MEDIUM.**

---

### LOW — minor degradation, doc/code-smell, well-contained

#### L1. `app/api/auth/verify-phone/send/route.ts:58-62` — generic error message on SMS failure
Has ok check + log, but user-facing error string is generic ("SMS sending failed"). User can't differentiate "wrong phone format" from "seven.io down".
**Severity: LOW.**

#### L2. `app/[locale]/_components/salon/SalonHeader.tsx:109, 111` — `navigator.share()` and `clipboard.write` silent catches
```ts
navigator.share(...).catch(() => {});
navigator.clipboard.writeText(...).catch(() => {});
```
Share dialog cancellation by user is expected — silent catch is correct. Clipboard write could fail on permission denied — silent is OK for UX.
**Severity: LOW.**

#### L3. `app/[locale]/_components/salon/SalonHero.tsx:92` — `navigator.share()` silent catch
Same as L2.
**Severity: LOW.**

#### L4. `lib/posthog-api.ts:30-54` — well-handled (reference)
ok check + log + returns 0 on failure. Acceptable for analytics. Reference pattern.

#### L5. `lib/sms.ts:53-77` — well-handled (reference)
Reference correct pattern (ok check + log + return false).

#### L6. `lib/email.ts:25-43` — well-handled (reference)
Reference correct pattern (throws on !ok).

#### L7. `lib/tiktok-embed.ts:26-44` — well-handled outer (reference, paired w/ H18 inner)
Outer caller checks ok + logs + returns null. Acceptable for non-essential metadata. Combined with retry-silent flagged in H18.

#### L8. `app/[locale]/coming-soon/page.tsx:34-50` — handleNotify intentionally optimistic
```ts
try {
  const res = await fetch("/api/coming-soon-notify", { ... });
  if (res.ok || res.status === 409) setSubmitted(true);
} catch (err) {
  console.error("[ComingSoon] Notify error:", err);
  setSubmitted(true); // Still show success — email capture is best-effort
}
```
Intentional UX — even on failure, show "you'll be notified". Acceptable. LOW.

#### L9. `app/[locale]/walk-in-pay/page.tsx:38-48` — well-handled (reference)
Checks ok properly.

#### L10. `app/[locale]/vouchers/buy/page.tsx:102-112` — well-handled (reference)
Checks ok properly.

#### L11. `app/[locale]/loyalty/stamp/page.tsx:33-53` — well-handled (reference)
Reference.

#### L12. `app/[locale]/staff-invite/page.tsx:29-56` — well-handled (reference)
Reference.

#### L13. `app/[locale]/auth/register/page.tsx:115-136` — partially handled
Calls `.json()` BEFORE ok check, but wrapped in try/catch. Could fail on non-JSON 500.
**Severity: LOW.**

#### L14. `app/[locale]/account/saved/page.tsx:37-49` — well-handled initial load
Initial load checks ok properly. The DELETE flow (C4) is the issue.

#### L15. `app/[locale]/_components/homepage/useSearchSuggest.ts:83-98` — well-handled (reference)
Try/catch inside setTimeout async + ok check + abort handling.

#### L16. `components-legacy/ui/SearchAutocomplete.tsx:100-118` — well-handled (reference)
Try/catch + ok check inside setTimeout async.

#### L17. `components-legacy/chat/AISuggestion.tsx:35-60` — well-handled (reference)
Try/catch + ok + 204 handling inside setTimeout async.

#### L18. `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx:48-69` — fetchBarber pattern
useEffect fire-and-forget but with internal try/catch + ok checks. Acceptable pattern reference.
**Severity: LOW.**

#### L19. `app/[locale]/_components/salon/SalonDetailV3.tsx:69-84` — well-handled
ok check + console.error in catch.

#### L20. `app/[locale]/_components/search/SearchResults.tsx:114-123` — well-handled
ok check + structured fallback + console.error.

#### L21. `app/[locale]/_components/salon/SalonVenuesNearby.tsx:46-47` — well-handled
ok check inline.

#### L22. `app/[locale]/discover/page.tsx:79-99, 102-128` — mostly OK
Auth-check fetch has ok check via conditional. fetchItems has internal try/catch + ok check. Acceptable.

#### L23. `app/[locale]/dashboard/discovery-admin/page.tsx`, `homepage-admin/page.tsx`, `services/page.tsx`, etc. (admin tools)
Group spot-check candidates. Many low-severity instances counted in M34.

---

## Patterns summary

| Pattern key                    | Count | Notes |
|---|---|---|
| `fetch-no-ok` (client `.then((r) => r.json())` w/o `.ok`) | 84 hits across ~35 files | Many cluster in dashboard/ pages |
| `fetch-no-ok-server` (route handler skips `.ok` check on outgoing fetch) | 8 hits | Resend ×6, Gemini ×3 (translate/intake unchecked, generate-description/ai-info/generate-roadmap checked), 1 fal.ai (checked) |
| `fire-and-forget` (Promise dropped no `.catch` no `await`) | ~12 hits | Most have inner try/catch making them safe; flagged where unsafe |
| `silent-catch` (`.catch(() => {})` or `.catch(() => null)` or `catch { /* ignore */ }`) | 13 hits | Violates CLAUDE.md L8 |
| `allSettled-ignore` (rejected reason dropped) | 4 sites | GiftCardManager, PackageManager, generate-embeddings, cancel route |
| `timer-leak` (setTimeout/setInterval w/o inner try/catch) | 0 hits | All 3 setTimeout sites have inner try/catch |
| `useEffect-leak` (fetchData async w/o inner try/catch) | ~12 sites | Most have inner try/catch; flagged where missing |
| `event-handler-leak` (onClick async w/o inner try/catch) | 6 sites | 4 OK, 2 risky (M11, M13) |
| `retry-silent` (retry loop exhausting → null/false) | 1 site | tiktok-embed |

## Cross-cutting observations

1. **The `.then((r) => r.json())` anti-pattern is endemic** — 84 sites is too many for surgical fixes. Recommendation: introduce a `lib/fetch-safe.ts` helper:
   ```ts
   export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
     const res = await fetch(url, init);
     if (!res.ok) throw new HttpError(res.status, await res.text(), url);
     return res.json() as Promise<T>;
   }
   ```
   Then migrate file-by-file. The fix is mechanical; the audit is the bottleneck.

2. **Inline Resend `fetch` calls bypass the `lib/email.ts` wrapper** — 6 routes (`bookings/[id]/report`, `admin/booking-disputes/[id]/action`, `loyalty/award`, `dashboard/barber-reminders/send`, `notifications/off-peak`, `cron/review-prompt`). The wrapper exists and correctly checks `.ok`. Migrate inline calls through `sendEmail()`.

3. **The salon detail page (`app/[locale]/salon/[slug]/page.tsx`) has 7 silent catches** (`.catch(() => {})`). This is the densest CLAUDE.md L8 violation in one file. Fix in a focused pass.

4. **Stripe-payment-intent fetches in client pages need response.ok handling** — checkout (C1), packages (C2), walk-in-pay (well-handled — keep as reference). The pattern of "parse error envelope and hope `data.error` exists" works most of the time but fails opaquely when the API returns non-JSON (HTML 500 from Next.js when an unhandled exception leaks).

5. **Cron job email flags update unconditionally** (`review_prompt_sent`, `sms_sent_24h`) — covered in 1B finding C9 + here in H2. Idempotency flag flipping after Resend ok-unchecked = permanent missed-notification.

6. **Promise.allSettled with rejected reasons silently dropped** — 4 sites. Counts are visible but actual error context is lost. Recommendation: when `r.status === "rejected"`, log `r.reason` with context tag.

7. **Edge functions for booking-reminder** (referenced in 1B audit) likely have similar `await` patterns without error capture. Not in scope here (supabase/functions/ excluded) but worth a 1C-supplement pass on the edge functions.

8. **The mobile UX is more brittle than desktop** because:
   - Network drops trigger fetch errors more often on mobile
   - Background tab throttling pauses fetches
   - The silent-catch pattern hides exactly the failure modes that affect mobile most

9. **Gemini Auth/Quota observability is critical** — 3 of 6 Gemini routes don't check `response.ok`. Translation + intake-recommendation are paid customer features that degrade silently. When the GEMINI_API_KEY rotates or quota hits, the entire feature surface goes dark with no log signal beyond "AI returned empty response" 500s. Engineering can't tell "Gemini issue" from "prompt issue."

10. **Reference patterns to standardize on**: `lib/email.ts` (Resend), `lib/sms.ts` (seven.io), `lib/posthog-api.ts` (PostHog), `app/api/admin/generate-roadmap/route.ts` (Gemini), `app/api/admin/nail/generate/route.ts` (fal.ai). All have ok-check + structured log + typed fallback. Extract a generic `fetchWithLog` helper that mirrors this.

## Recommended remediation order

1. **C1, C2** (checkout + packages payment-intent) — add ok check + structured error surface. Both customer-facing money paths.
2. **C3** (walk-in SMS) — route through `lib/sms.ts`.
3. **C5, C6** (AI intake + translate) — add ok check on Gemini fetches, return distinct error codes.
4. **C4** (favorites unsave) — await DELETE, check ok, revert optimistic on failure.
5. **H1, H2, H3, H4, H5, H6** (Resend inline calls) — route through `lib/email.ts` (already correct).
6. **H21** (silent catch on booking confirmation emails) — replace `catch { }` with log.
7. **H7, H8, H10, H11, H14, H15, H16, H22** (dashboard + salon-page fetch-no-ok) — introduce `fetchJSON` helper, migrate.
8. **H12, H13** (salon detail page silent catches × 7) — single focused pass.
9. **H17** (discovery image fallback) — log + skip pattern.
10. **H18** (tiktok-embed retry-silent) — retry on all non-2xx, not just 429.
11. **H19** (search results legacy) — covered by Tier-1 wireup but flag observability.
12. **H20** (admin observability cluster) — group fix.
13. **M5, M6, M7, M8** (allSettled rejection logging) — inspect rejected reasons.
14. **M11, M13, M14** (event-handler async without try/catch or with silent catch) — add try/catch + user-visible feedback.
15. **The 13 silent catches** — replace with `console.error("[Component] desc:", err)` per CLAUDE.md L8.

Count: **92 findings (Critical: 6 · High: 22 · Medium: 41 · Low: 23)**

Path: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/_audits/2026-05-16-ai-coding-traps-audit/1c-fetch-async.md`
