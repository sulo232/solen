# C1 — Mobile Design System Audit (read-only)

Scope: `/Users/sulo/Documents/solen-mobile`. All line numbers verified by direct read on 2026-07-12.

**Correction to the brief before section 1**: the web-canon summary supplied to this audit states
`error #D32F2F`. Direct inspection of `tailwind.config.js:178` (web worktree) shows this was
superseded: `"s-error": { DEFAULT: "#DC2626", bg: "#FEE2E2" }, // V3-D421: consolidated onto the
locked red (was off-brand #D32F2F); error == closed, one red system`. Current live web law is
**error = closed = #DC2626**, one token. The comparisons below use the verified live value, not
the brief's stale one — this flips what would otherwise have been reported as a mobile/web
divergence into a match.

---

## 1. Law inventory

Mobile has **no single LOCKFILE-equivalent**. `_design-system/PLAN.md` Phase 2 (line 43) promises
a deliverable named `MOBILE_LOCKFILE.md` — **it was never created**. Law instead lives scattered
across five documents with no precedence chain and no supersession markers (mobile's `CLAUDE.md`,
41 lines, has no precedence-chain section at all, unlike the web `CLAUDE.md`). This absence is the
root cause of most internal inconsistencies in section 2.

| Doc | Decides | Status | Dated |
|---|---|---|---|
| `CLAUDE.md` (41 lines) | Preview/screenshot workflow, mockup process, "no times in listings" copy rule, edit discipline, one layout-trap lesson | Settled workflow law | 2026-06-22 / 2026-07-03 |
| `PLAN.md` (233 lines) | The whole build plan + a **chronological decision log D1–D22** (tab bar, home anatomy, card ratios, filter pills, see-all treatment, icons, copy rules, dark-mode trigger) | Mixed: some decisions final, most later informally revised by THEMING.md/code without being marked superseded in-place | 2026-06-12 (nearly all D1-D22 same day) + one status-log append 2026-06-12 |
| `THEMING.md` (90 lines) | Light/dark token map, button-tier system, glass rules | Settled, "Approved by owner" | 2026-06-15 |
| `COMPONENT_REGISTRY.md` (38 lines) | Component inventory + one-line usage rules | Draft status column says "draft" for 9/13 rows; doc itself stale in places (see 2.3) | last edited 2026-07-03 |
| `MODERN_BAR.md` (60 lines) | Aesthetic principles (hierarchy > fill > semantic-color > photo > copy), the "no middot" rule, copy-economy checklist | Settled principles doc | 2026-06-13 |
| `HOME_BLUEPRINT.md` (46 lines) | Home screen section order + build phasing | Proposal awaiting/having had owner approval, screen-specific, not general law | 2026-06-12 |
| `MOCKUP_PIPELINE.md` (20 lines) | A table of 5 **unresolved** mockup decisions (widget size, filter-pill style, category icons, walk-in card, discovery layout) | **Specs-in-progress**, explicitly "owner review" status on every row, not settled law | undated (no per-row date) |
| `src/lib/theme.ts` (121 lines) | The actual token values (colors, space, radius, shadow, font) | Code, treated as ground truth by components | last touched 2026-06-23 (per git log on related files) |

Onboarding/hair-profile docs (`ONBOARDING_*.md`, `HAIR_PROFILE.md`, `HAIR_APP_BUILDOUT.md`,
`FUTURE_HAIR_PROFILE.md`) are feature-scoped specs, not general design-system law — out of scope
for this token/type/component audit beyond confirming they don't redefine tokens (they don't; they
reference `Chip`/`Button`/haptics by name only).

---

## 2. Internal inconsistencies (mobile doc vs mobile doc, and doc vs code)

### 2.1 Selected/filter-pill fill: THEMING.md contradicts PLAN.md's own approved decision, and both contradict the shipped code's stated intent

| | Claim | Location |
|---|---|---|
| PLAN.md D14 (owner-approved 2026-06-12) | "Filter pills APPROVED... selected = **pale tint fill** + INK text" | `PLAN.md:135-138` |
| THEMING.md (2026-06-15, 3 days later) | "Selected pill / tab / segment \| **ink fill** + onInk label \| ink fill + onInk label \| inversion, not colors.white" | `THEMING.md:61` |
| COMPONENT_REGISTRY.md Chip row | "category/filter pills, **ink-filled when selected**" | `COMPONENT_REGISTRY.md:13` |
| MOCKUP_PIPELINE.md (undated, "owner review") | Filter-pills mockup row still lists "A ink-selected (current, **'too monochrome'**)" as an open, unresolved option alongside B/C alternatives | `MOCKUP_PIPELINE.md:11` |
| Actual code, `Chip.tsx:45-48` | `selected: { backgroundColor: colors.ink, borderColor: colors.ink }` | ink fill, matches THEMING.md, contradicts D14 |
| Actual code, `FilterPills.tsx:88` | `pillOn: { backgroundColor: colors.ink }` | ink fill, matches THEMING.md, contradicts D14 |

Nothing in the repo marks D14 as superseded. THEMING.md simply asserts ink-fill three days later
with no cross-reference. MOCKUP_PIPELINE.md's own decision table calls the shipped ink-fill state
"too monochrome" and lists it as unresolved. This is a live three-way self-contradiction, not
settled law — see section 3 for why it also matters against the web canon.

### 2.2 See-all treatment: two same-day decisions (D8 vs D17) directly conflict; code sides with neither's literal text but a later rev-comment

| | Claim | Location |
|---|---|---|
| PLAN.md D8 (2026-06-12) | "See-all = **BLUE text 'Alle'**, no chevron (DIVERGES from web LOCKFILE 1.5 v3 ink+chevron; owner ordered for app)" | `PLAN.md:209-213` |
| PLAN.md D17 (2026-06-12, same date) | "See-all = **UE circled arrow** (grey circle + ink arrow), blue 'Alle' text **retired**" | `PLAN.md:146-150` |
| COMPONENT_REGISTRY.md (edited 2026-07-03, i.e. after the code below) | "22pt section title + **BLUE text 'Alle'** see-all (mobile divergence, owner)" | `COMPONENT_REGISTRY.md:18` |
| Actual code, `SectionHeader.tsx:10-12` | Comment: "rev3 (owner 2026-06-12): blue 'Alle' text read as web, replaced with the Uber Eats circled-arrow see-all" — component renders `arrowCircle` (grey circle, ink `arrow.right` SF Symbol), no blue text anywhere | `SectionHeader.tsx:16-37` |

D8 and D17 are both dated 2026-06-12 with no time-of-day to order them, and neither doc marks the
other as superseding. The shipped code implements the arrow-circle (matching D17), per a "rev3"
comment that isn't reflected back into PLAN.md's D8 entry or into COMPONENT_REGISTRY.md, which
still documents the blue-text version D8 describes — a stale registry entry describing dead
behavior, last touched on the same day (Jul 3) the divergence should have been visible.

### 2.3 Registry "draft" status vs shipped/live reality

`COMPONENT_REGISTRY.md` marks `Button`, `Chip`, `SlotChip`, `SearchBar`, `RatingRow`, `ServiceRow`,
`SectionHeader`, `EmptyState`, `Skeleton` all as **"draft"** (`COMPONENT_REGISTRY.md:12-20`,
meaning "awaiting owner gallery verdict"), while `SalonMap`, `FilterPills`, `PinCard` (added later,
lines 36-38) are marked **"live"**. All of these components are actually imported and rendered
throughout `src/app` (Button: 13 importers, SearchBar: 7, EmptyState: 6, Skeleton: 9 — see section
4 methodology). The "draft" flag is stale bookkeeping, not a real gate — nothing in the repo
distinguishes a "draft" component from a "live" one at the code level.

### 2.4 THEMING.md's semantic-color claim vs its own token table

THEMING.md's checklist states semantic colors are theme-invariant: `"star" / "success" / "error" /
"save" | semantic | semantic | color IS the message; stays"` (`THEMING.md:47`) — read naturally,
"stays" implies the same hex in light and dark. The token table two sections earlier in the same
file's source (`theme.ts:38-44` vs `theme.ts:66-72`) shows only `star` is actually identical
(#FFC32B both). `success`, `error`, and `save` all get **different** hex values in dark mode
(`success` #16A34A→#2BD17E, `error` #DC2626→#FF5A5A, `save` #FF3366→#FF4D7E) — a deliberate,
reasonable choice for dark-mode legibility, but it contradicts the "stays" wording in the same
doc's own checklist row.

---

## 3. Web vs mobile divergences

Web-canon values below are the **verified live** values (`tailwind.config.js`, worktree
`/Users/sulo/Documents/solen/.claude/worktrees/design-system-consolidation-10167f`), not the
brief's summary where the two differed (see the correction at the top).

| Topic | Web (verified) | Mobile (verified) | Classification | Evidence |
|---|---|---|---|---|
| **Selected/filter state fill** | Calm GRAY `bg-s-bg-sunken` #F4F4F5 + ink text, semibold, **never** black/ink fill (gate `no-black-selected`, owner 2026-06-29, "supersedes the prior ink-fill selection") | **Ink fill** + `onInk` (white) text, in both `Chip.tsx:45-48` and `FilterPills.tsx:88` | **ACCIDENTAL** | Mobile's ink-fill choice (`THEMING.md:61`, 2026-06-15) predates the web's 2026-06-29 supersession by two weeks and was never revisited. No mobile doc post-06-29 acknowledges or re-justifies the divergence. Compounded by mobile's own internal contradiction (2.1): even mobile's own D14 wanted pale-tint, not ink. Web LOCKFILE: `_design-system/LOCKFILE.md:1215`. |
| **Primary CTA fill** | Ink `bg-s-ink`, one per screen, never blue | Ink in light; **accent blue** in dark (`cta: "#4187FF"`, `theme.ts:76`) | **DELIBERATE** | `THEMING.md:1-17` names this explicitly as an "owner override," with rationale ("Revolut-style dark CTAs are accent, not stark white," `theme.ts:16`). Dated 2026-06-15. |
| **Dark mode existing at all** | None — `darkMode removed 2026-05-02 per Q62 — single light theme` (`tailwind.config.js:3`) | Full light+dark, "Revolut charcoal" dark (`THEMING.md` whole doc) | **DELIBERATE** | `THEMING.md:1,8-13`, "Approved by owner 2026-06-15," explicit rationale ("the owner lives in dark mode"). |
| **Icon set** | Lucide only, no hand-drawn/other sets (web `feedback_icon_rules`) | SF Symbols exclusively via `expo-symbols`, "No generic icon sets (Lucide draft is dead)" | **DELIBERATE** | `PLAN.md` D5, line 103; `COMPONENT_REGISTRY.md:28`. Native-platform rationale (D5, "FEEL = Apple native"). |
| **See-all affordance** | Ink/black arrow chevron, never blue (web LOCKFILE) | Grey circle + ink arrow (current code) — but a **stale doc** (`COMPONENT_REGISTRY.md:18`) still claims blue text | **DELIBERATE, but see 2.2** | Code (`SectionHeader.tsx`) already matches web's "arrow stays ink" principle; the registry doc just hasn't caught up. Not a real divergence once code is the source of truth — it's a documentation-drift bug (already logged in 2.2). |
| **Ink tier count** | Two tiers: `s-ink` (#0A0A0A) and `s-ink-2`/`s-ink-3` **collapsed onto one value** #6B6B6B per V3-D138 ("was #5F635D... collapsed onto ink-2") | Three tiers: `ink` #0A0A0A, `ink2` #6B6B6B, **`ink3` #A1A1AA** (distinct, lighter) | **ACCIDENTAL** | `tailwind.config.js:132-133` vs `theme.ts:29`. Mobile appears to have inherited a pre-V3-D138 3-tier scale and never re-synced after web collapsed it. THEMING.md's own token-map comment flags unease: `"ink3" ... (watch WCAG — borderline)"` (`THEMING.md:39`) — the same instability that motivated web's collapse. |
| **`successBg` pale tint** | `#E8F5E9` (`tailwind.config.js:170`) | `#F0FDF4` (`theme.ts:39`) | **ACCIDENTAL** | No dated note reconciling. Mobile's value actually matches an unrelated web token, `s-brand.subtle` (`tailwind.config.js:64`), suggesting a copy from the wrong token family rather than a deliberate choice. Low severity (both pale green). |
| **`errorBg` pale tint** | `#FEE2E2` (`tailwind.config.js:178`) | `#FEF2F2` (`theme.ts:41`) | **ACCIDENTAL** | No dated note. Error `DEFAULT` matches exactly (#DC2626 both); only the pale background diverges. Low severity. |
| **CTA text size** | Locked 15px, "never ≤13 on a button" (web design contract table) | Button primary/secondary text = **17pt** (`Button.tsx:103,108`) | **DELIBERATE** | `PLAN.md:22-24` explicitly carves mobile type scale out of the inherited web system: "Everything NOT covered by the web system is designed fresh for mobile: ... mobile type scale." `Button.tsx:80-81` comment cites "iOS 26 language" (native HIG convention) as the rationale, though no doc pins the number 17 specifically — the delegation to "mobile type scale = fresh" is the authorizing decision, not a specific sign-off on 17pt. |
| **Sheet radius (28)** | `sheet 28` (web design contract table) | No `radius.sheet` token exists (`radius` in `theme.ts:96-102` has `sm/md/lg/xl/pill`, no sheet value); sheets are native `formSheet` via Stack options, OS-controlled chrome | **DELIBERATE (native constraint)** | `PLAN.md` D8, "Sheets: native formSheet (grabber, detents, drag-dismiss) via Stack options... No JS sheet libraries" — but no doc explicitly states "28 doesn't apply because iOS owns sheet chrome"; this is inferred, not written down. Flagged again in section 4 as a documentation gap even though the underlying divergence is justified. |
| **Card/input radius 16** | `card 16`, `input 16` | `radius.lg = 16` (`theme.ts:99`) used for both | **Match** (no divergence) | Consistent. |
| **Accent blue #276EF1, sparse, small-clickable-only** | Locked (web design contract) | `accent: "#276EF1"` exact match; "hyperlink color, not clickability color" (`PLAN.md:17`); Button `link` variant and review-counts use it | **Match** | `theme.ts:34`; `PLAN.md:17,32`. |
| **No em-dashes / no middot separators** | Locked web copy rule | Explicitly ported + hardened: `.claude/hooks/no-decorative-dots.sh` + `npm run check:dots` (per `MODERN_BAR.md:55-57`) | **DELIBERATE / inherited** | `MODERN_BAR.md:49-58`, names the web rule explicitly as the source ("Fresha is our STRUCTURE source-of-truth... Strip it on translation"). |
| **"No time in listings" copy rule** | Web rule (not in the given canon summary, but present in mobile `CLAUDE.md`) | Ported near-verbatim with the same TT.MM / Heute / Morgen pattern | **DELIBERATE / inherited** | `CLAUDE.md:34-35`. |
| **Star, error(=closed), warning, border, bgSunken, accentDeep, accentPale, ink, ink2, inkDisabled, save** hex values | Locked web hexes | Exact matches | **Match** | `theme.ts:26-52` vs `tailwind.config.js` (spot-checked line by line). |

---

## 4. Gaps — topics no mobile doc decides

For each: what I looked at, and whether the web canon has a rule mobile could inherit vs one it
genuinely needs to originate itself (per `PLAN.md:22-24`, mobile is explicitly authorized to design
fresh: "tab bar, navigation transitions, bottom sheets, native list rows, press states, haptics,
pull-to-refresh, mobile type scale, safe areas, gesture patterns" — so most of what follows is a
gap in **documentation**, not necessarily a gap in intent).

- **Haptics vocabulary.** No dedicated doc. Usage is scattered and partially documented in
  `COMPONENT_REGISTRY.md:29-30` ("selectionAsync on pickers/chips; impactLight on heart-save;
  notificationSuccess on booking confirm. Nothing on plain buttons/tabs") — three rules, not a
  full vocabulary (no rule for e.g. pull-to-refresh, error states, walk-in queue updates). Grepped
  `_design-system/*.md` for "haptic": five scattered mentions across `PLAN.md`, `ONBOARDING_STRATEGY.md`,
  `HAIR_APP_BUILDOUT.md`, none consolidated. Web has no haptics system to inherit (browser-only) —
  this is genuinely mobile-native and needs its own doc.

- **Safe-area rules.** No doc. 59 files call `SafeArea`/`useSafeAreaInsets` (grepped
  `src/app`+`src/components`) but there is no written convention for which screens own their own
  inset handling vs rely on a shared layout. Native-only concern, mobile needs to originate this.

- **Press states.** Partially documented: `COMPONENT_REGISTRY.md:29` gives two numbers ("spring
  scale 0.97 (buttons/cards), 0.92 (small circles)") but this is one line in a "shared rules" list,
  not a dedicated section, and doesn't cover every interactive primitive (e.g. `Chip.tsx:27` and
  `FilterPills.tsx` use a flat `opacity` press effect instead of the documented spring-scale
  pattern — an unstated third press-feedback style).

- **Navigation transitions.** No doc found. Code shows only 3 explicit `presentation: "formSheet"`
  usages (`src/app/_layout.tsx:68,76,85`); no written convention for push vs modal vs slide-up
  screen transitions elsewhere in the nav tree.

- **Skeleton / empty / error state components.** `Skeleton.tsx` and `EmptyState.tsx` exist and are
  registered (`COMPONENT_REGISTRY.md:19-20`) and reasonably well used (9 and 6 importers
  respectively). **No `ErrorState` or `ErrorFallback` component exists anywhere in `src/`** (grep
  for `ErrorState`/`ErrorFallback` returned zero hits) — web has both, locked in its design
  contract table ("error = `<ErrorState>` (inline) / `ErrorFallback` (route)"). This is a genuine
  hole: mobile has no consistent error-state primitive, so error handling is presumably ad hoc
  per-screen. **Directly inheritable from web** (same problem, web already solved it).

- **Toast recipe.** No toast component or doc found (`grep -rl "Toast"` found only an unrelated
  comment about React Native's LogBox dev-toasts in `discovery.ts:240`, not a design decision).
  Web has a locked Toast recipe (`project_toast_recipe_locked` memory: Chime recipe, light pill +
  green-check badge + bottom + blue action) that could be **adapted** (native toast idioms differ
  from web's DOM-positioned toast, so this needs translation, not a straight port).

- **Touch-target floor.** No explicit minimum documented anywhere in `_design-system/*.md` or
  `theme.ts` (no `minTouchTarget` constant). Spot-checked `SectionHeader.tsx:55-58`
  (`arrowCircle`, 30×30 with `hitSlop={8}` → effective ~46×46, passes) and `Button.tsx:85,91`
  (52pt / 38pt heights, both pass 44pt), so the *practice* seems to track the web's 44px floor
  informally, but nothing states the rule — a new component could ship under it with nothing to
  catch it. **Directly inheritable from web** (same numeric floor, iOS HIG also recommends 44pt,
  so no translation needed).

- **Dark-mode coverage.** No doc states a percentage or a migration checklist. I measured it
  directly: 88 of 111 `.tsx` files under `src/app` + `src/components` call `useColors()` /
  `useThemedStyles` (theme-aware, ~79%); zero files still import the static back-compat `colors`
  export from `theme.ts` (so the remaining ~21% are likely non-visual or don't render colors at
  all, not confirmed light-only stragglers — would need a per-file check to be certain). No doc
  tracks this, so there's no way to know from the docs alone whether dark mode is "done" or which
  screens are known-incomplete.

- **A consolidated LOCKFILE / precedence chain.** Covered in section 1 as the root-cause gap:
  `MOBILE_LOCKFILE.md` was promised (`PLAN.md:43`) and never written; there's no equivalent of
  web's `TASTE_LOG.md` (dated, append-only decision log with explicit supersession) or precedence
  chain (`CLAUDE.md` section on the web side). `PLAN.md`'s D1–D22 log is the closest thing but
  entries silently conflict (2.1, 2.2) with no supersession syntax.

- **Anti-duplication / graveyard.** Web has `_design-system/REMOVED.md` (owner-rejected features,
  checked before re-proposing). No mobile equivalent found. Lower priority than the items above —
  this is a workflow guard, not visual/token law — but worth listing since the parent consolidation
  effort may want one system-wide.

---

## Files read in full for this audit

`CLAUDE.md`, `_design-system/PLAN.md`, `_design-system/THEMING.md`, `_design-system/COMPONENT_REGISTRY.md`,
`_design-system/HOME_BLUEPRINT.md`, `_design-system/MODERN_BAR.md`, `_design-system/MOCKUP_PIPELINE.md`,
`src/lib/theme.ts`, `src/lib/ThemeProvider.tsx`, `src/components/ui/SectionHeader.tsx`,
`src/components/ui/Chip.tsx`, `src/components/ui/FilterPills.tsx`, `src/components/ui/Button.tsx`,
`src/components/ui/EmptyState.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/GlassCircle.tsx`
(partial, token-usage relevant portion). Web comparison source:
`/Users/sulo/Documents/solen/.claude/worktrees/design-system-consolidation-10167f/tailwind.config.js`
and `_design-system/LOCKFILE.md`.
