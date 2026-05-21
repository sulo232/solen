# 3d — Untyped Boundaries Audit

**Date:** 2026-05-16
**Scope:** `app/`, `lib/`, `components-legacy/`, `supabase/functions/`, `src/`
**Patterns:** fetch.json() · JSON.parse · Supabase client typing · formData / URLSearchParams / cookies / headers · `catch(err: any)`

---

## TL;DR

| Boundary | Count | Severity |
|---|---|---|
| **`database.types.ts`** | **MISSING** | **CRITICAL** |
| Untyped `createClient` / `createServerClient` / `createBrowserClient` sites | 15 (100% of definition sites) | **CRITICAL** |
| Untyped `supabase.from()` query call-sites | ~1314 | **HIGH** (cascades from above) |
| `await req.json()` in API routes WITHOUT validation | 43 routes | **HIGH** |
| `JSON.parse(...)` followed by typed-cast or unchecked use | 20 sites | **MEDIUM–HIGH** |
| `formData.get(...) as ...` cast w/o schema parse | 15 sites | **MEDIUM** |
| `catch (err: any)` (TS 4.4+ default `unknown`) | 21 sites | **LOW–MEDIUM** |
| `request.headers.get("authorization")` direct compare | 31 sites | **MEDIUM** (cron secrets) |

Total finding count: ~1459 individual boundary-cross sites; only ~150 of them are validated. **Structural fix beats per-site fix here** — generate `database.types.ts`, type the Supabase clients, and add a shared validate-body helper to every route that uses `await req.json()`.

---

## Supabase client instantiation audit

**Verdict: 15 of 15 sites are UNTYPED.** Every Supabase client in the codebase is instantiated as `createClient(url, key, opts)` — never `createClient<Database>(url, key, opts)`. This means every `.from("table")` call returns `any`, every `.select()` result is `any`, and every `.insert()` accepts `any`. Type errors don't surface until runtime (or — more commonly — never).

### Definition sites (the three wrappers)

| file | line | call | typed? |
|---|---|---|---|
| `lib/supabase.ts` | 18 | `createServerClient(URL, ANON_KEY, ...)` | ❌ no `<Database>` |
| `lib/supabase.ts` | 62 | `createServerClient(URL, SERVICE_ROLE_KEY, ...)` (admin) | ❌ no `<Database>` |
| `lib/supabase.ts` | 86 | `createBrowserClient(URL, ANON_KEY)` (singleton) | ❌ no `<Database>` |
| `lib/supabase-browser.ts` | 8 | `createBrowserClient(URL, ANON_KEY)` (dup wrapper) | ❌ no `<Database>` |

### One-off creation sites (bypass the wrappers)

| file | line | snippet | severity |
|---|---|---|---|
| `app/api/auth/callback/route.ts` | 22 | `createServerClient(URL, ANON, { cookies: {...} })` — inline w/ custom cookie setter | HIGH (auth callback) |
| `app/api/partner/leads/route.ts` | 21 | `createClient(supabaseUrl, supabaseKey)` — uses `@supabase/supabase-js` not `@supabase/ssr` | HIGH (mixed library) |
| `app/api/salons/[slug]/gallery/route.ts` | 4 | `createClient(URL, SERVICE_ROLE_KEY)` — also untyped, also `@supabase/supabase-js` | HIGH (uploads + service-role) |
| `supabase/functions/booking-reminder/index.ts` | 29 | `createClient(url, serviceRoleKey)` | HIGH (deno edge fn) |
| `supabase/functions/post-booking-preferences/index.ts` | 16 | `createClient(...)` | HIGH |
| `supabase/functions/salon-verification/index.ts` | 22 | `createClient(...)` | HIGH |
| `supabase/functions/recurring-booking-processor/index.ts` | 29 | `createClient(...)` | HIGH |
| `supabase/functions/smart-nudges/index.ts` | 11 | `createClient(url, serviceRoleKey)` | HIGH |
| `supabase/functions/compute-analytics/index.ts` | 11 | `createClient(url, serviceRoleKey)` | HIGH |
| `supabase/functions/slot-auto-release/index.ts` | 16 | `createClient(url, serviceRoleKey)` | HIGH |

**Also bad:** `lib/supabase.ts` line 31, 34, 68 — `setAll(cookiesToSet: any[])` and `cookiesToSet.forEach(({ name, value, options }: any) => ...)`. Should be `{ name: string; value: string; options?: CookieOptions }[]` (`@supabase/ssr` exports this type).

**Fix:**
```ts
// 1. Run: npx supabase gen types typescript --project-id <id> > lib/database.types.ts
// 2. Then:
import type { Database } from "@/lib/database.types";
return createServerClient<Database>(URL, KEY, { cookies: { ... } });
```
Touches 15 files; once typed, ~1314 downstream `.from()` call-sites get inferred row types automatically.

---

## `database.types.ts` state

**STATUS: FILE DOES NOT EXIST.**

```
$ find . -name "database.types.ts" -not -path "*/node_modules/*"
(no results)

$ grep -rn "import type.*Database.*from" app/ lib/
(no matches)
```

### Migration timeline (for context — none of this is reflected in TS types)

- **125 migrations** in `supabase/migrations/`
- First: `001_booking_reviews.sql`
- Latest 3 (April 2026):
  - `20260401_gift_vouchers.sql`
  - `20260401_salon_min_prices.sql`
  - `20260401_walk_in_available.sql`
  - `20260402_last_minute_settings.sql`

The schema is rich (~125 migrations including `match_search_embeddings_city`, `prevent_double_booking_gist`, `rfm_materialized_view`, per-category dashboards: coiffeur / spa / waxing / nail / makeup, gift vouchers, recurring bookings, station/chair management, etc.) — none of which is type-safe in the TS code. Every column reference is a stringly-typed bet.

### Symptoms in code (without types you can't catch these)

- `app/api/notify/review-posted/route.ts:21` — `review.salons?.owner_id` — `salons` from `.select("*, salons(owner_id, name)")` is typed `any`, so a typo like `owner_iD` would compile fine and crash at runtime.
- `app/api/bookings/[id]/reschedule/route.ts:52` — `(booking.availability_slots as any).salon_id` — explicit `as any` to access embedded join, ONLY possible because the base type is `any`.
- `app/[locale]/_components/salon/SalonDetailV3.tsx:97` — `const list: string[] = (raw ? JSON.parse(raw) : []).filter(...)` — JSON.parse returns `any`, then directly filtered without runtime check.

**Fix priority:** generate `database.types.ts` first — it unblocks the next 1314 sites without per-site changes.

---

## `fetch.json()` audit — top sites

268 call sites total. ~225 are server-side `await req.json()` (request body in API routes). ~43 are client-side `await res.json()` (response from a fetch). Breakdown of unvalidated bodies by severity:

### CRITICAL — unvalidated bodies on payment / auth / booking routes

| file | line | snippet | shape expected | risk |
|---|---|---|---|---|
| `app/api/bookings/[id]/reschedule/route.ts` | 9 | `const { new_starts_at, new_ends_at } = await req.json();` | `{ new_starts_at: string, new_ends_at: string }` — date strings | un-parsed dates compared with `Date(...)` (line 41); attacker can send `null`/`"x"` and skip 24-hour rule on line 45 (`NaN < 24 === false`) |
| `app/api/auth/verify-phone/check/route.ts` | 21 | `const { phone, code } = await req.json();` | `{ phone: string (E.164), code: string (6 digits) }` | no E.164 check, no length check; `code` of `""` could match `storedOtp === ""` in some edge cases |
| `app/api/auth/verify-phone/send/route.ts` | (check) | — | same | rate-limited but unvalidated body shape |
| `app/api/favorites/toggle/route.ts` | 41 | `body = await request.json();` then `body.salon_id?.trim()` | `{ salon_id: string (uuid) }` | inline shape check `{ salon_id?: string }` is type-only, not runtime — a non-UUID makes `.eq("salon_id", "../../")` an empty result (probably safe, but not validated) |
| `app/api/notify/review-posted/route.ts` | 12 | `const { review_id } = await req.json();` | `{ review_id: string (uuid) }` | sends an email to salon owner based on lookup; bad UUID = 404 (probably safe, but unbounded `console.error` log) |
| `app/api/notify/review-replied/route.ts` | (similar) | same | same | same |
| `app/api/admin/booking-disputes/[id]/action/route.ts` | 24 | `const body = await req.json();` then refunds based on body | refund amount, action type | admin-protected upstream but still HIGH because of `try { ... } catch (stripeErr: any)` swallow |

### HIGH — unvalidated bodies on salon owner / dashboard routes (RLS-gated downstream)

43 routes total. Selected:

| file | line | snippet | shape expected |
|---|---|---|---|
| `app/api/salon/last-minute-settings/route.ts` | 84 | `body = await req.json();` | `{ enabled, discount_pct, lead_time_min, ... }` |
| `app/api/salon/waxing-zone-packages/route.ts` | 43, 89 | `body = await req.json().catch(() => ({}))` | package shape — falls through to spread w/o type |
| `app/api/admin/seed-test-salons/route.ts` | — | seed data body | admin-only but seed payload is untrusted |
| `app/api/admin/test-salon/route.ts` | — | same | same |
| `app/api/admin/homepage-sections/route.ts` | — | section config | CMS-style writes |
| `app/api/admin/content/[key]/route.ts` | — | content body | CMS write |
| `app/api/admin/salons/[id]/warn/route.ts` | — | warn payload | moderation flow |
| `app/api/admin/salons/[id]/freeze/route.ts` | — | freeze payload | moderation flow |
| `app/api/directory/[id]/claim/route.ts` | — | claim payload | owner-claim flow (could enable hijack) |
| `app/api/salons/[slug]/route.ts` | — | salon update body | hand-edit + RLS only |
| `app/api/salons/mine/route.ts` | — | self-salon body | same |
| `app/api/staff/[id]/route.ts` | — | staff update body | RLS only |
| `app/api/staff/schedule/auto-apply/route.ts` | — | schedule body | RLS only |
| `app/api/slots/[id]/route.ts` | — | slot update body | RLS only |
| `app/api/services/reorder/route.ts` | — | reorder array | RLS only |
| `app/api/reviews/[id]/flag/route.ts` | — | flag body | could spam-flag |
| `app/api/reports/route.ts` | — | report body | could spam-report |
| `app/api/vouchers/validate/route.ts` | — | voucher code | unbounded length DoS? |
| `app/api/vouchers/confirm/route.ts` | — | voucher confirmation | money-adjacent |
| `app/api/packages/[id]/route.ts` | — | package update | RLS only |
| `app/api/dashboard/batch/route.ts` | — | batch operations | bulk RLS write |
| `app/api/dashboard/waxing/sensitivity/route.ts` | — | client health-data | sensitive |
| `app/api/dashboard/waxing/zone-preferences/route.ts` | — | client preference | sensitive |
| `app/api/dashboard/spa/treatment-outcomes/route.ts` | — | medical-adjacent | sensitive |
| `app/api/dashboard/nail/ai-history/route.ts` | — | AI history | mildly sensitive |
| `app/api/dashboard/makeup/kit-usage/route.ts` | 36 | `const { salon_id, item_id, quantity_used, booking_id, notes } = await request.json();` | typed-by-destructure (NOT validated) |
| `app/api/profile/accept-tos/route.ts` | — | accept body | small |
| `app/api/salons/[slug]/ai-info/route.ts` | — | AI text body | unbounded? |
| `app/api/coming-soon-notify/route.ts` | — | email payload | newsletter signup |
| `app/api/nail/hand-chart/route.ts` | — | hand chart | client data |
| `app/api/nail/retail/checkout/route.ts` | — | retail order | money-adjacent |
| `app/api/discover/nails/route.ts` | 81 | `body = await req.json();` | discovery filter — unbounded? |
| `app/api/admin/preview-salon/route.ts` | — | preview body | admin-only |
| `app/api/admin/badges/[id]/route.ts` | — | badge update | admin-only |
| `app/api/admin/test-salon/seed/route.ts` | — | seed body | admin-only |
| `app/api/salons/[slug]/gallery/route.ts` | 16 | (also has formData — see Form section) | photo upload |

**Pattern:** all 43 use either inline destructure-typing (`const { a, b } = await req.json()`) or `as` cast — both of which the TypeScript compiler accepts as `any → typed`, no runtime check.

### MEDIUM — client-side `await res.json()` w/o runtime check

| file | line | snippet | what the response really is |
|---|---|---|---|
| `app/[locale]/auth/register/page.tsx` | 120 | `const data = await res.json();` after registration POST | `{ user, session }` or `{ error }` — branched on `res.ok` only |
| `app/[locale]/booking-action/page.tsx` | 29 | `const data = await r.json();` | booking action result; used to drive UI |
| `app/[locale]/tip/[bookingId]/page.tsx` | 55 | `const data = await res.json();` | Stripe PI client_secret; used for tip Stripe flow |
| `app/api/chat/suggest/route.ts` | 63 | `const result = await response.json();` | OpenAI-style chat completion — schema-less, only `result.choices?.[0]` access |
| `app/api/admin/generate-roadmap/route.ts` | 89 | `JSON.parse(errBody);` | claude/openai error body; defensively parsed but not typed |
| `app/api/recommendations/route.ts` | 192 | `JSON.parse(responseText);` | AI recommendation result; runs `.filter` etc. on `any` |

All these consume external (Stripe, OpenAI/Claude) responses without `safeParse`. If upstream changes shape silently, the failure mode is `Cannot read property 'X' of undefined` at runtime, not a typed compile error.

---

## `JSON.parse` audit (20 sites)

### CRITICAL — untrusted input typed-cast

| file | line | snippet | risk |
|---|---|---|---|
| `app/[locale]/checkout/page.tsx` | 144 | `let parsed: BookingIntent; ... parsed = JSON.parse(decodeURIComponent(raw));` (raw from `searchParams.get("booking_intent")`) | **URL-controlled JSON parsed and TYPE-CAST to `BookingIntent`**. Attacker can craft any `booking_intent=` query param, the only check is `try/catch` for malformed JSON — not for shape. Used to determine `chargeAmount` (line 157) and Stripe PI creation. |
| `app/[locale]/_components/primitives/CookieConsent.tsx` | 83 | `const parsed = JSON.parse(raw) as CookieConsentState;` (raw from localStorage) | localStorage-controlled. Lower severity (user-owned), but still `as`-cast w/o runtime check — a future schema change silently produces wrong flags. |
| `app/[locale]/dashboard/disputes/page.tsx` | 57 | `const parsed = JSON.parse(raw);` | dispute body cached locally; pushed back to server later |

### HIGH — AI/LLM output parsed without schema

| file | line | snippet | risk |
|---|---|---|---|
| `app/api/translate/route.ts` | 67 | `const translations = JSON.parse(cleaned);` | OpenAI translation JSON — schema-less, only `translations.X` access pattern |
| `app/api/discovery/generate-description/route.ts` | 98 | `const descriptions = JSON.parse(jsonMatch[0]);` | LLM-extracted descriptions used in salon discovery |
| `app/api/services/suggest/route.ts` | 42 | `const parsed = JSON.parse(cleaned);` | LLM-suggested services list |
| `app/api/admin/discovery/smart-import/route.ts` | 75 | `queries = JSON.parse(text);` | LLM-generated DB queries (!) — see below |
| `app/api/admin/generate-roadmap/route.ts` | 89 | `const errJson = JSON.parse(errBody);` | external error body |
| `lib/ai-vision.ts` | 159 | `const parsed = JSON.parse(cleaned) as AIVisionResult;` | Claude vision result `as`-cast to internal type |
| `lib/ai-vision.ts` | 262 | same | same |
| `app/api/recommendations/route.ts` | 192 | `JSON.parse(responseText);` | AI recommendation; `.filter` on `any` follows |

The "smart import" LLM-generated query case is the worst — even if Supabase RLS protects the data, a fragile JSON.parse means an LLM-formatting failure crashes the import.

### MEDIUM — localStorage / cookie reads (user-owned, but lossy)

| file | line | snippet |
|---|---|---|
| `app/[locale]/dashboard/settings/page.tsx` | 329 | `JSON.parse(localStorage.getItem("solen_quick_replies") ?? "null")` |
| `app/[locale]/_components/salon/SalonDetailV3.tsx` | 97 | `const list: string[] = (raw ? JSON.parse(raw) : []).filter(...)` |
| `app/[locale]/_components/homepage/useRecentSearches.ts` | 39 | `const parsed = JSON.parse(raw);` |
| `app/[locale]/_components/homepage/RecentlyViewed.tsx` | 98 | `const parsed = JSON.parse(raw);` |
| `app/[locale]/onboarding/salon/page.tsx` | 405 | `const data = JSON.parse(saved);` |
| `lib/guest-saves.ts` | 5 | `JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");` |
| `app/api/recommendations/route.ts` | 75 | `JSON.parse(viewedSalonIdsRaw).slice(0, 10)` (from cookie) |
| `lib/ai/recommendations.ts` | 41 | `const decoded = JSON.parse(atob(netlifyGeo));` (Netlify geo header) |

**Fix:** define a tiny `safeParse` helper per concern (`bookingIntentSchema`, `cookieConsentSchema`, `recentSearchesSchema`, etc.) and `safeParse(JSON.parse(raw))` instead of casting.

---

## `formData.get()` audit (15 sites)

All 15 cast directly to `File | null` or `string | null` without parsing. None go through Zod. This is workable for uploads (the cast IS the boundary check for `File`), but the string fields should validate format/length.

| file | line | snippet | severity |
|---|---|---|---|
| `app/api/clients/[id]/photos/route.ts` | 40 | `const file = formData.get("file") as File \| null;` | LOW (file null-check follows) |
| `app/api/clients/[id]/photos/route.ts` | 41 | `const photoType = (formData.get("photo_type") as string) ?? "progress";` | MEDIUM (no enum check on photo_type) |
| `app/api/clients/[id]/photos/route.ts` | 42 | `const bookingId = formData.get("booking_id") as string \| null;` | MEDIUM (no UUID check) |
| `app/api/salon/documents/route.ts` | 44 | `const file = formData.get("file") as File \| null;` | LOW |
| `app/api/salon/documents/route.ts` | 45 | `const document_type = formData.get("document_type") as string;` | MEDIUM (no enum check, no null check) |
| `app/api/admin/discovery/upload/route.ts` | 26 | `const file = formData.get("file") as File \| null;` | LOW |
| `app/api/admin/discovery/upload/route.ts` | 27 | `const category = formData.get("category") as string \| null;` | MEDIUM (no enum check on category) |
| `app/api/dashboard/coiffeur/formula-photo/route.ts` | 40–43 | 4× `formData.get("...") as ...` | MEDIUM |
| `app/api/salons/[slug]/gallery/route.ts` | 16 | `const file = formData.get("file") as File;` | **MEDIUM** — missing `\| null` makes downstream crash on missing file |
| `app/api/services/[id]/photos/route.ts` | 30 | `const file = formData.get("file") as File \| null;` | LOW |
| `app/api/services/import/route.ts` | 14, 15 | file + salonId | MEDIUM (CSV import — no UUID check on salonId) |

**Fix:** for string fields with constraints (enums, UUIDs, lengths), define a per-route Zod schema for the non-File parts, then validate before insert.

---

## `request.headers.get()` audit (31 sites)

Mostly cron auth-secrets and Authorization header reads. The dangerous part isn't reading — it's the comparison.

### HIGH — cron secret comparison without constant-time check

| file | line | snippet |
|---|---|---|
| `app/api/cron/birthday-messages/route.ts` | 9 | `const authHeader = req.headers.get("authorization");` then `=== \`Bearer ${CRON_SECRET}\`` |
| `app/api/cron/welcome-series/route.ts` | 13 | same |
| `app/api/cron/no-show/route.ts` | 7 | same |
| `app/api/cron/rebooking-nudge/route.ts` | 11 | same |
| `app/api/cron/salon-onboarding/route.ts` | 18 | same |
| `app/api/cron/auto-complete/route.ts` | 8 | same |
| `app/api/cron/generate-slots/route.ts` | 9 | same |
| `app/api/cron/late-cancel/route.ts` | 16 | same |
| `app/api/cron/release-deposits/route.ts` | 9 | same |
| `app/api/cron/nail-infill-reminders/route.ts` | 9 | same |
| `app/api/cron/barber-smart-reminders/route.ts` | 10 | same |
| `app/api/cron/pre-charge/route.ts` | (similar) | same |
| `app/api/cron/release-payments/route.ts` | (similar) | same |
| `app/api/loyalty/award/route.ts` | 16 | same |
| `app/api/admin/badges/auto-assign/route.ts` | 10 | same |
| `app/api/admin/solen-score/recalculate/route.ts` | 13 | same |

**Risk:** plain `===` is timing-attack vulnerable if a CRON_SECRET is short. Replace with `crypto.timingSafeEqual(...)`.

**Risk #2:** `app/api/salons/[slug]/gallery/route.ts:17` — `req.headers.get("Authorization")?.split("Bearer ")[1]` — string-split parsing of auth header without case-normalization. `bearer` (lowercase) returns wrong result.

---

## `catch (err: any)` audit (21 sites)

TypeScript 4.4+ defaults catch-bound to `unknown`. Each `: any` here is an explicit downgrade.

| file | line | severity |
|---|---|---|
| `app/[locale]/vouchers/buy/page.tsx` | 143 | MEDIUM |
| `app/api/notify/review-posted/route.ts` | 47 | LOW |
| `app/api/notify/review-replied/route.ts` | 39 | LOW |
| `app/api/gift-cards/purchase/route.ts` | 101 | MEDIUM (payment) |
| `app/api/bookings/[id]/route.ts` | 142 | MEDIUM |
| `app/api/bookings/[id]/cancel/route.ts` | 76 | MEDIUM (stripeErr) |
| `app/api/bookings/[id]/refund/route.ts` | 74 | MEDIUM (stripeErr) |
| `app/api/discovery/feed/route.ts` | 63 | LOW |
| `app/api/admin/booking-disputes/[id]/action/route.ts` | 125 | MEDIUM (refund flow) |
| `app/api/admin/tos/notify/route.ts` | 71, 81 | LOW |
| `app/api/recommendations/route.ts` | 224 | LOW |
| `app/api/dashboard/clients/[id]/tags/route.ts` | 68 | LOW |
| `app/api/dashboard/clients/[id]/notes/route.ts` | 69 | LOW |
| `app/api/ai/intake-recommendation/route.ts` | 88 | LOW |
| `app/api/packages/purchase/route.ts` | 87 | MEDIUM (payment) |
| `app/api/vouchers/create/route.ts` | 122 | MEDIUM (money) |
| `app/api/tips/route.ts` | 70 | MEDIUM (money) |
| `app/api/staff/[id]/availability/route.ts` | 39 | LOW |
| `app/api/cron/pre-charge/route.ts` | 79 | MEDIUM (payment) |
| `app/api/cron/release-payments/route.ts` | 53 | MEDIUM (payment) |

**Fix:** drop `: any`, narrow with `err instanceof Error ? err.message : "Unknown error"` or `if (err instanceof Stripe.errors.StripeError) { ... }`.

---

## Cross-cutting recommendations

1. **Generate `lib/database.types.ts`** via `npx supabase gen types typescript --project-id <id> > lib/database.types.ts`. Wire it into all 4 wrapper definitions in `lib/supabase.ts` and `lib/supabase-browser.ts`. This is the single highest-leverage fix.
2. **Move the 9 inline `createClient` calls in `supabase/functions/*` to a shared `_shared/supabase.ts`** that takes the `Database` type. Today each edge function re-creates the client.
3. **Default route shape:** `import { validateBody, fooSchema } from "@/lib/validations"; const body = await req.json(); const { data, error } = validateBody(fooSchema, body); if (error) return ...;` — already the pattern in ~half of routes (e.g. `app/api/bookings/route.ts:50`, `app/api/gift-cards/purchase/route.ts:32`). Apply to the 43 unvalidated routes.
4. **Constant-time secret compare:** introduce `lib/cron-auth.ts` with `verifyCronSecret(req)` using `crypto.timingSafeEqual`. Replace the 16 cron auth strips.
5. **`safeJsonParse<T>(s, schema)` helper** for the 20 `JSON.parse` sites — especially `app/[locale]/checkout/page.tsx:144` (URL-controlled JSON cast to `BookingIntent`).
6. **Drop `: any` from 21 catch blocks** — TS unknown + narrowing is a one-line fix per site.

---

## Final count

- **15** untyped Supabase client creation sites
- **0** typed Supabase client creation sites
- **0** existing `database.types.ts`
- **125** migrations not reflected in TS types
- **43** API routes with `await req.json()` and zero validation
- **20** `JSON.parse` sites
- **15** `formData.get` casts
- **21** `catch (err: any)` sites
- **31** `request.headers.get(...)` reads (16 cron-secret comparisons)
- **~1314** untyped `.from()` downstream call-sites (cascade)

**~1459 individual findings total.**
