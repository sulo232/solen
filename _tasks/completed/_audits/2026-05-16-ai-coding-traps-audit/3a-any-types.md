# Topic 3A — `any` Types Audit

**Date:** 2026-05-16
**Scope:** All non-generated TS/TSX outside `node_modules/`, `.next/`, `_audits/`, `_tasks/`, `_rules/`, `_docs/`, `_specs/`, `_plans/`, `_visual-qa/`, `public/`, `.claude/`
**Stack:** Next.js 15 App Router · TS (strict) · Tailwind · Supabase · Stripe
**Note:** No `lib/database.types.ts` exists — Supabase Database types are not generated. This is the root cause of most `as any` cluster on Supabase rows.

---

## Summary

### Aggregate totals

| Pattern | Count |
|---|---|
| `: any` annotations (function params, variables, return types, catch clauses) | **109** |
| `as any` casts | **431** |
| `any[]` arrays | **15** |
| `Record<string, any>` | **10** |
| `useState<any>` / `useRef<any>` / `createContext<any>` | **10** |
| `extends any` in generics | **0** |
| `is any` type predicates | **0** |
| `Promise<any>` return | **0** |
| `(...args: any[])` variadics | **0** |

**Combined union (`: any` + `as any` + `any[]` + `Record<string, any>` + React generics with any):** **575** distinct annotation/cast instances across **232 files** containing `as any`, **68 files** containing `: any`.

### Big finding — `useTranslations(...) as any` is 45 % of all `as any`

Of the 431 `as any` casts, **194 (45 %)** are of the form `const t = useTranslations("namespace") as any`. This is a single systemic pattern (typed-keys problem with next-intl). Excluding it, the remaining `as any` count is **237**.

### Severity breakdown

| Severity | Count | Definition |
|---|---|---|
| **HIGH** | **143** | API route handlers, server actions, Supabase wrappers, edge functions — `any` breaks request/response type safety and silently widens DB row types. Includes 75 `as any` + 55 `: any` in `app/api/` plus 4 in `supabase/functions/` plus 9 in `lib/{supabase,nail,barber,stripe,notifications,ai-vision,ratelimit}`. |
| **MEDIUM** | **108** | Shared client utilities, hooks, page-level data adapters that fan out to many surfaces (e.g. `useTranslations as any` 194 of which ~30 are in shared scaffolding; salon detail page 23 `as any` over union-typed `salon` object; `app/[locale]/partner/page.tsx` 11 `as any` for translations + dynamic data; `confirmation/page.tsx` 8). |
| **LOW** | **324** | Component-internal variables with simple types, mostly `useTranslations as any` in leaf components, `(window as any).posthog`, one-off cast in single component file. |

### By location (counting all forms — `: any`, `as any`, `any[]`, `Record<string, any>`, `<any>`)

| Location | `as any` | `: any` | Notes |
|---|---|---|---|
| `app/api/` (API route handlers) | 75 | 55 | 34 files with `: any`, 39 files with `as any`. **HIGH** — Supabase select rows widened on every access pattern. |
| `app/[locale]/` (page components) | ~120 | 18 | Salon detail page alone has 23 `as any`; settings page 9; partner 11; confirmation 8. |
| `components-legacy/` | 211 | 30 | The biggest tree of legacy any-cluster. 51 of 75 files in this dir have `as any`. |
| `lib/` (utilities, wrappers) | 3 | 11 | `lib/supabase.ts` 3 (`cookiesToSet: any[]`); `lib/notifications.ts` 2; `lib/stock-photos.ts` 4; `lib/nail/` and `lib/barber/` use `supabase: any` parameter. |
| `middleware.ts` | 0 | 3 | Cookie array typing — `cookiesToSet: any[]` × 3. |
| `src/` | 0 | 1 | `expandable-tabs.tsx` `icon: any`. |
| `supabase/functions/` | 5 | 0 | Edge function `booking-reminder` casts joined `b.profiles`, `b.services`, `b.salons`. |
| `tmp*.tsx` (committed in repo root) | 6 | 0 | `tmp_out.tsx`, `tmp3.tsx`, `tmp_header.tsx` — dead temp files tracked in git. |

### Top 10 files by `as any` count

| Rank | File | `as any` count |
|---|---|---|
| 1 | `app/[locale]/salon/[slug]/page.tsx` | 23 |
| 2 | `components-legacy/dashboard/DashboardLayout.tsx` | 11 |
| 2 | `app/[locale]/partner/page.tsx` | 11 |
| 4 | `app/api/stripe/webhook/route.ts` | 10 |
| 5 | `app/[locale]/dashboard/settings/page.tsx` | 9 |
| 6 | `components-legacy/dashboard/waxing/BodyZoneSelector.tsx` | 8 |
| 6 | `components-legacy/ProfilePage.tsx` | 8 |
| 6 | `app/[locale]/confirmation/page.tsx` | 8 |
| 9 | `components-legacy/CategoryHero.tsx` | 7 |
| 10 | `components-legacy/search/SplitView.tsx` | 6 |
| 10 | `components-legacy/dashboard/makeup/FaceChartBuilder.tsx` | 6 |

### Top 5 files by `: any` count

| Rank | File | `: any` count |
|---|---|---|
| 1 | `app/api/profile/live-state/route.ts` | 11 |
| 2 | `app/[locale]/salon/[slug]/page.tsx` | 6 |
| 3 | `app/api/recommendations/route.ts` | 5 |
| 4 | `lib/stock-photos.ts` | 4 |
| 4 | `app/api/dashboard/spa/rooms/route.ts` | 4 |

---

## Findings — grouped by category

### Category A — `useTranslations(...) as any` (194 instances)

**Pattern:** `const t = useTranslations("home") as any;`
**Where:** Components-legacy (~150) + app/[locale]/* pages (~40) + tmp files (4).
**Why it exists:** `next-intl`'s `useTranslations` returns a strict type that only accepts known keys; developers cast `as any` to call `t(dynamicKey)` or to pass `t` through to child components that don't accept the strict signature. Several occurrences pass `t={t as any}` from a parent to a child step component.
**Severity:** MEDIUM where the dynamic key is computed (e.g. `t(\`setup.steps.${step.key}\` as any)`), LOW for the pure `useTranslations(...) as any` at component top.
**Recommendation:** Generate typed message keys (`MessageKeys` from next-intl) once. Replace dynamic patterns with `t.rich()` / `t.has()` for unknown keys. For step pass-through, type the prop as `(key: MessageKeys) => string`. This single fix eliminates 194 of 431 `as any` casts.

Representative examples:
- `components-legacy/HomePage.tsx:63` — `const t = useTranslations("home") as any;`
- `app/[locale]/onboarding/salon/page.tsx:676,682,689` — `t={t as any}` passed down to 4 step components
- `app/[locale]/onboarding/salon/page.tsx:660` — `t(\`progress.${STEP_META[step - 1]?.label}\` as any)` (dynamic key)
- `components-legacy/shared/BodyDiagram.tsx:59` / `FaceDiagram.tsx:64` — `t(\`body_${zone.id}\` as any)`

### Category B — Untyped Supabase row access (~120 instances, HIGH severity)

**Pattern:** `(booking.salons as any)?.name`, `(booking.services as any)?.name_de`, `const salon = booking.salons as any`
**Where:** Most API routes that do a Supabase `.select(\`id, salons(name), services(name_de)\`)` then access the joined fields. Also in edge function `supabase/functions/booking-reminder/index.ts`.
**Why:** No `lib/database.types.ts` is generated; `supabase-js` returns `unknown` on joined relations without typed `Database` parameter. Developers reach for `as any` instead.
**Severity:** HIGH — this is in money-handling paths (stripe webhook, refund, pre-charge, cron payouts).

Representative examples:
- `app/api/stripe/webhook/route.ts:112-172` — 10 instances over webhook event handlers; the joined `booking.services` and `booking.salons` are accessed as `(booking.services as any)?.name_de`. Stripe webhook is the highest-risk surface; silent property typos here can wipe an email body and the test suite won't catch it.
- `app/api/cron/pre-charge/route.ts:39,89` — `(booking.salons as any)?.stripe_account_id` — incorrect chain here means failing to charge a customer.
- `app/api/cron/late-cancel/route.ts:44` — `const salon = (booking as any).salons`
- `app/api/cron/review-prompt/route.ts:46,47,122` — `const salon = booking.salons as any; const profile = booking.profiles as any;`
- `app/api/cron/sms-reminders/route.ts:51,52,95,96` — same join pattern
- `app/api/conversations/[id]/messages/route.ts:114,123,128` — message notify path
- `app/api/loyalty/stamp/route.ts:63` — `(card.barber_loyalty_programs as any)?.stamps_required`
- `app/api/bookings/route.ts:79,127` — `(slot.salons as any)?.booking_confirmation_mode`, `?.owner_id`
- `app/api/bookings/[id]/dispute/route.ts:25` / `report/route.ts:138` — `dispute.bookings as any`
- `app/api/bookings/express-rebook/route.ts:42,43` — `source.services as any; source.staff_members as any`
- `app/api/packages/[id]/route.ts:33` — `(pkg as any).salons?.owner_id !== user.id` (auth check on `as any` is a real risk)
- `app/api/packages/purchase/route.ts:44` — `(pkg.salons as any)?.stripe_account_id`
- `app/api/dashboard/clients/route.ts:55` — `(b.staff_members as any)?.name`
- `app/api/dashboard/barber-reminders/route.ts:95` — `preferred_barber: (lastBooking?.staff_members as any)?.name`
- `app/api/earnings/staff/route.ts:55` — `const price = (b.services as any)?.price ?? 0` (financial total)
- `app/api/analytics/referrals/route.ts:65` — `(r.profiles as any).first_name`
- `app/api/barber/[slug]/portfolio/route.ts:28` + `route.ts:29` — `const salon = barber.salons as any`
- `app/api/gift-cards/balance/route.ts:45` — `(card.salons as any)?.name`
- `app/api/tips/route.ts:44` — `(booking.salons as any)?.stripe_account_id`
- `supabase/functions/booking-reminder/index.ts:57,59,60,61` — `(b.profiles as any)?.locale`, `(b.services as any)?.name_en`, `(b.salons as any)?.name` — Deno edge function notification path

**Recommendation:** Generate Database types once via `supabase gen types typescript`. Annotate `createServerClient<Database>(…)`. Then `.select("…, salons(name)")` returns a properly typed row and `as any` becomes unnecessary. This single fix eliminates an estimated 120+ casts.

### Category C — `catch (err: any)` (27 instances, mostly HIGH-LOW mixed)

**Pattern:** `catch (err: any) { return NextResponse.json({ error: err.message }) }`
**Severity:** HIGH when the message is forwarded to the client (leaks internal Stripe errors / SQL hints); LOW when it's logged-only.

Representative examples:
- `app/api/packages/purchase/route.ts:87` `} catch (err: any) {`
- `app/api/ai/intake-recommendation/route.ts:88` — same
- `app/api/vouchers/create/route.ts:122` — Stripe error path
- `app/api/tips/route.ts:70`, `app/api/notify/review-replied/route.ts:39`, `notify/review-posted/route.ts:47`
- `app/api/bookings/[id]/cancel/route.ts:76` — `catch (stripeErr: any)`
- `app/api/bookings/[id]/refund/route.ts:74` — `catch (stripeErr: any)`
- `app/api/admin/booking-disputes/[id]/action/route.ts:125` — `catch (stripeErr: any)`
- `app/api/admin/tos/notify/route.ts:71,81`
- `components-legacy/ReviewForm.tsx:116`, `disputes/ReportProblemModal.tsx:52`, `ui/ImageUpload.tsx:142`, `discovery/KISection.tsx:80`, `dashboard/DisputeNotification.tsx:37`, `dashboard/SalonAboutEditor.tsx:51`
- `app/[locale]/vouchers/buy/page.tsx:143`

**Recommendation:** `catch (err: unknown)` + narrow via `err instanceof Error` or `if (typeof err === 'object' && err && 'message' in err)`. TypeScript 4.4+ even has the `useUnknownInCatchVariables` compiler flag — not currently enabled in this project's `tsconfig.json`. Turning it on surfaces all 27.

### Category D — `.map((x: any) => …)` / `.filter((x: any) => …)` callbacks (~40 instances)

**Pattern:** `(data ?? []).map((salon: any) => ({ … }))`
**Where:** API routes mapping Supabase result rows to API DTOs.
**Severity:** HIGH (same root cause as B — no `Database` types). These are the response-shaping callbacks that decide what the client sees.

Representative examples:
- `app/api/profile/favorites/route.ts:36` — `(salons ?? []).map((salon: any) => …)` shapes the favorites response
- `app/api/profile/live-state/route.ts:62,90,98,99,126,135,136,162,188` — the priority resolver builds 5 different response shapes using `any` row aliases (`const b: any = upcomingBookings[0]`, etc.). 11 `: any` in one file.
- `app/api/reviews/featured/route.ts:24` — `.map((r: any) => …)`
- `app/api/reviews/salon/[salon_id]/route.ts:40`
- `app/api/staff/featured/route.ts:62`
- `app/api/slots/last-minute/route.ts:33`
- `app/api/recommendations/route.ts:94,95,102,196` — recommendation building including the LLM-output mapping `parsed.recommendations.map((r: any) => …)`
- `app/api/cron/rebooking-nudge/route.ts:44,55,78,86,87` — cron decides who gets nudge SMS
- `lib/stock-photos.ts:34,41,63,91` — Unsplash/Pexels/Pixabay JSON shape (defensible — third-party JSON; should be `unknown` + zod parse, not `any`).

**Recommendation:** Generated DB types fix the Supabase ones (90 % of the cluster). Third-party JSON (`lib/stock-photos.ts`) should switch to `unknown` + a zod schema per provider.

### Category E — Generic-instantiation `<any>` (10 instances, MEDIUM)

**Pattern:** `useState<any>(null)`, `useState<any[]>([])`, `useRef<any>(null)`

| File | Line | Code |
|---|---|---|
| `components-legacy/staff/StaffAvailability.tsx` | top | `const [schedules, setSchedules] = useState<any[]>([])` |
| `components-legacy/home/NearbySection.tsx` | top | `const [salons, setSalons] = useState<any[]>([])` |
| `components-legacy/ui/PWAInstallPrompt.tsx` | top | `const deferredPrompt = useRef<any>(null)` (BeforeInstallPromptEvent — should be the proper interface) |
| `app/[locale]/salon/[slug]/page.tsx` | hooks | `const [nextSlot, setNextSlot] = useState<any>(null)` |
| `components-legacy/dashboard/nail/NailClientTab.tsx` | hooks | `useState<any[]>([])` × 2 (`notes`, `tags`) |
| `app/[locale]/salon/[slug]/gift-card/page.tsx` | hooks | `useState<any>(null)` (salon row) |
| `app/[locale]/dashboard/discovery-admin/page.tsx` | hooks | `useState<any[]>([])` (photos) |
| `app/[locale]/dashboard/gallery/page.tsx` | hooks | `useState<any>(null)` (salon row) |
| `app/[locale]/tip/[bookingId]/page.tsx` | hooks | `useState<any>(null)` (booking row) |

**Severity:** MEDIUM — these define the shape that downstream JSX trusts; a missing field shows up as runtime undefined at render. **Lazy escape from a real type** — every one of these has a proper type already declared elsewhere (`Salon` from `_shared.ts`, `BookingRow`, etc.).

### Category F — Function-parameter `any` on shared utilities (HIGH)

| File | Line | Signature |
|---|---|---|
| `lib/barber/chair-availability.ts` | 2-3 | `export async function checkChairAvailability(supabase: any, salonId: string, …)` |
| `lib/nail/station-availability.ts` | 5-6 | `export async function checkStationAvailability(supabase: any, salonId: string, …)` |
| `lib/supabase.ts` | 31,34,68 | `setAll(cookiesToSet: any[])`, destructure `({ name, value, options }: any)` (cookie array type) |
| `lib/notifications.ts` | 52,56 | `params.data?: any`, `params.emailParams.vars: any` |
| `lib/booking-context.tsx` | 10 | `payload?: any` (in BookingAction type) |
| `lib/stock-photos.ts` | 34,41,63,91 | mappers over external JSON |
| `lib/stripe.ts` | 18 | `return (getStripe() as any)[prop]` — Proxy escape (defensible but adds undeclared surface) |
| `lib/ai-vision.ts` | 266 | `(parsed as any)._freshThumbnailUrl = …` (mutating parsed result with side-channel) |
| `lib/ratelimit.ts` | 10 | `: null as any` cast — defensible fallback when Upstash creds missing, but should be typed as `Ratelimit | null` |
| `middleware.ts` | 120-125 | `setAll(cookiesToSet: any[])` × 3 cookie destructures |

**Severity:** HIGH — `supabase: any` on the chair/nail availability helpers means a typo on a Supabase method call (e.g. `.fr` instead of `.from`) is not caught. These are called from API routes (`app/api/walkin/queue/route.ts`, `app/api/bookings/route.ts`).

**Recommendation:** Type as `SupabaseClient<Database>` from `@supabase/supabase-js` once Database types are generated. The cookie `any[]` in `lib/supabase.ts` and `middleware.ts` should use the standard `{ name: string; value: string; options?: CookieOptions }[]` from `@supabase/ssr`.

### Category G — Local variable widening (HIGH severity, scattered)

**Pattern:** `const updates: any = { status }; if (refunded) updates.refund_amount = …`
**Where:** Several API write paths build update payloads with `: any` to allow optional fields.

| File | Line | Code |
|---|---|---|
| `app/api/bookings/[id]/route.ts` | 79 | `const updates: any = { status };` |
| `app/api/admin/salons/[id]/warn/route.ts` | 40 | `const updateData: any = { warning_count: newCount };` |
| `app/api/vouchers/create/route.ts` | 48 | `const couponParams: any = { … };` (Stripe coupon params) |
| `components-legacy/admin/BookingDisputePanel.tsx` | 51 | `const body: any = { action, resolution_note: … }; if (refund) body.refund_amount = …` |
| `app/api/dashboard/today/route.ts` | 88,93,94 | `(sum, b: any) => …`, `let nowBooking: any = null;`, `const upNextRows: any[] = [];` |
| `app/api/reviews/[id]/photos/route.ts` | 50 | `const uploadedRecords: any[] = [];` |
| `app/api/admin/discovery/smart-import/route.ts` | 84 | `const allPhotos: any[] = [];` |
| `app/[locale]/profile/favorites/page.tsx` | 57 | `let salons: any[] = [];` |
| `app/api/dashboard/spa/rooms/route.ts` | 46,65,88,116 | `auth as { user: any; salon: { id: string }; … }` × 4 |
| `app/api/dashboard/spa/wellness-journal/route.ts` | 48,72 | same `user: any` cast on auth tuple |
| `app/api/stripe/webhook/voucher-handler.ts` | 14 | `export async function handleVoucherPurchase(pi: any): Promise<boolean>` (PaymentIntent typed as any) |
| `app/api/loyalty/award/route.ts` | 73 | `card: { stamps_needed: number; reward_text: string; salons: any }` (partial typing — `salons` left as any) |

**Severity:** HIGH — `updates: any` makes the next refactor of the bookings table silent. Stripe's `PaymentIntent` and `Stripe.Event.Data.Object` are well-typed by `stripe@latest`; widening them to `any` is a lazy escape.

### Category H — Stripe Event-object widening (HIGH, security-adjacent)

**Pattern:** `const si = event.data.object as any; const account = event.data.object as any;`
**Where:** `app/api/stripe/webhook/route.ts:193,207,232,252,277`
**Severity:** HIGH. Stripe ships discriminated-union types for every event (`Stripe.Account.Updated.Data.Object`, etc.). Casting `as any` skips the narrowing and any field-rename in a Stripe Node SDK upgrade goes silently broken. This is the same surface that decides whether to release payouts.
**Recommendation:** Use `Stripe.Event.Data.Object` and narrow on `event.type`. Specifically:
- `payment_intent.succeeded` → `event.data.object as Stripe.PaymentIntent`
- `account.updated` → `event.data.object as Stripe.Account`
- `charge.refunded` → `event.data.object as Stripe.Charge`
- `payout.paid` / `payout.failed` → `event.data.object as Stripe.Payout`

These are typed casts (still `as`, but to a real type), not `as any`.

### Category I — JSX prop pass-through `as any` (LOW–MEDIUM)

Pattern: `<SalonCard salon={s as any} … />` where the consumer expects a richer object than the producer returns. Indicates a mismatch between the two component contracts.

Examples:
- `components-legacy/home/NearbySection.tsx:55` — `<SalonCard salon={s as any} />` (where `s` is `Salon` but `SalonCard` expects an extended row)
- `app/[locale]/behandlungen/[...slug]/page.tsx:204`, `TreatmentsClient.tsx:205` — `salon={salon as any}` × 2
- `components-legacy/discovery/KISection.tsx:163` — `salon={salon as any}`
- `components-legacy/SalonCard.tsx:189` — `toggleCompare(salon as any)` (compare-context expects different shape)

**Severity:** MEDIUM. Real risk: when `Salon` type adds a required field the JSX prop check still passes because of `as any`.

### Category J — `(window as any).posthog` (LOW)

- `components-legacy/ui/CookieBanner.tsx:49,50,60,61` — opt-in/opt-out PostHog from window.

**Severity:** LOW. Defensible if PostHog's snippet is loaded externally without a typed shim. Use `declare global { interface Window { posthog?: PostHog } }` instead.

### Category K — Misc field-access escapes (LOW)

- `components-legacy/discovery/BookCTA.tsx:56` — `(item as any).estimated_time_minutes`
- `components-legacy/booking/PayConfirmStep.tsx:50` — `(salon as any).cancellation_window_hours ?? 24`
- `components-legacy/salon/SalonReviews.tsx:232,342` — `(rev as any).booking_id`, `(rev as any).salon_response`
- `components-legacy/onboarding/steps/OpeningHoursStep.tsx:59` — `const { break_start, break_end, ...rest } = curr as any`
- `components-legacy/ChatWindow.tsx:130` — `(others[0] as any).name`
- `components-legacy/ProfilePage.tsx:757,837,907` — `loyaltyRes as any`, `profile.customer_preferences as any`, `profile.customer_preferences as any`?.beauty

These are all **lazy escapes from a real type** — the source type exists but is missing the field the developer wants to read. Either the type needs the field, or the runtime check needs to come back from the API as a different shape.

### Category L — Dynamic-key index access (LOW–MEDIUM)

Pattern: `(salon as any)[\`about_text_${locale}\`]` — TypeScript can't narrow on a template-literal property name without a typed index signature.

- `app/[locale]/salon/[slug]/page.tsx:526` — `(salon as any)[\`about_text_${locale}\`] || salon.about_text_en || salon.about_text_de`
- `app/api/stripe/webhook/route.ts:112` — `(booking.services as any)?.[\`name_${locale}\`]`
- `app/api/cron/review-prompt/route.ts:122` — `(t as any)[userLocale] || t.de`

**Recommendation:** Type the row with a `LocalizedField<\`name\`>` template-literal helper (e.g. `type LocalizedField<F extends string> = { [K in \`${F}_de\` | \`${F}_en\` | \`${F}_fr\` | \`${F}_it\`]?: string }`). Eliminates this whole bucket cleanly.

### Category M — `Record<string, any>` (10 instances, MEDIUM)

Used in 7 files (per `--count-matches`). Each is a config-bag pattern (e.g. `posthog.capture(event, properties: Record<string, any>)`). Examples:
- `lib/supabase.ts:2` instances on options-bag types
- `lib/posthog-server.ts:2` properties bag for analytics
- `app/[locale]/dashboard/bookings/page.tsx:2`, `components-legacy/dashboard/nail/NailClientTab.tsx:2` — local state shape
- `middleware.ts:1`, `app/api/walkin/queue/[id]/route.ts:1`, `app/api/staff/[id]/slug/route.ts:1`, `app/api/slots/[id]/route.ts:1`, `app/api/salons/route.ts:1`, `app/api/reviews/[id]/photos/route.ts:1`, `app/api/recommendations/route.ts:1`, `app/api/nail/hand-chart/route.ts:1`, `app/api/dashboard/today/route.ts:1`, `app/api/dashboard/nail/infill-due/route.ts:1`, `app/api/admin/discovery/smart-import/route.ts:1`, `app/[locale]/profile/favorites/page.tsx:1`, `app/[locale]/dashboard/discovery-admin/page.tsx:1`

**Severity:** MEDIUM for analytics property bags (`Record<string, unknown>` is the correct alternative). LOW where it's a config-bag at module boundary.

---

## Patterns observed

1. **No generated Database types is the single biggest accelerator.** ~120 of the 431 `as any` casts directly access `b.salons`, `b.services`, `b.profiles`, `b.staff_members`, etc. — all joined Supabase relations that would be typed automatically if `Database` were generated and passed to `createServerClient<Database>`.
2. **next-intl typed keys are the second biggest accelerator.** 194 of 431 `as any` are `useTranslations(...) as any` or `t(dynamicKey as any)`. A one-time `next-intl.d.ts` declaration eliminates this entire category.
3. **`catch (err: any)` is endemic** (27). Turning on `useUnknownInCatchVariables` in `tsconfig.json` surfaces every one at compile time.
4. **Stripe SDK widening is high-risk** but small in volume (5 in `stripe/webhook/route.ts`). Each one is a money path.
5. **Untyped `supabase: any` parameter on shared helpers** (`lib/barber/chair-availability.ts`, `lib/nail/station-availability.ts`) is a HIGH-severity pattern even though the count is small — these gate availability writes.
6. **Three categories of "real type missing"** drive most variable-level `: any`:
   a. **Beauty/customer preferences JSON** in `profiles.customer_preferences` is jsonb and the codebase has no zod schema for it (`components-legacy/ProfilePage.tsx:837,907`).
   b. **Salon "extended" fields** like `quartier`, `facebook_url`, `tiktok_url`, `website_url`, `atmosphere`, `expertise`, `products`, `nearest_transport`, `about_text_${locale}`, `cancellation_window_hours`, `booking_confirmation_mode` are accessed via `(salon as any).field` because the `Salon` type in `_shared.ts` lacks them.
   c. **External-API JSON** (Unsplash, Pexels, Pixabay, Gemini structured output) — no zod parse layer.
7. **Tracked tmp files contribute noise** — `tmp_out.tsx`, `tmp3.tsx`, `tmp_header.tsx` should be deleted from git; they account for 6 `as any` casts and 0 `: any` annotations.
8. **`tsconfig.json` does NOT have `noImplicitAny`** explicitly disabled, but **does NOT have `strict: true`** with `useUnknownInCatchVariables` either. The codebase relies on TS strict implicit defaults; this is fine, but a single config flip surfaces 27 catch-anys.

---

## Recommendations (priority-ranked)

| Priority | Action | `any` removed | Effort |
|---|---|---|---|
| 1 | **Generate Database types**: `supabase gen types typescript --linked > lib/database.types.ts`, then `createServerClient<Database>(…)` and `createAdminSupabaseClient<Database>(…)` in `lib/supabase.ts`. | ~120 `as any` + ~30 `: any` (mappers) | Half-day. Largest single win. |
| 2 | **Type next-intl messages**: add `global.d.ts` with `declare module 'next-intl' { interface IntlMessages extends MessagesShape {} }` based on a generated `MessagesShape` from `messages/de.json`. Remove all `as any` on `useTranslations`. | 194 `as any` | One-time setup ~2 hours. |
| 3 | **Enable `useUnknownInCatchVariables`** in `tsconfig.json` and pass through fixing each catch. Combine with a `getErrorMessage(err: unknown): string` helper. | 27 `catch (err: any)` | One pass, ~1 hour. |
| 4 | **Type Stripe events properly** in `app/api/stripe/webhook/route.ts`. Use the SDK's discriminated unions. | 10 `as any` (HIGH risk) | 1 hour for the 1 file. |
| 5 | **Type `lib/{barber,nail}/*-availability.ts`** to take `SupabaseClient<Database>`. | 2 `: any` (HIGH risk) | Trivial after step 1. |
| 6 | **Replace `useState<any>` / `useRef<any>`** with the proper row types from `Database`. | 10 generic-any | Per-component, ~15 min each. |
| 7 | **Add `Salon` extended type** in `app/[locale]/_components/salon/_shared.ts` covering `quartier`, `facebook_url`, `tiktok_url`, `website_url`, `atmosphere`, `expertise`, `products`, `nearest_transport`, `about_text_de/en/fr/it`. | 23 `as any` in `salon/[slug]/page.tsx` | 1 hour. |
| 8 | **Delete tracked `tmp_*.tsx`** files from repo root. | 6 `as any` + dead code | 1 minute. |
| 9 | **Zod parsing on third-party JSON** (Unsplash, Pexels, Pixabay, Gemini, posthog). | ~10 `(p: any)` + `Record<string, any>` | 2-3 hours total. |
| 10 | **Replace `Record<string, any>` with `Record<string, unknown>`** for analytics property bags. | 10 instances | Trivial. |

**If steps 1 + 2 alone are completed: ~330 of 575 total `any` instances (57 %) are eliminated mechanically.**

---

## Closing note on `unknown` vs `any`

Many of the catch-clauses, third-party JSON callbacks, and PostHog windows are genuinely-unknown shapes. The correct replacement is `unknown` + narrowing, **not** the specific type. The audit recommends `unknown` for:
- `catch (err: unknown)` × 27
- Third-party JSON map callbacks (Unsplash et al.)
- `(window as Window & { posthog?: unknown }).posthog` then narrow

For lazy escapes (everything in Category B, F, G, K), the recommendation is the actual type, not `unknown`.
