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

> **⚠️ SUPERSEDED by `CLAUDE.md` § Surgical edits only (item 4) + Netlify auto-deploy workflow.** This rule was written for the old Vercel always-deploy workflow. The current setup:
> - **Do NOT run `npm run build` before commits** unless the user explicitly asks. Use `npx tsc --noEmit` for typecheck instead — much faster, and Netlify CI catches build errors on push.
> - **Pushes to `main` auto-deploy to Netlify** (no gating). Pushes to feature/worktree branches do NOT deploy production (may build a deploy preview).
> - **Memory rule:** every commit message includes `[skip vercel]` — belt-and-suspenders for the paused Vercel project. Has no effect on Netlify.
>
> The push-after-commit auto-push behavior IS still active per user memory. The local `npm run build` step is retired.

```bash
# CURRENT workflow (post-Netlify migration 2026-05-09):
npx tsc --noEmit       # Optional: typecheck only
git add <specific files> # Stage relevant files (not -A)
git commit -m "... [skip vercel]"  # Descriptive message + memory-rule token
git push origin <branch>  # Auto-push — pushes to main auto-deploy to Netlify
```

**IMPORTANT**: After executing a roadmap or task, commit AND push without asking (per user memory). The "always push" behavior remains. The "build first" step is retired.

## Rule 5: FOLLOW THE ROADMAP LITERALLY
When executing a roadmap from `_tasks/`:
- Build EXACTLY what the roadmap specifies — no more, no less
- If the roadmap says "use `lucide-react` Scissors icon" → use that exact icon, not a custom SVG
- If the roadmap says "6 category cards" → build exactly 6, not 8
- If the roadmap says "use existing `<SalonCard>` component" → import and use the existing one, do NOT build a new card component
- If the roadmap does NOT mention a component/feature → do NOT add it
- **NEVER** ad-lib features, components, or API calls that aren't in the roadmap

## Rule 6: CHECK VERCEL AFTER EVERY PUSH

> **⚠️ SUPERSEDED — Netlify auto-deploys from `main`.** The original `npx vercel ls` check no longer applies (`vercel.json` was deleted in the Netlify migration). With Netlify auto-deploy:
> - Pushes to `main` deploy automatically. Check the Netlify dashboard or `curl https://www.solen.ch/de/` after ~60s to verify.
> - Pushes to feature/worktree branches do NOT deploy to production (Netlify may build a deploy preview separately).
> - The deployment-status check below is still valid — just point it at Netlify, not Vercel.

## Rule 7: IF UNSURE, STOP AND ASK
- If a roadmap step is ambiguous → STOP and ask the user
- If you need a component that doesn't exist → STOP and ask if you should create it or use something else
- If an API endpoint isn't available → STOP and note it in `_tasks/INCOMPLETE_FEATURES.md`
- **NEVER** guess or improvise — broken production is worse than a paused task

## Rule 8: NEVER REBUILD FROM SCRATCH
> **INCIDENT**: An AI agent was asked to modify existing pages but instead created entirely new pages/layouts, overwriting working UI with generic templates that didn't match the Solen design system.

- **ALWAYS** read the existing file content FIRST before editing
- **ALWAYS** use existing components (`DashboardLayout`, `SalonCard`, `Spinner`, etc.) — do NOT create replacements
- **ALWAYS** match the existing styling patterns (read `_tasks/SOLEN_DESIGN.md` §20 + `_rules/SOLEN_UI.md` + look at `dashboard/page.tsx` for reference)
- **NEVER** replace a working page with a new one built from scratch
- **NEVER** create a new layout component when `DashboardLayout` already exists
- **NEVER** create a new card component when `SalonCard` or the dashboard card pattern already exists
- If you think the existing component is wrong → STOP and ask the user before replacing it

## Rule 9: VERIFY PREVIEW ENVIRONMENTS
> **INCIDENT**: Preview deployments crashed because `NEXT_PUBLIC_SUPABASE_URL` was only set for Production (not Preview) in the legacy Vercel hosting setup. The middleware tried to init Supabase with `undefined` → instant `MIDDLEWARE_INVOCATION_FAILED`. Same hazard exists on Netlify if env vars are scoped per context.

- When adding NEW environment variables, remind the user to set them for **ALL Netlify contexts** (Production + Deploy Preview + Branch deploys + Local) in the Netlify dashboard
- If a build works locally but a deploy preview fails → check the env var scopes for that Netlify context
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

## Rule 12: SINGLE DESIGN SYSTEM
- **Single source of truth:** `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D48 Earthen Wellness Light pivot 2026-05-09 + V2-D42 typography pivot 2026-05-09 + V2-D49j color rule 2026-05-10). Decision log: `_tasks/V2_REBUILD_LOG.md`. Operational playbook: `_rules/SOLEN_PATTERNS.md`. Supplemental UX skill: `_rules/SOLEN_UI.md`. Historical Q-lock context: `_tasks/archive/SOLEN_DESIGN.archived.md` §20.
- **V3 Brand (V2-D48 Earthen Wellness Light):** emerald `#1F5C42` (`s-brand.DEFAULT`) + terracotta `#C97A57` (`s-accent`). Brand-mid `#0F3D26`, brand-deep `#0A2917`, brand-pale `#A8CFB8`, brand-subtle `#D4EBD9`. Substrate cream `#F5EBDD` (`s-bg-base`).
- **V3 Categories (4, V2-D48):** Coiffeur (`#FAF2E5` + `#C97A57`), Barbershop (`#E8DDC9` + `#2A1F18`), Nails (`#D4DDC8` + `#8E4A2D`), Spa & Wellness (`#D4EBD9` + `#0F3D26`).
- **Color rule (V2-D49j):** emerald `s-brand` is the ONLY color allowed on action affordances (CTAs, primary links, focus outlines, success/check glyphs, active chip states). Terracotta `s-accent` is reserved for ONE-OR-TWO highlight words inside h1/h2 + logo dot + eyebrow leading-dot. Never invert.
- **Foundation:** `s-ink` `#1A1209`, `s-ink-2` `#56463E`, `s-ink-3` `#7A6957`, `s-border` `#E8DFD2`, `s-bg-base` cream `#F5EBDD` (V2-D48 — was white pre-V2-D48), `s-bg-sunken` `#F8F0E2`.
- **Semantic:** love `#FF4A6B`, success `#16A34A`, warning `#F59E0B`, error `#D32F2F`, closed `#DC2626`, star `#F3A864`. Distinct from brand, never collapse.
- **V3 Fonts (V2-D42, 2026-05-09):** **Peace Sans** (display: hero h1, logo wordmark, footer cropped wordmark) + **Open Sauce One** (body/UI: section h2s, eyebrows, body text, buttons, microcopy). Both via cdnfonts. Inter via Google Fonts as cdnfonts-failure fallback. Tracking-normal everywhere — Peace Sans's chunky letters break at negative tracking.
- **RETIRED — do NOT reintroduce:** V2-D15-3 era V3 dark teal `#043338` + pale teal `#C2F0F1` + brand subtle `#E1F4F4` + brand-mid `#0A6873` (replaced by emerald V2-D48). V2-D15-3 era V3 cat texts cherry `#B5345A`, magenta `#B50051`, sandy beige `#948565` (replaced by V2-D48 cat texts above). Sage `#A8B89A` as a CTA / button / glyph-bg color (retired V2-D49j — too low contrast on cream; sage stays only as atmosphere blob). V0 coral `#E8624A`, V1 forest green `#1B4D1B`, V2 brand orange `#E8742A` + variants (`#FFE4D2`, `#8A3C0F`, `#5C2308`, `#F0834D`), 6-cat colorways (rose/sunny/clay/sage/coral-orange/camel/plum), warm-cream substrate `#FBF8F3`/`#FFF4E8`, all V0 designs (`#38B2AC` teal, `#FF6B6B` red, wine-red, V2 green+peach `#F5A962`, V5 `#E8735A`). Retired fonts: **Cooper BT, Cooper Black Std, Sansita 900, ITC Avant Garde Gothic Std, League Spartan, Inter Tight** (all retired V2-D42 and replaced by Peace Sans + Open Sauce One). Also retired: Bricolage Grotesque, Instrument Serif, JetBrains Mono, Anton, Bebas Neue, Syne, Fraunces, DM Sans, Plus Jakarta, Outfit, Phosphor, DM Serif Display, Space Grotesk, Figtree, Open Sauce **Sans** (broken cdnfonts variant — Open Sauce **One** is the active V3 font).
- **NEVER** use any retired color or font in new code.
- **NEVER** reference `index.html`, `public/home.html`, or `public/solen-coral.html` — retired/never existed.
- **V3 living preview:** `_rules/SOLEN_PATTERNS.md` Part 2 lists every shipped V3 component with its file path. For visual reference, run `npm run dev` and visit `http://localhost:3000/de`.

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

After EVERY push (to `main` only — feature branches don't auto-deploy):
1. Wait ~60s for Netlify deploy to finish (Netlify dashboard shows build status)
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

> **CONTEXT**: This bug has been fixed TWICE (2026-03-18 and 2026-03-19). `supabase.auth.getUser()` makes a **network call** from edge runtime → Supabase to validate the JWT. This call **can time out** under edge runtime constraints (originally diagnosed on Vercel Edge — defensive Promise.race in `middleware.ts:135-139` guards against any edge platform), returning `user: null` even when the session cookie is valid.

**ALWAYS use `getSession()`** — it reads the JWT directly from cookies with **zero network calls**.

```typescript
// CORRECT — reads JWT from cookies, no network call:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;

// BANNED — makes network call that can TIME OUT under edge runtime:
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
