# Solen.ch

Swiss beauty + wellness booking marketplace. Next.js App Router + Supabase + Stripe. Deploy: **Netlify** (auto from `main`). Cron via GitHub Actions (`.github/workflows/cron-jobs.yml`). i18n: de / en / fr / it.

---

## 🗺️ Before you BUILD, MOCK, or REDESIGN anything — check what already exists (V3-D440, 2026-06-02)

**The #1 recurring failure: rebuilding / re-mocking / re-proposing something that already exists, because no file said it did, and a context-reset wipes the memory so it recurs.** (Almost re-mocked the walk-in screens that were shipped; re-created the `tips` table; built a FAKE calendar mockup when the `DateTimePicker` primitive ALREADY did grouped-grid + blue selected.) Applies to **backend, frontend, AND design/mockups equally**: before you mock, propose, or redesign ANY UI, run `npm run exists <thing>` + read `_design-system/COMPONENT_REGISTRY.md`. NEVER assume a component or pattern doesn't exist, and never hand-fake one in a mockup when the real one exists. If you catch yourself guessing whether something exists, STOP and check.

- **`npm run exists <keyword>`** — run this BEFORE creating any new page / endpoint / component / migration / lib util. It live-scans the repo and lists every existing route, endpoint (+ HTTP methods), component, lib module, and DB table that matches. **A hit → REUSE or EXTEND. Empty → safe to build new.** (e.g. `npm run exists walk-in` → all 25 existing pieces.)
- **`_inventory/SURFACE.md`** — the full auto-generated map of what exists. Regenerate with **`npm run inventory`**. 🤖 Never hand-edit it; it's generated from the filesystem so it cannot rot like the old hand-written `UTILITIES_INDEX.md` / `KEY_FEATURES.md` did.
- **`_inventory/STATUS.md`** — thin hand-kept layer for what a scan can't know: partial / deprecated / don't-reuse-for. Read it when `exists` returns a hit; append when you ship or deprecate.
- DB tables + columns come from a LIVE snapshot (`_inventory/_db-snapshot.json` + `_db-columns.json`), NOT migration files — migrations drift from the live DB (the schema-drift bug). `npm run exists <column>` works. Refresh both together (ask Claude to re-run `list_tables` + the `information_schema.columns` query) before trusting backend table/column existence.
- **Coverage:** routes · API endpoints (+ HTTP methods) · components (incl. colocated under `app/`) · lib + hooks · Supabase RPCs (parsed from migrations) · DB tables + columns.
- **Enforced, not honor-system:** a PreToolUse hook (`.claude/hooks/pre-build-exists-check.sh`) BLOCKS creating a new `page.tsx` / `route.ts` / migration until `npm run exists` has run this turn (override: `touch .claude/exists-skip.flag`, 30-min TTL). CI (`.github/workflows/inventory-freshness.yml`) reds the PR if `SURFACE.*` is stale or the DB snapshot is > 30 days old.

---

## 🏁 Finish the job — do NOT report-and-wait (V3-D444, 2026-06-07)

Given a multi-step task or a list, **finish it.** Do not stop after each step to report and wait for "ok" — that wastes the user's turns and is a top recurring complaint. Keep going until the work is actually done, THEN report once.

Pause mid-task ONLY for:
- a genuine **decision** only the user can make (a real fork, not a default you can pick), or
- a **design / taste choice that needs a MOCKUP** for the user to react to.

Everything else (mechanical edits, sweeps, enforcement wiring, verification, applying an already-decided spec) = keep going to completion. **"ok" / "continue" / "go" means finish the list, not do one item.**

---

## 🎯 Taste rules: the 10 I most often get wrong (V3-D441, 2026-06-07)

**Why this block exists:** SOURCE.md + LOCKFILE hold the full system, but they're 80KB+ and I don't re-read them before a small edit, so I drift. These ten are what my own correction history shows I break most. They live HERE because in-context beats buried. The machine-checkable ones (hex, retired tokens, dead clicks, arbitrary color, durations) are now **enforced** by a PreToolUse gate (`.claude/hooks/pre-edit-drift-gate.sh`) that BLOCKS the edit; the taste ones still need judgment every time.

1. **No fabricated data.** Never render a number / status not wired to a live source: no "Frei in 15 Min", fake ratings, fake counts. Omit the element and flag it for wiring. A fake value is worse than a dot, it's a lie the user trusts.
2. **No decorative artifacts.** No separator / status dots (`•`, colored pips), no redundant filler ("· Walk-in", repeating the price already shown above the CTA). Every element carries information or it gets deleted. And when two adjacent bits already differ by colour or weight (e.g. green "Geöffnet" + ink "bis 19:00"), that contrast IS the separator, do NOT add a `·` between them too.
3. **80 / 17 surfaces+ink; blue is SPARSE (small clickable bits ONLY).** ~80% neutral surfaces (white + COOL sunken `#F4F4F5`, no warm cream), ~17% ink (`#0A0A0A` + greys + hairlines + photos). Blue `s-accent #276EF1` goes ONLY on small clickable accents: **text links** ("Buchung verwalten", "Mehr lesen"), **small buttons / chips**, **small tappable metadata** (review counts "(54)"). NOT on big CTAs, NOT on see-all **arrows** (those stay ink/black), NOT on secondary buttons (neutral outline), NOT on body/labels/prices/headings/eyebrows. Clickability on structure is signalled by AFFORDANCE (chevron / underline-on-hover / weight / icon), not colour. The one primary/commit CTA stays ink (`bg-s-ink`). **(LOCKED 2026-06-10, RESTRAINT — supersedes the generous-blue v2; reference = Apple / Airbnb / Fresha.)** Selected/active states stay blue ONLY as small chips (filter pill = blue border+text V3-D450; calendar date/slot fill).
4. **Semantic color is independent of the interactive-blue accent.** Elements with universal meaning keep their hue: star `#FFC32B`, success/confirmation = **normal green `#16A34A`** disc + white check (NOT deep `#15803D` — dark green rejected 2026-06-10; inline status chips may stay pale-green), availability green, error red, save-heart `#FF3366`. Blue is a small clickable accent only (links / small buttons / review counts) — NOT prices, NOT big CTAs; prices stay ink/grey. Don't monochrome a semantic element to ink to "stay on brand."
5. **No muted focal fills + coherent emphasis.** Never use a dark `.text` token (`#906309`, `#9A3412`) as a FOCAL fill, it reads muddy. Focal = a vivid `.DEFAULT` token or surcharge orange `#EA580C` on a light tint bg. Surcharge is orange, not blue. And emphasis (weight or colour) maps to a WHOLE meaningful unit, never an orphan sub-token: bolding/colouring just the "65" but not the "from / CHF" reads as a glitch, not a decision. A card may carry two ink elements (name + price) only if the NAME is larger, so size, not colour, marks the anchor (V3-D442, amends A13).
6. **Refined pastel, never screamy.** Inline status chips/badges = pastel `.bg` + ink text + saturated icon (Stripe / Vercel restraint), not a saturated solid block. The success/confirmation disc = **normal green `#16A34A`** + white check (NOT deep `#15803D`, NOT a pale tint).
7. **Elevation is earned by the background, not the button.** One primary commit → ink fill; a control over a photo → frosted glass (`FROST_GLASS`, `lib/frost-glass.ts`); a calm control on white / stone → FLAT, no shadow. White + shadow on a calm surface is the banned grey-haze.
8. **Fonts:** Inter Tight (display / headings) + Inter (body) + JetBrains Mono (codes). **Never Geist.**
9. **Ground in the system; don't invent.** Pull size / affordance / selected-state from a LOCKED component (avatar size from SalonTeam, selected = ink-border). Don't eyeball or invent hex / sizes / copy. "Too heavy / too small" = refine the existing affordance, don't replace it. When a value isn't locked, ASK, don't fill from memory.
10. **No em-dashes; emoji chat-only.** No `—` / `–` anywhere in UI copy, code, comments, or commits (use period / comma / colon / parentheses / spaced hyphen). Emoji + playful tone live in chat replies only, never in shipped code or files.

Full system lives in `_design-system/SOURCE.md` (canonical) + `LOCKFILE.md` (frozen literals); on an aesthetic conflict, LOCKFILE wins. Screen-by-screen taste decisions elicited with the founder are logged in `_design-system/TASTE_LOG.md` (read it before design work on a covered surface, so a settled call is never re-litigated).

---

## 🔒 Design contract — LOCKED (V3-D443, council-stamped 2026-06-07)

Frozen single-values. Do NOT re-open any row without the owner saying so by name. Visual rulebook: `public/solen-styleguide.html`. Full axes + sweep status: `_design-system/CONSISTENCY_AUDIT.md`.

| axis | locked |
|---|---|
| selected / active | blue `s-accent`. date/slot = blue FILL; **filter pills/chips = blue BORDER + blue text, NO fill** (V3-D450). ink ONLY for the one commit button. |
| link | text links = blue `s-accent` #276EF1 (small clickable bit), hover underline. **See-all arrows = ink/black; big CTAs = ink; secondary buttons = neutral outline.** Blue is SPARSE — links, small buttons/chips, review counts "(54)" only (LOCKED 2026-06-10 restraint, supersedes "use blue a lot"; ref Apple/Airbnb/Fresha). |
| shadow | card `shadow-elevation-2` rest / `-3` hover; over-photo = frost; calm control = flat; sticky bar = gradient fade |
| text size | name **14** · meta **12** · section-H2 **clamp(18px,2vw,20)** · body **14** · CTA **15** (never ≤13 on a button) · eyebrow **11** |
| hierarchy | name leads by SIZE; price bold-ink but smaller than name; rating = yellow star; filler (category·city·distance) greys out |
| availability | **plain ink text — NO green pill** (owner call, do not re-add) |
| radius | card/block **16** (`rounded-card`) · button/chip pill · input **16** · sheet **28** · image flush(0) |
| spacing | 4-pt scale only; card pad `p-4`/`p-3`; page `max-w-[1280px]` (PDP 1180) |
| wrap | name truncate · meta truncate · title wrap · body line-clamp · price/rating nowrap |
| icon-button | `h-11 w-11` |
| hairline | `border-s-border` = **`#E4E4E7`** (cool neutral, v2 rule 4; reverses warm V3-D447 #E0DDDB; one token, every divider) |
| states | loading = `<Skeleton>` (shape matches the final layout, NOT a bare spinner) · empty = `<EmptyState>` · error = `<ErrorState>` (inline) / `ErrorFallback` (route). All exist + locked in COMPONENT_REGISTRY — USE them, don't hand-roll. |
| focus | inputs: ONE ink edge — `border-s-ink` + a single soft halo `box-shadow:0 0 0 3px rgba(10,10,10,.10)`, set globally in globals.css; primitives add NO extra `outline` (V3-D449 — no double ring). buttons/links: the global 2px ink `outline`. |
| disabled | `opacity-50 cursor-not-allowed` (e.g. the commit button before a slot is picked) |
| touch target | interactive controls ≥ 44px (`h-11`), the a11y floor |
| filter pill | selected = `border-s-accent` + `text-s-accent`, **NO fill**; hover (inactive) = `bg-s-bg-sunken` (sink), never `hover:border-s-ink` (V3-D450) |
| category tag | neutral — `bg-s-bg-sunken` + `text-s-ink-2`, NO per-category colour (incl. the on-photo eyebrow → `text-white`); owner picked B, V3-D449 |
| date / time | ONE `DateTimePicker` primitive — `dateLayout` strip (booking) \| calendar (search); booking + search share it. NO bespoke date UI (V3-D445) |
| nav | sub-page nav is single — the global `Breadcrumb` is excluded on `/{city}/{category}` (SearchTemplate owns it). No stacked home+back (V3-D449) |

**States are componentised + locked** (above) — USE them, don't hand-roll. Booking's `DateTimeStep` now renders the shared `DateTimePicker` (Skeleton loading). The rows above (incl. focus, disabled, 44px, filter-pill, category, date, nav) are all locked as of this session (V3-D445–450). Drift-checker calibration (V3-D446–450): A2 arbitrary sizes + A3 arbitrary durations = INFO; A1/A15/A17 comment-aware; token-equivalent hexes whitelisted; report respects `drift-ok`.

---

## 🎨 Design system — start here

**Before any design / UI work: read `_design-system/SOURCE.md`.** It is the canonical, 22-section source-of-truth for tokens, motion, spacing, components, voice, a11y, and patterns.

**Key recent rules** (V3-D197 / V3-D198 / V3-D199, 2026-05-26):
- **Three-layer color system**: Layer 1 chrome (B&W) / Layer 2 brand/interaction accent (royal blue #276EF1 — marks every interactive affordance: links, active states, secondary/ghost buttons, tappable rows; never on non-interactive text) / Layer 3 semantic UI (color IS the message — Toast / StatusPill / AlertBanner / FormFieldError / etc.). Before picking ANY color class, answer §14.0's decision tree.
- **Universal-color convention**: don't invent semantic hues. success=green / error=red / warning=amber / info=blue / rating=yellow / save=pink / urgency=burnt-amber / disabled=muted-grey. See §1 universal colors table.
- **Saturation contract**: every new color token defines `.DEFAULT` (L 36-51%, S 65-92%) + `.bg/.pale` (L 93-96%) together. See §1 saturation contract.
- **Refined pastel pattern** for Layer 3 surfaces: pastel `.bg` + ink text + saturated icon. Tailwind UI / Stripe / Vercel — not screamy saturated solids. EXCEPTION (v2 2026-06-09): the success/confirmation FOCAL moment is a deep solid green #15803D disc + white check, not a pale tint; pastel stays for inline status chips/badges only. It **supersedes**:

- `_tasks/SOLEN_LIVE_TRUTH.md` → archived (pre-B&W pivot, V2-D70 era — almost entirely stale)
- `_tasks/SOLEN_DESIGN.md` → extracted into SOURCE.md §2 (Colors) + §1 (Positioning), 95% aligned with shipped code

**It complements (does NOT supersede)**:

- `_rules/SOLEN_PATTERNS.md` → Parts 4-5-8 (Fresha translation playbook) extracted into SOURCE.md §21; rest still useful for tactical reference. Some token refs are stale — defer to SOURCE.md when in conflict.
- `_rules/SOLEN_UI.md` → universal UX principles (orthogonal to tokens). Stays in place — token references inside need a refresh ([Q10 in QUESTIONS.md](_design-system/QUESTIONS.md#q10)).

**Per-component rules** live at `_design-system/components/<Name>.md`. **Open questions / drift items** live at `_design-system/QUESTIONS.md` — flag new questions there, don't ask in chat unless blocking.

**Component registry (the shared brain):** `_design-system/COMPONENT_REGISTRY.md` — every shared component listed with file path, Layer (1/2/3), public API, use-for/don't-reuse-for, status. **Read this BEFORE building any new component.** Drift-checker enforces membership (V3-D205).

**Agent brief template for route rebuilds:** `_design-system/AGENT_BRIEF_TEMPLATE.md` — standard self-contained brief for sub-agents doing Fresha-clone rebuilds. Fresha bones + Solen skin formula. Includes verifier-loop pattern.

**When creating a NEW shared component:** in the same turn, write `_design-system/components/<Name>.md` AND add to COMPONENT_REGISTRY.md. No new components without their doc + registry entry. Layer 1/2/3 declaration is mandatory in the .md.

**Universal-components rule (V3-D205):** same component renders correctly for every category (Coiffeur / Barber / Nails / Spa / Massage). No `if category === 'X'` branches. Drift-checker rule B5 flags violations.

**🔒 LOCKFILE (V3-D235, 2026-05-27):** `_design-system/LOCKFILE.md` is the frozen literal-values reference. Every token hex, primitive prop signature, copy pattern, layout invariant, and hard rule lives here as a single source of truth. **Subagents read it as immutable** — when a captured Fresha spec contradicts the LOCKFILE, the LOCKFILE wins. Only the orchestrator (not subagents) writes here; subagents propose changes in their return message for central merge. Created as the council-recommended single-highest-leverage fix to prevent aesthetic drift across parallel rebuild waves.

**🎚️ CONTROL_ELEVATION (V3-D420, 2026-06-01):** `_design-system/CONTROL_ELEVATION.md` decides when an interactive control is elevated-white-glass (A) vs flat (B) vs ink (C). One-line philosophy: **"elevation is earned by the background, not by the button."** Decision tree: the one primary commit action → ink fill (C); a control sitting OVER a photo → frosted white glass (A, shared recipe `lib/frost-glass.ts` `FROST_GLASS`); a calm control on white/stone → flat (B: text → `bg-s-bg-sunken` no shadow, icon-only → `bg-white border-s-border` no shadow). White+shadow on a calm surface is the banned "grey-haze" drift. **Read before styling any add-button, stepper, icon-button, or action pill.** Lives on the AESTHETIC axis (companion to LOCKFILE §3 + SOURCE §5/§14.0). Drift-checker rule A14 flags violations.

**📺 VIDEO-AUDIT DS UPGRADE (2026-06-11, owner-approved IN FULL):** `_design-system/_video-audit/` (PLAN.md + AUDIT.md) is the 8-video design-audit program record. 12 adopted rules now codified in LOCKFILE: §1 closed neutral inventory (DS-3) + s-accent-deep #1E54B7 hover step (DS-6) + chart OKLCH/legibility (DS-A3), §2.5 display-type recipe (DS-A1), §3 nested-radius formula + twin-control rule + 32/12/16 spacing rhythm (DS-4/5), §3.5 loading + outcome-confirmation states (DS-1), §11 DS-10 scrim recipe, §13.2 **UNIFIED BLUE stepper** (supersedes green default — blue=progress, green=state), §13.7 icon pairing table (DS-2), §14 card grammar + dividers + content resilience + flow hatches (DS-7/8/9/A6), §15 vibe statement + personality zones + typographic-404 (DS-12), §16 sheet physics (grabber + drag-dismiss + scale-back bg, Option B) + gallery dots + the ONE View-Transitions card→PDP moment (DS-11/A4). Reference mockups: `public/_mockups/video-audit/`. **Next phase: every-state mockups of every page (Phase 4 in PLAN.md), then implementation.**

**🎬 MOTION (2026-06-09):** `_design-system/MOTION.md` is the motion + design-language-pass record from the two Tim Gabe videos. Thesis: **premium = restrained statics + rich MOTION**, not heavy static effects ("visual overworking" is the mistake we corrected). Holds the motion principles (easings used purposefully, celebratory moments via the `SuccessMark` primitive, haptics), what's DONE (depth softened LOCKFILE §3.5, type core-ramp §2), and the **REMAINING-WORK checklist** (SuccessMark on the other success peaks, motion sweep, haptics, type-ramp rollout, copy pass, mockup cleanup). **Read before any motion / design-polish work , it is the record that must survive context compaction.**

**🏅 SENIOR_SCORECARD (2026-06-09) — the ship-gate for customer screens:** `_design-system/SENIOR_SCORECARD.md` turns the existing design principles (already translated from the Tim Gabe videos into SOLEN_UI + LOCKFILE) into a **pass/fail gate**. Five dimensions, each scored Pass/Half/Fail: **Copy** (every word earns its place, no repeating a heading above), **Emphasis** (exactly ONE focal = what the user came for, not metadata; one primary action), **Color** (80/17/3, the emotional peak wears its semantic color, never dead-grey, never rainbow), **Type** (≤4 sizes + ≤2 weights *per screen*, mono for the one big number, nothing <12px), **Structure** (8pt, group logically, fewest containers). **A customer-facing screen ships only at 5/5.** The booking-confirmation page proved rules-as-principles get skipped (it broke 5 rules that already existed); a gate doesn't. Countable dims → drift-checker hard-fail; judgment dims → mandatory verifier-agent pass with a screenshot. Hooks WORK_TYPES Axis-2. **Run it on any customer-screen build / rebuild / non-trivial edit.**

**🏗️ WORK_TYPES (V3-D331, 2026-05-28):** `_design-system/WORK_TYPES.md` is the work-type taxonomy. **Read it BEFORE scoping any new design / UI work.** Six types: (1) surgical fix, (2) route sweep, (3) component sweep, (4) ground-up rebuild, (5) new primitive, (6) major IA shift. Each has its own effort budget + verification requirement + commit granularity. User flag 2026-05-28 — sessions kept conflating types and budgeting the same way. Wave plans must tag each item with its work-type number. One wave = one shipping unit when all items are green + verified.

**🌊 WAVE_PLAN (V3-D331, 2026-05-28):** `_design-system/WAVE_PLAN.md` is the living roadmap of open work. Waves 9-17 enumerated with item-by-item work-type tagging + time estimates + verification requirements. Update after each wave completes. Order rationale: Salon PDP (W9) → Fusion finalize (W10) → Category landings (W11) → Spacing audit (W12) → Solen-originals (W13) → Map primitive (W14) → Booking flow separate session (W15) → Strict drift flip (W16) → Misc cleanup (W17).

**🎯 DUAL-AXIS SOURCE-OF-TRUTH (V3-D338, 2026-05-28) — THE MOST IMPORTANT RULE:** Per user "structure n evrth like fresha but colorways typography contrast like ubers." Every design decision sits on ONE of two axes. **STRUCTURE** (IA, layout, components, sections, hero pattern, sticky nav, grid layouts, what-section-goes-where, affordance set, copy density) = **Fresha** is source-of-truth (via `fresha-section-capture` skill → `public/_pixel-refs/fresha/<section>/SPEC.md`). **AESTHETIC** (colors, type role recipes, contrast pairings, accent application, eyebrow policy, imagery rules, spacing rhythm, motion timing, hover affordances) = **Uber via LOCKFILE §1.5/§2.5/§11/§6** is source-of-truth. **Both axes apply to every change. Never apply one without verifying the other.** Conflating them = the failure mode that's bitten this project ≥4 times (e.g. T4 of overnight run applied "Pattern 3" — an Uber Eats AESTHETIC pattern — as if it were a structural PDP-hero rule, when Fresha's actual PDP hero is 3-photo grid). Full rule + decision tree + anti-pattern catalogue at `_design-system/LOCKFILE.md` §10.0-§10.7. **Operational layer** (§10.8) — per-axis skill stack (which tool when), drift signals (concrete tells you're conflating), self-auto-verification triggers (when to run each check), the 60-second pre-edit check (Q1-Q5 script), Fresha SPEC.md cache TTL (30-day default), and the single-test "would my change MATCH or DIVERGE from current Fresha?" axis-identifier. **Read §10.0 + §10.8 before any non-trivial edit.** WORK_TYPES.md "Pre-task self-auto-verification" section mirrors the operational layer at the per-task scope.

**Drift check skill:** `/solen-drift-check` runs the static drift checker — logs token + dead-click drift to `_design-system/_drift-report.md` and `_pending-migration.md`. Never halts. Add a file to `_design-system/_rebuilt_routes.json` `strict_globs` when it passes clean.

**🎯 Fresha-clone capture skill (V3-D230, 2026-05-27):** `fresha-section-capture` is the FIRST tool to fire for any Fresha-clone section rebuild. Replaces eyeballing screenshots. Navigates the real Fresha URL via Playwright, snaps mobile + desktop, walks the DOM for computed CSS (sizes/colors/transitions/animations), clicks every interactive and screenshots the result, outputs a `SPEC.md` with measurements + a mission-lock translation table at `public/_pixel-refs/fresha/<section>/`. **Mission lock when rebuilding from a Fresha spec:** exact copy of Fresha section anatomy, spacing, hierarchy, animations, click states — ONLY exceptions are Solen primitives (the registry list), tokens (`s-accent #276EF1` / `s-star #FFC32B` / heart `#FF3366` / `s-urgency #9A3412`), fonts (Inter Tight / Inter), CTA discipline (primary stays `bg-s-ink` per V3-D192-fix). Anti-pattern this prevents: "screenshot whack-a-mole" — patching surface deltas without seeing motion + click states + structure. If you find yourself eyeballing a Fresha screenshot to rebuild a section, STOP, fire the skill instead.

---

## 🖼️ Mockup FIRST (visual changes) — ALWAYS

Before applying, building, or committing ANY visual / design change: **show the user a mockup/preview FIRST, get approval, THEN touch real code.** Never apply-then-show. (User rule, 2026-06-09, after a long run of rejected attempts.)

1. The mockup MUST be a **copy of the REAL page/component** with ONLY the proposed change applied — capture the real route (Playwright), modify the real DOM/component uncommitted, show before/after. NEVER a from-scratch HTML redraw (they diverge → "this doesn't look like the homepage").
2. **Treatment-only:** change ONLY the proposed thing (shadow / bg / radius / spacing). Never touch structure, layout, copy, icons, or content in a design mockup. Structure stays; only the treatment changes.
3. Approve → THEN edit the real component + commit. Memory: `feedback_mockup_first_always`.

---

## ⚡ Binary triggers — specific inputs fire specific tools FIRST (no eyeballing)

**Enforced mechanically** by `.claude/hooks/user-prompt-binary-triggers.sh` (UserPromptSubmit — injects the matching row into context on every prompt). This table is the canonical copy; the memory one-liner (`feedback_binary_triggers`) points here. Restored 2026-06-10 after the section was found missing: the agent eyeballed attached Fresha reference screenshots twice, shipped a misaligned reviews page, and the owner had to ask why the trigger never fired.

| Input arrives | FIRST tool call of the turn — before ANY edit or opinion |
|---|---|
| Reference image attached / pointed at ("ss folder", IMG_xxxx, "screenshot") | `python3 ~/.claude/skills/pixel-spec-auto/scripts/extract.py <image> <outdir>` → implement against spec.md. If detection fails (borderless UI), PIL pixel-sample the measurements directly. Escalate to `screenshot-spec` if still missing elements. |
| `<launch-selected-element>` XML pasted | `preview_eval` → `getBoundingClientRect()` + `getComputedStyle` on the element, its container, and siblings. Report NUMBERS, then one fix. |
| Measurement-complaint words: "overlap", "clipped", "off", "not like the ss/picture", "unbalanced", "different heights", "not 1:1", "compare", "still wrong" | Measure live UI (`preview_eval` rects) AND the reference (PIL) BEFORE editing. Confirmation-bias warning: do NOT pattern-match to recently-changed elements. |
| Brand-named structure rebuild ("like Fresha('s) X") | `fresha-section-capture` (live URL) or pixel-measure the provided screenshots. STRUCTURE=Fresha / AESTHETIC=Uber-LOCKFILE (§ dual-axis above). |
| Any visual just changed (screenshot taken / mockup ported) | `gemini-visual-check` (image vs reference) before claiming a match. |

**Detection = fire.** No interpreting first, no "let me look at the code first", no rationalizing that the case is different. The asymmetry: measuring costs ~30s; eyeballing wrong costs 3-5 correction turns and trust.

---

## 🪶 Copy economy (owner rules, 2026-06-11)

1. **Drop words the context already says.** A button inside the reviews list is "Mehr laden", never "Weitere Bewertungen laden" — the user knows they're reviews. Same family: "Zum Kalender hinzufügen" → "Kalender hinzufügen"; a "Kopieren" label next to a copy icon → icon-only. Test: delete each word; if the meaning survives in place, the word was padding.
2. **Long text truncates with a blue "Mehr lesen".** Reviews/descriptions clamp (~150 chars / 3 lines) with an inline `text-s-accent` "Mehr lesen" that expands in place (Fresha pattern). Never render a wall of text; never a grey/underlined read-more.
3. **Action verbosity ladder:** icon-only when the icon is unambiguous next to its object (copy, flag/report, share) — keep `aria-label`; icon+label when the action is rarer (Wegbeschreibung); label-only for commitments (Buchen, Bezahlen). One primary commit phrasing per screen.
4. **No redundant tags/badges/meta.** A tag must add a decision-relevant fact not already on the row. Banned examples (owner, 2026-06-11): language tags ("DE / EN") on a barber row at checkout, a policy line repeated twice on one screen, decorative chips. Test: remove the tag — if the user loses nothing, it was noise.
5. **These rules bind MOCKUPS too** (`public/_mockups/**`). A mockup that breaks them gets rejected just like real UI. Mockup-specific banned list (all owner-rejected at least once):
   - tracked-uppercase labels/eyebrows (`text-transform:uppercase` + letter-spacing) — use normal-case 13px semibold
   - hand-drawn inline SVG glyph paths — Lucide icons only (memory `feedback_actual_icons_lucide`)
   - placeholder junk in the status bar (`●●●`) — use the kit's signal/wifi/battery glyphs
   - bare X close — the design system close is a 38px circled X (border, white bg)
   - fake/false claims (payment timing, saved cards that don't exist, invented counts) — same no-fabrication rule as production

---

## 🪦 Exists-check protocol (anti-duplication, council 2026-06-12)

The #1 post-compression failure: proposing/rebuilding what already exists or was deliberately removed.
Three layers, all live:

1. **`npm run exists <keyword>`** — live scan over routes, APIs, components, lib, DB, **page-inline
   sections**, and the **🪦 graveyard** (`_design-system/REMOVED.md`: owner-deleted/rejected things;
   a hit there = do not re-propose without an explicit owner yes). Run it BEFORE proposing anything.
2. **`_design-system/REMOVED.md`** — when the owner deletes/rejects a feature, ADD A LINE in the same
   turn (keywords | what | why/when | record). The graveyard only works if it's fed.
3. **Hook-enforced**: new routes/APIs/migrations/mockups block unless `npm run exists` ran this turn,
   and every NEW mockup file must contain an `Exists-check:` line naming what the target surface
   already renders + any REMOVED hits + the one thing that's actually new.

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the reported bug.
2. Match the exact scope of the request — padding fix = padding class, nothing else.
3. Read before editing — find the exact lines, confirm match, then change.
4. Never `npm run build` unless asked — dev runs on port 3000.
5. `git diff` after each fix — verify only the intended thing changed.

---

## 🕳️ Silent no-ops — phantom columns, dead filters, convention mismatches

This project's #1 silent failure mode: a control / column / filter that LOOKS wired but does nothing. PostgREST swallows a `.select()` on a non-existent column (returns null, not an error); a filter param can be set + counted in the UI yet never applied server-side; a helper can key off the wrong convention and return a constant (e.g. `isOpenNow` read long day-names while all data is short-keyed → "open now" returned empty everywhere, fixed 2026-06-05).

- **Prove behavior, not existence.** A filter must DISCRIMINATE (return a correct subset), not just render or return 200. A column must appear in the LIVE snapshot (`npm run exists <column>`), not merely in a TS type.
- **Computed filters** (open-now, distance — anything not expressible as a PostgREST predicate) resolve matching IDs first, then `.in("id", ids)` BEFORE `.range()`; never client-side over one page (breaks count/pagination). Reference: `app/api/salons/route.ts`.
- `opening_hours` is SHORT-day-keyed (`mon`…`sun`). Full pitfalls + patterns: `_rules/LESSONS_LEARNED.md`.

---

## 📂 User's screenshot folder

The user saves all their phone screenshots, AI-generated illustrations, and reference images to:

**`/Users/sulo/solen/screenshots/`**

(Note: this is OUTSIDE the project at `~/solen/screenshots/` — separate from in-project `_audits/screenshots/` which Claude uses for Playwright captures.)

When the user says "I pasted in the screenshot folder", "see the screenshot folder", or refers to images they shared but the inline-attached images aren't a file you can process — look here FIRST. Filenames are usually `IMG_XXXX.png` (phone) or UUID-named `.png` (Mac screenshots / Nano Banana outputs).

---

## ⚡ Terminal autonomy

- ✅ npm/npx, git status/add/commit/diff/log, tsc checks, file ops — **commit OFTEN + autonomously, don't ask** (each verified chunk = its own commit)
- ✅ Verify owner/auth-gated surfaces yourself — `GET /api/dev/login?to=<path>` (dev-only) mints a seed test-owner session; never hand-wave "auth-gated, can't check"
- ❌ `git push` — NEVER auto-push, and don't even mention pushing (the owner pushes manually). Also ask first: `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits

---

## Workflow rules

- **Functional rules** live in `_rules/*` (code safety, structural, i18n, security, db, lessons learned). Read the relevant one before related work.
- **Incomplete features** → append to `_tasks/INCOMPLETE_FEATURES.md` (file:line · blocker · next steps). **Never delete entries.**
- **Error handling** → never `.catch(() => {})`. Always `console.error("[Component] description:", err)`. Auth flows: log + redirect to login. Payment flows: log + user-visible error + retry.
