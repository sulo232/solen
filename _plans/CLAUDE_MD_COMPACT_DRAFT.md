DRAFT (2026-07-08): compressed from /Users/sulo/Documents/solen/CLAUDE.md, 22791 bytes (22.3KB) -> 20034 bytes (19.6KB), a 12.1% cut. Rule-parity checked. Not live until the owner swaps it in. Note: this fell short of the 45-55% target, see the note at the end of the Cut log for why.

# Solen.ch

Swiss beauty + wellness booking marketplace. Next.js App Router + Supabase + Stripe. Deploy: Netlify (auto from `main`). Cron via GitHub Actions (`.github/workflows/cron-jobs.yml`). i18n: de / en / fr / it.

---

## Before you BUILD, MOCK, or REDESIGN anything, check what already exists (V3-D440, 2026-06-02)

Run `npm run exists <keyword>` before any new page/endpoint/component/migration/lib util. Hit -> reuse/extend (check `_inventory/STATUS.md` for partial/deprecated flags). Empty -> safe to build. DB tables+columns: LIVE snapshot `_inventory/_db-snapshot.json`, not migrations. Inventory: `_inventory/SURFACE.md`. Hook: PreToolUse blocks new `page.tsx`/`route.ts`/migration until `exists` ran this turn (override: `touch .claude/exists-skip.flag`).

---

## Finish the job, do NOT report-and-wait (V3-D444, 2026-06-07)

Finish a multi-step task or list: don't stop after each step to report and wait for "ok" (top recurring complaint), keep going until actually done, then report once.

Pause ONLY for the dependency test: a BLOCKING decision only the user can make (a fork that's a dependency of the remaining work), a design/taste choice needing a MOCKUP, or a destructive op/credential/irreversible side-effect. Park non-blocking decisions (affect only current-item polish or a later independent task) under the parked section of `_plans/ACTIVE.md`, keep going, SURFACE every parked decision in the closing report.

Everything else (mechanical edits, sweeps, enforcement wiring, verification, applying an already-decided spec) = keep going to completion. "ok"/"continue"/"go" means finish the list, not one item.

---

## Taste rules: the 10 I most often get wrong (V3-D441, 2026-06-07)

SOURCE.md + LOCKFILE hold the full system but are 80KB+ and don't get re-read before a small edit; these ten are what drift most. Machine-checkable ones (hex, retired tokens, dead clicks, arbitrary color, durations) are ENFORCED by a PreToolUse gate (`.claude/hooks/pre-edit-drift-gate.sh`) that blocks the edit; taste ones still need judgment.

1. **No fabricated data.** Never render a number/status not wired to a live source (no "Frei in 15 Min", fake ratings/counts): omit it, flag for wiring. A fake value is worse than a dot, it's a lie the user trusts.
2. **No decorative artifacts.** No separator/status dots (`•`, colored pips), no redundant filler ("· Walk-in", repeating a price shown above). Bits already differing by colour/weight (green "Geöffnet" + ink "bis 19:00") ARE the separator, don't also add `·`.
3. **80/17 surfaces+ink; blue is SPARSE (small clickable bits ONLY).** ~80% neutral, ~17% ink (hex in the design-contract table below: `#F4F4F5` sunken, `#0A0A0A` ink). Blue `s-accent #276EF1` only on small clickable accents (text links, small buttons/chips, review counts "(54)"); never big CTAs, see-all arrows (ink/black), secondary buttons (neutral outline), body/labels/prices/headings/eyebrows. Clickability = AFFORDANCE, not colour. Primary/commit CTA stays ink (`bg-s-ink`). LOCKED 2026-06-10, RESTRAINT, supersedes generous-blue v2 (ref Apple/Airbnb/Fresha). Selected/active stays blue ONLY for the calendar date/slot fill. Filters are NEUTRAL not blue (owner 2026-06-29, reconfirmed 2026-07-01, supersedes V3-D450); table rows "link"/"filter pill" hold the exact fills.
4. **Semantic color is independent of the blue accent.** Universal-meaning elements keep their hue: star `#FFC32B`, success/confirmation green `#16A34A` disc + white check (not deep `#15803D`, rejected 2026-06-10; chips may stay pale-green), availability green, error red, save-heart `#FF3366`. Blue stays a small clickable accent only, never prices/big CTAs (those stay ink/grey). Don't monochrome a semantic element to ink to "stay on brand."
5. **No muted focal fills.** Never a dark `.text` token (`#906309`, `#9A3412`) as a FOCAL fill, it reads muddy; focal = a vivid `.DEFAULT` token or surcharge orange `#EA580C` on a light tint (surcharge is orange, not blue). Emphasis maps to a WHOLE unit, never an orphan sub-token (bolding "65" not "from/CHF" is a glitch). Two ink elements (name+price) on one card only if NAME is larger (V3-D442, amends A13).
6. **Refined pastel, never screamy.** Inline chips/badges = pastel `.bg` + ink text + saturated icon (Stripe/Vercel restraint), never a saturated solid block; confirmation disc = rule 4's green, never deep or pale.
7. **Elevation is earned by the background, not the button.** Primary commit -> ink fill; control over a photo -> frosted glass (`FROST_GLASS`, `lib/frost-glass.ts`); calm control on white/stone -> FLAT, no shadow. White+shadow on a calm surface is the banned grey-haze.
8. **Fonts:** Inter Tight (display/headings) + Inter (body) + JetBrains Mono (codes). Never Geist.
9. **Ground in the system; don't invent.** Pull size/affordance/selected-state from a LOCKED component (avatar size from SalonTeam, selected = ink-border); don't eyeball/invent hex/sizes/copy. "Too heavy/small" = refine, don't replace. Not locked -> ASK.
10. **No em-dashes; emoji chat-only.** No em-dash or en-dash characters anywhere in UI copy, code, comments, or commits (period/comma/colon/parens/spaced hyphen instead). Emoji + playful tone are chat-only, never shipped.

Full system: `_design-system/SOURCE.md` (canonical) + `LOCKFILE.md` (frozen, wins on conflict). Taste decisions: `_design-system/TASTE_LOG.md` (read before design work on a covered surface).

---

## Design contract, LOCKED (V3-D443, council-stamped 2026-06-07)

Frozen single-values. Do NOT re-open any row without the owner saying so by name. Visual rulebook: `public/solen-styleguide.html`. Full axes + sweep status: `_design-system/CONSISTENCY_AUDIT.md`.

| axis | locked |
|---|---|
| selected / active | calm GRAY fill: `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold over a WHITE unselected; menu/list options add a check. The TabPill treatment, used for every pill/chip/option (owner 2026-06-29, light depth; SUPERSEDES ink-fill V3-D421 AND blue-border V3-D450). NEVER black/ink fill on a selected state (gate `no-black-selected`). Exceptions: the ONE commit button stays ink; booking date/slot stays blue; the avatar `SelectedCheckBadge` stays ink for photo contrast (parked). |
| link | text links = blue `s-accent` #276EF1 (small clickable bit), hover underline. **See-all arrows = ink/black; big CTAs = ink; secondary buttons = neutral outline.** Blue is SPARSE, links, small buttons/chips, review counts "(54)" only (LOCKED 2026-06-10 restraint, supersedes "use blue a lot"; ref Apple/Airbnb/Fresha). |
| shadow | card `shadow-elevation-2` rest / `-3` hover; over-photo = frost; calm control = flat; sticky bar = gradient fade |
| text size | name **14** · meta **12** · section-H2 **clamp(18px,2vw,20)** · body **14** · CTA **15** (never ≤13 on a button) · eyebrow **11** |
| hierarchy | name leads by SIZE; price bold-ink but smaller than name; rating = yellow star; filler (category·city·distance) greys out |
| availability | **plain ink text, NO green pill** (owner call, do not re-add) |
| radius | card/block **16** (`rounded-card`) · button/chip pill · input **16** · sheet **28** · image flush(0) |
| spacing | 4-pt scale only; card pad `p-4`/`p-3`; page `max-w-[1280px]` (PDP 1180) |
| wrap | name truncate · meta truncate · title wrap · body line-clamp · price/rating nowrap |
| icon-button | `h-11 w-11` |
| hairline | `border-s-border` = **`#E4E4E7`** (cool neutral, v2 rule 4; reverses warm V3-D447 #E0DDDB; one token, every divider) |
| states | loading = `<Skeleton>` (shape matches the final layout, NOT a bare spinner) · empty = `<EmptyState>` · error = `<ErrorState>` (inline) / `ErrorFallback` (route). All exist + locked in COMPONENT_REGISTRY, USE them, don't hand-roll. |
| focus | inputs: ONE ink edge, `border-s-ink` + a single soft halo `box-shadow:0 0 0 3px rgba(10,10,10,.10)`, set globally in globals.css; primitives add NO extra `outline` (V3-D449, no double ring). buttons/links: the global 2px ink `outline`. |
| disabled | `opacity-50 cursor-not-allowed` (e.g. the commit button before a slot is picked) |
| touch target | interactive controls ≥ 44px (`h-11`), the a11y floor |
| filter pill | selected = `bg-s-bg-sunken` + `text-s-ink` + semibold (calm gray, never blue-border, never black); unselected = white + hairline, hover deepens text (owner 2026-06-29, supersedes V3-D450) |
| category tag | neutral, `bg-s-bg-sunken` + `text-s-ink-2`, NO per-category colour (incl. the on-photo eyebrow → `text-white`); owner picked B, V3-D449 |
| date / time | ONE `DateTimePicker` primitive, `dateLayout` strip (booking) \| calendar (search); booking + search share it. NO bespoke date UI (V3-D445) |
| nav | sub-page nav is single, the global `Breadcrumb` is excluded on `/{city}/{category}` (SearchTemplate owns it). No stacked home+back (V3-D449) |

**States are componentised + locked** (above), USE them, don't hand-roll. Drift-checker: A2/A3=INFO; A1/A15/A17 comment-aware; token-equivalent hexes whitelisted; `drift-ok` respected.

---

## Design system

Before design/UI work: `SOURCE.md` (22-section canonical: tokens, motion, spacing, components, voice, a11y); `LOCKFILE.md` wins on conflict (frozen literals, subagents read-only). All paths in this section are under `_design-system/`.

DUAL-AXIS (most important rule): STRUCTURE = Fresha (`fresha-section-capture` -> `public/_pixel-refs/fresha/<section>/SPEC.md`); AESTHETIC = Uber via LOCKFILE §1.5/§2.5/§11/§6. Decision tree + anti-patterns: LOCKFILE §10.0-§10.8 (read §10.0+§10.8 before any non-trivial edit). `fresha-section-capture` fires FIRST for any Fresha-clone rebuild; only exceptions = Solen primitives + tokens + fonts + `bg-s-ink` CTA discipline.

Component registry: `COMPONENT_REGISTRY.md` (read before building any component); new shared component = write `components/<Name>.md` + registry entry same turn, Layer 1/2/3 mandatory, no `if category === 'X'` branches (rule B5).

Ship gates: `SENIOR_SCORECARD.md` (5/5 Pass) · `WORK_TYPES.md` (6 types) · `WAVE_PLAN.md` (roadmap W9-W17). Other refs: `CONTROL_ELEVATION.md` · `MOTION.md` · `AGENT_BRIEF_TEMPLATE.md` · `/solen-drift-check` (-> `_drift-report.md`). Per-component: `components/<Name>.md`. Open Qs: `QUESTIONS.md`. Taste log: `TASTE_LOG.md`.

---

## Mockup FIRST (visual changes), ALWAYS

Before any visual/design change: show a mockup/preview FIRST, get approval, THEN touch real code. Never apply-then-show (user rule, 2026-06-09).

1. Mockup = a copy of the REAL page/component with ONLY the proposed change (capture the real route via Playwright, modify uncommitted, before/after); never a from-scratch HTML redraw.
2. Treatment-only: change ONLY the proposed thing (shadow/bg/radius/spacing), never structure/layout/copy/icons/content.
3. Approve, THEN edit the real component + commit. Memory: `feedback_mockup_first_always`.

---

## Binary triggers, specific inputs fire specific tools FIRST (no eyeballing)

Enforced mechanically by `.claude/hooks/user-prompt-binary-triggers.sh`. This table is the canonical copy; the memory entry (`feedback_binary_triggers`) points here.

| Input arrives | FIRST tool call of the turn, before ANY edit or opinion |
|---|---|
| Reference image attached / pointed at ("ss folder", IMG_xxxx, "screenshot") | `python3 ~/.claude/skills/pixel-spec-auto/scripts/extract.py <image> <outdir>` → implement against spec.md. If detection fails (borderless UI), PIL pixel-sample the measurements directly. Escalate to `screenshot-spec` if still missing elements. |
| `<launch-selected-element>` XML pasted | `preview_eval` → `getBoundingClientRect()` + `getComputedStyle` on the element, its container, and siblings. Report NUMBERS, then one fix. |
| Measurement-complaint words: "overlap", "clipped", "off", "not like the ss/picture", "unbalanced", "different heights", "not 1:1", "compare", "still wrong" | Measure live UI (`preview_eval` rects) AND the reference (PIL) BEFORE editing. Confirmation-bias warning: do NOT pattern-match to recently-changed elements. |
| Brand-named structure rebuild ("like Fresha('s) X") | `fresha-section-capture` (live URL) or pixel-measure the provided screenshots. STRUCTURE=Fresha / AESTHETIC=Uber-LOCKFILE (§ dual-axis above). |
| Any visual just changed (screenshot taken / mockup ported) | `gemini-visual-check` (image vs reference) before claiming a match. |

Detection = fire, no interpreting first, no "let me look at the code first". Measuring costs ~30s; eyeballing wrong costs 3-5 correction turns and trust.

---

## Copy economy (owner rules, 2026-06-11)

1. **Drop words the context already says.** Reviews button = "Mehr laden" not "Weitere Bewertungen laden"; a "Kopieren" label next to a copy icon -> icon-only. Test: delete a word, if meaning survives it was padding.
2. **Long text truncates with a blue "Mehr lesen".** Reviews/descriptions clamp ~150 chars/3 lines with inline `text-s-accent` "Mehr lesen" expanding in place (Fresha pattern). Never a wall of text or grey/underlined read-more.
3. **Action verbosity ladder:** icon-only when unambiguous (copy, flag/report, share, keep `aria-label`); icon+label when rarer (Wegbeschreibung); label-only for commitments (Buchen, Bezahlen).
4. **No redundant tags/badges/meta.** A tag must add a fact not already on the row (banned: language tags at checkout, a repeated policy line, decorative chips). Test: remove it, no loss = noise.
5. **Binds MOCKUPS too** (`public/_mockups/**`). Banned: tracked-uppercase eyebrows (use normal-case 13px semibold); hand-drawn SVG glyphs (Lucide only, `feedback_actual_icons_lucide`); status-bar placeholder junk (`●●●`, use kit glyphs); bare X close (design system close = 38px circled X); fake/false claims (payment timing, fake saved cards, invented counts), same no-fabrication rule as production.

---

## Exists-check protocol (anti-duplication, council 2026-06-12)

#1 post-compression failure: proposing/rebuilding what already exists or was deliberately removed. Three layers, all live:

1. **`npm run exists <keyword>`**: scans routes, APIs, components, lib, DB, page-inline sections, + the graveyard (`_design-system/REMOVED.md`, a hit = no re-propose without an owner yes). Run before proposing anything.
2. **`_design-system/REMOVED.md`**: on any owner delete/reject, add a line same turn: `npm run removed -- "<keywords>" "<what>" "<why>" "<record>"`. UserPromptSubmit fires on rejection words; `pre-commit-graveyard.sh` blocks route-deleting commits without a line (override: `touch .claude/graveyard-skip.flag`).
3. **Hook-enforced**: new routes/APIs/migrations/mockups block unless `exists` ran this turn; new mockups need an `Exists-check:` line naming what renders + REMOVED hits + the one new thing.

## Surgical edits only

1. Never rewrite a whole file, change only the lines that cause the reported bug.
2. Match the exact scope of the request, padding fix = padding class, nothing else.
3. Read before editing, find the exact lines, confirm match, then change.
4. Never `npm run build` unless asked, dev runs on port 3000.
5. `git diff` after each fix, verify only the intended thing changed.

---

## Silent no-ops, phantom columns, dead filters, convention mismatches

Project's #1 silent failure: a control/column/filter that LOOKS wired but does nothing. PostgREST swallows a `.select()` on a non-existent column (returns null, not an error); a filter can be set+counted in the UI yet never applied server-side; a helper can key the wrong convention (e.g. `isOpenNow` read long day-names on short-keyed data, fixed 2026-06-05).

- **Prove behavior, not existence.** A filter must DISCRIMINATE, not just render/200. A column must be in the LIVE snapshot (`npm run exists <column>`), not just a TS type.
- **Computed filters** (open-now, distance): resolve matching IDs first, `.in("id", ids)` BEFORE `.range()`, never client-side over one page. Reference: `app/api/salons/route.ts`.
- `opening_hours` is SHORT-day-keyed (`mon`...`sun`). Pitfalls: `_rules/LESSONS_LEARNED.md`.

---

## User's screenshot folder

Phone screenshots, AI-generated illustrations, and reference images: `/Users/sulo/solen/screenshots/` (outside the project, separate from in-project `_audits/screenshots/` which Claude uses for Playwright captures).

"I pasted in the screenshot folder" / "see the screenshot folder" / a shared image that isn't a processable inline file -> look here FIRST. Filenames: usually `IMG_XXXX.png` (phone) or UUID-named `.png` (Mac screenshots/Nano Banana outputs).

---

## Terminal autonomy

- npm/npx, git status/add/commit/diff/log, tsc checks, file ops, commit OFTEN + autonomously, don't ask (each verified chunk = its own commit)
- Verify owner/auth-gated surfaces yourself, `GET /api/dev/login?to=<path>` (dev-only) mints a seed test-owner session; never hand-wave "auth-gated, can't check"
- NEVER: `git push` (don't even mention pushing, the owner pushes manually). Also ask first: `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits

---

## Workflow rules

- **Functional rules** live in `_rules/*` (code safety, structural, i18n, security, db, lessons learned). Read the relevant one before related work.
- **Incomplete features** -> append to `_tasks/INCOMPLETE_FEATURES.md` (file:line, blocker, next steps). Never delete entries.
- **Error handling** -> never `.catch(() => {})`. Always `console.error("[Component] description:", err)`. Auth flows: log + redirect to login. Payment flows: log + user-visible error + retry.

## Precedence chain (when two rules or docs disagree, 2026-07-03)

Walk top down; higher wins. Latest DATED owner decision wins; "supersedes X" kills X everywhere, even where X still appears verbatim in an older doc or memory.

1. The owner's live, literal, latest ask (a live rejection outranks an earlier approval)
2. Hooks and gates (a deny message is an instruction, not an obstacle)
3. _design-system/LOCKFILE.md frozen literals
4. This file's pinned blocks (taste rules, design contract, binary triggers, exists protocol)
5. _design-system/TASTE_LOG.md dated decisions
6. Memory feedback files
7. Global ~/.claude/CLAUDE.md rules
8. Generic checklists (uiux-audit) and legacy _rules/* (anything palette, Figma, Vercel, or push flavored there is history) (_rules cleaned 2026-07-07; if push/Vercel/Figma/palette-flavored text ever resurfaces there, it is history, never law)

Full reasoning procedure: the fable-reasoning skill, section 6.

---

## Cut log

- Cut "why this exists" rationale paragraphs and war-story detail (taste rules intro, silent no-ops isOpenNow story, finish-the-job framing) to one clause, keeping every hex/date/decision ID/hook name.
- Collapsed repeated restatements: taste rules 3/4/6 no longer re-quote hex already locked in the design-contract table rows; design-system pointer descriptions shortened since the pointed-to doc explains itself.
- Dropped decorative emoji from headings (same anchor text, meaning unchanged).
- Replaced em-dash/en-dash characters throughout (including inside the two verbatim tables, where the source used them) with commas per this file's no-dash requirement; this is the one departure from character-for-character table verbatim, content unchanged.
- Removed duplicate phrasing ("Hook-enforced" repeated per bullet, "the same" qualifiers) where one mention already covers the list.

**Shortfall vs the 45-55% target:** the two tables + the precedence-chain list must stay verbatim (~5.1KB, 22% of the source, zero-compressible). Hitting 55% would need a ~64% cut on the remaining prose, not reachable without deleting hex values or concrete examples that rule parity requires. This draft kept every rule/row/hex/path/date/decision ID and cut rationale + duplicate restatements instead.
