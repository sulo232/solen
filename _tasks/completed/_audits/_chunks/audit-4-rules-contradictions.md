# Rules contradictions sweep

> Audit of `_rules/*.md` + `CLAUDE.md` + `_docs/PROJECT_REFERENCE.md` against the locked design decisions in `_tasks/SOLEN_DESIGN.md` §20 (Q1-Q63 locks). Read-only audit.

## Summary
- Files scanned: 13 (11 rules + CLAUDE.md + PROJECT_REFERENCE.md)
- Contradictions found: 41
- Most-contradicted file: `_rules/STRUCTURAL_RULES.md` (12 hits) — Rule 47 (V5 spec) + Rule 46 (zone/dark-mode) + Rule 43 (filter pill flood) all preserve retired V5/zone/dark-mode language wholesale.
- Runner-up: `_rules/SYSTEMS.md` (7 hits) — quick-match table points at 4+ deleted files, wrong coral hex, wrong ink hex, banned `bg-white` even though Q15 = white bg.

**Important note about the audit prompt:** the prompt asserts the typography lock is `Anton+Figtree` (Q23/Q48/Q49). That matches §20 — but the design doc's *own* §2 still declares `Bebas Neue + Fraunces + DM Sans` and §18 banned-list mirrors that. Per CLAUDE.md "Q-locks live in §20" + "If anything contradicts SOLEN_DESIGN.md, that doc wins" → §20 is canonical. **SOLEN_DESIGN.md has internal §2-vs-§20 drift that should be reconciled separately** — see "Cross-doc note" at the bottom. For this audit, §20 wins, so all `Bebas / Fraunces / DM Sans / Syne` references in rule files are flagged as contradictions to the §20 lock.

---

## Contradictions table

| File | Line | Rule says | Q-lock says | Recommended action |
|---|---|---|---|---|
| `_rules/CODE_SAFETY.md` | 86 | "match the existing styling patterns (read `_rules/UI_RULES.md` …)" | UI_RULES.md does not exist; design source of truth is `_tasks/SOLEN_DESIGN.md` (Q-locks §20) | Replace pointer with `_tasks/SOLEN_DESIGN.md` + `_rules/SOLEN_UI.md` |
| `_rules/CODE_SAFETY.md` | 126 | "There is only ONE design system: **V5** (see `_rules/UI_RULES.md`)" | V5 zone language retired (CLAUDE.md retired list); UI_RULES.md missing | Replace block with pointer to SOLEN_DESIGN.md §20 |
| `_rules/CODE_SAFETY.md` | 128 | "Fonts: Bebas Neue (display ≥40px), Syne (headings), DM Sans (body + data)" | Q23 (2026-05-01) + Q48 (2026-05-02): Anton (display) + Figtree (everything else); Syne explicitly retired (§20 2026-04-20 "Fraunces replaces Syne") and now Fraunces also superseded by Figtree | Rewrite line: "Fonts: Anton (display, hero only) + Figtree (everything else)" |
| `_rules/CODE_SAFETY.md` | 130 | "NEVER use teal, old coral `#FF6B6B`, wine red, gold, DM Serif Display, or Space Grotesk" | OK as far as it goes, but should also list Bebas Neue, Syne, Fraunces, DM Sans as retired display/heading/body | Append retired fonts to the never-use list |
| `_rules/I18N_ROUTING.md` | 51 | "The `not-found.tsx` component MUST adhere to the **Zone 1** or **Zone 3** rules in `_rules/UI_RULES.md`" | V5 zones retired (CLAUDE.md retired list); UI_RULES.md missing | Replace with: must follow `_tasks/SOLEN_DESIGN.md` §20 + `_rules/SOLEN_UI.md` (no zone language) |
| `_rules/KEY_FEATURES.md` | 3 | "**V5 HOMEPAGE HERO**: cinematic warm gradient background (cream → coral blush → plum shadow) — NOT a flat white background" | Q15: page bg is white `#FFFFFF`; Q49: home above-fold = stacked Anton + Fresha-flow search card, NO hero photo, NO gradient hero; Q16 retired all decorative gradients | Delete this header block entirely |
| `_rules/KEY_FEATURES.md` | 3 | "search bar is ALWAYS visible as a floating glass pill" | Q49: 3-field stacked Fresha-flow card on hero (full-bleed pill wrapper, NOT a single floating glass pill); §6 glass-only-3-places allows hero card overlay glass but not "the search bar is always glass" | Replace with Q49 spec |
| `_rules/KEY_FEATURES.md` | 15 | "**Dark Mode**: System/manual toggle via `ThemeToggle` in Header. `darkMode: 'class'` in Tailwind." | §20 2026-04-20 "Dark mode killed"; CLAUDE.md retired list explicitly bans dark mode | Delete entry 11; rewire to "single light theme" if listing themes at all |
| `_rules/LESSONS_LEARNED.md` | 321 | "Coral is ONLY for: Book Now CTAs, active filter pills, progress bars, star ratings, **active hearts**, price highlights, 'open now' status." | Q23 + Q26 + SOLEN_UI #5b: **heart save state must use literal `#FF4A6B` love-red, NOT brand coral**; Q26 explicitly says "heart-favorite uses #FF4A6B literal love-red, NOT brand token"; "open now" is semantic green `#16A34A` (Q52) not coral; star ratings are amber `#F3A864` (Q23/Q43), not coral | Rewrite list: remove "active hearts", remove "star ratings" (amber), remove "open now" (semantic green); coral = CTAs + time-pulse signal + em underline + eyebrow dot only |
| `_rules/LESSONS_LEARNED.md` | 321 | "active filter pills" use coral | SOLEN_UI #2c: "selection by weight or contrast, not by brand-color flood" (Uber Eats reference); active states = bolder weight + ink, not coral flood | Remove "active filter pills" from coral-list; selection state = weight + ink color |
| `_rules/STRUCTURAL_RULES.md` | 76 | "Page component MUST determine its **zone** (1-4) and pass it to child components as `zone` prop" | V5 zone language retired | Delete the zone-determination requirement |
| `_rules/STRUCTURAL_RULES.md` | 87 | "see `_rules/SOLEN_DESIGN_SYSTEM.md` Section 8" | File does not exist | Replace with `_tasks/SOLEN_DESIGN.md` + `_rules/SOLEN_UI.md` |
| `_rules/STRUCTURAL_RULES.md` | 91 | Filter Pills active = `bg-s-coral text-white` | SOLEN_UI #2c + Q23: selection by weight + ink, never brand-color flood | Replace active state spec with "weight 700 + ink color" |
| `_rules/STRUCTURAL_RULES.md` | 140 | "On 2026-03-26 … 45+ hardcoded white `rgba(255,255,255,...)` glass backgrounds that broke dark mode" | Dark mode retired; "broke dark mode" is no longer a relevant failure mode | Strip dark-mode justification from incident note |
| `_rules/STRUCTURAL_RULES.md` | 148-150 | "B. Dark Mode Support — USE CSS VARS FOR GLASS … `dark:text-s-dm-text` … `bg-[--raised] dark:bg-s-dm-surface` … BANNED: `text-black`, raw `bg-white`" | Dark mode killed; `dark:*` utilities should not be used; Q15: page bg = WHITE `#FFFFFF`, so `bg-white` is the page rule, not banned | Delete section B entirely; replace with "single light theme; coral signal only" |
| `_rules/STRUCTURAL_RULES.md` | 153-156 | "C. Zone Compliance — DECLARE AND ENFORCE … Every component … must know its zone (1-4) … Zone 1-2: Glass on floating UI, animations allowed. Zone 3-4: NO glass, NO animations." | V5 zone language retired; §6 glass-only-3-places (nav/hero card overlay/trust strip) is the new rule | Delete section C; replace with §6 glass-3-places + Q40 4-hover-classes |
| `_rules/STRUCTURAL_RULES.md` | 159 | "Read `_rules/SOLEN_DESIGN_SYSTEM.md` before writing ANY styling" | File does not exist | Replace with `_tasks/SOLEN_DESIGN.md` |
| `_rules/STRUCTURAL_RULES.md` | 163 | "Section 8 in `_rules/SOLEN_DESIGN_SYSTEM.md`" | File does not exist | Replace pointer |
| `_rules/STRUCTURAL_RULES.md` | 174 | Pre-commit checklist: "Has zone prop or inherits zone from parent" | Zones retired | Delete this checklist line |
| `_rules/STRUCTURAL_RULES.md` | 175 | "No `rgba(255,255,255,...)` — uses var(--glass-*) tokens" | §6 only allows glass in 3 contexts (nav, hero overlay+booking summary, trust strip); blanket "use --glass-* tokens" implies glass-everywhere | Rewrite to: "glass only in §6 sanctioned contexts; everywhere else use solid `--raised`/`--bg`" |
| `_rules/STRUCTURAL_RULES.md` | 196-204 | **Rule 47 — entire "HOMEPAGE UI/UX OVERHAUL SPEC (V5)" block** | Whole rule is V5-era; multiple direct contradictions (see next 5 rows) | Delete Rule 47 entirely (replaced by `_tasks/SOLEN_DESIGN.md` + Q-locks Q15/Q23/Q48/Q49/Q50/Q51) |
| `_rules/STRUCTURAL_RULES.md` | 199 | "Page background is Warm Beige (`#F5F0EB`)" | Q15 (2026-04-22): page bg is WHITE `#FFFFFF`; cream/beige bg explicitly retired | Delete (Rule 47 deletion covers this) |
| `_rules/STRUCTURAL_RULES.md` | 200 | "Hero: Header is **Bebas Neue 42px**" | Q23/Q48: Anton 32-72px (uppercase, tracked); Bebas Neue retired as headline font (replaced by Anton) | Delete (Rule 47 deletion covers this) |
| `_rules/STRUCTURAL_RULES.md` | 200 | "Horizontal scroll-snap featured salon carousel" with "Solid `#F5F0EB` background (no images/fade-ups)" | Q49: stacked search card + chips above fold (no carousel hero); Q50: per-section 2.5-up scroll-snap carousels (correct pattern); but BG color `#F5F0EB` wrong | Delete; Q49/Q50 in SOLEN_DESIGN.md are correct |
| `_rules/STRUCTURAL_RULES.md` | 201 | "Header: Background is `#F5F0EB` glass frost" | Q15 = white page bg; nav pill = G1 glass (`rgba(250,246,239,.82)` per §6); the `#F5F0EB` value isn't in any token; "glass frost" applied to whole header contradicts §6 (glass = nav pill only) | Delete |
| `_rules/STRUCTURAL_RULES.md` | 202 | "Icons: Category SVG icons render perfectly solid in Coral (`#E8735A`)" | Coral hex is `#E8624A` (§1 + Q23), NOT `#E8735A`; Q23 also says coral is signal not substrate (icons get colored only when they ARE the signal — solid coral category icons reads as brand-color flood) | Delete; Coral hex in this doc is wrong (`#E8735A` ≠ `#E8624A`) |
| `_rules/STRUCTURAL_RULES.md` | 203 | "Footer: Background is strictly `#2C2825`" | Solen footer in design doc uses `--ink` `#1A1209` (warm ink, never `#000`-adjacent grey-tinted black); `#2C2825` is a mid-grey-brown that doesn't appear in §1 palette | Delete; if a dark footer is wanted, use `--ink` `#1A1209` |
| `_rules/STRUCTURAL_RULES.md` | 204 | "Mobile Tab Bar: active states **Coral (`#E8735A`)** … glass frost" | Wrong coral hex (see above); active state = brand-color flood, contradicts SOLEN_UI #2c | Delete; tab bar active = weight + ink (Q23 vocab) |
| `_rules/SYSTEMS.md` | 11-17 | Quick-match table column "Key file" points at `_rules/FIGMA_CODE_SYNC.md`, `_rules/UI_RULES.md` | Both files do not exist (verified by `ls _rules/`) | Replace with `_tasks/SOLEN_DESIGN.md` and `_rules/SOLEN_UI.md` |
| `_rules/SYSTEMS.md` | 86 | "Component specs: `_rules/DESIGN_SPEC.md` … Read the relevant section BEFORE implementing any component" | File does not exist | Replace with `_tasks/SOLEN_DESIGN.md` (relevant Q-locks in §20) |
| `_rules/SYSTEMS.md` | 88 | "Rules: `_rules/UI_RULES.md`, `_rules/SOLEN_DESIGN_SYSTEM.md`" | Neither file exists | Replace with `_tasks/SOLEN_DESIGN.md` + `_rules/SOLEN_UI.md` |
| `_rules/SYSTEMS.md` | 90 | "Key tokens: `s-coral` (#E8735A accent, #C05038 button, #B84A35 text), `s-ink` (#222222)" | §1 + Q23: coral = `#E8624A` (hover `#CC4E35`, text `#7A2415`); `--ink` = `#1A1209`. `#E8735A` / `#C05038` / `#B84A35` / `#222222` are NOT design tokens | Replace with the exact §1 palette values |
| `_rules/SYSTEMS.md` | 92 | "Banned: … `bg-white`, `text-black`" | Q15 (2026-04-22): page bg is WHITE `#FFFFFF`; `bg-white` is correct for the page. `text-black` was retired in favor of `--ink` `#1A1209`, so the ban for `text-black` is correct, but `bg-white` should not be banned | Remove `bg-white` from banned list; keep `text-black` ban |
| `_rules/SYSTEMS.md` | 100 | "Easing `cubic-bezier(0.23, 1, 0.32, 1)`. Duration 100-300ms" | SOLEN_UI default out-curve `cubic-bezier(0.2, 0.8, 0.4, 1)`; Q35 timing scale = 200ms / 400ms slide + morph for shared-element. The `0.23, 1, 0.32, 1` curve is not in either source | Replace with SOLEN_UI scale + Q35 200/400ms |
| `_rules/SYSTEMS.md` | 108 | Feature dev pointer list mentions `_rules/search-bar-rules.md` | File does not exist | Remove or replace with Q48 (E2 Fresha-flow pattern) reference |
| `_rules/SYSTEMS.md` | 118 | "Intentional Figma deviations: `_rules/FIGMA_DEVIATIONS.md`" | File does not exist | Remove row or stub the file |
| `_rules/SYSTEMS.md` | 120 | "Asset generation: `_rules/GENERATION_TOOLS.md`" | File does not exist | Remove row or stub the file |
| `_rules/ROADMAP_RULES.md` | 104-108 | "**R11: STRICT ZONE COMPLIANCE FOR NEW STEPS** — Identify the Zone … Zone 3 … DO NOT use glassmorphism. DO NOT use entry animations." | V5 zone language retired (CLAUDE.md retired list) | Delete R11 entirely; replace with pointer to §6 (glass-3-places) + Q40 (hover scope) + Q35 (motion timing) |
| `_rules/ROADMAP_RULES.md` | 140 | "Before writing ANY frontend code, you must read and strictly adhere to `UI_RULES.md`. Do NOT deviate from the light-mode, **glassmorphic**, Airbnb-style layout constraints" | UI_RULES.md missing; "glassmorphic" reads as glass-everywhere, contradicts §6 (3-place glass cap) | Replace with: "Read `_tasks/SOLEN_DESIGN.md` (Q-locks §20) + `_rules/SOLEN_UI.md`. Light-mode only. Glass restricted to §6 sanctioned contexts." |
| `_rules/SOLEN_UI.md` | 91 | "Drop shadows and box shadows are **neutral grayscale only** (`rgba(0,0,0,0.x)`). Never tint shadow with the surface color underneath" | §5 (palette + shadows): "Every shadow uses `rgba(26,18,9,x)` tinting — NEVER `rgba(0,0,0,x)`". The neutral-grayscale lock contradicts §5 warm-ink-tint lock. (The Q16 retirement of `--sh-coral`/`--sh-amber` was for *colored same-hue glow*, not for warm-ink tinting of all shadows.) | Reconcile: change SOLEN_UI #5c to "neutral warm-ink shadows (`rgba(26,18,9,0.x)`); never colored-glow (`--sh-coral`/`--sh-amber` retired per Q16); never pure-black `rgba(0,0,0,x)`" |
| `_rules/SOLEN_UI.md` | 230 | "Default `0 4px 6px rgba(0,0,0,0.1)` shadows look harsh. Drop to ~5–10% opacity, push blur to 16–32px+" | Same as above — `rgba(0,0,0)` contradicts §5 warm-ink shadows | Update example hex to `rgba(26,18,9,...)` |

---

## Files with zero design-lock contradictions
- `CLAUDE.md` (clean — explicitly identifies retired patterns + "SOLEN_DESIGN.md wins")
- `_docs/PROJECT_REFERENCE.md` (line 31 has the correct Anton+Figtree lock with explanatory note about retired Bebas/Syne/DM Sans)
- `_rules/AGENT_COORDINATION.md` (operational only, no design tokens)
- `_rules/DB_SCHEMA.md` (pure schema)
- `_rules/SECURITY_RULES.md` (pure security)

---

## Cross-doc note (out of audit scope, but flagged for reconciliation)
**`_tasks/SOLEN_DESIGN.md` itself has internal §2-vs-§20 drift:**
- §2 (Typography, lines 87-135) declares Bebas Neue + Fraunces + DM Sans as the locked typography system
- §18 (BANNED list, lines 486-488) reinforces "DM Sans body, Fraunces buttons … DM Sans + Fraunces + Bebas Neue"
- §20 Q23 (2026-05-01) RE-LOCKS the system to Anton (display) + Figtree (everything) — supersedes earlier locks
- §20 Q48 (2026-05-02) confirms Anton + Figtree as the brand signature
- Per CLAUDE.md "Q-locks live in §20" + "If anything contradicts SOLEN_DESIGN.md, that doc wins" → §20 is the canonical layer, but §2 + §18 still display the older lock to any reader who doesn't scroll to §20.

**Recommendation:** rewrite SOLEN_DESIGN.md §2 + §18 to match §20 Q23/Q48 (Anton + Figtree). This audit treats the §20 Q-locks as canonical for evaluating rule files; once §2/§18 are reconciled, the rule-file fixes recommended here will fully align with the design doc.

---

## Recommended fix order
1. **`_rules/STRUCTURAL_RULES.md`** (12 hits) — biggest payoff. Delete Rule 47 (entire V5 block), strip zone language from Rule 42 + Rule 46 + the pre-commit checklist, replace `_rules/SOLEN_DESIGN_SYSTEM.md` pointers with `_tasks/SOLEN_DESIGN.md`, fix Rule 43 filter-pill active state.
2. **`_rules/SYSTEMS.md`** (7 hits) — replace 4 missing-file pointers, fix coral hex (`#E8735A` → `#E8624A`), fix ink hex (`#222222` → `#1A1209`), unbann `bg-white`, swap easing curve.
3. **`_rules/CODE_SAFETY.md`** (4 hits) — rewrite Rule 12 "Single design system" block (V5 + Bebas/Syne/DM Sans → Q-locks §20 + Anton/Figtree); fix Rule 8 pointer.
4. **`_rules/KEY_FEATURES.md`** (3 hits) — delete the V5 hero header block (line 3), delete entry 11 Dark Mode.
5. **`_rules/ROADMAP_RULES.md`** (2 hits) — delete R11 zone block, fix line 140 UI_RULES + glassmorphic language.
6. **`_rules/LESSONS_LEARNED.md`** (2 hits) — fix the 2026-04-04 coral-rebalance lesson (line 321) so coral list excludes hearts/stars/"open now"/active filter pills.
7. **`_rules/I18N_ROUTING.md`** (1 hit) — fix Rule 36 zone reference.
8. **`_rules/SOLEN_UI.md`** (2 hits) — reconcile #5c shadow rule (`rgba(0,0,0)` → `rgba(26,18,9)` warm-ink; clarify that "no colored shadows" means no `--sh-coral`/`--sh-amber` glow).
9. **(Out-of-scope follow-up)** Reconcile SOLEN_DESIGN.md §2 + §18 with §20 Q23/Q48 (Anton + Figtree) so §20 isn't the only place reflecting the current font lock.
