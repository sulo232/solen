# Code Safety Rules (MANDATORY — ZERO EXCEPTIONS)

> **CONTEXT**: On 2026-03-17, an AI agent executed a roadmap and created a mega-commit that broke the entire production site. It imported 4 components that didn't exist, called 4 APIs that didn't exist, and deviated from the roadmap spec. This section exists to prevent that from EVER happening again.

---

## Rule 1: VERIFY IMPORTS EXIST BEFORE USING THEM
Before writing `import Foo from "@/components/Foo"`:
1. **Check** if `components/Foo.tsx` (or `Foo/index.tsx`) actually exists in the file system
2. If it does NOT exist → you MUST create it FIRST, or remove the import
3. **NEVER** import a component, hook, type, or utility that doesn't exist yet

**Verification command:**
```bash
ls -la components/Foo.tsx  # Must return the file, not "No such file"
```

## Rule 1b: THIRD-PARTY FALLBACKS (MANDATORY)
> **INCIDENT**: The Mapbox MapView broke production when the API key was missing or connection failed, leaving a blank gap.
- **ALWAYS** implement generic text/link fallback UI states for third-party widgets (e.g., Maps, Video players) in case of missing API keys, rate limits, or network failures. Never let a missing API token cause a blank screen or crash.

## Rule 2: VERIFY API ROUTES EXIST BEFORE CALLING THEM
Before writing `fetch("/api/some-endpoint")`:
1. **Check** if `app/api/some-endpoint/route.ts` exists
2. If it does NOT exist → you MUST create the API route FIRST, or remove the fetch call
3. **NEVER** call an API endpoint that doesn't exist — this causes 404/500 errors in production

**Verification command:**
```bash
ls -la app/api/some-endpoint/route.ts
```

## Rule 3: ONE COMMIT PER SUB-PHASE
- If a roadmap has phases `1.1`, `1.2`, `1.3` → make **separate commits** for each
- **NEVER** combine multiple phases into one mega-commit
- Each commit message must reference the sub-phase: `"phase 1.1: fix layout overflow"`
- After EACH commit: `npm run build` must pass BEFORE pushing

## Rule 4: BUILD BEFORE COMMIT, PUSH AFTER BUILD — ALWAYS PUSH
```bash
# This exact sequence. Every time. No exceptions.
npm run build           # Step 1: MUST pass
git add -A              # Step 2: only after build passes
git commit -m "..."     # Step 3: descriptive message with phase number
git push origin main    # Step 4: ALWAYS push after commit — never ask, just push
# Step 5: Check Vercel deployment via MCP (list_deployments) — must show READY
# Step 6: If errors → fix and push again. If READY → done.
```
If `npm run build` fails → **DO NOT commit. DO NOT push. Fix the error first.**
**IMPORTANT**: After executing a roadmap or task, ALWAYS commit AND push without asking. Do not stop to ask "should I push?" — the answer is always yes. Then verify the Vercel deployment status and fix any errors.

## Rule 5: FOLLOW THE ROADMAP LITERALLY
When executing a roadmap from `_tasks/`:
- Build EXACTLY what the roadmap specifies — no more, no less
- If the roadmap says "use `lucide-react` Scissors icon" → use that exact icon, not a custom SVG
- If the roadmap says "6 category cards" → build exactly 6, not 8
- If the roadmap says "use existing `<SalonCard>` component" → import and use the existing one, do NOT build a new card component
- If the roadmap does NOT mention a component/feature → do NOT add it
- **NEVER** ad-lib features, components, or API calls that aren't in the roadmap

## Rule 6: CHECK VERCEL AFTER EVERY PUSH
After every `git push`:
```bash
sleep 30
npx vercel ls 2>&1 | head -5
# Must show "● Ready" with a recent timestamp
# If "● Error" → read logs, fix, and push again
```
Then check the live page:
```bash
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Must return 200 or 307
```

## Rule 7: IF UNSURE, STOP AND ASK
- If a roadmap step is ambiguous → STOP and ask the user
- If you need a component that doesn't exist → STOP and ask if you should create it or use something else
- If an API endpoint isn't available → STOP and note it in `_tasks/INCOMPLETE_FEATURES.md`
- **NEVER** guess or improvise — broken production is worse than a paused task

## Rule 8: NEVER REBUILD FROM SCRATCH
> **INCIDENT**: An AI agent was asked to modify existing pages but instead created entirely new pages/layouts, overwriting working UI with generic templates that didn't match the Solen design system.

- **ALWAYS** read the existing file content FIRST before editing
- **ALWAYS** use existing components (`DashboardLayout`, `SalonCard`, `Spinner`, etc.) — do NOT create replacements
- **ALWAYS** match the existing styling patterns (read `_rules/UI_RULES.md` + look at `dashboard/page.tsx` for reference)
- **NEVER** replace a working page with a new one built from scratch
- **NEVER** create a new layout component when `DashboardLayout` already exists
- **NEVER** create a new card component when `SalonCard` or the dashboard card pattern already exists
- If you think the existing component is wrong → STOP and ask the user before replacing it

## Rule 9: VERIFY PREVIEW ENVIRONMENTS
> **INCIDENT**: Preview deployments crashed because `NEXT_PUBLIC_SUPABASE_URL` was only set for Production in Vercel, not Preview. The middleware tried to init Supabase with `undefined` → instant `MIDDLEWARE_INVOCATION_FAILED`.

- When adding NEW environment variables, remind the user to set them for **ALL environments** (Production + Preview + Development) in Vercel
- If a build works locally but preview fails → check if the env vars are set for Preview in Vercel
- **NEVER** assume an env var is available — always use fallbacks or early-exit checks:
  ```typescript
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  ```

## Rule 10: TEST API ROUTES AFTER CREATING THEM
> **INCIDENT**: 41 API routes were built but never tested. They looked correct in code but failed at runtime because of missing env vars, wrong response formats, and broken function calls.

- After creating or modifying an API route, verify it works by checking:
  - All imported functions/modules exist
  - All env vars it depends on are set (or gracefully handled if not)
  - The response format matches what the frontend expects
- If you can't test a route, add it to `_tasks/INCOMPLETE_FEATURES.md` with a note like: "Route created but untested — needs manual verification"

## Rule 11: API RESPONSE FORMAT CONSISTENCY
> **INCIDENT**: DM Chat broke because one route returned `{ data: profile }` but the frontend expected `profile` directly. Another returned `{ items: [...] }` but the frontend expected `{ messages: [...] }`.

- **ALWAYS** check what the frontend expects before changing an API response format
- **ALWAYS** return data in the format the consumer expects — if changing the format, update ALL consumers
- When in doubt, return BOTH keys for backwards compatibility:
  ```typescript
  // SAFE — supports both old and new consumers
  return NextResponse.json({ messages: data, items: data, data });
  ```
- **NEVER** change an existing API's response structure without grepping for all `fetch("/api/that-route")` calls first

## Rule 12: DESIGN SYSTEM — IN FLUX
- The design system is being iterated. **Don't cite locked palette / fonts / patterns as authoritative.**
- For current values, read `_tasks/SOLEN_DESIGN.md` (if it's been updated) or ask the user.
- Previous V5 spec is archived at `_tasks/completed/rules-locked-design-tokens-2026-05-06.md` for restoration once a new system stabilizes.

---

## Error Handling Rules (MANDATORY)

- **NEVER** use `.catch(() => {})` — always log with `console.error("[ComponentName] description:", err)`
- For fire-and-forget calls (analytics, tracking, welcome emails): log silently with `console.error`
- For user-facing fetches (data loading): log + show error state
- For auth flows: log + redirect to login
- For payment flows: log + show user-visible error with retry option

```tsx
// CORRECT
.catch((err) => console.error("[DashboardBookings] Failed to load bookings:", err))

// BANNED — silent catch swallows errors forever
.catch(() => {})
```

---

## Rule 12b: MANDATORY RLS INSERTS
> **INCIDENT**: Users couldn't submit new reviews because the RLS INSERT policy was missing on the table itself, even though the API route was authenticated.
- **ALWAYS** configure RLS `INSERT` policies when creating new tables that take user submissions (e.g., reviews).
- If building UI that displays averages (like rating), **always** establish a minimum data threshold (e.g. 5+ reviews) before calculating/displaying the average to avoid statistical insignificance pointing out 5-star ratings with 1 review.

## Rule 13: VERIFY YOUR BRANCH NAME BEFORE WORKING

> **INCIDENT**: On 2026-03-18, a parallel session agent was told to create `moat/session2` but ended up on `moat/session3` (created by another agent running in parallel). All Session 2 commits landed on the wrong branch, causing confusion during merge.

- After running `git checkout -b <branch>`, **IMMEDIATELY verify** the branch name with `git branch --show-current`
- If the branch already exists (error: `fatal: A branch named 'X' already exists`), **DO NOT** silently switch to a different branch. STOP and ask the user.
- If `git branch --show-current` shows a DIFFERENT branch than what you intended, **DO NOT** continue working. Switch to the correct branch first.
- **NEVER** assume you're on the right branch — always verify after checkout.

## Rule 14: CODE REVIEW PROTOCOL

Before EVERY push:
1. `npm run build` — must pass
2. `npx tsc --noEmit` — zero type errors
3. `git diff --stat` — review changed files, ensure no unintended changes

After EVERY push:
1. Wait 60s for Vercel deploy
2. `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/` — must be 200 or 307
3. Curl critical routes: /de, /de/coiffeur, /de/barbershop, /de/dashboard

After ALL phases complete:
1. Visual browser check on every new page
2. Lighthouse: performance > 70, accessibility > 90
3. Minor UI bugs → fix immediately
4. Major design issues → STOP and ask user

## Rule 15: EMPTY STATES ALWAYS USE `<EmptyState>`

> **CONTEXT**: On 2026-03-25, an audit found raw oversized emojis used as empty states ("Noch keine Salons"), which violates the UI_RULES ban on functional emojis and looks unpolished.

**Rules:**
1. **NEVER** build custom empty states with raw text and emojis.
2. **ALWAYS** use the `<EmptyState>` component with an appropriate `illustration` or standard Lucide icon.
3. Empty state messaging must be human, empathetic, and professional (no giant smiley faces).

---

## Rule 25: NEVER USE `getUser()` IN API ROUTES OR MIDDLEWARE

> **CONTEXT**: This bug has been fixed TWICE (2026-03-18 and 2026-03-19). `supabase.auth.getUser()` makes a **network call** from Vercel Edge → Supabase to validate the JWT. This call **times out** on Vercel's edge network, returning `user: null` even when the session cookie is valid.

**ALWAYS use `getSession()`** — it reads the JWT directly from cookies with **zero network calls**.

```typescript
// CORRECT — reads JWT from cookies, no network call:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;

// BANNED — makes network call that TIMES OUT on Vercel Edge:
const { data: { user } } = await supabase.auth.getUser();
```

Applies to: `middleware.ts`, ALL files in `app/api/`, `lib/supabase.ts` `getSessionUser()` helper.

## Rule 26: NO DEAD CODE — EVERY COMPONENT MUST BE IMPORTED AND RENDERED

> **CONTEXT**: On 2026-03-20, Claude Code created 15+ components as standalone files but NEVER imported them on any page. Pure dead code.

1. **CREATING** the file is NOT enough. You MUST also import and render it on the target page.
2. After building each component, immediately verify it's imported somewhere.
3. If a component is conditionally rendered, it still MUST be imported and placed in the JSX tree with its condition.

## Rule 27: PAGES MUST NOT DUPLICATE ROOT LAYOUT ELEMENTS

> **CONTEXT**: On 2026-03-20, the Discovery page rendered its own `<Header />` and `<BottomNav />` on top of the ones in `app/[locale]/layout.tsx`.

The root layout already renders: `<Header>`, `<BottomNav>`, `<CookieBanner>`, `<PWAInstallPrompt>`.
**NEVER** import or render these inside any page component under `app/[locale]/`.

## Rule 28: EVERY TYPE REFERENCED MUST EXIST IN `lib/types.ts`

Before writing `import type { Foo } from "@/lib/types"`, verify `Foo` is actually exported from `lib/types.ts`. If introducing a new type, define it FIRST, then import in later phases.

## Rule 29: POST-EXECUTION SMOKE TEST (MANDATORY)

After completing ALL phases of any feature roadmap, you MUST perform:
1. `npm run build` with 0 errors
2. `npx tsc --noEmit` with 0 errors
3. Every new `.tsx` file is imported at least once
4. No `has no exported member` errors
5. New pages don't import Header/BottomNav (already in layout)
6. If using `checkFeatureEnabled("x")`, verify `x` is in `feature_flags` table
7. If creating admin-only pages, verify path is in `adminOnlyPaths` in `middleware.ts`
8. Translations exist in ALL 4 locale files
9. If SQL migrations are required, add a `RUN MIGRATION FIRST` note at top of roadmap

**A feature is NOT complete until all 9 checks pass.**
