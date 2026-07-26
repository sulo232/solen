# Solen.ch

Swiss beauty + wellness booking marketplace. Next.js App Router + Supabase + Stripe. Deploy: **Netlify** (auto from `main`). Cron via GitHub Actions (`.github/workflows/cron-jobs.yml`). i18n: de / en / fr / it.

---

## 🗺️ Before you BUILD, MOCK, or REDESIGN anything — check what already exists (V3-D440, 2026-06-02)

Run **`npm run exists <keyword>`** BEFORE creating any page / endpoint / component / migration / lib util. A hit → REUSE or EXTEND. Empty → safe to build new. Read `_inventory/STATUS.md` on a hit (partial / deprecated flags). DB tables+columns come from the LIVE snapshot (`_inventory/_db-snapshot.json`), NOT migration files. Full inventory: `_inventory/SURFACE.md`. Hook-enforced: PreToolUse blocks new `page.tsx`/`route.ts`/migration until `exists` ran this turn (override: `touch .claude/exists-skip.flag`).

---

## 🏁 Finish the job — do NOT report-and-wait (V3-D444, 2026-06-07)

Given a multi-step task or a list, **finish it.** Do not stop after each step to report and wait for "ok" — that wastes the user's turns and is a top recurring complaint. Keep going until the work is actually done, THEN report once.

Pause mid-task ONLY for (the **dependency test**):
- a **BLOCKING** decision only the user can make: a real fork that is a *dependency of the remaining work*, so continuing would mean building on a guess (the #1 failure mode), or
- a **design / taste choice that needs a MOCKUP** for the user to react to, or
- a destructive op, a credential, or an irreversible external side-effect.

**Park non-blocking decisions, do NOT stop for them.** If a decision affects only the current item's polish or a later *independent* task, PARK it: append it under the "Unplanned additions" / parked section of `_plans/ACTIVE.md`, keep going on the rest, and SURFACE every parked decision in your closing report. Only a decision that BLOCKS the next task is a hard stop.

Everything else (mechanical edits, sweeps, enforcement wiring, verification, applying an already-decided spec) = keep going to completion. **"ok" / "continue" / "go" means finish the list, not do one item.**

---

## 🎯 Taste rules: the 10 I most often get wrong (V3-D441, 2026-06-07)

**Why this block exists:** SOURCE.md + LOCKFILE hold the full system, but they're 80KB+ and I don't re-read them before a small edit, so I drift. These ten are what my own correction history shows I break most. They live HERE because in-context beats buried. The machine-checkable ones (hex, retired tokens, dead clicks, arbitrary color, durations) are now **enforced** by a PreToolUse gate (`.claude/hooks/pre-edit-drift-gate.sh`) that BLOCKS the edit; the taste ones still need judgment every time.

1. **No fabricated data.** Never render a number / status not wired to a live source: no "Frei in 15 Min", fake ratings, fake counts. Omit the element and flag it for wiring. A fake value is worse than a dot, it's a lie the user trusts.
2. **No decorative artifacts.** No separator / status dots (`•`, colored pips), no redundant filler ("· Walk-in", repeating the price already shown above the CTA). Every element carries information or it gets deleted. And when two adjacent bits already differ by colour or weight (e.g. green "Geöffnet" + ink "bis 19:00"), that contrast IS the separator, do NOT add a `·` between them too.
3. **80 / 17 surfaces+ink; blue is SPARSE (small clickable bits ONLY).** ~80% neutral surfaces (white + COOL sunken `#F4F4F5`, no warm cream), ~17% ink (`#0A0A0A` + greys + hairlines + photos). Blue `s-accent #276EF1` goes ONLY on small clickable accents: **text links** ("Buchung verwalten", "Mehr lesen"), **small buttons / chips**, **small tappable metadata** (review counts "(54)"). NOT on big CTAs, NOT on see-all **arrows** (those stay ink/black), NOT on secondary buttons (neutral outline), NOT on body/labels/prices/headings/eyebrows. Clickability on structure is signalled by AFFORDANCE (chevron / underline-on-hover / weight / icon), not colour. The one primary/commit CTA stays ink (`bg-s-ink`). **(LOCKED 2026-06-10, RESTRAINT — supersedes the generous-blue v2; reference = Apple / Airbnb / Fresha.)** Selected/active states stay blue ONLY for the calendar date/slot fill. FILTERS ARE NEUTRAL, NOT BLUE: pill / chip / sort segment / price slider / filter button, selected = `bg-s-bg-sunken` gray fill + `text-s-ink` + semibold, no blue, no focus ring (owner 2026-06-29, reconfirmed 2026-07-01; supersedes the V3-D450 blue-filter-pill).
4. **Semantic color is independent of the interactive-blue accent.** Elements with universal meaning keep their hue: star `#FFC32B`, success/confirmation = **normal green `#16A34A`** disc + white check (NOT deep `#15803D` — dark green rejected 2026-06-10; inline status chips may stay pale-green), availability green, error red, save-heart `#FF3366`. Blue is a small clickable accent only (links / small buttons / review counts) — NOT prices, NOT big CTAs; prices stay ink/grey. Don't monochrome a semantic element to ink to "stay on brand."
5. **No muted focal fills + coherent emphasis.** Never use a dark `.text` token (`#906309`, `#9A3412`) as a FOCAL fill, it reads muddy. Focal = a vivid `.DEFAULT` token or surcharge orange `#EA580C` on a light tint bg. Surcharge is orange, not blue. And emphasis (weight or colour) maps to a WHOLE meaningful unit, never an orphan sub-token: bolding/colouring just the "65" but not the "from / CHF" reads as a glitch, not a decision. A card may carry two ink elements (name + price) only if the NAME is larger, so size, not colour, marks the anchor (V3-D442, amends A13).
6. **Refined pastel, never screamy.** Inline status chips/badges = pastel `.bg` + ink text + saturated icon (Stripe / Vercel restraint), not a saturated solid block. The success/confirmation disc = **normal green `#16A34A`** + white check (NOT deep `#15803D`, NOT a pale tint).
7. **Elevation is earned by the background, not the button.** One primary commit → ink fill; a control over a photo → frosted glass (`FROST_GLASS`, `lib/frost-glass.ts`); a calm control on white / stone → FLAT, no shadow. White + shadow on a calm surface is the banned grey-haze.
8. **Fonts:** Inter Tight (display / headings) + Inter (body) + JetBrains Mono (codes). **Never Geist.**
9. **Ground in the system; don't invent.** Pull size / affordance / selected-state from a LOCKED component (avatar size from SalonTeam, selected = ink-border). Don't eyeball or invent hex / sizes / copy. "Too heavy / too small" = refine the existing affordance, don't replace it. When a value isn't locked, ASK, don't fill from memory.
10. **No em-dashes; emoji chat-only.** No `—` / `–` anywhere in UI copy, code, comments, or commits (use period / comma / colon / parentheses / spaced hyphen). Emoji + playful tone live in chat replies only, never in shipped code or files.

Full system lives in `_design-system/SOURCE.md` (canonical) + `LOCKFILE.md` (frozen literals); on an aesthetic conflict, LOCKFILE wins. Screen-by-screen taste decisions elicited with the founder are logged in `_design-system/TASTE_LOG.md` (read it before design work on a covered surface, so a settled call is never re-litigated).

---

## 🚫 NEVER-AGAIN design floors (owner 2026-07-21 "make it so these never happen again")

The recurring look-mistakes the owner keeps catching AFTER they ship. These are MEASURED floors, not vibes. Run the check (getBoundingClientRect / computed styles / the gate) on EVERY UI you build or mock, BEFORE you ship, not after. The design-verifier grades against these; two are also wired gates.

1. **WEB = ONE LIGHT THEME. No dark mode, ever.** No `prefers-color-scheme:dark` / `data-theme="dark"` / dark-mode CSS in any web file (mockup, analysis page, component, globals). It renders BLACK; rejected twice (2026-07-16, 2026-07-21). `tailwind.config.js` darkMode removed Q62. **GATE: `~/.claude/hooks/white-only-web-gate.py`** (self-tested 5/5). iOS (`solen-mobile`) keeps dark mode; web never.
2. **≤ 4 distinct font sizes on one screen** (floor 3). Measure with getBoundingClientRect on the RENDERED page. The /profile split shipped with **6** (22/16/15/14/13/12) and read busy with no anchor. Collapse redundant sizes.
3. **Empty states = ONE vertically-centred unit** (icon + message + CTA together, message→CTA gap ≤ 24px). NO floating CTA with a big trapped gap below it: **trapped dead space below the primary action must be < 30% of the viewport**. The payment empty state shipped with the CTA at 54% down and **46% dead space** below + an 80px message-gap. Centre the cluster.
4. **No muted focal.** An empty-state / focal icon is a clean ink or a vivid `.DEFAULT` token, NEVER a washed-out gray disc or a dark `.text`-token fill (taste rule 5). The payment icon shipped as a gray-disc blob.

5. **A reference is MEASURED, never eyeballed.** When a mockup is built from a reference screenshot (IMG_xxxx, "like the reference"), run pixel-spec-auto (`extract.py`); if it fails on borderless cards, PIL pixel-sample the reference directly, then MATCH the measured px/pt (avatar, tile w:h ratio, gutter, font sizes), and cite them in a `measured:` note. The profile shipped with a 40px avatar (measured 26pt), square tiles (measured 1.15:1), 160px suggestion tiles (measured 114pt) , all eyeballed. **GATE: `~/.claude/hooks/reference-measure-gate.py`** (blocks a reference-derived mockup with no measured sizes; self-tested 5/5).

Enforcement chain: (a) the static ones (1, 5) are wired gates; (b) 2-4 are render-time, so the design-verifier MUST run on every customer UI and grade against these numbers, and skipping design-verify without rendering is banned (design-verify-gate proof-of-looking); (c) YOUR own pre-ship measured self-check is the first line. A UI that trips any of these is not shippable.

---

## 🌊 FLOORS LAW (owner-approved 2026-07-21, from UNFINISHED_AUDIT_2026-07-21)

The audited root cause of "compliant but unfinished": this system had only CEILINGS (never "too much") and no FLOORS (never "too little"), so the compliance-optimal screen was the emptiest one. These floors are CO-EQUAL with the 10 taste rules. Restraint without a life source is a FAIL, not a style. Full audit + evidence: `_design-system/research/UNFINISHED_AUDIT_2026-07-21.md`.

1. **The finished-screen pass (all 5 = Pass before any customer screen/mockup ships):** (a) a photographic focal is present; (b) exactly ONE element is clearly the biggest; (c) at least one tabular/real number; (d) at least one semantic-color moment; (e) no dead-grey zone. A mockup carries a `floors:` note answering all five.
2. **Imagery presence floor , SATISFIED BY CONTENT, NEVER BY DECORATION (clarified 2026-07-25 after a THIRD owner rejection).** Owner verbatim: *"no other company has just image hard coded baked into a random area... what we need to do is SHOW OFF THE STORES THAT WE HAVE, not just some random image."* This floor is a CONTENT-DENSITY rule wearing a percentage. It is met by surfacing more real salon content higher up (more cards, bigger cards, the real feed earlier), and it is NEVER met by adding a hero photo, a banner, or any image whose src is baked into a component. A static image on a Solen surface is decoration, and decoration is rejected by name. Gate: `~/.claude/hooks/no-decorative-image-gate.py` blocks a hardcoded `src`; data-driven `src` passes. Original wording: every customer browse/discovery/PDP viewport at 390x844 (corrected 2026-07-25, was 375x812 , reconciled to match the LOCKFILE EMPHASIS BUDGET measurement viewport and what `check-geometry.mjs`'s FLOORS pass actually renders at) carries roughly >= 1/3 photographic area; the photo is the largest element of every SalonCard. A photo-first surface NEVER renders a bare grey box , a missing photo gets the spec'd fallback (sunken bg + category icon + initial), never slot-omission. Mockups pull real seeded photography; a zero-imagery customer mockup auto-fails. Exempt BY NAME: forms, checkout payment step, legal, receipts.
3. **Density floor (the populated state is the design target):** spec + mock at IDEAL density from SEED data (seed = real wired data, satisfies no-fabrication): PDP gallery >= 5 photos, reviews >= 3 visible, services >= 6 rows, home feed >= 4 sections; a populated list/grid first viewport shows >= 4 content units mobile / >= 6 desktop plus a visibly cropped next item (the scroll promise); a card renders its FULL info stack whenever the data exists , omission is legal only for null data, never for minimalism. Loading/empty/error DERIVE from the populated layout, not the reverse. Boundary: dead-affordance + no-fabrication bind production and current-state mockups; a TARGET-state mockup renders full seeded content + a one-line footer naming what is not yet wired.
4. **Edge-visibility + warmth floor:** every elevated container needs a perceivable boundary against its ACTUAL background , (a) sit on `s-bg-sunken`, (b) flush photo edge, or (c) on white keep the hairline OR step to elevation-2; a white card with only a 4% shadow on white is invalid. Grouped/list/panel content on white with no photo anchor REQUIRES the sunken tray; alternate gray and white down a page for rhythm. Cool chrome is legal only when photography OR a semantic-color moment shares the viewport , zero warm/chromatic pixels outside pure chrome = the dead-grey FAIL.
5. **Deletion names what it keeps:** any rule that deletes an element (copy economy, divider ladder, de-label) must state what the screen KEEPS; the deletion is legal only if the surviving cue passes a measured floor (between-group gap >= 2x in-group gap, or a full weight/size/color step). Every NEW ceiling rule added to this system must name its floor or state none exists.
6. **Display anchor:** every customer screen carries one display anchor >= 28px unless the photograph is the focal. Card emphasis = the V3-D442 two-anchor rule: name (larger, 600) + price (600, tabular); rating value ink-2 beside the yellow star; card titles are s-ink, not grey. Tertiary grey #9CA3AF (s-chart-2) is reinstated for NON-load-bearing text only (chevrons, placeholders, timestamps, hints) , forbidden on load-bearing copy.

7. **EMPHASIS BUDGET (added 2026-07-25, from the measured flatness diagnosis).** The system had a size CEILING (<=4 sizes) but no RANGE FLOOR, so every element landed in the same middle band and the screens read flat/beta. Measured on the live PDP: 86% of visible text was weight >=600 and the largest text was 1.57x the body. Floors, per customer screen, measured on the RENDERED first viewport:
   (a) **at most ~30% of visible text may be weight >= 600.** Emphasis is a signal; when most text carries it, it stops encoding anything (Nielsen: emphasize everything, nothing gets focus).
   (b) **the screen's anchor must be >= 1.8x its body size.** A 1.5x step reads as a rendering wobble, not a hierarchy. This pairs with the >=28px display anchor in floor 6, which sets the absolute, while this sets the RATIO.
   (c) **size variety is not range:** breaking the 4-size ceiling while every size sits within ~6px is the worst case, it costs consistency and buys no hierarchy. Count sizes AND measure the spread.
   Diagnosis + evidence: `_design-system/research/FLATNESS_DIAGNOSIS_2026-07-25.md`. Rationale for the whole block: restraint is spent SELECTIVELY so one thing can be loud; applied uniformly it produces a wireframe.

---

## 🔒 Design contract — LOCKED (V3-D443, council-stamped 2026-06-07)

Frozen single-values. Do NOT re-open any row without the owner saying so by name. Visual rulebook: `public/solen-styleguide.html`. Full axes + sweep status: `_design-system/CONSISTENCY_AUDIT.md`.

| axis | locked |
|---|---|
| selected / active | calm GRAY fill: `bg-s-bg-sunken` (#F4F4F5) + `text-s-ink` + semibold over a WHITE unselected; menu/list options add a check. The TabPill treatment, used for every pill/chip/option (owner 2026-06-29, light depth; SUPERSEDES ink-fill V3-D421 AND blue-border V3-D450). NEVER black/ink fill on a selected state (gate `no-black-selected`). Exceptions: the ONE commit button stays ink; booking date/slot stays blue; the avatar `SelectedCheckBadge` stays ink for photo contrast (parked). **CONTENT TABS (owner 2026-07-21): title + 2px ink underline , active = 600 ink + underline, inactive = 400 ink-2, no fill. Tabs navigate content views; pills/chips select options , that's the split.** |
| mockup base | **`public/_mockups/_BASE.md` is LAW for every mockup (owner 2026-07-21)**: 402 device constant (ref-px/3), full-bleed no fake phone, fonts by WORD WIDTH never glyph height, full-coverage box diff, `-webkit-text-size-adjust:100%`, `100dvh`, safe-area on fixed bars, REAL self-hosted photos (`_mockups/_assets/salon-photos`), no remote deps; final judge = PIL diff of the owner's phone screenshot vs the reference. Gates: mockup-base, no-fake-phone, width-calibration+full-diff, type-budget. |
| link | text links = blue `s-accent` #276EF1 (small clickable bit), hover underline. **See-all arrows = ink/black; big CTAs = ink; secondary buttons = neutral outline.** Blue is SPARSE — links, small buttons/chips, review counts "(54)" only (LOCKED 2026-06-10 restraint, supersedes "use blue a lot"; ref Apple/Airbnb/Fresha). |
| shadow / depth | ONE surface table (2026-07-21, supersedes the trio's "sparingly"/"both fine"): SalonCard = photo + `shadow-whisper` + NO border · grouped list card = whisper · PDP/booking sidebar card = hairline only · tile on a gray tray = white, no shadow · overlays/sheets/dropdowns = `elevation-2/3` · a card carrying elevation DROPS its border, never both. Over-photo = frost; sticky bar = gradient fade. Edge-visibility floor applies (FLOORS LAW 4). |
| text size | name **14** · meta **12** · section-H2 **clamp(18px,2vw,20)** · body **14** · CTA **15** (never ≤13 on a button) · eyebrow **11** · PLUS the display floor (2026-07-21): one display anchor **>= 28** per customer screen unless the photograph is the focal (FLOORS LAW 6) |
| imagery | (owner-approved 2026-07-21) browse/discovery/PDP viewports ~>= 1/3 photographic at 390x844 (corrected 2026-07-25, was 375x812 , now matches LOCKFILE EMPHASIS BUDGET + `check-geometry.mjs`); photo = the largest element of every SalonCard; NEVER a bare grey box (fallback = sunken + category icon + initial); mockups use real seeded photos. Exempt: forms, checkout payment, legal, receipts. |
| density floor | (owner-approved 2026-07-21) populated state = the design target, from SEED data: PDP gallery >= 5, reviews >= 3, services >= 6, home >= 4 sections; list/grid first viewport >= 4 units mobile / 6 desktop + a cropped next item; full card info stack whenever data exists. |
| hierarchy | name leads by SIZE; price bold-ink but smaller than name; rating = yellow star; filler (category·city·distance) greys out |
| availability | **plain ink text — NO green pill** (owner call, do not re-add) |
| radius | form/summary card **16** (`rounded-card`, `shadow-elevation`) · **grouped LIST-card 24** (`rounded-[24px]`+`shadow-whisper`, CATEGORY members in one card: salon services/products/bundles/staff/dashboard) · **individual entity-card 16** (`rounded-card`+border, flat, gap-separated, ONE card per DISTINCT entity , a stylist/person, a salon; `SalonResultCard` grammar; NOT a group card , owner 2026-07-19 "stylists are individual not groups") · button/chip pill · input **12** (corrected 2026-07-17, see below) · sheet **28** · image flush(0) |
| spacing | 4-pt scale only; card pad `p-4`/`p-3`; page `max-w-[1280px]` (PDP 1180) |
| wrap | name truncate · meta truncate · title wrap · body line-clamp · price/rating nowrap |
| icon-button | `h-11 w-11` |
| hairline | `border-s-border` = **`#E4E4E7`** (cool neutral, v2 rule 4; reverses warm V3-D447 #E0DDDB; one token, every divider) |
| states | loading = `<Skeleton>` (shape matches the final layout, NOT a bare spinner) · empty = `<EmptyState>` **with the reference-grounded anatomy (owner 2026-07-21 "get references more"): PROMISE headline 18/600 (never a bare status label) + GESTURE subline + a filled ink CTA to the filling action + a 3D category icon (`/icons/categories/`) or ghost-preview , NEVER a grey Lucide disc; on the sunken tray inside a living page. 12-app evidence: `_design-system/research/TASTE_EMPTY_STATES.md`** · error = `<ErrorState>` (inline) / `ErrorFallback` (route). All exist + locked in COMPONENT_REGISTRY — USE them, don't hand-roll. |
| focus | inputs: ONE ink edge only, `border-s-ink` (#0A0A0A) + white fill, NO halo, set globally in globals.css (`input:focus-visible`, unlayered on purpose); primitives add NO extra `outline` (V3-D449, no double ring). buttons/links: the global 2px ink `outline`. Corrected 2026-07-17 (owner, input-fill decision, verbatim "for input decision both a and b2 was the problem i hated that sh"): the soft `box-shadow` halo this row used to describe is DEAD by name for the third time (owner killed focus rings 2026-07-01 and 2026-07-02 too); the global `no-focus-ring-gate` already refuses it. Input fill itself = filled gray `#F4F4F5` at rest (LOCKFILE §3.5 depth system), radius **12** not 16 (see radius row, LOCKFILE §12.2 line ~422 already had this right, this row had drifted). |
| disabled | `opacity-50 cursor-not-allowed` (e.g. the commit button before a slot is picked) |
| touch target | interactive controls ≥ 44px (`h-11`), the a11y floor |
| filter pill | selected = `bg-s-bg-sunken` + `text-s-ink` + semibold (calm gray, never blue-border, never black); unselected = white + hairline, hover deepens text (owner 2026-06-29, supersedes V3-D450) |
| category tag | neutral — `bg-s-bg-sunken` + `text-s-ink-2`, NO per-category colour (incl. the on-photo eyebrow → `text-white`); owner picked B, V3-D449 |
| date / time | ONE `DateTimePicker` primitive — `dateLayout` strip (booking) \| calendar (search); booking + search share it. NO bespoke date UI (V3-D445) |
| nav | sub-page nav is single — the global `Breadcrumb` is excluded on `/{city}/{category}` (SearchTemplate owns it). No stacked home+back (V3-D449) |
| theme | **WEB = SINGLE LIGHT THEME, no dark mode** (`tailwind.config.js` darkMode removed 2026-05-02 Q62; Taste Lab "5 no dark mode"). NEVER put `prefers-color-scheme:dark` / `data-theme="dark"` / dark-mode CSS in ANY web file (mockup, analysis page, component, globals) — it renders BLACK and the owner rejected it twice (2026-07-16, 2026-07-21 "only white for web"). Gate: `~/.claude/hooks/white-only-web-gate.py` (built + self-tested; wire on Write/Edit when settings is writable). iOS (`solen-mobile`) keeps dark mode — this is web-only. |

**States are componentised + locked** (above) — USE them, don't hand-roll. Drift-checker: A2/A3=INFO; A1/A15/A17 comment-aware; token-equivalent hexes whitelisted; `drift-ok` respected.

---

## 🎨 Design system

**Before design/UI work: `_design-system/SOURCE.md`** (22-section canonical: tokens, motion, spacing, components, voice, a11y). On conflict, **`_design-system/LOCKFILE.md`** wins (frozen literal values; subagents read as immutable, only orchestrator writes).

**DUAL-AXIS (THE most important rule):** STRUCTURE = Fresha source-of-truth (via `fresha-section-capture` → `public/_pixel-refs/fresha/<section>/SPEC.md`). AESTHETIC = Uber via LOCKFILE §1.5/§2.5/§11/§6. Both axes apply to every change. Full decision tree + anti-patterns: `_design-system/LOCKFILE.md` §10.0-§10.8. Read §10.0+§10.8 before any non-trivial edit.

**`fresha-section-capture` skill fires FIRST** for any Fresha-clone rebuild (live DOM → SPEC.md). Mission lock: exact Fresha anatomy; only exceptions are Solen primitives + tokens + fonts + `bg-s-ink` CTA discipline.

**Component registry:** `_design-system/COMPONENT_REGISTRY.md` — read BEFORE building any component. New shared component = write `_design-system/components/<Name>.md` + registry entry in the same turn. Layer 1/2/3 mandatory. No `if category === 'X'` branches (rule B5).

**Ship gates:** `_design-system/SENIOR_SCORECARD.md` (5/5 Pass required, customer screens) · `_design-system/WORK_TYPES.md` (6 types, pick before scoping) · `_design-system/WAVE_PLAN.md` (living roadmap W9-W17).

**Other references:** `_design-system/CONTROL_ELEVATION.md` (elevation decision tree: primary→ink, over-photo→frost, calm→flat; read before any button/stepper styling) · `_design-system/MOTION.md` (principles + remaining-work list; read before motion work) · `_design-system/AGENT_BRIEF_TEMPLATE.md` (sub-agent brief format) · `/solen-drift-check` skill (static drift → `_design-system/_drift-report.md`).

Per-component rules: `_design-system/components/<Name>.md`. Open questions: `_design-system/QUESTIONS.md`. Taste decisions: `_design-system/TASTE_LOG.md` (read before design on a covered surface).

---

## 🖼️ Mockup FIRST (visual changes) — ALWAYS

Before applying, building, or committing ANY visual / design change: **show the user a mockup/preview FIRST, get approval, THEN touch real code.** Never apply-then-show. (User rule, 2026-06-09, after a long run of rejected attempts.)

1. The mockup MUST be a **copy of the REAL page/component** with ONLY the proposed change applied — capture the real route (Playwright), modify the real DOM/component uncommitted, show before/after. NEVER a from-scratch HTML redraw (they diverge → "this doesn't look like the homepage").
2. **Treatment-only:** change ONLY the proposed thing (shadow / bg / radius / spacing). Never touch structure, layout, copy, icons, or content in a design mockup. Structure stays; only the treatment changes.
3. Approve → THEN edit the real component + commit. Memory: `feedback_mockup_first_always`.

---

## ⚡ Binary triggers — specific inputs fire specific tools FIRST (no eyeballing)

**Enforced mechanically** by `.claude/hooks/user-prompt-binary-triggers.sh`. This table is the canonical copy; the memory entry (`feedback_binary_triggers`) points here.

| Input arrives | FIRST tool call of the turn — before ANY edit or opinion |
|---|---|
| Reference image attached / pointed at ("ss folder", IMG_xxxx, "screenshot") | `python3 ~/.claude/skills/pixel-spec-auto/scripts/extract.py <image> <outdir>` → implement against spec.md. If detection fails (borderless UI), PIL pixel-sample the measurements directly. Escalate to `screenshot-spec` if still missing elements. |
| `<launch-selected-element>` XML pasted | `preview_eval` → `getBoundingClientRect()` + `getComputedStyle` on the element, its container, and siblings. Report NUMBERS, then one fix. |
| Measurement-complaint words: "overlap", "clipped", "off", "not like the ss/picture", "unbalanced", "different heights", "not 1:1", "compare", "still wrong" | Measure live UI (`preview_eval` rects) AND the reference (PIL) BEFORE editing. Confirmation-bias warning: do NOT pattern-match to recently-changed elements. |
| Brand-named structure rebuild ("like Fresha('s) X") | `fresha-section-capture` (live URL) or pixel-measure the provided screenshots. STRUCTURE=Fresha / AESTHETIC=Uber-LOCKFILE (§ dual-axis above). |
| ANY other brand/visual reference named ("this animation from Airbnb", "web Uber Eats", "like Stripe's hover"), or a liked ASPECT of a shared image/recording ("I like how the structure / aesthetic / motion / shadow / shader is") | `Skill(reference-lock)` → resolve brand+platform+surface, classify the aspect, CAPTURE the real thing (record-interaction.mjs video + animations.json / Mobbin / ffmpeg frames of a recording), write `_design-system/references/<brand>--<surface>.md` with a Philosophy section, arm the active-ref lock. NEVER build a named reference from training memory. Enforced globally by the `reference` category in `~/.claude/hooks/fable-skill-trigger.py`. |
| Any visual just changed (screenshot taken / mockup ported) | `gemini-visual-check` (image vs reference) before claiming a match. |
| Owner criticizes a look WITHOUT naming the cause ("this is bad", "looks bad", "ugly", "off", "busy", "unbalanced", "doesnt look right", "sieht schlecht aus") | `Skill(solen-taste-diagnosis)` FIRST: measured walk (squint, hierarchy counts, typography floors, grouping tree, contrast math) against RATIONALE.md + research/TASTE_*.md floors; report NAMED violations with numbers, THEN propose the fix. Never guess-and-apply on a look complaint. |

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
2. **`_design-system/REMOVED.md`** — when the owner deletes/rejects a feature, ADD A LINE in the same turn: `npm run removed -- "<keywords>" "<what>" "<why>" "<record>"`. Hook-enforced: UserPromptSubmit fires on rejection words; `pre-commit-graveyard.sh` blocks commits that delete routes without a REMOVED.md line (override: `touch .claude/graveyard-skip.flag`).
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

## Precedence chain (when two rules or docs disagree, 2026-07-03)

Walk top down; higher wins. Latest DATED owner decision wins; "supersedes X" kills X everywhere, even where X still appears verbatim in an older doc or memory.

1. The owner's live, literal, latest ask (a live rejection outranks an earlier approval)
2. **STATUTORY AND SAFETY FLOORS** (added 2026-07-27). A named legal or safety minimum is not a
   taste axis and cannot be outranked by one. Members, and this list is closed until the owner
   extends it: WCAG 2.2 level A and AA on any published customer surface; Swiss nFADP and, for EU
   data subjects, GDPR, in particular consent and the special-category handling that allergy and
   treatment notes fall under; the Swiss Price Indication Ordinance (PBV) total-price rule; and
   anything the Terms of Service represent to a user as true.
   **Why this tier exists, the case that created it:** the owner rejected focus rings three times
   on looks, and the estate implemented that as `outline: none` on every link, button and tabbable
   element sitewide, with no substitute. A taste rejection had silently deleted WCAG 2.4.7, and
   nothing in the chain could catch it because there was no tier that said a statutory floor
   outranks a taste preference. Same shape as the A3-photo-lock versus FLOORS-LAW-2 collision:
   two owner decisions, no arbitration rule.
   **How it resolves, and it is not "the law wins, ignore the owner":** when a taste decision and a
   floor collide, you do NOT silently override the taste call and you do NOT silently drop the
   floor. You SURFACE the collision, name both sides with dates, and propose the treatment that
   satisfies the floor while honouring the taste intent. The focus case: the owner objected to the
   RING, not to keyboard users knowing where they are, so the answer is a non-ring focus treatment,
   shown for approval, not a restored ring and not nothing.
3. Hooks and gates (a deny message is an instruction, not an obstacle)
4. _design-system/LOCKFILE.md frozen literals
5. This file's pinned blocks (taste rules, design contract, binary triggers, exists protocol)
6. _design-system/TASTE_LOG.md dated decisions
7. Memory feedback files
8. Global ~/.claude/CLAUDE.md rules, together with the ~/.claude system docs it points to (LAW_SYSTEM.md, LOOP_SYSTEM.md, MODEL_ROUTING.md, REPORT_SYSTEM.md, REGRESSION_SYSTEM.md, CONTEXT_SYSTEM.md, FABLE_DNA.md) , same tier, the doctrine layer for cross-project behavior
9. Generic checklists (uiux-audit) and legacy _rules/* (anything palette, Figma, Vercel, or push flavored there is history) (_rules cleaned 2026-07-07; if push/Vercel/Figma/palette-flavored text ever resurfaces there, it is history, never law)

Full reasoning procedure: the fable-reasoning skill, section 6.
