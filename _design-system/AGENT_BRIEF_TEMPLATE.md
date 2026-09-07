# Agent Brief Template — Route Rebuild

**Purpose.** Standard self-contained brief for any sub-agent doing a route rebuild (Fresha bones + Solen skin). Copy this template, fill in `ROUTE` + `SECTIONS` + `INTENTIONAL DEVIATIONS`, and dispatch.

**The whole brief is self-contained.** Sub-agents have NO conversation context — they read only what's in the brief. Don't reference "as we discussed" or "per the earlier turn." Include everything they need.

---

## Standard brief format (copy-paste, fill the bracketed parts)

```
ROUTE: [/de/salon/[slug]  OR  /de/business  OR  /de/search ...]
SCOPE: [list of sections owned by this agent, e.g. "every section of /salon/[slug] — Hero, Header, TopNav, Services, Team, Reviews, Portfolio, About, Hours, Loyalty, BookBar"]
PROJECT ROOT: /Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7
DEV SERVER: running on http://localhost:3000

═══════════════════════════════════════════════════════════════
STEP 1 — NON-NEGOTIABLE FIRST ACTION
═══════════════════════════════════════════════════════════════

Your first three tool calls must be reading these files:
1. `_design-system/COMPONENT_REGISTRY.md` (full)
2. `_design-system/SOURCE.md` (sections §1, §2.5, §14.0 minimum)
3. `_design-system/QUESTIONS.md` (resolved Q list — Q1-Q31)

Then in your first reply, print:
- The list of existing components from the registry (just names)
- The 3 color layers from §1 (one line each)
- The current accent token: `#276EF1`
- The universal-components rule (V3-D205, no category branches)

If you skip this step you will rebuild things that exist. The explicit-target drift report may surface related source candidates, but the registry check is the actual reuse evidence.

═══════════════════════════════════════════════════════════════
STEP 2 — RESEARCH (per section)
═══════════════════════════════════════════════════════════════

For EACH section in your scope, do this FIRST — no exceptions, no code before it lands:

**Fire `fresha-section-capture` on the section.** That's the entire step.

```
Skill: fresha-section-capture
Args:
  FRESHA_URL    — real fresha.com page that has the section (e.g. https://www.fresha.com/a/<slug>)
  SECTION_NAME  — slug for output folder (e.g. salon-hero, services-row, sidebar)
Output:
  public/_pixel-refs/fresha/<section>/
    SPEC.md             ← TLDR + measurements + mission-lock translation table
    INTERACTIONS.md     ← every click + result
    motion-specs.md     ← CSS transitions/animations per element
    _interactives.json  ← raw JSON
    static-mobile-375.png + static-desktop-1440.png
    click-NN-*.png      ← interaction screenshots
```

The skill (added 2026-05-27 after a screenshot-whack-a-mole incident — see V3-D229 → V3-D230 closing-the-loop validation) bundles:
- mobile + desktop static screenshots
- DOM walk + every interactive's computed CSS (font, color, transition, animation, border-radius, padding)
- click-result capture per interactive
- mission-lock translation table (Fresha values → Solen tokens)

It replaces the 40-line manual orchestration of Mobbin queries + Playwright navigation + pixel-spec-auto runs + click capture + measurement tabulation. ONE command instead of six.

**Then READ the SPEC.md.** Internalize the mission-lock translation table. Don't write code until you have. The whole point of the skill is to put a SPEC in front of your face that says exactly what to change — if you skip reading it you're back to eyeballing.

**Mission lock — repeat with every section:**

> Exact copy of Fresha section anatomy, spacing, hierarchy, animations, click states. Only exceptions: Solen primitives (SalonCard / HeartButton / SearchBar / StatusInline / TabPill / Toast / Skeleton / ComingSoon / Step / FAQItem / BentoCard / MarketplaceVisual — StatusPill DELETED 2026-06-30, MetaDot banned V3-D232; list corrected 2026-07-12), tokens (`s-accent #276EF1`, `s-star #FFC32B`, heart `#FF3366`, `s-urgency #C2410C`), fonts (Inter Tight display, Inter body), and CTA discipline (primary CTAs stay `bg-s-ink` per V3-D192-fix lock). Everything else is exact-copy Fresha.

**Anti-pattern this kills:** "screenshot whack-a-mole" (user's V3-D229 → V3-D230 incident). Treating each pasted user screenshot as a new bug, patching the surface delta, missing the structural gap. The skill forces you to see motion + click states + sizes + colors that static screenshots hide. If you find yourself eyeballing — stop, fire the skill, get the spec.

═══════════════════════════════════════════════════════════════
STEP 3 — BUILD (per section)
═══════════════════════════════════════════════════════════════

For each section:

A. Check the registry FIRST. Does a component exist for what you need? Use it. Don't recreate.

B. If a genuinely NEW component is needed:
   1. Append a row to `_design-system/COMPONENT_REGISTRY.md` "Proposed" section claiming it. This synchronization point prevents parallel agents from duplicating.
   2. Build the `.tsx` at the correct location (`primitives/` if cross-route, route-folder if scoped).
   3. Write the per-component `.md` doc at `_design-system/components/<Name>.md` (use existing docs as template — Purpose / Layer / Public API / Visual signature / Motion / Do-Don't / Edge cases / Provenance / Related).
   4. Move the row from "Proposed" to the appropriate locked section.

C. Universal-components rule (V3-D205):
   No category-specific branches anywhere. The same component must render for Coiffeur, Barber, Nails, Spa, Massage. No `if category === 'X'`. No category-specific hardcoded copy. Parameterize via data. Drift-checker rule B5 will flag violations.

D. Color rules (V3-D197):
   - Decision tree first: ask if color carries semantic meaning → Layer 3 (use universal token). If brand identity moment → Layer 2 (`s-accent #276EF1`, SMALL footprint). Else → Layer 1 chrome (B&W).
   - NO category-specific colors. NO inventing hues.
   - Universal colors: success=`s-success`, error=`s-error`, warning=`s-warning`, info=`s-accent`, rating=`s-star` (#FFC32B), save=`--heart-active` (#FF3366), urgency=`s-urgency #C2410C on #FFF1E6` (V3-D424), disabled=`s-ink-3`.
   - Primary CTAs stay `bg-s-ink` (V3-D192-fix). Blue accent is small highlight only.

E. Typography (V3-D190/D191/D193):
   - Display = Inter Tight, weight 700 (Hero H1), 600 (all section + page headings). Tracking -0.02em. NEVER 800 (V3-D325/D327).
   - Body = Inter, weight 400 (body + meta, the default), 500 (card names + sub), 600 (semibold). V3-D410: Inter 400 reads solid; Hanken + the 300 default are retired.

F. Iconography (V3-D203):
   - Lucide icons ONLY. No emoji. No Phosphor, no Heroicons, no custom SVG.
   - Sizes per §7: 10-11 (badges), 12 (inline rating star), 14-16 (button), 18-20 (toolbar), 24+ (hero).

G. Component anatomy MUST match Fresha screenshot:
   - Same element order
   - Same hierarchy
   - Same spacing pattern (with measurements from Step 2C as guide)
   - Same micro-interactions (from Step 2B click-state captures)
   Only colors + fonts + accent differ. Layout is Fresha-shaped.

═══════════════════════════════════════════════════════════════
STEP 4 — VERIFY (per section, then per route)
═══════════════════════════════════════════════════════════════

Per section:
1. Live-server the section: navigate dev server to the route, take screenshot at 375×812.
2. Side-by-side compare your screenshot vs the Fresha reference.
3. If layout differs: iterate. Don't move to next section until this one matches (colors/fonts intentionally differ; LAYOUT must match).
4. Save side-by-side comparison to `_audits/screenshots/<route>/<section>-vs-fresha.png` (use a Python script if needed to stitch).

Per route (after all sections):
1. Run pre-finish checklist:
   - `tsc --noEmit` clean on all touched files
   - Run `solen-drift-check` with explicit changed `.ts`, `.tsx`, or `.css` targets; review applicable candidates. The report is not a clean verdict.
   - All new components in COMPONENT_REGISTRY.md (move from Proposed to Locked)
   - All new components have per-component `.md` with Layer: declaration
   - All section .md files have `Reference:` line pointing at a Fresha screenshot
   - No emoji anywhere (`grep -r '[⭐✨🎉👏✅❌🚀💡🔥]' app/` clean)
2. Do not add scanner globs or exclusions as part of this brief. Future checks select their actual changed targets explicitly.

═══════════════════════════════════════════════════════════════
STEP 5 — RETURN
═══════════════════════════════════════════════════════════════

Final reply (~500 words):
- Sections built (list each with file path + section.md path)
- New components added to registry (list with paths)
- Pre-finish checks status (each line: PASS / FAIL)
- Open questions surfaced (added to QUESTIONS.md as Q{n})
- Any sections deferred + reason
- Comparison screenshots saved to `_audits/`

After your reply, a VERIFIER sub-agent will run. It will read your screenshots + the Fresha refs + your code. It will return PASS or a punch list. You'll be asked to iterate on the punch list. Loop until PASS or round-3 stop.

═══════════════════════════════════════════════════════════════
INTENTIONAL DEVIATIONS (so verifier doesn't flag them)
═══════════════════════════════════════════════════════════════

These differ from Fresha by design — verifier should NOT flag them as gaps:

- Display font is Inter Tight (Fresha uses a different sans). Don't flag.
- Body font is Inter 400 (Fresha differs). Don't flag.
- Primary CTAs are `bg-s-ink` (Fresha uses green). Don't flag.
- Accent color is `#276EF1` blue (Fresha green for accent moments). Don't flag.
- Eyebrows are plain ink text (`text-s-ink-3`), with NO accent and NO leading bullet (V3-D330/D331). Accent `#276EF1` is functional-only: focus rings, spinner, input fields. Don't flag.
- Star rating uses yellow `#FFC32B` (universal convention — Fresha also yellow, so match).

[Add more if your route has specific deviations]

═══════════════════════════════════════════════════════════════
CONSTRAINTS
═══════════════════════════════════════════════════════════════

- DO NOT touch `/api/*`, `.env.local`, `tailwind.config.js`, database migrations
- DO NOT modify `_design-system/SOURCE.md` (read only — rules are locked)
- DO NOT modify `app/[locale]/salon/[slug]/page.tsx` (page wrapper has feature-flag, owner check, posthog — outside your scope)
- DO NOT run `npm run build`
- DO NOT commit or push
- PRESERVE V3-D{n} provenance comments in every file
- TypeScript strict — no `any` without justification
- File paths use `[locale]` literally (Next.js dynamic segment)
- All file edits must be surgical — never rewrite a file you only need to change 5 lines of

Time budget: estimate up front. If a section takes >2× your estimate, surface it (don't grind).

═══════════════════════════════════════════════════════════════
START NOW
═══════════════════════════════════════════════════════════════
```

---

## How to use this template

Three steps:

1. **Pick a route.** /salon/[slug], /business, /search + categories, etc.
2. **Fill the bracketed slots:**
   - `ROUTE:` the live URL
   - `SCOPE:` the section list for that route
   - `INTENTIONAL DEVIATIONS:` route-specific deviations from Fresha (the standard list above stays)
3. **Dispatch the agent** with the filled template. Run in background. Wait for completion notification. Run verifier.

---

## Verifier brief format

The verifier is a SEPARATE sub-agent that runs after the main agent. It's read-only — does not write code. Its brief:

```
You are VERIFYING a route rebuild that just finished. Read-only review.

ROUTE: [same route as main agent]
MAIN AGENT'S TOUCHED FILES: [list from main agent's reply]
FRESHA REFERENCES: public/_pixel-refs/fresha/<route>/
USER'S CURATED REFERENCES: /Users/sulo/solen/screenshots/
LIVE DEV URL: http://localhost:3000/<route>

INTENTIONAL DEVIATIONS [paste from main agent's brief — don't flag these]:
- ...

YOUR JOB:
1. Read the main agent's section .md files in `_design-system/sections/<route>/`.
2. Take fresh screenshots of the live route at 375×812 and 1440×900.
3. Compare side-by-side with the Fresha references for each section.
4. Look for:
   - Layout gaps (anatomy differs from Fresha)
   - Missing interactions (button click doesn't open the right modal/drawer)
   - Wrong tokens (semantic color where ink should be, or vice versa)
   - Hardcoded values (inline hex, magic numbers without provenance)
   - Components recreated despite existing in registry
   - Per-component .md missing Layer: declaration
   - Per-section .md missing Reference: line
   - Emoji anywhere
   - Category-specific branches (`if category === 'X'`)
5. RETURN: PASS or punch list. Each punch list item must include `file:line` + what's wrong + recommended fix.

NO CODE EDITS. Only diagnosis.
```

---

## When NOT to use this template

- Single-component edits (StatusPill color tweak) — direct edit, not an agent
- Token swaps across files (e.g. retired-token sweep) — explicit-target `solen-drift-check` report + main agent
- Bug fixes that don't affect visual design — direct edit
- Pure refactors (no visual change) — direct edit

The template is for **route rebuilds against Fresha references**. That's its job.
