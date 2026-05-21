# Topic 1D — UI Defaults Masking Errors Audit
Date: 2026-05-16
Agent: 1D
Scope: ErrorBoundary returning null, default-fallback masking, blank-screen patterns
Stack: Next.js 15 App Router · TypeScript (strict) · Tailwind · Supabase · Stripe

## Summary
- **Total findings: 41** (CRITICAL: 3 | HIGH: 15 | MEDIUM: 18 | LOW: 5)
- Original pass: 28 findings (HIGH 9 · MEDIUM 14 · LOW 5) — sections H1-L5 below
- Extension pass: 13 additional findings (CRITICAL 3 · HIGH 6 · MEDIUM 4) — sections E1-E13 below (after the original LOW section)
- Files scanned: ~940 .ts/.tsx files under `app/`, `components-legacy/`, `lib/`, `components/`, `hooks/`
- Files with empty `catch {}` blocks: 164 (sample of ~60 reviewed in depth)
- React ErrorBoundary components in repo: **ZERO** (no class-based or hook-based error boundaries detected — this is a finding in itself, see Pattern Observations)
- Optional-chain 3+ depth: **1** instance (`d?.salon?.categories?.join` defaulting to `"hair"` — LOW)

The dominant pattern is fetch-based silent failure rather than React ErrorBoundary masking. Recurring failure modes: (a) optimistic UI updates committed without checking server response; (b) `if (!res.ok) return;` after POST without surfacing the error; (c) catch-all `catch {}` with no toast/state/log; (d) cookie-parse errors silently downgrading authenticated users to anonymous.

---

## Findings by severity

### HIGH (9)

#### H1 · Auth session silently dropped on cookie parse failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/supabase.ts:12-17`
```ts
let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
try {
  cookieStore = await cookies();
} catch {
  // Fall through — cookieStore stays null, auth will be anonymous
}
```
The Server Component Supabase client silently swallows ANY cookie parse error and treats the request as anonymous. No console.error, no Sentry hook. When a valid session JWT contains a character the cookie parser rejects (a known cause per the comment 2 lines above), the user gets logged-out UI with no indication of why. This is the dominant cause of "I was logged in, why am I seeing the guest view" complaints, and the silent path makes it impossible to debug from logs.

#### H2 · Booking cancel fires success callback even when API failed
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/ProfilePage.tsx:80-90`
```ts
try {
  await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST", ... });
  onCancelled(bookingId);  // marks UI as cancelled — runs even on res.status === 500
  onClose();
} catch { /* ignore */ } finally {
  setLoading(false);
}
```
No `if (!res.ok)` check. `onCancelled(bookingId)` runs after the fetch resolves regardless of HTTP status. The booking is marked cancelled in local React state even when the server kept it as confirmed. User shows up to the salon, salon has them as a no-show. Data integrity issue. Note: the sibling `TerminePage.tsx:58-78` cancel handler is correct (sets `cancelError` state). The legacy `/profile` page still uses the broken `ProfilePage.tsx` (verified via `app/[locale]/profile/page.tsx:1`).

#### H3 · ChatWindow text-message send silently retracts on failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/ChatWindow.tsx:174-184`
```ts
try {
  await fetch(`/api/conversations/${conversationId}/messages`, { method: "POST", ... });
} catch {
  setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
} finally { setSending(false); }
```
No `if (!res.ok)` check (so a 500 response with JSON body keeps the optimistic message displayed but it never persisted). On network error, the optimistic message vanishes with no toast. Image-upload sibling at line 220 handles this correctly with a toast — the text path is the broken one.

#### H4 · Search results page hides server errors as "0 results"
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/_components/search/SearchResults.tsx:114-127`
```ts
fetch(url, { signal: ac.signal })
  .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
  .then((d) => { setSalons(d.items ?? []); ... })
  .catch((err) => { if (err?.name !== "AbortError") { ...setError(...) } });
```
The `r.ok ? r.json() : { items: [], total: 0 }` branch converts every server error (500, 404, 403) into a "0 search results" empty-state. User sees "Suche fehlgeschlagen" only on network-level errors; backend bugs masquerade as "no salons match your query." This is the V3 customer-facing search page — the highest-traffic surface.

#### H5 · Treatments search page same pattern as H4
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/behandlungen/[...slug]/TreatmentsClient.tsx:67-77`
```ts
try {
  const res = await fetch(`/api/search/treatments?${params.toString()}`);
  const data = await res.json();
  setSalons(data.items ?? []);
  setTotal(data.total ?? 0);
} catch { setSalons([]); } finally { setLoading(false); }
```
No `if (!res.ok)`. 500 response with JSON body → `data.items` undefined → "no treatments available." Catch handles network only. Same UX failure as H4 on a different surface.

#### H6 · Salon detail page returns 404 UI on server error
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/salon/[slug]/page.tsx:274-279, 324-336`
```ts
fetch(`/api/salons/${slug}`)
  .then((r) => r.ok ? r.json() : null)
  .then((d) => { if (d) setSalon(d); setLoading(false); })
  .catch(() => setLoading(false));
...
if (!salon) { return <404 page>; }
```
Any backend error → `salon` stays null → user sees "Salon nicht gefunden / 404." Cannot distinguish "this slug doesn't exist" from "Supabase RLS dropped the join." No logging on either branch. The customer thinks the salon left the platform; the salon owner thinks Solen is broken.

#### H7 · IntakeFormTab clinical form submission silently swallows errors
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/IntakeFormTab.tsx:56-74`
```ts
const handleSave = async () => {
  setSaving(true);
  try {
    const res = await fetch(`/api/clients/${customerId}/intake`, { method: "POST", ... });
    if (res.ok) { ...setHistory, close form, reset... }
    // no else branch — failure path silent
  } catch { /* ignore */ } finally { setSaving(false); }
};
```
Both the `!res.ok` and the catch path are silent. Salon staff submit client intake (allergies, sensitivities, hair history), see spinner stop, no toast — they don't know whether it saved. Clinical-data integrity issue.

#### H8 · Sensitivity log (waxing) silently swallows submission errors
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/waxing/SensitivityLog.tsx:68-102`
```ts
const handleSubmit = async () => {
  setSaving(true);
  try {
    const res = await fetch("/api/dashboard/waxing/sensitivity", { method: "POST", ... });
    if (res.ok) { ...append entry, reset form... }
  } catch {}
  setSaving(false);
};
```
Same `if (res.ok)`-only pattern with no else and empty catch. Sensitivity-reaction tracking (severe reactions, medications, sun-exposure history) silently lost on any failure. Compliance / clinical-safety concern.

#### H9 · Report-content button silently fails
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/discovery/ReportButton.tsx:26-37`
```ts
const res = await fetch(endpoint, { method: "POST", ... });
if (!res.ok) return;
setReported(true);
} catch {
  // Silent
}
```
User clicks "Report this content" for moderation, both error paths swallow silently. UI doesn't change — user thinks click was ignored. Trust/safety regression: failed reports leak into the platform.

### MEDIUM (14)

#### M1 · BodyZoneSelector preferences save fails silently
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/waxing/BodyZoneSelector.tsx:113-128`
Save handler is `try { await fetch(...) } catch {}` — no `res.ok` check, no error toast. Customer zone preferences silently dropped.

#### M2 · `feature-flags.ts` silent fail-open on maintenance-mode check
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/feature-flags.ts:13-41`
```ts
} catch {
  // Fail open — if admin client can't be created (e.g. missing service role key), allow the feature
  return null;
}
```
Intentional fail-open documented, but catch is bare — no `console.error`. If `SUPABASE_SERVICE_ROLE_KEY` is missing in env or Supabase is down, `maintenance_mode` and `bookings` flags silently bypass. Should at minimum log the cause; an admin debugging "why did the maintenance banner stop showing" has zero signal.

#### M3 · HomePage personalization swallows non-OK responses
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/HomePage.tsx:102-110`
```ts
fetch("/api/me")
  .then((r) => r.ok ? r.json() : null)
  .then((data) => { if (!data) return; ... })
  .catch((err) => console.error("[HomePage] failed to fetch user data:", err));
```
Catch is logged, but the `r.ok ? r.json() : null` → `if (!data) return;` path is silent. First-name greeting and last-booking nudges silently disappear on server errors with no observability.

#### M4 · ProfilePage Supabase mutations don't check the `{ error }` result
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/ProfilePage.tsx:797-845`
`handleSaveProfile`, `removeFav`, `handleSaveBeautyProfile` all call `await supabase.from(...).update/delete(...)` and discard the result. `setProfile` / `setFavorites` runs regardless of whether the DB call succeeded. RLS denial → UI shows update, server has old data, page reload reverts.

#### M5 · packages/page.tsx silent on package-list fetch failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/salon/[slug]/packages/page.tsx:210-221`
On API error, packages stays empty, page renders "Keine Pakete verfügbar" identical to the legitimately-empty state. Owner publishes packages, customer sees nothing, no distinguishing signal.

#### M6 · TerminePage redirects to login on any bookings-fetch failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/TerminePage.tsx:257-260`
`.catch((err) => router.push(`/${locale}/auth/login`))` — server hiccup on the booking-list endpoint bounces the logged-in user back to the login screen. Misleading UX (they think they got logged out).

#### M7 · DashboardLayout: same bounce-to-login on `/api/profile` fail
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/DashboardLayout.tsx:230-252`
Plus, no `if (!r.ok)` before `r.json()` so a 500 response triggers the JSON-parse failure path → redirect to login. Staff and owners get bounced on backend errors with no error toast.

#### M8 · Stock photos lib silently returns empty arrays
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/stock-photos.ts:23-107`
Multiple `if (!key) return [];` and `if (!res.ok) return [];` with no logging. Admin gallery search returns no results — admin can't tell if it's "no matches" or "Unsplash rate limit." Catches log, the early-return paths don't.

#### M9 · Stripe `payment-intent` referral-credit fetch swallowed
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/checkout/page.tsx:181-190`
```ts
.catch((err) => console.error("[Checkout] failed to load referral credits:", err));
```
On error, `userCredits` stays at 0. User who has CHF 10 in credits doesn't see them applied at checkout. Logged but no user-facing fallback retry.

#### M10 · SaveButton + LikeButton silently revert optimistic updates
**Files:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/discovery/SaveButton.tsx:67-69` and `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/discovery/LikeButton.tsx:55-62`
Both revert on `!res.ok` or catch without a toast. User sees heart fill briefly, then flip back, with no explanation.

#### M11 · account/saved un-favorite silently restores on failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/account/saved/page.tsx:54-63`
Catch re-fetches the favorites list (which restores the favorite) without telling the user the delete didn't go through.

#### M12 · PackageManager toggle-active silent revert
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/PackageManager.tsx:115-118`
`catch { setPackages(previousPackages); }` — toggle flips back with no message. Owner thinks the toggle is broken.

#### M13 · Audit log silently swallows write failures
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/audit.ts:14-26`
Compliance audit log fires-and-forgets. If `audit_log` table is misconfigured or RLS denies, security-relevant events are not recorded. Should at least `console.error` so server-side observability picks it up. Same for `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/strikes.ts:50-57`.

#### M14 · category-detect silently swallows AI errors
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/search/category-detect.ts:31-40`
`try { ...gemini... } catch { return null; }` — Gemini quota / network / parse errors all silent. Caller has no signal whether the null means "ambiguous query" or "Gemini broke." Used in search; degrades silently to "no category filter."

### LOW (5)

#### L1 · Cookie banner parse fallback
`/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/ui/CookieBanner.tsx:15-23` — corrupt JSON in localStorage returns null, banner shows again. Acceptable.

#### L2 · `getGuestSaves` localStorage fallback
`/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/lib/guest-saves.ts:3-7` — corrupt JSON returns []. Acceptable.

#### L3 · `RecentlyViewed` localStorage handling
`/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/RecentlyViewed.tsx:25-32` and `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/_components/homepage/RecentlyViewed.tsx:93-105` — `try/catch` around `localStorage` returns []. V3 version logs, legacy version doesn't. Acceptable, but V3 is the better pattern.

#### L4 · SocialProofStrip decorative null
`/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/ui/SocialProofStrip.tsx:91-104` — decorative stats; empty catch with comment "Keep null values — shows '–' placeholder." Acceptable.

#### L5 · Single 3-level optional chain
`/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/onboarding/steps/ServicesStep.tsx:36` — `d?.salon?.categories?.join(",") || "hair"`. Defaults to "hair" if any link in chain is missing; reasonable for an onboarding-default behavior, but a comment would help future readers.

---

## Extension findings (Pass 2) — paths not enumerated in original pass

These findings supplement the original pass with specific routes/components not enumerated above. The first three are CRITICAL-class issues the original pass marked as having 0 critical findings — re-evaluating because each touches either safety, money, or trust on a path with no recovery.

### CRITICAL (extension pass)

#### E1 · Nail allergy warning silently hidden on API error — SAFETY
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/nail/AllergyWarning.tsx:22-32`
```ts
useEffect(() => {
  if (!customerId) return;
  let cancelled = false;
  fetch(`/api/clients/${customerId}/nail-allergies`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (!cancelled && d) setData(d); })
    .catch((err) => console.error("[AllergyWarning] failed to load nail allergy data:", err));
  return () => { cancelled = true; };
}, [customerId]);
// ...
if (!data?.hasAllergy) return null;
```
**Pattern:** `r.ok ? r.json() : null` masking + `if (!data?.hasAllergy) return null` (treats "couldn't load" identically to "no allergy").
**Hides:** Any non-OK response from the nail-allergies endpoint (auth flicker, RLS misconfig, transient 5xx) leaves `data` permanently null. `data?.hasAllergy` is falsey → the red allergen-warning UI never renders. Nail technician applies gel/acrylic containing a known allergen. Anaphylaxis-class hazard.
**Severity:** CRITICAL (medical / safety surface silently degraded with no operator signal)
**Fix:** Three-state model (`loading | loaded | error`). On `error`, render a yellow "⚠ Allergie-Status konnte nicht geladen werden — bitte mit dem Kunden prüfen" banner instead of returning null. Same defensive pattern should apply to `dashboard/coiffeur/AllergyAlert.tsx` if/when it becomes the data-loader (currently parent-loaded).

#### E2 · coming-soon-notify returns ok:true after DB write failure — DATA LOSS
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/coming-soon-notify/route.ts:28-37`
```ts
if (error) {
  // Table may not exist yet — fail silently so the UX still works
  console.error("[coming-soon-notify] Supabase error:", error.message);
  return NextResponse.json({ ok: true });
}
return NextResponse.json({ ok: true });
} catch (err) {
  console.error("[coming-soon-notify] Unexpected error:", err);
  return NextResponse.json({ ok: true });
}
```
**Pattern:** Pattern #7 in the audit prompt — success response (`{ok:true}`) after an error path. The "fail silently so the UX still works" comment is the exact failure mode of this pattern: UX shows success that didn't actually happen.
**Hides:** Customer enters email on a Coming-Soon page, sees the success state, never gets the launch email. Marketing dashboards record signups that don't exist in the table. Whole purpose of this endpoint is to persist the email — silently dropping the write defeats the feature entirely.
**Severity:** CRITICAL (data-loss; user-trust-eroding silent failure on a public route whose only job is persistence)
**Fix:** Return `{ ok: false, error: "Signup-Service vorübergehend nicht erreichbar — bitte später erneut versuchen" }` with a 502 or 503 status. UI shows the user the system is down; they retry instead of waiting for an email that won't come.

#### E3 · profile/favorites endpoint returns empty items on DB error — DATA INTEGRITY
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/profile/favorites/route.ts:21-22, 34`
```ts
if (error || !data || data.length === 0) {
  return NextResponse.json({ items: [], total: 0 });
}
// ...
if (sErr) return NextResponse.json({ items: [], total: 0 });
```
**Pattern:** #4 + #7 (empty array as fallback on real error + 200 success after DB error).
**Hides:** If the `favorites` table query or the salon-enrichment query errors (RLS surprise, timeout), customer's `/profile/favorites` page shows "no saved salons" with no error indication. They might re-save salons they've already saved. They lose their primary entry point to favorite salons. The original pass cites the symptom in M11 (UI silently restores on un-favorite failure) but doesn't flag this server-side return-empty-on-error masking the root cause.
**Severity:** CRITICAL (user's saved state appears wiped — they think the platform forgot them)
**Fix:** Return `{ error: "Konnte Favoriten nicht laden", code: "DB_ERROR" }` with 500 status on error. Let the UI distinguish "you have no favorites" from "we couldn't load your favorites."

### HIGH (extension pass)

#### E4 · salon-draft DELETE silently succeeds on error
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/salon-draft/route.ts:91-94`
```ts
const admin = createAdminSupabaseClient();
await admin.from("salon_drafts").delete().eq("user_id", user.id);
return NextResponse.json({ ok: true });
```
**Pattern:** #7 (success response without error capture). The PUT handler above checks errors correctly; the DELETE does not.
**Hides:** Onboarding draft deletion fails silently. User restarts onboarding, fetches the (still-existing) draft, reads stale data → confused about why their changes from "before" are showing.
**Severity:** HIGH (onboarding-flow corruption)
**Fix:** Destructure `{ error }`, return 500 on failure.

#### E5 · notify/review-posted silent missing-email skip
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/notify/review-posted/route.ts:21-46`
```ts
const { data: review } = await admin.from("reviews").select(...).eq("id", review_id).single();
if (!review || !review.salons?.owner_id) return NextResponse.json({ error: "not found" }, { status: 404 });
const { data: owner } = await admin.from("profiles").select("email").eq("id", review.salons.owner_id).single();
if (owner?.email) {
  await sendEmail({...});
}
return NextResponse.json({ ok: true });
```
**Pattern:** #3 (silent fall through on missing optional data) + #7 (ok:true after skip).
**Hides:** Owner profile lookup error → `owner` undefined → email silently skipped → ok:true returned. Customer believes the salon was notified of their review; salon never sees it. Same flow if sendEmail throws inside the conditional (no try/catch).
**Severity:** HIGH (review-pipeline integrity; affects salon-owner trust in the platform's review channel)
**Fix:** Destructure profile-fetch error; throw on lookup failure; wrap sendEmail in try/catch; return `{ ok, email_sent: boolean }` so callers see ground truth.

#### E6 · discovery/feed catch returns empty items on exception
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/discovery/feed/route.ts:63-72`
```ts
} catch (e: any) {
  // Graceful fallback when Supabase admin client can't be created
  return NextResponse.json({ items: [], total: 0, page: 1, limit: 30, has_more: false });
}
```
**Pattern:** #1 (no log in catch) + #4 (empty array) + #7 (200 with empty after exception).
**Hides:** Any throw in the query block (RLS, function timeout, missing env) returns "no posts yet" indistinguishable from a legitimately empty feed. Engineers see 200s in logs and no error signal. Discovery is positioned as the engagement loop; silent failure here drains the strategy.
**Severity:** HIGH (engagement loop silently broken)
**Fix:** `console.error("[discovery/feed]", e); return NextResponse.json({ error: "feed_unavailable" }, { status: 503 })`.

#### E7 · bookings/[id]/approve-increase: GET + PATCH both silent on failure
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/bookings/[id]/approve-increase/page.tsx:34-39, 41-53`
```ts
// GET
fetch(`/api/bookings/${bookingId}/dispute`)
  .then((r) => r.json())
  .then((d) => setDispute(d.dispute ?? null))
// PATCH
const res = await fetch(`/api/bookings/${bookingId}/dispute`, { method: "PATCH", ... });
if (res.ok) setResult(action === "approve" ? "approved" : "disputed");
```
**Pattern:** #3 (no res.ok check on GET) + #4 (`?? null` masking parsed-error-JSON) + `if (res.ok)`-only on PATCH with no else branch.
**Hides:** Customer follows email link to approve/dispute a salon's price-increase. On 401 (session expired between email and click), GET returns the auth-error JSON which parses as `{}`, `dispute` is null, UI shows "Keine offene Preisanpassung gefunden" — customer takes no action. The auto-approval timer fires and silently approves the increase. Customer is charged extra without knowing they could have disputed. The PATCH path also fails silently — they submit "approve" or "dispute," nothing happens, no toast.
**Severity:** HIGH (money + regulatory dispute surface; customer can be silently overcharged)
**Fix:** GET should detect 401 and redirect to login with return-URL preserved; PATCH should toast on error and re-enable the submit button.

#### E8 · admin/users role check silent on DB error
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/admin/users/route.ts:20-22, 49-51`
```ts
const { data: profile } = await supabase
  .from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```
**Pattern:** #2 (silent supabase, no error inspection).
**Hides:** DB outage causes admin lookup to fail → admin gets 403 "Forbidden" → they assume their permission was revoked, lose trust. Real cause is just a DB hiccup. Same shape in many other routes (`/api/discovery/post`, `/api/search/suggest`, `/api/salons/by-category`).
**Severity:** HIGH (security admin surface — 403 indistinguishable from genuine deny)
**Fix:** Destructure error → return 503 `{code: "DB_UNAVAILABLE"}` so the UI can show "try again" instead of "you're not allowed."

#### E9 · SetupBanner fragile render (no shape guard) + no ok check
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/components-legacy/dashboard/SetupBanner.tsx:26-41`
```ts
fetch("/api/salon/setup-progress")
  .then((r) => r.json())           // no ok check
  .then((d) => { if (d.percentage < 100) setData(d); })
// later:
const incompleteSteps = data.steps.filter((s) => !s.complete);  // throws if steps undefined
```
**Pattern:** #3 (no ok check) + brittle render.
**Hides:** On 401, body parses as `{message: "Unauthorized"}`, `d.percentage` undefined, `undefined < 100` is false → setData not called (lucky escape). BUT if the API ever returns a partial shape (e.g. `{percentage: 50}` without `steps`), `data.steps.filter(...)` throws. With NO ErrorBoundary anywhere (see original Pattern #1), the dashboard layout crashes.
**Severity:** HIGH (depends on perfect API contract; trivially breakable + no boundary to catch)
**Fix:** Validate response shape (Zod) or default the steps array: `setData({ steps: [], completed: 0, total: 0, percentage: 0, ...d })`.

### MEDIUM (extension pass)

#### E10 · `safeCategory` defaults missing data to "coiffeur"
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/[locale]/_components/search/SearchResults.tsx:50-54`
```ts
function safeCategory(cats: string[] | undefined): V3Cat {
  const first = cats?.[0]?.toLowerCase();
  if (first && (V3_CATS as readonly string[]).includes(first)) return first as V3Cat;
  return "coiffeur";
}
```
**Pattern:** Default value that masks malformed data. A salon with empty `categories` array or a legacy single-string category like `"nail"` (not in V3_CATS) renders with the "coiffeur" colorway. A Nails salon shown with the Coiffeur tile is visual misinformation.
**Severity:** MEDIUM
**Fix:** Return `null` and render a neutral fallback tile. Log a warning to surface backend-data drift.

#### E11 · salons/by-category silent city filter drop
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/salons/by-category/route.ts:42-49`
```ts
if (citySlug) {
  const { data: cityRecord } = await supabase.from("cities").select("id").eq("slug", citySlug).single();
  if (cityRecord) cityId = cityRecord.id;
}
// city filter only applied if cityId
```
**Pattern:** #2 + #3 — DB error on city lookup → filter silently skipped → results return for all of Switzerland with no warning.
**Severity:** MEDIUM (silently widens result set; misleading for city-targeted queries)
**Fix:** Throw if citySlug was provided but lookup failed.

#### E12 · search/suggest: cascading silent supabase queries
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/search/suggest/route.ts:27-77`
```ts
const { data: cityRecord } = await supabase.from("cities")...
const { data: rawServices } = await servicesQuery.limit(5);
const { data: salons } = await salonsQuery.limit(3);
return NextResponse.json({ services: services ?? [], salons: salons ?? [] });
```
**Pattern:** #2 (three silent supabase queries) + #4 (empty arrays as final fallback).
**Hides:** Autocomplete shows empty dropdown on any DB error. User assumes no salons match → abandons.
**Severity:** MEDIUM
**Fix:** Inspect each query's error; return 503 on DB failure so the UI can show retry.

#### E13 · discovery/post: silent profile/salon owner lookup
**File:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/discovery/post/route.ts:28-35`
```ts
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
let ownerSalonId: string | null = null;
if (profile?.role === "salon_owner") {
  const { data: salon } = await supabase.from("salons").select("id").eq("owner_id", user.id).eq("is_active", true).single();
  ownerSalonId = salon?.id ?? null;
}
```
**Pattern:** #2 (silent on both queries) + #3 (null fall-through).
**Hides:** Salon owner posts to discovery while their profile lookup fails (RLS transient, DB hiccup); post is attached as anonymous user instead of salon-owned. Owner doesn't see their own post on their dashboard.
**Severity:** MEDIUM
**Fix:** Inspect errors; throw on lookup failure; on a clean "not a salon owner" result, proceed as-is.

---

## Patterns observed

1. **No React ErrorBoundary anywhere in the codebase.** Zero `componentDidCatch`, zero `getDerivedStateFromError`, zero `ErrorBoundary` imports. Next.js `error.tsx` route-level boundaries are also not present in the repo. When any component throws during render, the whole route crashes to the Next.js default fallback. Adding `error.tsx` per major route segment (`/salon/[slug]`, `/checkout`, `/profile`, `/dashboard`) would let one Server-Component crash degrade gracefully instead of blanking the page.

2. **`r.ok ? r.json() : null` followed by `if (data) set...`** is the most-repeated anti-pattern (~30 occurrences). It silently converts every 4xx/5xx into "no data" without distinguishing from legitimate empty. Customer-facing surfaces (salon detail, treatment search, package list, nearby section) all use it.

3. **`if (!res.ok) return;` after POST** (write operations): the function returns without surfacing the error. Found in IntakeFormTab, SensitivityLog, BodyZoneSelector, DesignHistoryTimeline, InspoBoard, ReportButton, and many dashboard handlers. Submission UX feels "did it save?" — and sometimes the answer is no.

4. **Empty `catch {}` blocks paired with optimistic-UI commits**: pattern is to update React state optimistically, then `try { fetch } catch {}` — but no revert and no error display when the fetch fails. ProfilePage's cancel-booking is the most damaging instance (data-integrity), but the pattern is endemic across discovery and dashboard.

5. **Silent Supabase mutation results**: many places `await supabase.from(...).update(...)` without destructuring the `{ error }` result. JS-level await succeeds even when PostgREST returned an RLS-denied error. ProfilePage `handleSaveProfile` is a prime example.

6. **Cookie/auth fragility**: `lib/supabase.ts` silently downgrades to anonymous on cookie parse error. Combined with `DashboardLayout.tsx`'s "any `/api/profile` failure → push to login," this gives users a confusing logged-out-but-was-logged-in state.

7. **Logged-but-silent**: many `.catch((err) => console.error("[X] failed:", err))` log to console but show no user-visible feedback. The log is server-side only (or browser console for client code); regular users can't see it. These are better than no-log silence but still leave the user-visible UI broken with no recourse.

8. **Decorative vs critical paths conflated**: the codebase treats off-peak-banner-failure (decorative) and booking-cancel-failure (critical) with the same empty-catch pattern. A consistent policy ("decorative → swallow + log; transactional → toast + state revert; financial → modal + retry") would surface fast.

9. **The good patterns exist already**: `BookingCalendar.tsx` handles "payment succeeded but booking creation failed" with a specific error message. `SearchResults.tsx` (V3) sets a visible error state. `OffPeakManager.tsx`, `PromoManager.tsx`, `GalleryManager.tsx` all set error state correctly. The fix is mostly mechanical — apply the existing good patterns to the broken handlers.

---

## Recommended next steps (out of audit scope but evident)

- Add Next.js `error.tsx` to the 5 most critical route segments: `app/[locale]/salon/[slug]/`, `app/[locale]/checkout/`, `app/[locale]/profile/`, `app/[locale]/dashboard/`, `app/[locale]/auth/`. This catches Server-Component crashes that currently white-screen.
- Fix H2 (ProfilePage booking cancel) and H1 (lib/supabase.ts cookie swallow) first — both are data-integrity / auth-correctness bugs hiding in catch blocks.
- Sweep the `r.ok ? r.json() : null → setX([])` pattern: at minimum log the response status and set an error-visible state on the customer-facing search and salon-detail surfaces (H4, H5, H6).
- Add `console.error` to every bare `catch {}` and `catch { /* ignore */ }` to make root-cause analysis possible. Browser-level logging is cheap insurance.
