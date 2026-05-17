# Solen.ch — Project Configuration

> Every AI agent must read this file before changes.

**Stack:** Next.js App Router · TS · Tailwind · Supabase · Stripe · Netlify.
**Reference (load on demand):** `_docs/PROJECT_REFERENCE.md` (full stack table, architecture, commands, deployment, task-tracking conventions).

---

## 💬 Communication — always plain English

- Plain English. Short sentences. Direct statements.
- No preamble ("let me proceed with...", "I'll now..."). State what changed, ask what's next.
- No hedging ("could potentially", "might consider"). If recommending, recommend.
- Lead with the answer. Reasoning comes after.
- Match the user's register — if they write casual ("ye those", "alr lets"), match that. Don't formalize back.
- Concrete names over abstract refs: "Solen" not "the user", "Header.tsx" not "the component".
- Bullets over long prose paragraphs when conveying multiple points.
- End-of-turn summary: one sentence, what changed and what's next. Not a closing paragraph.

**Anti-pattern:** five paragraphs when one sentence does. Translate "I have successfully completed the task" → "Done." Translate "Would you like me to proceed?" → "Go?"

---

## 🎨 Design system — single source of truth

- **READ FIRST (the principal — current locked state, V3-only after V2-D67-fu14 cleanup 2026-05-17):** `_tasks/SOLEN_LIVE_TRUTH.md` (944 lines, no V2 contamination)
- **Decision narrative:** `_tasks/V2_REBUILD_LOG.md` (running log of every V2-D## decision + why)
- **Operational patterns + Fresha translation:** `_rules/SOLEN_PATTERNS.md`
- **Component specs:** read the component file's JSDoc directly (e.g. `SalonCard.tsx`, `Hero.tsx`, `SearchBar.tsx`) — JSDoc lives next to code and cannot drift
- **Archived (DO NOT GREP for current state):** `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` (5,178-line snapshot with V2-D15-3 dark teal + Cooper + 6-cat contamination — historical reference only) · `_tasks/archive/SOLEN_DESIGN.archived.md` §20 (older Q-lock decision history)
- **Hierarchy when docs conflict:** production code wins over `SOLEN_LIVE_TRUTH.md` wins over `SOLEN_PATTERNS.md` wins over reference HTML. **If `SOLEN_LIVE_TRUTH.md` contradicts production code, fix the doc, not the code** — and ASK the user first per "Visual-work pre-flight" rule #4 (doc grep is hint not verdict).

**Retired — do not reintroduce:**
- **Brand colors:** V1 green+peach (`#1B4D1C` / `#F5A962`), V2 brand orange `#E8742A` (retired V2-D15-3), `#FFE4D2` brand-subtle peach, `#8A3C0F` brand-text, `#5C2308` brand-text-deep, `#F0834D` hover-top, hover gradient `#F0834D → #E8742A`
- **6-cat colorways** (retired V2-D15-3): `#B5588A` rose, `#E8A957` sunny, `#C77A5C` clay, `#88B89E` sage, `#D66547` coral-orange, `#A66E3D` camel, `#9B7BB8` plum (V2-D15-2 purple ban). 5th cat Makeup retired entirely.
- **Typography:** Plus Jakarta, Outfit, Phosphor, Anton, Bebas Neue, Bricolage Grotesque (V2 display — retired V2-D15-3), Inter Tight (retired as primary V2-D15-3, retired as fallback V2-D42), Instrument Serif italic, JetBrains Mono, DM Sans, Figtree, Fraunces, Cooper BT (V3 display — retired V2-D42), Cooper Black Std, ITC Avant Garde Gothic Std (V3 body — retired V2-D42), Sansita 900 (Cooper fallback — retired V2-D42), League Spartan (Avant Garde fallback — retired V2-D42)
- **Surfaces:** warm cream substrate `#FBF8F3` (V2-D15 reverted to white), V5 zone language, glass-everywhere, 3:2 cover photos, dark mode, blobs-in-every-section
- **Italic anywhere in UI** — period (V2-D15)
- **V2-D15-3 era V3 dark teal trio** (retired V2-D48 2026-05-09): `#043338` brand teal + `#C2F0F1` pale teal + `#E1F4F4` brand subtle + `#0A6873` brand-mid. Replaced by Earthen Wellness Light emerald palette below.
- **V2-D15-3 era V3 cat text colors** (retired V2-D48): cherry `#B5345A` (was Coiffeur text), magenta `#B50051` (was Nails text), sandy beige `#948565` (was Spa text). Replaced by Earthen Wellness Light cat colors below.
- **Sage `#A8B89A` as a CTA / button / glyph-bg color** (retired V2-D49j 2026-05-10 — too low contrast on cream). Sage stays only as an atmosphere-blob hue.

**Locked V3 brand (V2-D60 Vibrancy Tune, 2026-05-14 — supersedes V2-D48):** punched-up emerald `#1A8F5C` (`s-brand`, 70% sat — was `#1F5C42` 49% sat) + warm terracotta `#E0703D` (`s-accent`, 71% sat — was `#C97A57` 51% sat) + lighter cream substrate `#FAF3E6` (`s-bg.base` — was `#F5EBDD`) + **WHITE cards** `#FFFFFF` (`s-bg.surface` — was `#FAF2E5` cream-on-cream that caused beige collapse). Pale `#A8E0BF`, subtle `#D4F2E0`, brand-mid `#0F6F44`, brand-deep `#084B2D`. Accent soft `#F0A98C`, deep `#A04A22`. Same V2-D48 palette STRUCTURE (emerald action + terracotta accent + cream substrate), only saturation + substrate brightness changed. No new hues added per "not many colors scattered."

**Color rule (V2-D49j 2026-05-10, locked LIVE_TRUTH §5h principle 9 + §5h.2):** emerald `s-brand` is the ONLY color allowed on action affordances (CTAs, primary links, focus outlines, success/check glyphs, active chip states). Terracotta `s-accent` is reserved for ONE-OR-TWO highlight words inside h1/h2 display text + logo dot + eyebrow leading-dot — **never on buttons, never on links, never on glyph backgrounds.** Heart-saved fill is the universal-semantic exception (love-red `#FF4A6B`).

**Locked V3 categories (4, V2-D60 vibrancy tune):** Coiffeur `#FFE8D8`/`#E0703D` (peach + warm terracotta), Barbershop `#EAE0D0`/`#2A1F18` (bone + ink), Nails `#D4DDC8`/`#A04A22` (sage-pale + terra-deep), Spa & Wellness `#D4F2E0`/`#0F6F44` (emerald-subtle + emerald-mid).

**Locked V3 typography (V2-D42, 2026-05-09 — overrides V2-D15-3):** Peace Sans (display: hero h1, logo, feature h2) + Open Sauce One (body/UI: section h2s, eyebrows, body text, buttons, microcopy). Both via cdnfonts. Inter via Google Fonts as the cdnfonts-failure fallback for body. Peace Sans + Open Sauce Sans were briefly tried earlier in V2-D15-3 evolution but a different variant (Open Sauce **Sans**, broken on cdnfonts) — V2-D42 picks Open Sauce **One** (sister font, full 300-900 weights, working CDN).

Full V3 spec lives in `_tasks/SOLEN_LIVE_TRUTH.md` (944 lines, V3-only after V2-D67-fu14 cleanup 2026-05-17): §1 brand, §2 categories, §5 typography, §5a pill rule, §5g atmosphere wash, §5h color philosophy, §13 Hero, §14 SearchBar, §16 Salon card. The 5,178-line pre-cleanup snapshot lives at `_tasks/archive/SOLEN_LIVE_TRUTH_v3-pre-cleanup-2026-05-17.archived.md` (don't grep — V2-D15-3 dark teal + Cooper + 6-cat era contamination). Operational playbook (pattern library + Fresha translation rules): `_rules/SOLEN_PATTERNS.md`. Decision log: `_tasks/V2_REBUILD_LOG.md` (latest entries V2-D67-fu14 / V2-D67-fu13 / V2-D60 / V2-D49j / V2-D48 / V2-D42).

---

## 🧠 Visual-work pre-flight (run BEFORE skill / mockup / code edit)

Fired by visual feedback ("looks off", "more depth", "redesign X", "feels flat", "the cards…"). Skipping these gates is the documented source of the "skeleton-blind / always wraps text / docs-as-verdict / jumps to fix" pattern (V2-D67-fu13, 2026-05-17 — user spent ~6 mockup rounds because pre-flight was skipped).

1. **STRUCTURE or TREATMENT?** Before any mockup or code edit, ask aloud: is this a STRUCTURAL change (different geometry / integration / overlay / horizontal vs vertical) or a TREATMENT change (same skeleton, different surface)? Don't assume production's skeleton is the right one. Production = anchor for IMPLEMENTATION, not for DESIGN truth.

2. **Name the slot before touching it.** Cards have 4 depth slots: photo / text region / section frame / background atmosphere. User complaints usually point at WHICH slot, even if they don't name it. Restate the slot back: "you said 'card vs background' → that's the photo + section slot, not the text slot." Then build only inside that slot.

3. **Restate complaint + desired outcome BEFORE producing.** "What you said: X. What I think you want: Y. Right?" Wait for ack. No mockup, no code edit, no doc grep until confirmed. Solution-jumping = the source of every wasted mockup round.

4. **Doc grep is a HINT, not a verdict.** When grep finds a spec, QUOTE it AND ask: "is this still locked or did the thinking shift?" Production code drift from spec = 50/50 the spec is stale. NEVER assert "the spec says X so X." If user rejects the cited spec, EDIT the spec in the same session — don't leave the stale paragraph behind for the next agent to grep-and-confidently-cite.

5. **No-touch slots are permanent.** If user says "don't touch X" once, X is off-limits for the rest of the conversation. Re-verify before doing anything that even neighbors X. Example: user says "no surfaces around text" → I never reach for pill / wrapper / border / blur on text again that session, even if a depth complaint follows.

**User trigger phrases to call out slips** (any of these = STOP, run the relevant gate):
- "you're skeleton-blind" → list structural alternatives instead of surface treatments
- "stop wrapping" → text region is off-limits for the rest of this conversation
- "doc isn't verdict" → stop asserting from grep, ask user if spec is still current
- "restate first" → stop producing, restate the complaint + desired outcome before continuing

---

## 🎨 Design exploration — skill-first stack

For ANY visual / design question, run this skill sequence INSTEAD of opening `.tsx` components. NEVER iterate on visual questions in real component code.

### Step 0 · Look + describe (default for pasted images, NO auto-skill)

When user pastes a UI/design screenshot, the DEFAULT is native vision — look at the image, describe what you see in plain English, ask what to do, build from your understanding.

**Default workflow on pasted image:**
1. Look + describe what you see — 3-5 plain-English sentences covering composition, dominant colors, visible text, vibe
2. Ask user what they want to do with it
3. Build natively from your understanding
4. Correct based on user feedback

**Native vision is reliable for:** overall composition, dominant colors (rough hex ±10-20 RGB), visible text content, element presence, pattern recognition (card / nav / hero / footer), overall feel.

**Native vision is NOT reliable for:** exact corner-radius direction (concave vs convex), subtle spacing (16 vs 20px), font weight nuance (500 vs 600), exact hex when precision matters.

### Step 0-escalation · `screenshot-spec` (escalation only — NOT auto-trigger)

Invoke `screenshot-spec` via the `Skill` tool ONLY when:
- User explicitly asks for pixel-exact matching: "match this 1:1", "exact dimensions", "copy this exactly"
- You genuinely can't tell something critical from the image and need user-marked landmarks
- Six-rounds-of-failure-mode kicks in (multiple wrong interpretations on the same image) — break the loop with measured data

**Anti-pattern:** auto-invoking `screenshot-spec` on every pasted image — that was the wrong policy. It made the user do 30 clicks of annotation work for cases where native vision was enough. Default to looking + describing; only escalate when precision is the goal.

### Step 0-deep · `site-teardown` (auto-trigger when user gives a live URL to study)

When the reference is a **live URL** (not a static image), invoke `site-teardown` via the `Skill` tool. Built 2026-05-11 at `~/.agents/skills/site-teardown/`. Runs a 7-step Playwright pipeline that extracts:

- Full typography spec (every font / size / weight / line-height / letter-spacing used, clustered by frequency)
- Color palette (text + bg, ranked by usage)
- CTA / button system (geometry + variants)
- Imagery system (photo vs SVG vs PNG cutout)
- Page structure (height + section list)
- Layout / container widths

Outputs `_audits/{YYYY-MM-DD}-{slug}-teardown.md` + a full-page screenshot. Future "match {site}" tasks build from the teardown doc, not from screenshot interpretation.

**Trigger phrases:**
- "analyze [url]", "study [url]", "teardown [site]"
- "how does [site] do their typography / colors / spacing"
- "extract design tokens from [url]"
- "go look at [site] and tell me about it"
- "what's the design system of [site]"
- "audit [site]"
- "pixel-match [site]" (escalation when vibe-match fails)

**Example output produced 2026-05-11:** `_audits/2026-05-11-fluz-stacking-teardown.md` — full typography scale (132/72/40/24/20/16/14/11px ramp), 3-font system (Greed Condensed display + Greed Semibold nav + Area Semibold body), warm dark/cream palette, CTA pill geometry (radius 200px, h-56, 20px Greed Condensed).

### Step 1 · `huashu-design` (auto-trigger) — variation exploration

Build 3–5 variations side-by-side at `public/solen-v3-mockup-{topic}.html` using real V3 tokens (`s-brand`, `s-accent`, `s-bg-base`, Peace Sans, Open Sauce One). Has "Design Direction Advisor" fallback for vague briefs (3 directions from 20 design philosophies). User picks a letter → refine micro-variations → lock.

**Auto-trigger phrases** (call `Skill` with `skill: "huashu-design"` as FIRST action — before any Read/Edit/Write on layout components):
- "redesign / redo / rework / design the X / overhaul"
- "make it look like [ref]", "match [ref] style", "like [site].com"
- "mockup", "variations", "options", "explore designs", "show me alternatives"
- "hero / header / card / footer variants"
- "design direction", "visual feel", "vibe", "make it more [adj]" applied to style
- "is this the right look", "does this feel [adj]"

### Step 2 · Execute — port the locked variation to React

Single clean edit to the real component. Use existing V3 tokens. No improvisation, no scope creep, no "while I'm in here" tweaks.

### Step 3 · `uiux-audit` (auto-trigger after build) — production-standards review

Audits the rendered output against 20 production UI/UX standards: visual hierarchy, typography scale, WCAG 2.2 accessibility, animation performance, responsive issues, states (hover/focus/active/disabled/loading), spacing rhythm, contrast ratios. **This compensates for my visual-detail blind spots** — it sees what I miss.

**Auto-trigger phrases:** "review / audit / check / improve / critique / accessibility check / WCAG / responsive / dark mode / states / hierarchy / spacing / make this look better".

Returns a punch list with severity. Fix high-severity items, re-audit. Stop on PASS or after 3 rounds.

### Step 4 · `emil-design-eng` (optional final polish) — motion / micro-interaction

Run ONLY after layout + uiux-audit pass. Reviews timing, easing, choreography for hover / focus / entry / exit animations. Output format: markdown table `| Before | After | Why |`.

### Anti-patterns (V2-D56 session burned 6 rounds on these)

- Opening `Header.tsx` / `Hero.tsx` / `SearchBar.tsx` for a visual question
- Interpreting visual feedback in words ("rounded the other way") instead of building variations to point at
- HMR-cycling on real components instead of comparing flat artboards
- Claiming "done" based on my eye alone — skip `uiux-audit` and I miss details (corner-curve direction, micro-spacing rhythm, contrast failures)
- **Interpreting a pasted screenshot with my eyes instead of invoking `screenshot-spec`** — Step 0 exists for this exact failure

### Exceptions (regular code edits, not design)

- Surgical bug fixes: "the logo is 2px off", "dropdown broken on mobile"
- Token swaps where decision is already made: "use `s-brand` here"
- Data wiring / API connection / state logic

### Planned: `solen-design` custom skill

A `skill-creator`-built wrapper that pre-loads V3 tokens + anti-patterns + retired-color list, auto-triggers on Solen visual questions, and calls the 5-stack internally. Status: TBD. Builds in ~1hr, compounds across every future design task.

**Memory backup:** `feedback_check_skills_first.md` in user memory mirrors this stack across sessions.

---

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the bug.
2. Match the exact scope of the request.
3. Read before editing.
4. Never `npm run build` unless asked.
5. `git diff` after each fix.
6. **Mass token sweeps are runtime-blocked.** A `PreToolUse` hook (`.claude/hooks/pre-sweep-check.sh`, registered in `.claude/settings.json`) BLOCKS any `Edit` with `replace_all: true` whose `old_string` contains a hex literal that exists in `public/solen-coral.html` or `_tasks/archive/SOLEN_DESIGN.archived.md`. Skipped paths: `tailwind.config.js`, `app/globals.css`, every `_tasks/_rules/_audits/_docs/_specs/_plans/_visual-qa/`, `CLAUDE.md`, `.claude/`, `messages/*.json`. To explicitly authorize a brand-pivot-style sweep (e.g. Q64), the user runs `touch .claude/sweep-approved.flag` — flag auto-expires in 10 minutes. This exists because lesson L8 in `_tasks/archive/SOLEN_BUILD_LEARNINGS.archived.md` self-diagnosed that documentation alone didn't prevent sweep-without-grep failures.

---

## ✅ "Done" claim discipline (runtime-enforced)

Before saying "it's done / fixed / shipped / working / rendering" for any UI work:

1. Open the relevant URL with `mcp__playwright__browser_navigate`
2. Take a screenshot with `mcp__playwright__browser_take_screenshot`
3. Quote in 1-2 lines what's literally visible on the rendered page (e.g. "viewport shows header + 4 salon cards bleeding to frame edge; no atmosphere clipping at the boundary")
4. Then say done.

`tsc --noEmit clean` / `curl 200` / `log-grep returns 0 errors` are **necessary but never sufficient** per global CLAUDE.md rules 7 + 8 + 9. The screenshot + literal description IS the close condition for visual / behavioral claims.

**Runtime enforcement:** `.claude/hooks/pre-done-claim-check.sh` (registered under `hooks.Stop` in `.claude/settings.json`) blocks the agent from ending its turn when ALL three hold:
- Last assistant text contains done-class language (`it's done` / `renders correctly` / `all sections present` / `no errors` / etc.)
- AT LEAST ONE `Edit` or `Write` to a UI file (`.tsx` / `.css` / `components-legacy/`) happened in the recent transcript
- NO `mcp__playwright__browser_*` tool was used in the recent transcript

When blocked, the hook injects a system-reminder telling the agent to either verify in Playwright now or retract the claim.

**Override** (legitimate docs-only or non-UI completion claim the heuristic misjudged):
```sh
touch .claude/done-claim-override.flag   # 5-minute TTL
```

This rule is belt-and-suspenders — the global CLAUDE.md already has rules 7 + 8 + 9 (verifier-loop protocol). This project-level entry exists because documentation alone didn't prevent the failure pattern across the V3 rebuild sessions. The hook is the actual fix; this section is the receipt.

**What this hook does NOT fix:** scope creep, taste-fork skipping, missing-spec-items. Those need pre-build scope confirmation + verifier sub-agents per global rule 9, not post-claim verification.

---

## 🗣 Discuss-before-execute (design + structural)

Order: **PROPOSE → WAIT → EXECUTE → VERIFY**. For design tokens, components, layout, or `SOLEN_LIVE_TRUTH.md` / V3 preview HTML (`solen-v2-republik-teal.html`, `solen-v2-palette.html`, `solen-v2-combos.html`) edits, propose options first and wait for explicit "ok / lock / go".

**Skip protocol:** clear-repro bug fixes, terminal commands per §⚡, or user says "just do it / ship it".

---

## 🔍 Verify before asking

Try to answer yourself first. Use `grep` / `Read` / `git log` / `preview_eval` / existing docs (`_tasks/SOLEN_LIVE_TRUTH.md`, `_rules/*.md`, `_tasks/V2_REBUILD_LOG.md`, `package.json`, `tailwind.config.js`). Older docs (`SOLEN_DESIGN.md`, `REDESIGN_INVENTORY.md`, `BACKEND_NEEDS_UI.md`, `GAP_AUDIT_V2.md`) are archived under `_tasks/archive/` — re-derive against V3 LIVE_TRUTH instead of consulting the archives.

**Only ask the user about:** preferences, taste, intent, business decisions, or info only they have.

---

## ⚡ Terminal autonomy

Run npm/npx, git status/add/commit/push/diff/log, tsc, file ops without asking.
**Ask before:** `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits.

## 🚀 Deploy workflow (Netlify, migrated 2026-05-09)

**Local preview:** `npm run dev` for the app · `npx serve public -p 4747` for design preview HTML files.

**Production:** every push to `main` auto-deploys to Netlify. Build config lives in `netlify.toml`. There's no `[deploy]` commit-message token anymore — pushes to `main` DO deploy, period.

**Crons:** GitHub Actions runs `.github/workflows/cron-jobs.yml` to invoke `/api/cron/*` routes on schedule (replaces the old `vercel.json` crons).

**Memory rule (still active):** every commit message must end with `[skip vercel]` — belt-and-suspenders for the paused Vercel project from pre-migration. Has no effect on Netlify deploys; harmless redundancy.

**Default workflow:** commit + push to feature/worktree branches freely; nothing reaches production. Only merge to `main` (or push to `main`) when the user explicitly says "deploy" / "merge to main" / "ship it."

---

## ⚠️ INCOMPLETE_FEATURES is sacred

If a feature can't finish: append to `_tasks/INCOMPLETE_FEATURES.md` using the canonical format (Feature · File/Line · Backend · Frontend · Blocker · Next Steps · Priority — see `_rules/STRUCTURAL_RULES.md` Rule 45 for the full schema). Never delete or hide failures. File is never deleted.

---

## ❌ Error handling — every failure must leave a trace

The "blank screen, no idea what happened" pattern. AI loves to silently swallow errors. Every variant below is banned in this codebase:

**Empty catches:**
- `.catch(() => {})`, `.catch(() => null)`, `.catch(() => false)` — eats the error
- `try { ... } catch {}` or `catch (err) { /* TODO */ }` — same, just longer

**Ignored returned errors:**
- Supabase `const { data } = await supabase.from(...)` — `error` MUST be destructured AND checked. `if (error) { console.error(...); throw / redirect / surface }`
- Zod `const result = schema.safeParse(input)` without checking `result.success === false`
- `fetch()` without checking `response.ok` before `.json()` — you'll parse the error body as data

**Mask-as-empty:**
- `if (!data) return;` after a fetch with no log of WHY data is empty
- `result ?? defaultValue` / `error || null` to mask a thrown error as "no data"
- Empty array returned from a broken query (treated as "no rows" when actually the query failed)
- Retry loops that exhaust and return `null` instead of throwing the last error

**Fire-and-forget:**
- `doSomething()` (async, no `await`, no `.catch`) at call sites — the rejection lands in the void
- `Promise.allSettled` without inspecting the rejected entries
- `setTimeout(async () => { ... })` without an inner try/catch — async errors escape the timer

**Type-cheats over errors:**
- `as Foo` over an `unknown` from a catch block — papers over the real failure shape
- Returning `undefined` from a function whose contract said it'd throw
- `console.error(...)` then continuing as if nothing happened, when the function should `throw`

**UI escape hatches:**
- React `<ErrorBoundary>` that renders `null` instead of a user-visible fallback
- Optional chaining (`user?.profile?.name`) burying a missing-field bug that should surface

**For every catch / error-aware branch, pick exactly ONE:**
1. **Rethrow** — let the caller decide
2. **Log with context** — `console.error("[Component] action failed:", err, { userId, route, params })` — enough info to debug from logs alone
3. **Surface to the user** — visible error state with retry, NOT a blank screen

Auth fetches → log + redirect. Payment flows → log + user-visible error with retry. Background jobs / crons → log + Sentry alert. API routes → log + return 500 with a stable error code.

**If you can't decide which of the three to do, that's the bug — don't catch yet.**

---

## 🔐 Hardcoded values — config, env, or constants (never inline)

AI's #1 deploy-breaker. The rule:

**Secrets — `process.env.*` ONLY, server-side ONLY:**
- Supabase service role key, Stripe secret, OpenAI key, Resend key, webhook signing secrets, JWT secrets, cron tokens
- **Service role key**: NEVER in `"use client"`, NEVER in shared utils a client file imports, ONLY in API routes / server components / server actions. Service role bypasses RLS — a leak = full DB compromise. Don't reach for it to "fix" an RLS error; fix the RLS policy instead.
- **Public env (`NEXT_PUBLIC_*`)**: WILL ship to the browser bundle. Only values safe to publish on the homepage in plain text. When unsure, it's not safe.

**Env-varying values — typed accessor, no fallbacks:**
- App base URL (`NEXT_PUBLIC_APP_URL` — used in OAuth callbacks, Stripe redirects, email links)
- Supabase URL + anon key
- Sentry DSN, analytics IDs
- Email `from:` addresses
- Stripe price IDs (different between test/prod)
- Cron secret tokens

**Forbidden env patterns:**
- `process.env.X || 'fallback'` — silently uses fallback when env is missing
- `process.env.X ?? 'default'` — same trap
- `process.env.X!` — lies to TypeScript, crashes at runtime instead of boot
- **Correct**: a typed `lib/env.ts` that zod-validates every env at boot. Missing/malformed = crash on `next build` / server start, not on the customer's checkout click.

**Magic strings / numbers repeated 3+ times → `lib/constants.ts` or a typed enum:**
- Role checks: `ROLES.ADMIN` not `'admin'`
- Status: `BOOKING_STATUS.CONFIRMED` not `'confirmed'`
- Category slugs: already in `lib/types.ts` — USE them
- Locale codes: from `_rules/I18N_ROUTING.md` constants
- Rate limits, pagination caps, retry counts, timeouts
- Display thresholds (`MIN_RATING_FOR_BADGE = 4.5`)
- Stripe webhook event types: prefer Stripe's TS `event.type` discriminated union over string literals

**Locale / timezone / currency:**
- Timezone: never hardcode `'Europe/Zurich'` — constant or read from user profile
- Currency: `'CHF'` lives in one constant
- Date format strings: one source of truth in `lib/format/`

**No UUIDs or IDs from local seed data in source:**
- `const ADMIN_USER_ID = 'abc-...'` — doesn't exist in prod DB
- Test-mode Stripe price IDs / customer IDs
- Storage bucket names typo'd vs created
- Reference by role / slug / lookup, never by raw UUID

**No demo/mock data shipping to prod:**
- AI's favorite: `const DEMO_SALONS = [{...}]` array left in component. Ships to every user.
- Demo fixtures go in `_dev/fixtures/` or named `__demo__` and excluded from prod bundle
- Wired-to-real-data is the close condition, not "looks right with placeholders"

**Build-time vs runtime trap (Next.js):**
- `NEXT_PUBLIC_*` is baked at BUILD time. Changing it in Netlify env after deploy = needs a redeploy to take effect.
- Server env (no prefix) is RUNTIME — changes without rebuild.
- If you change an env value and nothing seems to update, it's probably `NEXT_PUBLIC_*` cached in the build.

**When AI suggests inlining a value: "What environment does this assume?" If anything other than "the same value in every env forever," it's wrong.**

---

## 🚫 TypeScript must actually be TypeScript

AI's silent way to "make the error go away" instead of solving it. Every escape hatch breaks the type contract.

**Required tsconfig (prerequisite for everything below):**
- `"strict": true` ✅ (already on)
- `"noUncheckedIndexedAccess": true` — **NOT ON, ADD IT.** Without this, `array[i]` is typed `T` instead of `T | undefined`. AI indexes into arrays without bounds checks constantly. Add this and fix the (likely many) errors it surfaces — most are real bugs.
- `"exactOptionalPropertyTypes": true` — distinguishes `prop?: string` from `prop: string | undefined`
- `"noUnusedLocals": true`, `"noUnusedParameters": true` — flags dead code AI leaves behind
- `"noFallthroughCasesInSwitch": true`
- `"noImplicitOverride": true`

**Banned outright:**
- `: any` anywhere — use `unknown` if shape is genuinely unknown, then narrow with type guard or zod parse
- `// @ts-ignore` — silences future errors too. Use `// @ts-expect-error <reason>` when you must (errors when the underlying issue is fixed)
- `// @ts-nocheck` at the top of a file
- `: Function`, `: object`, `: {}` — pseudo-types that allow anything
- `[key: string]: any` index signatures — use `unknown` or a specific shape
- Empty interfaces / `interface X extends Y {}` — just use `type X = Y` or fill it

**Banned type assertions on external data:**
- `as Foo` on values from `JSON.parse`, `fetch().then(r => r.json())`, Supabase, FormData, env, file IO
- `as unknown as Foo` (double-cast lie)
- `value!` non-null assertion when value might genuinely be null
- **Correct**: validate at boundary with zod (`schema.parse(input)`), then the type is real

**Catch blocks — narrow, don't cheat:**
- `catch (err)` — TS types `err` as `unknown` (good). DO NOT type it `: any` to dodge narrowing.
- Narrow with `err instanceof Error`, `typeof err === 'string'`, or a zod parse
- `console.error("[Component] action failed:", err)` is fine even on `unknown` (console takes anything)

**Discriminated unions over flat unions:**
- BAD: `type R = { kind: 'ok' | 'err'; data: string | null; error: string | null }`
- GOOD: `type R = { kind: 'ok'; data: string } | { kind: 'err'; error: string }` — `kind` narrows the rest
- AI defaults to flat because it's easier to write. Harder to use safely. Push back.

**Use `as const` for constants with literal types:**
- BAD: `const ROLES = { ADMIN: 'admin' }` → type `{ ADMIN: string }` (loses literal)
- GOOD: `const ROLES = { ADMIN: 'admin' } as const` → type `{ readonly ADMIN: 'admin' }`
- Same for status enums, route lists, anything where you want the string literal preserved

**Required typing at the data boundary:**
- Supabase: use generated types (`supabase gen types typescript --linked > lib/database.types.ts`) and `createClient<Database>(...)`. **After ANY migration, regenerate BEFORE writing code that uses the new schema.** Stale types = silent runtime errors.
- API route input: zod `.parse()` the body / query params
- Server actions input: zod-validate before use
- Form data: zod parse from `FormData` entries, not `as string`
- Env: typed `lib/env.ts` (mentioned in hardcoded-values section)
- `await res.json()` → `any` by default. Wrap with zod parse or type the response explicitly.

**React-specific:**
- Component props: explicit `interface Props { ... }`, no `(props: any)`, no `React.FC<Props>` (has implicit-`children` issues). Prefer `function Foo(props: Props): JSX.Element { ... }`.
- `useState` — provide a generic when initial value's type isn't enough (`useState<Salon | null>(null)`)
- Event handlers — `React.ChangeEvent<HTMLInputElement>` etc., not `(e: any)`
- Custom hooks, Context, `forwardRef` — all need typed generics

**Promise / async traps:**
- `Promise.all([a, b, c])` returns `[A, B, C]` — if any element is `any`, the whole tuple is `any`. Audit.
- Returning `Promise<any>` from async = forfeiting all downstream safety
- Use `Awaited<T>` to unwrap a promise type when needed

**next-intl typing (project-specific):**
- `useTranslations("home.hero")` is typed if message keys are typed. Make sure `messages/` is typed via the next-intl typegen step — otherwise translation keys are stringly-typed and typos compile.

**Generics:**
- Unconstrained `<T>` everywhere = hiding a bug
- `Partial<X>` only when "any subset" is truly what you mean — not to dodge "missing property" errors
- Generic constraints: `<T extends Record<string, unknown>>`, not `<T extends Record<string, any>>` — the `any` leaks through

**The mental check:** if AI suggests `any`, `as Foo`, or `@ts-ignore`, the prompt back is "what's the actual type?" — never accept the cheat.

**Boundary rule:** `unknown` is for data that genuinely hasn't been validated yet. Once it crosses a boundary (network → app, file → app, user input → app), it must be parsed (zod) or narrowed (type guard) before anything else uses it.

---

## 🔍 Duplicate functions — search before you build

AI defaults to creation mode. Every utility / component / hook / type / migration / schema / template AI proposes might already exist. Search FIRST, build only if absent.

**The 30-second pre-write check (mandatory before creating any reusable code):**
1. `grep -ri "<concept>" lib/ app/ supabase/` — name + variants (`formatDate`, `format_date`, `formatDay`)
2. `Glob "**/<concept>*.ts"` — file-name search
3. Read `_rules/UTILITIES_INDEX.md` (canonical inventory — keep it up to date)
4. For DB-level things: check `supabase/migrations/` history AND `lib/database.types.ts` for the current schema state

If found → import / extend. If found but slightly wrong → add a param / overload to the existing one, don't fork. If genuinely not found → create in the canonical location.

**Canonical locations — ONE home per category:**
| Category | Path |
|---|---|
| Format helpers | `lib/format/` |
| Generic utilities | `lib/utils/` |
| Custom hooks | `lib/hooks/` |
| Supabase queries | `lib/queries/` |
| Auth helpers | `lib/auth/` (single source for `requireAuth`, `getCurrentUser`, etc.) |
| Zod schemas | `lib/schemas/` |
| Constants | `lib/constants/` |
| Types (shared) | `lib/types.ts` or `lib/types/` |
| API clients | `lib/api/` |
| Email templates | `lib/email/templates/` |
| State stores | `lib/stores/` — ONE store per data domain |
| Test fixtures | `__fixtures__/` or `tests/fixtures/` |
| New components | `app/[locale]/_components/` |
| Legacy components | `components-legacy/` — **FROZEN, don't add, only delete** |
| Migrations | `supabase/migrations/` — **check existing before adding** |

**Where duplication already exists in Solen (high-risk areas — audit + consolidate):**
- `components-legacy/` vs `app/[locale]/_components/` — every page on legacy is a future dedupe job (see `_audits/2026-05-10-v3-wireup-audit.md`)
- Categories defined in 3+ places: `lib/types.ts` enum + `Header.tsx CATEGORIES` + `components-legacy/layout/Header.tsx CATEGORY_ICONS` + Gemini prompt in `lib/search/category-detect.ts` — change ONE, the others drift
- Salon card variants — `SalonCard.tsx` is the canonical one; any "compact card", "mini card", "list card" needs a prop on the existing one, not a new file
- Tailwind colors vs `app/globals.css` CSS variables — both must match. If you change one, check the other.

**Banned patterns:**
- Creating `formatDate` in a component file because "the existing one didn't fit" — extend with a param instead
- Inline-defining a hook that already exists in `lib/hooks/`
- Copy-pasting a Supabase query from one route to another — extract to `lib/queries/`
- Re-declaring `Salon` / `User` / `Booking` shapes — `lib/types.ts` is the only source
- Adding a fourth category list when three already exist — consolidate to one and re-export
- Defining a zod schema inline that already lives in `lib/schemas/`
- Hand-drawing an SVG icon when Lucide has one (`lucide-react` is in deps)
- Creating a second auth helper (`getServerSideUser`, `getCurrentSession`) when `lib/auth/` already exports the canonical one
- Forking an email template with a 3-line difference — parameterize instead
- Inline mock data per test — use shared fixtures
- Adding a migration without first reading the latest 5 migrations + `lib/database.types.ts` to confirm the change isn't already done

**The mental check:** before writing any function/component/hook/schema/migration, the question is "where would this already live if it existed?" Grep that path first.

**Three strikes consolidation:** if you find yourself writing similar logic in 3+ files, extract to `lib/`. Don't wait for the fifth instance.

**`_rules/UTILITIES_INDEX.md` discipline (the rule fails if this goes stale):**
- When you CREATE a reusable utility/hook/schema/canonical component, add a one-line entry in the SAME commit
- When you DELETE one, remove the entry in the same commit
- When you RENAME, update the entry
- Stale index = AI grows duplicates again → enforcement decays

**Scheduled dedupe sweeps:**
- After each V3 wire-up Tier completion (Tier 1, 2, 3), run a dedup pass before locking the tier:
  - Grep for the top 30 utility name patterns (`format*`, `parse*`, `use*`, `is*`, `get*`, `require*`)
  - Find duplicates, consolidate
  - Update `UTILITIES_INDEX.md`
- Don't ship a Tier with known duplicates — they compound across Tiers

---

## ✅ Tests must actually test — fake coverage is worse than no coverage

The "all green, zero confidence" pattern. A test is real ONLY if it would fail when the code is broken.

**Mental check before accepting any test:**
"If I deleted the function body of what this test is testing, would the test fail?" If no → fake test, rewrite.

**Mock at the EDGE, never inside:**
- ✅ Mock external APIs: Stripe, OpenAI, Resend / email send, third-party HTTP
- ❌ DO NOT mock Supabase queries — use a real test Supabase project (separate from prod)
- ❌ DO NOT mock `fetch` for internal API calls — call the real route in an integration test
- ❌ DO NOT mock auth helpers — use a real test Supabase Auth flow
- ❌ DO NOT mock the function under test (self-mocking proves nothing)
- ❌ DO NOT global-mock `Date.now()` unless testing schedulers/timers specifically

**Integration > unit for application code:**
- One integration test that hits a real test DB > 10 unit tests with mocked DB
- For CRUD-ish app code (route handlers, server actions, RLS policies), prefer integration
- Unit tests stay valuable for pure functions (formatters, parsers, calculations)

**Banned patterns:**
- `it('renders', () => { render(<X />); })` — no assertion, just inflates coverage
- `expect(...).toBeDefined()` as the only assertion — passes for almost everything
- `expect(...).not.toThrow()` without checking what happened
- `expect(mockFn).toHaveBeenCalled()` when you should be checking the OUTPUT
- `expect.any(Object)` / `expect.any(Array)` when specific value matters
- `expect(foo(1)).toBe(1)` tautologies where the test mirrors the implementation
- `.skip` / `.todo` left in code that's been there >1 week — fix or delete
- `.only` committed to main — fails CI
- `try { fn() } catch { /* maybe it threw, who knows */ }` in the test body
- Snapshot tests as the only assertion — snapshots lock in bugs

**Required for each test:**
- At least ONE happy-path assertion on the actual return value or DB state
- At least ONE error/edge case (null input, empty array, missing field, unauth user) for any function that has a branch
- Reset state between tests (test isolation — no leftover DB rows, no leaked mocks)

**Critical surfaces for Solen (when added, MUST be real-DB / real-flow, never fully mocked):**
- Stripe webhook handler — integration test with Stripe test mode + test DB
- Booking flow — E2E Playwright against a deployed preview
- Auth flows (signup, login, OAuth callback) — integration with real test Supabase Auth
- Cron jobs (`/api/cron/*`) — call route + verify DB state
- API routes that mutate DB — integration with test Supabase, NOT mocked
- RLS policies — direct SQL tests against test DB, impersonating users

**Mock drift detection:**
- When you change an API response shape, grep tests for stale mocks. AI rarely updates them.
- If types shared between mock and real (good practice), TS catches drift. If not, a real-server test will.

**Coverage:**
- 100% coverage = vanity metric. Don't chase it.
- Critical-path coverage matters: auth / payment / booking / RLS at high coverage. Trivial files (re-exports, type-only) excluded.
- The real metric is "would tests catch a mutation?" — if a tweak in source doesn't break a test, the test is weak.

**Test infrastructure (when first introduced — Solen currently has only `e2e/visual/homepage.spec.ts`):**
- Framework: Vitest (Vite-native, fast, integrates with Next.js cleanly). Not Jest (slower, CJS issues with ESM).
- Real DB tests: Supabase local stack (`supabase start`) gives a real test Postgres + Auth + Storage on localhost.
- E2E: Playwright (already wired for visual tests).
- Run order: `vitest` unit/integration → `playwright` E2E → on CI: both, against ephemeral test DB seeded fresh.

**Honest reporting:**
- "Tests pass" ≠ "feature works." Tests verify code; only manual + browser verification confirms the user experience (per the project's verifier-loop and done-claim discipline rules).
- A green CI badge with mocked tests is a lie. Don't ship behind it.

---

## 🔌 V3 wire-up status (2026-05-10)

V3 UI is largely shipped (homepage, SearchBar with Path C hub, atmosphere, sections) but **most homepage feed sections still use static `DEMO` arrays** (Coiffeur, LastMinute, Nearby, RecentlyViewed) — the salons shown are fake. The search-results page still renders legacy `SplitView`. Booking flow, auth, favorites, profile = NOT BUILT in V3.

**Active audit:** `_audits/2026-05-10-v3-wireup-audit.md` — phased customer-side wireup + reconnection. Customer surfaces only this round; B2B/Stripe/crons/email = separate audit later.

**Strategy = Modified Z (3-tier rebuild):**
- **Tier 1 (~15 critical-funnel pages, ~2 weeks):** search, salon detail, salon/booking, checkout, confirmation, auth/login, auth/signup, profile, profile/favorites, profile/bookings, 4 category pages, /[city]. Lock V2-D52, merge to main.
- **Tier 2 (~30 secondary surfaces, ~3 weeks):** salon detail extras, profile extras, help, vouchers, discover, onboarding, etc. Lock V2-D53.
- **Tier 3 (~45 long-tail, ~3 weeks):** legal pages, niche flows, brand pages. Lock V2-D54.

**91 of 114 customer page.tsx files import from `components-legacy/` (80%).** The V3 homepage is a beautiful lobby that opens onto a legacy hotel. All 91 eventually get V3 treatment.

**Don't ship Path C alone** — it's calling into broken downstream surfaces. Tier 1 ships together when Phase G.1 verifies all critical-funnel paths.

---

## ⭐ Design enforcement

Anything visual must come from `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3 era → V2-D48 Earthen Wellness Light pivot 2026-05-09 → V2-D42 typography pivot 2026-05-09 → V2-D49j color rule 2026-05-10). New colors use existing tokens. To change the design itself: edit `SOLEN_LIVE_TRUTH.md` first, then update any V3 mockup HTML in `public/solen-v2-*.html`, then log decision as next `V2-D##` entry in `_tasks/V2_REBUILD_LOG.md`. Historical Q-locks in `_tasks/archive/SOLEN_DESIGN.archived.md` §20 are context only — V3 supersedes any conflict.

**🚨 Permanent technical anti-patterns (LIVE_TRUTH §0d.7 + V2_REBUILD_LOG.md V2-D41-fu).** Read these BEFORE editing layout, body styles, atmosphere wash, salon cards, search bar, or section frames. Breaking any silently breaks visible design:
1. ❌ `bg-white` on `<body>` element (kills atmosphere wash)
2. ❌ Cat-color halo glows on salon cards (retired V2-D41)
3. ❌ Section padding ↔ ScrollRow margin drift (cards stick out past rounded border)
4. ❌ "Fixing" Cooper Black Std cdnfonts URL by reordering font-family (actual loaded font is Sansita 900)
5. ❌ `will-change` / `transform: translateZ(0)` at REST (causes blurry text)
6. ❌ Animating `width` / `height` to/from `auto` (browsers can't smooth this)
7. ❌ `mix-blend-mode: multiply` on `AtmosphereBlobs.tsx` (retired V2-D54 2026-05-11 — multiply darkens everything under blobs, producing a brownish film over cream substrate; cards look tinted and the page feels "just beige."). Also ❌ stacking >5 blobs or pushing opacity > 0.10 (retired V2-D55 2026-05-11 — V2-D54's vibrant glow ate the substrate; page felt "designer-pour" not "natural light"). Locked V2-D55 recipe: 5 blobs, `mix-blend-mode: normal`, opacity 0.05-0.08, `blur(130px) saturate(0.85)`. See `_rules/SOLEN_PATTERNS.md` §1.5.

---

## 📚 Topic-specific rules (load when relevant)

| Topic | File |
|---|---|
| DB schema | `_rules/DB_SCHEMA.md` |
| Security (RLS, rate limit, Zod) | `_rules/SECURITY_RULES.md` |
| Code safety | `_rules/CODE_SAFETY.md` |
| Structural | `_rules/STRUCTURAL_RULES.md` |
| I18N | `_rules/I18N_ROUTING.md` |
| Key features (60-entry list) | `_rules/KEY_FEATURES.md` |
| Lessons learned | `_rules/LESSONS_LEARNED.md` |
| **V3 patterns + Fresha playbook** | `_rules/SOLEN_PATTERNS.md` |
| **V3 wire-up audit (in progress 2026-05-10)** | `_audits/2026-05-10-v3-wireup-audit.md` |
| UI principles (skill) | `_rules/SOLEN_UI.md` |
| Agent coordination | `_rules/AGENT_COORDINATION.md` |
| Roadmap rules | `_rules/ROADMAP_RULES.md` |
| Systems map | `_rules/SYSTEMS.md` |
