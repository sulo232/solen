# Claude Design — Plan for Solen

**Generated 2026-04-22**
**Based on:** `CLAUDE_DESIGN_RESEARCH.md` (how Claude Design actually works) + `SOLEN_DESIGN.md` (what we want built) + `GAP_AUDIT_V2.md` (what's missing)

---

## 0. What Claude Design is — for our purposes

Claude Design (claude.ai/design) is Anthropic's design-assistant product, launched 2026-04-17, powered by Opus 4.7. Available on **Pro / Max / Team / Enterprise** tiers. **Key fact: it has a separate weekly quota** from Claude Chat / Claude Code — we can iterate without eating our coding quota.

For Solen, it matters because:
- ✅ It extracts a **project-level design system** from our codebase at onboarding, and that system persists across design sessions. One-time correct setup = all future sessions inherit locked tokens.
- ✅ It outputs a **"Claude Code handoff bundle"** — a ZIP we can apply back to the repo, not just raw copy-paste code.
- ✅ It refines output via **chat + inline comments + adjustment sliders** — iterative, not one-shot.
- ⚠️ Several facts unverified: GitHub fetch behavior, Figma support, React idiom output, exact quota numbers.

## 1. How we'll use it — the working loop

```
[Repo state + design system]
         ↓
Claude Design onboarding (1-time)
   ↳ extracts SOLEN_DESIGN.md tokens into "project design system"
   ↳ persistent across all future sessions
         ↓
Per-feature design session (rolling)
   ↳ prime with SOLEN_DESIGN.md + solen-coral.html
   ↳ ask for specific feature/component
   ↳ refine via chat + sliders
         ↓
Claude Code handoff (export)
   ↳ ZIP bundle with design + component code
         ↓
Apply in Claude Code
   ↳ I review, adjust, merge to branch
   ↳ build verify, commit, push
```

## 2. One-time onboarding — the critical move

Claude Design's "project design system" feature persists tokens across every future session. **Setting this up correctly ONCE eliminates 80% of drift risk.**

### Steps (30-45 min, do when quota clears)

1. **Go to claude.ai/design → Create new project → "Solen"**
2. **Connect GitHub repo** (`sulo232/solen`) — recommend **linking a subdirectory**, not the whole repo. Best subdirectory: `components/ui/` + `tailwind.config.js` + `app/globals.css` + `_tasks/SOLEN_DESIGN.md`
3. **Upload the Desktop bundle as supplementary files:**
   - `SOLEN_DESIGN.md` — spec
   - `solen-coral.html` — living visual reference
   - `CLAUDE_DESIGN_PROMPT.md` — paste its content into "Any other notes"
   - `package.json` — metadata marker
   - Skip the audit docs (`DESIGN_AUDIT_MASTER.md`, `INVENTORY_FULL.md`, `MASTER_ROADMAP.md`, `ROADMAP_AUDIT.md`, `GAP_AUDIT*.md`) — they're reference for us, not for Claude Design. Keep them OUT so Claude Design doesn't get confused about what's current vs retired.

4. **First prompt** — establish the system. Use this exact wording:
   ```
   Read SOLEN_DESIGN.md end-to-end and confirm you understand the 15 locked decisions in §20. Then list: (1) the palette tokens, (2) the three fonts + their scope, (3) the 3 contexts where glass is allowed, (4) the 3 contexts where blobs are allowed, and (5) what's explicitly retired. Don't generate any designs yet — I want to verify you have the system right first.
   ```

5. **Verify output.** If Claude Design summarizes correctly, we're primed. If it mentions anything retired (cream bg, Syne, "Basel-only", green+peach, `--sh-xl`, 4-segment search), flag and correct before proceeding.

## 3. Session-level workflow — per feature

Each design session focuses on **one feature area**. Don't ask for "redesign homepage" in one shot — that's too wide and Claude Design will invent tokens.

### Ideal session template

```
[Session 1] Homepage — section 1 (hero)
[Session 2] Homepage — sections 2-3 (search, categories)
[Session 3] Homepage — sections 4-6 (recently visited, discovery, empfohlen)
[Session 4] Homepage — remaining sections
[Session 5] Salon detail page — layout
[Session 6] Salon detail — services list + reviews
[Session 7] Booking wizard — all 4 steps
[Session 8] Dashboard shell + stats
... etc
```

### Per-session prompt pattern

```
Reference: SOLEN_DESIGN.md (already in project memory).
Feature: [SPECIFIC: "Homepage hero section"]
Rendering at: 1280px desktop + 375px mobile
Must use tokens: coral #E8624A, Fraunces, Bebas Neue, DM Sans, white bg, no --sh-xl
Must NOT include: cream bg, Syne, Basel-hyperlocal voice, 4-segment search, dark mode
Constraints from spec:
- Section order locked
- Hero uses "Für [city]" dynamic copy fallback "Für deine Stadt"
- 3-segment search bar
- [additional constraints from the spec for this section]

Output: full HTML + inline CSS using the locked tokens. I'll apply it to our Next.js codebase via Claude Code.
```

### After each session

- Export as "Claude Code handoff bundle"
- Open the bundle in Claude Code (this tool)
- Apply to relevant component, build verify, commit, push
- Update SOLEN_DESIGN.md §20 if any new micro-decisions were made
- Next session picks up the updated state

## 4. What to AVOID in Claude Design sessions

These patterns burn quota or invite drift:

- ❌ **"Redesign the whole homepage"** — too wide, too much invention, bad output
- ❌ **"Make it look nice"** — vague, token-free, will drift from locks
- ❌ **Uploading the whole repo as a folder** — performance + confusion
- ❌ **Uploading retired docs** (DESIGN_AUDIT, ROADMAP_AUDIT, old CLAUDE.md versions) — confuses the model
- ❌ **Asking for brand/palette changes** — locks are locks; use Claude Chat or DESIGN_SYSTEM edits, not Claude Design
- ❌ **Asking for code copy-paste** — use the Claude Code handoff bundle instead
- ❌ **Iterating on unlocked decisions mid-session** — if you realize a spec needs a change, pause, update `SOLEN_DESIGN.md` §20, re-prime Claude Design, then continue

## 5. Priority feature list (order to tackle in Claude Design)

Ordered by user-visible impact × quota efficiency:

### Tier 1 — Homepage (biggest visual real estate)

| # | Feature | Current state | Claude Design session |
|---|---------|---------------|----------------------|
| 1 | Hero + search bar | Basel-hyperlocal copy + 4-seg search in prod | Rebuild with 3-seg + Swiss-wide voice |
| 2 | Category scroll row | Generic icons, basic styling | Iconly/lucide polish + spacing |
| 3 | Recently visited carousel | Cards OK, hover pills OK | Polish pill color system |
| 4 | Discovery preview (3:4 cards) | Gradient placeholders | Polish overlay + "Direkt buchen" pill |
| 5 | Empfohlen / Trending / Per-category rows | White-box cards (pre-Q1 style) in FeaturedSalonCarousel | Already partially updated — polish pass |
| 6 | Deals banner | Peach gradient looks OK | Minor polish |
| 7 | City cards | Dark gradient rectangles | Polish to match Q5 Swiss-wide voice |
| 8 | Map teaser | Basic gradient card | Polish or redesign |
| 9 | Review cards | Solid white cards | Polish type/spacing |
| 10 | Instagram blob tiles | Playful blob shapes | Polish — these are the signature |
| 11 | Quartier dark section | Gold index numbers | Polish + Swiss-wide voice |
| 12 | Partner gradient block | Coral→plum gradient | Polish — it's the call-out block |
| 13 | Footer | Forest-deep bg with links | Update voice to Swiss-wide |

### Tier 2 — Salon detail page
- Photo gallery, staff section (StaffPortfolio wiring), services list, reviews, booking sidebar, mobile sticky CTA

### Tier 3 — Core flows
- Booking wizard (4 steps)
- Checkout page
- Confirmation page
- Tip flow
- Walk-in pay

### Tier 4 — Discovery + category pages
- `/discover` masonry grid
- Category pages (`/coiffeur`, `/nails`, etc.)
- `/search` with map split

### Tier 5 — Dashboard (salon owner + admin)
- Dashboard shell + navigation
- Calendar view
- Analytics
- Marketing tab
- Category-specific dashboards (nail AI art, barber queue, etc.)

## 6. Gaps we fix BEFORE running Claude Design sessions

From `GAP_AUDIT_V2.md`, these block Claude Design's project design system from extracting correctly:

### MUST fix before first Claude Design session

1. **NEW-1 aspect-[4/3] in 3 files** → `aspect-square` (5 min)
2. **NEW-6 SOLEN_DESIGN.md voice example** → update to Swiss-wide (2 min)
3. **NEW-4 Footer tagline** → "Für deine Stadt. Für die Schweiz." (10 min)
4. **NEW-5 /termine redirect** (5 min)
5. **NEW-9 Bottom nav → 4 tabs** (15 min) OR update Q14 lock to match code
6. **NEW-3 partial** — update AT LEAST the footer tagline + hero_title in all 4 locales (30 min)

Total: ~1 hour of mechanical fixes.

### CAN fix during / after Claude Design sessions

- NEW-2 dark mode cleanup (cosmetic, dead CSS)
- NEW-3 full messages Basel → {city} migration (2-3 hrs, can be Sprint 2)
- NEW-10 Solen Favorit badge (Claude Design generates the design; we implement)
- NEW-11 swipeable carousel (Claude Design helps with visual; implementation in Claude Code)
- NEW-12 claim ribbon (Claude Design generates; we implement)
- NEW-15 TWINT (backend work, not design)

## 7. Quota budget + pacing

Since Claude Design is on a separate weekly quota we don't know the exact limit for yet, pace conservatively:

- **Target: 3-4 Claude Design sessions per week** (estimated safe)
- **Session length:** 15-30 min (focused on ONE feature area, not wide-scope)
- **If quota hits mid-session:** save the session state, wait for reset, continue
- **Between sessions:** I do the implementation in Claude Code (that's where our effort lives)

Over 6 weeks, with Tier 1 + Tier 2 priorities, this plan covers:
- Homepage fully polished: 3-4 weeks
- Salon detail fully polished: 1-2 weeks
- Core flows: 2-3 weeks (may run in parallel)

## 8. Fail-safes + checkpoints

### After each Claude Design session, verify:
1. **Output doesn't reference retired tokens** (scan for: cream, Syne, Phosphor, `--sh-xl`, Basel-hyperlocal, green+peach, 4-segment, dark mode)
2. **Output uses only declared locked tokens** (coral, white, warm ink, amber, plum, sage, blue, yellow + Bebas Neue + Fraunces + DM Sans)
3. **Spacing uses 8-point grid** (no 5, 7, 9, 11, 13, 15)
4. **Radii are from the defined set** (12/16/18/20/99)

If any fail → respond to Claude Design session with "Re-render using only these tokens: [list]. Don't invent new values." and re-check.

### Weekly checkpoint (outside Claude Design):
- Have we drifted any lock? Audit `GAP_AUDIT_V2.md` → re-run quick grep
- Any new contradictions introduced by Claude Design output?
- Is SOLEN_DESIGN.md §20 kept up-to-date with any new micro-decisions?

## 9. The 12 unverified Claude Design facts — discover as we go

From research doc §8, these are unknowns we can only answer by using the product:
1. Exact file-type ingestion rules for GitHub
2. GitHub re-fetch vs cache behavior
3. Upload-vs-GitHub conflict priority
4. Numeric weekly quota per tier
5. Session-to-session chat memory persistence
6. File-size upload limits
7. Figma read/write support
8. Custom Google Font rendering in canvas
9. Responsive (mobile/desktop) preview behavior
10. React / Next.js output idiom
11. Whether tokens-referenced-by-name actually resolve to values
12. How "Claude Code handoff bundle" structures its output

**Document findings in a new `_tasks/CLAUDE_DESIGN_LEARNINGS.md` as we use it.** After 3-5 sessions, we'll know how this thing really works.

## 10. Rollback plan

If Claude Design produces output that:
- Breaks multiple locks
- Invents new tokens
- Doesn't match the SOLEN_DESIGN.md spec

Then:
1. **Don't apply the output.** Export the session as reference only.
2. **Roll back Claude Design project** to before the drift (re-prime with SOLEN_DESIGN.md).
3. **If repeated failures across sessions:** consider that Claude Design may not handle our level of design-system strictness, and fall back to direct iteration via Claude Chat → Claude Code → SOLEN_DESIGN.md updates.

## Summary — the 60-second version

1. **Fix 5 critical gaps** from `GAP_AUDIT_V2.md` first (1 hour).
2. **Onboard Claude Design** with a subdirectory + SOLEN_DESIGN.md + solen-coral.html (30-45 min).
3. **Verify onboarding** by asking Claude Design to summarize the 15 locks.
4. **Run sessions** one feature at a time, export as Claude Code handoff.
5. **Apply exports here** in Claude Code. Commit, push, verify build.
6. **Repeat** until tier 1 homepage polished, then salon detail, then flows.
7. **Document learnings** as we discover Claude Design's actual behavior.

**Estimated time:** Tier 1 homepage + Tier 2 salon detail fully polished = 4-6 weeks of disciplined use.
