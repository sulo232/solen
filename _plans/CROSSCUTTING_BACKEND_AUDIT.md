# Cross-cutting backend (notifications / crons / media) — bug & gap audit (2026-07-09)

The workflow hit a session limit mid-run (27 of 36 agents errored). Its `refuted` list therefore contains `0/0`-vote entries that were **never verified, not refuted**. The orchestrator hand-verified the important ones by direct file reads (no subagents needed). Findings below are labelled by how they were established.

---

## CRITICAL

### 1. Unauthenticated open email relay + HTML injection — `/api/notify/review-replied` — CONFIRMED (3/3 + orchestrator-verified)
`app/api/notify/review-replied/route.ts:8-42`. The route has **no session check, no CRON_SECRET, no ownership check, no rate limit**. It takes client-supplied `review_id` + `reply_text`, uses the **service-role client** to look up the review author's real email, and interpolates `reply_text` **UNESCAPED** into the HTML body (`:28`), sent via `sendEmail` from Solen's trusted sender.

The intended caller is `app/api/reviews/[id]/respond/route.ts` (which *does* enforce salon-owner auth), but that auth is **not inherited** — this is a public Next.js route reachable directly.

- Exploit: review ids are public (visible on every salon's review list). An attacker POSTs any real `review_id` with `reply_text` containing arbitrary HTML/links (e.g. a fake "payment failed, verify here" phishing block). Solen's own mail infra delivers it to the real customer, apparently from the named salon and `noreply@solen.ch`. No rate limit → sweep many review ids to blast phishing at scale and burn Solen's sender reputation.
- Fix: enforce the same auth+ownership as `respond/route.ts` (or just call `sendEmail` inline from `respond` instead of an internal HTTP hop to a public route); HTML-escape `reply_text`; add a rate limit. If an internal-only route is genuinely needed, gate it with the shared `CRON_SECRET` header pattern already used everywhere else.

---

## HIGH

### 2. Unauthenticated `/api/notify/review-posted` → salon-owner email-bombing — CONFIRMED (2/2 + orchestrator-verified)
`app/api/notify/review-posted/route.ts`. Same pattern: **no auth, no rate limit** (grep for `getSession|auth|CRON_SECRET|applyRateLimit` returns nothing). Accepts a client-supplied `review_id`, resolves the salon owner's real email server-side, sends a "Neue Bewertung" email. Anyone can POST the same `review_id` in a loop to bomb any salon owner's inbox. Fix: same as above.

### 3. Supabase Edge Functions have NO in-code request-auth gate — ORCHESTRATOR-VERIFIED
All 7 functions (`booking-reminder`, `compute-analytics`, `post-booking-preferences`, `recurring-booking-processor`, `salon-verification`, `slot-auto-release`, `smart-nudges`) contain **zero** request-authorization code — grep for `req.headers` / `request.headers` across `supabase/functions/*/index.ts` returns **no hits**. Their only "auth-ish" strings are `SUPABASE_SERVICE_ROLE_KEY` (a DB credential, not a request gate) and `Authorization: Bearer ${RESEND_API_KEY}` (an outbound header).

There is **no `supabase/config.toml`**, so `verify_jwt` sits at the Supabase default (`true`) — meaning invocation requires *some* valid JWT, and the **public anon key qualifies**. So any holder of the publicly-shipped anon key can invoke these scheduled jobs on demand: fire reminder emails, run `slot-auto-release`, run `smart-nudges`, drive `recurring-booking-processor`, trigger `salon-verification`.

Contrast: **all 24 `app/api/cron/*` routes correctly check `CRON_SECRET`** (verified route-by-route). The Edge Functions are the gap. Fix: add a shared-secret header check at the top of each function (mirroring `CRON_SECRET`), and/or set `verify_jwt`/JWT-role restrictions explicitly in a committed `config.toml`.

### 4. SMS OTP send is rate-limited by IP, not by target phone → victim SMS-bombing — ORCHESTRATOR-VERIFIED
`app/api/auth/verify-phone/send/route.ts:18` — `applyRateLimit(authLimiter, { ip: getClientIp(request) })`. The bucket key is the **caller's IP**, never the target `phone` (`:22`). Compounds with the already-confirmed HIGH that `getClientIp()` reads the client-spoofable `x-forwarded-for` (`lib/ratelimit.ts:139`): an attacker rotates the XFF header and sends unlimited OTP SMS to **one victim's number**, at Solen's SMS cost. Fix: key the limiter on the normalized target phone number (and on a platform-trusted client IP), plus a per-number daily cap.

### 5. `booking-reminder` send-once guard is a non-atomic read-then-write → duplicate reminder emails — ORCHESTRATOR-VERIFIED
`supabase/functions/booking-reminder/index.ts:40` selects `.eq("reminder_sent", false)`, sends, then `:76` `update({reminder_sent:true})`. The guard exists but is **not atomic and not locked** — two concurrent invocations both read `reminder_sent=false` and both send. Combined with finding #3 (any anon-key holder can invoke it), duplicate reminders are trivially triggerable. Fix: claim rows atomically (conditional `UPDATE ... WHERE reminder_sent=false RETURNING id`, send only the claimed rows) or add a run-lock.

---

## MEDIUM

### 6. `rebooking-nudge` has no cooldown / already-sent guard — PLAUSIBLE (grep-level; needs a full read)
`app/api/cron/rebooking-nudge/route.ts` — grep for `last_nudge|nudge_sent|cooldown|already|notified_at|sent_at|gte(|lte(` returns **nothing**, i.e. no send-once column, no cooldown, and no time-window bound on the selection. If the fallback query path is reached, the same customer plausibly gets the same nudge every day the cron fires. Confirm by reading the handler end-to-end before fixing.

---

## REFUTED (checked, not a bug)
- **"Crons are unauthenticated"** — false for the Next.js routes: all 24 `app/api/cron/*/route.ts` check `CRON_SECRET`, and `.github/workflows/cron-jobs.yml` passes the bearer. The real gap is the Edge Functions (finding #3).

## Media — orchestrator hand-checked (blind spot now closed)
- **Image-proxy SSRF — REFUTED.** `app/api/discovery/thumb/[id]/route.ts` only fetches a fixed host (`tiktok.com/oembed`) and then whatever `thumbnail_url` TikTok's own response returns. The attacker never controls the fetch target (they control only the discovery-item `id`, which maps to a stored `tiktok_url`). No SSRF. (It does have unrelated smaller issues: an unbounded in-process `imageCache`/`oembedCache` Map with no eviction, and it's an unauthenticated public byte proxy — low severity.)
- **Storage upload authz — SOUND.** All six upload routes are properly guarded: `salons/[slug]/gallery` (owner_id===user.id + JPG/PNG/WEBP allowlist + 5MB), `clients/[id]/photos` + `dashboard/coiffeur/formula-photo` (getActiveSalon-scoped + type + size), `reviews/[id]/photos` (review.user_id===user.id + count + 5MB), `salon/documents` (owner + mime allowlist + 10MB), `services/[id]/photos` (salons.owner_id via join). No cross-tenant write found. Minor: worth confirming the `[id]` path param in `clients/photos`/`formula-photo` is verified to belong to the caller's active salon (path is already salon-scoped, so exposure is low).

## STILL NOT VERIFIED (re-check when subagents are available; do NOT treat as clean)
- `smart-nudges` (Edge Fn): claimed to duplicate newer gated cron pipelines with no send-once guard on its review-prompt path (Edge-Fn auth gap #3 already covers its reachability).
