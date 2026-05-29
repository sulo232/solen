# Solen LOCKFILE — frozen literal values

**Status:** load-bearing. Every agent reads this verbatim. If a captured Fresha spec contradicts a value here, **the LOCKFILE wins.** Surface the conflict in your return message; never resolve it yourself.

**Why this file exists.** Without literal locked values, parallel subagents independently re-decide "what's the blue moment here" / "how dense is the spacing" / "what does Closed look like" hundreds of times across a sweep. The result: every section is locally "Fresha-accurate" but the whole site feels stitched together by 14 different designers. This file factors all global decisions out of the parallel work.

**When the LOCKFILE updates.** Only the orchestrator (not subagents) writes here. Subagents propose changes in their return message; orchestrator merges centrally between waves.

**V3-D origin.** Created 2026-05-27 (V3-D235). Council recommendation post-pre-mortem of the full-site sweep — both Opus and Grok independently identified the missing lockfile as the single highest-leverage thing.

---

## §0 — Hard rules (NEVER allowed)

1. **No emoji.** Anywhere in code / files / UI / commits. `lucide-react` icons only. (Sole exception: `·` `→` `●` `★` typographic glyphs are allowed.)
2. **Primary CTAs stay `bg-s-ink` (#0A0A0A)** — V3-D192-fix lock. Accent blue NEVER on primary action buttons. Only on small highlight moments (eyebrows, link text, badges, focus rings).
3. **No category branches** in components — `if (category === 'X')` is forbidden. Same component renders for Coiffeur / Barber / Nails / Spa / Makeup / Waxing without conditionals. (Drift-checker rule B5.)
4. **No new semantic hues invented.** Use the §3 universal-color table. Success=green / error=red / warning=amber / info=blue / rating=yellow / save=pink / urgency=burnt-amber / disabled=ink-3. Don't pick a "nice teal" for a status. (V3-D197.)
5. **No `onClick={() => {}}` dead clicks.** Every interactive surface has a working handler OR uses `<ComingSoon>` wrapper.
6. **No hardcoded hex in JSX/TSX.** Use the Tailwind tokens below. Only exceptions: the per-token literal definitions in `tailwind.config.js` itself and the universal-color star/heart values that ARE the spec.
7. **Strict TypeScript.** No `any` without justification comment. No `// @ts-ignore`.
8. **No `git commit` or `git push` automatically** — user controls all commits.
9. **No `.env.local` edits** without explicit ask.
10. **No `npm run build`** unless asked — dev runs on port 3000.

---

## §1 — Color tokens (literal hex)

### Chrome (Layer 1 — neutral)

| Token | Hex | Usage |
|---|---|---|
| `s-ink` | `#0A0A0A` | Primary text + primary CTA bg |
| `s-ink-2` | `#6B6B6B` | Secondary text |
| `s-ink-3` | `#6B6B6B` | Tertiary text (collapsed onto ink-2 per V3-D138) |
| `s-ink-disabled` | `#C5C8C4` | Disabled state |
| `s-border` | `#E7E5E4` | Hairline borders |
| `s-bg.base` | `#FFFFFF` | Page base |
| `s-bg.surface` | `#FFFFFF` | Card surface |
| `s-bg.raised` | `#FFFFFF` | Raised / modal surface |
| `s-bg.sunken` | `#F5F5F4` | Hover bg, input active, inert surface |
| `s-bg.active` | `#F5F5F4` | Input typing active state |
| `white` | `#FFFFFF` | Pure white (text on dark) |
| `black` | `#000000` | NEVER use (eye strain). Use `s-ink` instead. |

### Brand accent (Layer 2 — royal blue, SMALL footprint) — V3-D329 token swap

| Token | Hex | Usage |
|---|---|---|
| `s-accent.DEFAULT` | `#185CE0` | **V3-D330 (2026-05-28): NARROWED to system feedback only.** Focus-visible rings + `<Spinner>` arc + form-input focus border. NEVER decorative text, eyebrows, link text, dots, step circles, hero spans, badges. See §1.5 Accent Application Rules. V3-D329 hex unchanged (still calmer than #276EF1). |
| `s-accent.deep` | `#185CE0` | Alias (same as DEFAULT now). Kept for callsites that use s-accent-deep explicitly. |
| `s-accent.bright` | `#276EF1` | The OLD royal #276EF1 preserved for places that need the punchier hit (large icons, hero accent moments). Use sparingly. |
| `s-accent.pale` | `#EAEFFE` | Pale wash for selected-tab bg / focus glow. Unchanged. |

### Semantic UI (Layer 3 — universal-color convention, color IS the message)

| Semantic | Token | Hex | Light bg |
|---|---|---|---|
| Success / open | `s-success.DEFAULT` / `.bg` | `#16A34A` | `#E8F5E9` |
| Error | `s-error.DEFAULT` / `.bg` | `#D32F2F` | `#FFEBEE` |
| Warning | `s-warning.DEFAULT` / `.bg` | `#F59E0B` | `#FFF3E0` |
| Info | use `s-accent` | `#276EF1` | `#EAEFFE` |
| Rating star | `s-star` | `#FFC32B` | — |
| Save / heart | `--heart-active` | `#FF3366` | — |
| Urgency (last-min / off-peak) | `s-urgency.DEFAULT` / `.bg` / `.border` | `#9A3412` | `#FFF1E6` / `rgba(154,52,18,0.22)` |
| Closed | `s-closed` | `#DC2626` | (distinct from error) |
| Disabled | `s-ink-3` | `#6B6B6B` | — |

### Chart-grey (Layer 4 — data visualization, V3-D315 2026-05-27)

| Token | Hex | Usage |
|---|---|---|
| `s-chart-1` | `#0A0A0A` | Primary chart row (alias of `s-ink` — use for the Solen brand bar in any competitor-comparison chart) |
| `s-chart-2` | `#9CA3AF` | Secondary chart row (e.g. main competitor / Treatwell bar in /partner pricing chart) |
| `s-chart-3` | `#D1D5DB` | Tertiary chart row (e.g. competitor range / "others" bar in /partner pricing chart) |

**Why discrete tokens (not opacity-modifier):** opacity-modifier-on-ink-2 (`bg-s-ink-2/40` / `bg-s-ink-2/30`) is a smell — it conflates hierarchy with transparency. Discrete chart-grey tokens make data-vis intent explicit + readable to drift-checker. Use this scale ONLY for bar/line/area charts (NOT for general UI grey).

### RETIRED — never use in new code

- `s-coral`, `s-cream`, `s-butter`, `s-sage`, `s-wasabi`, `s-droplet`, `s-pop`, `s-cool`
- `s-amber` — **PERMANENTLY KILLED V3-D320 (2026-05-27)** per user pick on Q-W7-A. Was an orphan reference rendering invisible. All callsites swept: star/rating context → `s-star` (#FFC32B yellow), warning/alert context → `s-warning` (#F59E0B amber per LOCKFILE universal-color §3). NO alias added — drift-checker will reject any new `s-amber` usage. If you need amber for warnings use `s-warning`; if for rating-yellow use `s-star`.
- `s-atm-*` family (warm / cool / cream / terra / sage / bone / butter)
- `s-cat-*` family (coiffeur / barbershop / nails / spa — and their `-text` variants)
- `s-love` family (replaced by `--heart-active` for save, `s-error` for error)
- `Inter Tight`, `Hanken Grotesk` — **RETIRED V3-D317 (2026-05-27)** type-swap to Geist Sans single-family. See §2.

Drift-check `RETIRED_TOKENS` list flags any new usage.

---

## §1.5 — Accent Application Rules (V3-D330, 2026-05-28)

**Rule:** `s-accent` (any shade — DEFAULT / deep / bright / pale) may only be applied to surfaces in the ALLOWED list. The FORBIDDEN list is enforced by drift-check rule A9.

**Rationale:** Measured Uber inventory + feedback-blue research (`public/_pixel-refs/uber/feedback-blue/UBER-FEEDBACK-BLUE.md` + `UBER-BLUE-INVENTORY.md`) confirms Uber gates blue exclusively on `:focus-visible` rings and `<Spinner>` arc — zero decorative usages across 8 web surfaces + 26 iOS screens. Solen previously painted accent on ~8-12% of pixels via eyebrows, link text, step circles, hero spans, decorative dots. The user-reported "vibrating blue text" / "blue pill black text contrast" complaints all trace to this overuse.

### ✓ ALLOWED accent applications

| Surface | Recipe | Notes |
|---|---|---|
| `:focus-visible` ring (any focusable element) | `box-shadow: 0 0 0 2px white inset, 0 0 0 2px var(--s-accent)` | Double-ring per Base Web `accent` token |
| Text link focus-visible | `outline: 3px solid var(--s-accent); outline-offset: 1px` | Per Base Web link-focus pattern |
| `<Spinner>` arc (loading) | Track grey, arc `var(--s-accent)` | Matches Base Web `<Spinner kind="primary">` |
| Form input focus border | `border-color: var(--s-accent); box-shadow: 0 0 0 2px var(--s-accent-pale)` | Inline + textarea + select |

### ✗ FORBIDDEN — sweep to ink/semantic instead

| Current usage | Sweep to |
|---|---|
| `text-s-accent` on eyebrow / label | `text-s-ink-3` |
| `text-s-accent` on body link | `text-s-ink underline` |
| `text-s-accent` on hero accent span | `text-s-ink` (single word can use weight contrast instead) |
| `bg-s-accent-pale text-s-accent` pill | Either `bg-white text-s-accent` OR `bg-s-accent-pale text-s-ink` — never both blue |
| `bg-s-accent` step circle | `bg-s-ink text-white` |
| `text-s-accent` decorative dot / icon tint | `text-s-ink-3` or `text-s-success` (if completion-coded) |
| `border-s-accent` on resting card | `border-s-border` |

---

## §2 — Typography (literal values)

### Font families (V3-D317, 2026-05-27 — single-family swap)

```ts
display: ["'Geist'", "system-ui", "-apple-system", "sans-serif"]
heading: ["'Geist'", "system-ui", "-apple-system", "sans-serif"]
body:    ["'Geist'", "system-ui", "-apple-system", "sans-serif"]
mono:    ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"]
```

**Why one family:** Inter Tight (display) + Hanken Grotesk (body) had a 3× weight ratio (800 ↔ 300) that the user flagged as "too heavy everywhere." Swapped to a single-family geometric sans (Geist, Vercel-issued, closest free analog to Uber Move). Weight contrast now carries hierarchy instead of family contrast. Result: lighter overall feel, fewer font loads, easier-to-tune type scale.

**NEVER:** Inter Tight (retired V3-D317), Hanken Grotesk (retired V3-D317), Peace Sans (retired), Plus Jakarta Sans (retired V3-D189), Bricolage Grotesque (retired V3-D190), system-default-only (must specify family).

### Scale (role × size × weight × line-height × tracking)

**V3-D325 (2026-05-27): Uber-aligned scale** — applied to Page H2, Section H2, Subsection H3, body, eyebrow, CTA. All heading weights uniformly 600 EXCEPT Hero H1 (see next note).

**V3-D327 (2026-05-27): Hero H1 = Fresha-exact** — overrides Uber for hero only. Per council (Grok 2× consistent): Solen's actual category peer is Fresha (salon-booking marketplace), not Uber (transport). Hero gets editorial weight (40-64 / 700), rest of site keeps Uber-aligned discipline. This hybrid is intentional — the hero is a self-contained editorial block that benefits from larger type + heavier weight; sections below it benefit from the tighter Uber scale.

| Role | Mobile | Desktop | Weight | LH | Tracking | Font |
|---|---|---|---|---|---|---|
| **Hero H1** (homepage hero "Termin in 30 Sekunden.") — V3-D327 Fresha-exact | **40px** | **64px** | **700** | **1.1** | **-0.02em** | display |
| **Salon-PDP H1** (salon name in hero) | 30px | 34px | 600 | 1.1 | -0.02em | display |
| **Salon-sidebar H2** (salon name in right rail) | 22px | 26px | 600 | 1.15 | -0.02em | display |
| **Page H2** (section titles on /business) | 22px | 26px | 600 | 1.2 | -0.015em | display |
| **Section H2** (homepage / PDP section heading) | 18px | 20px | 600 | 1.25 | -0.01em | display |
| **Subsection H3** (card name in BentoCard) | 16px | 18px | 600 | 1.3 | -0.01em | display |
| **Eyebrow** (uppercase small caps over sections) | 11px | 12px | 600 | — | 0.16em | body |
| **Body large** (sub-headlines, lead text) | 14px | 16px | 400 | 1.4 | -0.015em | body |
| **Body** (default paragraph) | 14px | 15px | 400 | 1.55 | normal | body |
| **Body small** (meta rows, secondary) | 13px | 14px | 400 | 1.4 | normal | body |
| **Caption** (tiny labels, badge text) | 11px | 12px | 500 | — | 0.06em (uppercase) | body |
| **CTA** (button label) | 14px | 15px | 500 | — | -0.005em | body |
| **Service-row name** | 15px | 16px | 600 | — | — | body |
| **Service-row duration** | 13px | 14px | 400 | — | — | body |
| **Service-row price** | 14px | 15px | 600 | — | — | body |
| **Team-card name** | 14px | 15px | 500 | tight | — | body |
| **Team-card role** | 12px | 13px | 400 | snug | — | body |
| **Star rating large** (sidebar 5.0) | 18px | 20px | 600 | 1.0 | — | body |
| **Star rating small** (card 4.8) | 14px | 14px | 600 | — | — | body |

**Common clamp() patterns (use these literal values for new code):**

```
Hero H1:      text-[clamp(40px,10vw,64px)]     font-bold leading-[1.1] tracking-[-0.02em]   (V3-D327 Fresha-exact)
Hero sub:     text-[clamp(16px,4vw,22px)]      font-normal leading-[1.3] tracking-[-0.015em] (V3-D327 Fresha-exact)
Page H2:      text-[clamp(22px,2.8vw,26px)]    font-semibold leading-[1.2] tracking-[-0.015em]
Section H2:   text-[clamp(18px,2vw,20px)]      font-semibold leading-[1.25] tracking-[-0.01em]
Subsection:   text-[clamp(16px,1.6vw,18px)]    font-semibold leading-[1.3] tracking-[-0.01em]
Eyebrow:      text-[11px] md:text-[12px]       font-semibold uppercase tracking-[0.16em]
Body:         text-[clamp(14px,3.5vw,16px)]    font-normal leading-[1.55]
```

**Hero spacing chain (V3-D327 Fresha-exact, mobile 375):**
```
Header bottom → H1 top:           64px (pt-16 on hero outer)
H1 → Sub:                          12px (mb-3)
Sub → Search card:                 64px (mt-16 on SearchCard wrapper)
Search card shadow:                NONE (was 4-layer white-glass rim — drift drop)
```

### Geist weight scale (V3-D325 lock — supersedes V3-D317 + V3-D191)

Geist is geometric + cleaner than Inter Tight/Hanken at every weight. Hierarchy uses **size** + **position** + **tracking** — NOT compound weight contrasts. Uber-aligned: all headings 600 semibold, body 400, with 500 only for emphasis chips/CTAs.

- Body default = **400** (normal) — Geist 400 reads premium without thinness
- CTA / chip / tile label = **500** (medium)
- ALL headings (Hero H1 / Page H2 / Section H2 / Subsection H3) = **600** (semibold)
- Service-row price + star rating + secondary emphasis within text = **600**
- NEVER 700 bold on headings — looks press-shouty against Geist's geometric forms
- NEVER 800 / extrabold — Geist 800 is heavy + clumsy
- NEVER 300 / light — Geist 300 reads thin on mobile

**Weight class sweeps applied:**
- V3-D317: `font-extrabold` (800) → `font-bold` (700) — 82 callsites
- V3-D317: `font-light` (300) → `font-normal` (400) — included
- V3-D325: `font-bold` (700) → `font-semibold` (600) ONLY in heading contexts (`font-display` / `font-heading` classes) — 74 callsites → 129 total semibold headings

---

## §2.5 — Type Role Registry (V3-D330, 2026-05-28) — ENFORCED

**Rule:** Every typography callsite maps to ONE of the 11 enumerated roles. Each role has ONE locked recipe (size, weight, case, tracking, color). Drift-check rule A7 flags any `uppercase` Tailwind class outside `Eyebrow` or `Tag/Status` role. Rule A8 flags any `tracking-[*em]` outside the canonical set. Rule A9 enforces accent rules from §1.5.

**Rationale (root cause fix):** Audit found 19 distinct "primary CTA" variants, 20 distinct letter-spacing values, 733 uppercase usages across rebuilt routes. No upstream policy enforced role→recipe pairing. Every component invented its own variant. Each user-reported symptom ("cheap CTA fonts" / "blue text vibrates" / "busy hierarchy") traces to this missing layer. Registry + drift rules close the loop.

### The 11 roles

| Role | Size (mobile→desktop) | Weight | Case | Tracking | Color | Max/surface |
|---|---|---|---|---|---|---|
| **Hero H1** | clamp(28,7vw,64)px | 700 | sentence | -0.02em | `s-ink` | 1 |
| **Hero sub** | clamp(15,4vw,22)px | 400 | sentence | -0.005em | `s-ink-2` | 1 |
| **Page H2** | clamp(22,2.8vw,26)px | 600 | sentence | -0.015em | `s-ink` | unlimited |
| **Section H2** | clamp(18,2vw,20)px | 600 | sentence | -0.01em | `s-ink` | unlimited |
| **Subsection H3** | 16→18px | 600 | sentence | -0.01em | `s-ink-2` | unlimited |
| **Body** | clamp(14,3.5vw,15)px | 400 | sentence | 0 | `s-ink-2` | unlimited |
| **Meta** | 12→13px | 400 | sentence | 0 | `s-ink-3` | unlimited |
| **Primary CTA** | 15px | 500 | sentence | -0.005em | white on `s-ink` | 1-2 |
| **Secondary CTA** | 15px | 500 | sentence | -0.005em | `s-ink` + `border-s-border` | 1-2 |
| **Tab label** | 14px | 500 | sentence | 0 | `s-ink-2` (active: `s-ink`) | (one nav per route) |
| **Eyebrow** | 11→12px | 600 | **UPPERCASE** | 0.08em | `s-ink-3` | **max 1** |
| **Tag / Status** | 10-12px | 600 | **UPPERCASE** | 0.06-0.08em | semantic (success/warn/error) | small footprint |

### Canonical tracking values (rule A8 enforces this set)

```
-0.02em   — Hero H1
-0.015em  — Page H2 / Body large
-0.01em   — Section H2 / Subsection H3
-0.005em  — Hero sub / Primary CTA / Secondary CTA
0         — Body / Meta / Tab label / Subsection inline
0.06em    — Tag/Status compact
0.08em    — Eyebrow / Tag/Status default
```

Everything else (`.04em`, `.07em`, `.10em`, `.12em`, `.14em`, `.15em`, `.16em`, `.18em`, `.1em`, `.20em`, `.22em` — currently 20 distinct values in use) → drift rule A8 logs to `_pending-migration.md`. Phase 2 sweep collapses callsites onto canonical set.

### Uppercase application policy (rule A7)

Only TWO roles allow `uppercase` Tailwind class:
1. **Eyebrow** — max 1 per surface, semantic role = "what's this section about." Drift rule A7 counts eyebrows per file; >1 = log violation.
2. **Tag/Status** — semantic states (success / error / warning / urgency / open / closed / new / discount). Small footprint, always paired with a colored bg or icon.

ALL other uppercase usage = drift violation. Sweep target: 733 → ~50-80 legit Tag/Status + ~30-50 Eyebrow (one per surface × 30+ surfaces).

### Eyebrow decoration policy (V3-D331, 2026-05-28) — rule A12

**Rule:** Eyebrows are **plain text only**. No leading coloured dot. No leading icon. No `before:` pseudo-element decoration. The eyebrow text IS the entire element.

**Rationale (measured 2026-05-28 against matched-surface peers):** Neither Fresha nor Uber decorate eyebrows with leading dots/icons on their B2B pages. Fresha business + Uber business both go **straight from section break to H2** — zero eyebrow, zero dot, zero icon. The "5px coloured dot → uppercase eyebrow → H2" stack is a 2018-2022 SaaS template trope (Webflow / Notion / early-Linear) that reads "AI-generated landing page." User flagged this 2026-05-28: "u love to use alot of dots for attention like start of category etc that looks ai and not real."

**Preferred:** drop the eyebrow entirely. Section break (white-space + bg-color change) IS the divider. The H2 itself is the entry point. Use eyebrows ONLY when a surface needs a magazine-style identity label ("OPINION" / "GUIDE" / "FÜR SALONS") AND the section break alone wouldn't communicate the transition.

**FORBIDDEN patterns (drift rule A12 flags):**

| Pattern | Sweep to |
|---|---|
| `<span ...rounded-full bg-s-*></span> Eyebrow text` (inline span dot prefix) | Drop the dot span; if eyebrow stays, just the text |
| `before:rounded-full before:bg-s-*` (pseudo-element dot) on eyebrow span | Drop the `before:*` classes |
| `<Icon /> Eyebrow text` (leading lucide icon as decoration) | Drop the icon; if it has semantic role, justify with V3-D{n} comment |
| Eyebrow + H2 stack on a section that has no section-identity content above | Drop the eyebrow entirely |

**KEEP (semantic, not decoration):**
- Separator dots between list values: `1200+ · Basel · Zürich · 4.9★` (Uber + Fresha use middle-dot here too)
- Status indicator dots: `<StatusPill open=true>` (semantic = open/closed signal)
- Animated typing-indicator dots in chat mockups
- Notification count badges (circle around a number)
- Icon container circles (bg circle around an actual icon)

### Migration mapping (phase 2 sweep table)

### Migration mapping (phase 2 sweep table)

| Current Tailwind pattern (regex-matchable) | Role | New recipe |
|---|---|---|
| `bg-s-ink text-white text-xs uppercase tracking-[.0Xem]` | Primary CTA | `bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em]` |
| `border border-s-border text-xs uppercase tracking-[.0Xem]` | Secondary CTA | `border border-s-border text-s-ink text-[15px] font-medium tracking-[-0.005em]` |
| `text-[10-12px] uppercase tracking-[.1Xem] text-s-accent` | Eyebrow (drop) | **Drop entirely** per V3-D331 — sections go straight to H2. Keep only if magazine-style identity label needed |
| `<span ...rounded-full bg-s-*>` immediately before eyebrow text | Decoration dot (forbidden A12) | **Drop the dot span** — eyebrow is plain text only |
| `text-[9-12px] uppercase tracking-[.16-.22em]` | Tag/Status | `text-[10-12px] font-semibold uppercase tracking-[0.08em] text-<semantic>` |
| `text-s-accent` on link | Body link | `text-s-ink underline underline-offset-2` |

### Escape hatch

One-off campaign-style decorative type → use `style={{}}` inline + `// V3-D{n}: justification` comment + add to `_design-system/_drift-acks.json`. Same pattern as the `ALLOWED_HEX` allowlist in `check.py`.

---

## §3 — Spacing + Radius + Shadow

### Border radius

| Token | Value | Usage |
|---|---|---|
| `card` | 16px | Salon cards, listing cards, content blocks |
| `card-lg` | 20px | Hero cards, feature cards, modals |
| `panel` | 16px | Inner panels within a card, review cards |
| `search` | 99px | Search bar outer container (fully rounded) |
| `pill` | 9999px | Availability pills, tags |
| `btn` | 99px | CTA buttons, action buttons |
| `input` | 16px | Form inputs (stable, NOT pill) |
| `sheet` | 28px | Bottom sheets |
| `rounded-full` | 9999px | Avatars, icon buttons |
| `rounded-2xl` | 16px | Sidebar card, info cards |
| `rounded-3xl` | 24px | Bento cards, larger surfaces |

### Box shadow (3-level system + legacy aliases)

| Token | Value |
|---|---|
| `elevation-1` (= `warm-sm` = `card`) | `0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)` |
| `elevation-2` (= `warm-md` = `card-hover` = `surface`) | `0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)` |
| `elevation-3` (= `warm-xl` = `surface-hover` = `warm-float`) | `0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)` |
| `pressed` | `0 1px 1px rgba(50,47,44,.12), inset 0 1px 2px rgba(50,47,44,.06)` |

**Fresha pattern lock (V3-D230):** the salon sidebar card has **NO box-shadow** — `boxShadow: none`. Only `border + radius`. Use shadow sparingly on Layer 1 surfaces; many cards in Fresha are flat.

### Z-index scale

```
sheet-bg: 400 / sheet: 410 / modal-bg: 500 / modal: 510 / toast: 600 / tooltip: 700
header / tab-nav: z-50 / sticky-rail: z-30
```

---

## §4 — Motion (timing + easing)

### Durations (only these — non-canonical = drift)

```
80ms / 150ms / 200ms / 250ms / 300ms / 500ms
```

### Easing functions

```ts
"snap":   cubic-bezier(0.4, 0, 0.2, 1)        // standard UI (focus, color)
"spring": cubic-bezier(0.34, 1.56, 0.64, 1)   // bouncy reveal (toggle, check)
"glide":  cubic-bezier(0.16, 1, 0.3, 1)       // long-distance smooth (sheet open)
"thud":   cubic-bezier(0.7, 0, 0.84, 0)       // press-down feel (button scale)
```

### Fresha-measured motion patterns

- **Book CTA hover/press:** `transition: max-inline-size 0.2s cubic-bezier(0.85, 0, 0.15, 1)` — width-morph ONLY, no transform/scale
- **TabPill active swap:** `transition-colors duration-200 ease-glide`
- **Sheet open/close:** `300ms ease-glide`
- **Hover lift on cards:** `transform translateY(-1px) + shadow-elevation-2`, `duration-200 ease-glide`

### Anti-patterns (NEVER)

- Will-change on resting elements (forces permanent compositor layer, blurry text)
- Backdrop-filter inside scrolling containers (mobile perf killer — `md:` gate it)
- Custom duration / easing values not in the lists above

---

## §5 — Primitive prop signatures (TypeScript-exact, frozen)

### Toast / Toaster

```ts
toast.success(msg: string, opts?: { description?: string }): void
toast.error(msg: string, opts?: { description?: string }): void
toast.warning(msg: string, opts?: { description?: string }): void
toast.info(msg: string, opts?: { description?: string }): void
// Pastel bg + ink text + saturated lucide icon. Auto-dismiss 4s. Max 3 visible.
```

### Skeleton

```ts
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: boolean | "sm" | "md" | "lg" | "full";
  aspect?: string;  // e.g. "16/9", "4/3"
  className?: string;
}
```

### ComingSoon

```ts
interface ComingSoonProps {
  label?: string;  // appears in toast on click
  toastTitle?: string;
  toastDescription?: string;
  children: React.ReactNode;  // any clickable surface
}
// Wraps with opacity-50 + cursor-not-allowed + aria-label suffix " — bald verfügbar"
```

### TabPill

```ts
interface TabPillProps {
  active: boolean;
  onClick: () => void;
  size?: "sm" | "md";  // sm=32px, md=40px
  variant?: "outline" | "ghost";
  children: React.ReactNode;
}
// Active = ink-fill + white text; Inactive = white + hairline border + ink text.
```

### StatusPill

```ts
interface StatusPillProps {
  isOpen: boolean;
  label: string;
  size?: "sm" | "md";
  showDot?: boolean;  // default true
  icon?: LucideIcon;  // optional override (e.g. Clock when closed)
}
// Open → text-s-success + green dot. Closed → text-s-ink-2 + grey dot.
```

### StatusInline

```ts
interface StatusInlineProps {
  isOpen: boolean;
  label: string;  // "Geöffnet · Schliesst um HH:MM" or "Geschlossen · Öffnet Mittwoch um 09:00"
  size?: "sm" | "md" | "lg";  // sm=13, md=15, lg=16
}
// Split-color inline. First word "Geöffnet" green / "Geschlossen" amber.
// Rest of label in muted ink-2. NO pill chrome.
```

### MetaDot

```ts
function MetaDot(): JSX.Element  // No props. Renders the `·` typographic separator. text-s-ink-3, aria-hidden.
```

### SalonCard

```ts
interface SalonCardProps {
  slug: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  category?: SalonCategory;
  variant?: "default" | "service";  // service = compact in SearchTemplate
  discountPercent?: number | null;
  priceFromCHF?: number | null;
  address?: string;
  city?: string;
  isSaved?: boolean;
  className?: string;
}
// Photo + 3-row text below. Used across homepage feeds, search, /favorites.
```

### HeartButton

```ts
interface HeartButtonProps {
  isSaved?: boolean;
  salonId?: string;
  salonName: string;
  tone?: "light" | "dark";
  className?: string;
}
// Pink #FF3366 fill when saved, ink stroke unsaved. 44px hit area, 32px visible circle.
```

### SearchTemplate

```ts
interface SearchTemplateProps {
  locale: string;
  serviceFilter?: SalonCategory | null;
  cityFilter?: CitySlug | null;
  breadcrumb?: { label: string; href?: string }[];
  hero?: { title: string; subtitle?: string } | null;
  aboveSlot?: React.ReactNode;
  belowSlot?: React.ReactNode;
}
// Universal-components compliant. Used by /search + 4 category routes.
```

### BentoCard / Step / FAQItem / MarketplaceVisual

See `_design-system/components/{BentoCard,Step,FAQItem,MarketplaceVisual}.md`.

---

## §6 — Copy patterns (verbatim strings)

Subagents may NOT paraphrase. If a captured Fresha spec needs a phrase variation, surface in return message.

### Status

- Open: `"Geöffnet"` (alone) or `"Geöffnet · Schliesst um HH:MM"` (with detail)
- Closed: `"Geschlossen"` (alone) or `"Geschlossen · Öffnet HH:MM"` (today) or `"Geschlossen · Öffnet {Weekday} um HH:MM"` (later in week)

### CTAs

- Primary book on PDP / sidebar: `"Jetzt buchen"` (used 2026-05-27+)
- Primary book on legacy / sticky mobile: `"Termin buchen"` (kept for back-compat surfaces, prefer "Jetzt buchen" on new work)
- Homepage hero CTA: `"Termine finden"`
- Service-row CTA: `"Buchen"`
- Buy buttons (gift card / packages / vouchers): `"Kaufen"`
- Reset filters: `"Filter zurücksetzen"`
- Empty state CTA: `"Zur Startseite"`
- Show-all: `"Alle ansehen"` (preferred) or `"Mehr anzeigen"` (in-place expand)
- See/show more: `"Mehr"` (compact)
- Get directions: `"Wegbeschreibung"` (preferred) — `"Route"` (compact in sidebar)
- Read more (long text): `"Mehr lesen"`
- Back: `"Zurück"`

### Service-row format (V3-D227 lock)

```
Line 1: {name_de}           (15-16 / 600 / ink)
Line 2: {duration}          (13-14 / 400 / muted ink-2)
Line 3: ab {price} CHF      (14-15 / 700 / ink)        ← "ab N CHF" not "CHF N"
```

Duration format (German): `"{n} Min."` if <60, `"{h} Std."` if exact hours, `"{h} Std., {rem} Min."` if mixed.

### Empty / loading / error

- Empty salon list: `"Keine Salons gefunden."` + sub `"Versuche eine andere Stadt, einen anderen Service oder lass die Filter weg."`
- Empty reviews: `"Noch keine Bewertungen."` (zero count) or `"Bewertungstexte folgen."` (rating but no text)
- Loading: skeleton shimmer pattern (no spinner)
- Error: `"Etwas ist schiefgelaufen."` + retry button

### Salon-card secondary line patterns

- Discount badge: `"-{N}% Last-Minute"` (with lucide `TicketPercent` icon)
- Urgency badge: `"Nur noch {N} heute"` (with lucide `Flame` icon)
- Featured: `"EMPFOHLEN"` — ONLY in listings, NOT on PDP hero
- Price line on card: `"ab CHF {N}"` (note: card uses "CHF N" prefix, service-row uses "ab N CHF" suffix — different surfaces, different patterns)

### Tab nav (PDP sticky)

Always German: `Fotos · Über uns · Services · Bewertungen · Portfolio · Treueprogramm`

(Note: SalonStickyTabNav German labels live in `_shared.ts` `TAB_SECTIONS` constant.)

### Brand voice (always)

- `"du"` not `"Sie"` (informal Swiss)
- No exclamation marks (confidence over enthusiasm)
- No emoji (V3-D203 hard rule)
- No over-cap (don't shout)
- "Termin in 30 Sek." pattern signals speed; "Nur noch X heute" pattern signals urgency

---

## §7 — Layout invariants

### Container widths

| Surface | Max width | Mobile padding | Desktop padding |
|---|---|---|---|
| Page outer | `max-w-[1280px]` | `px-4` | `px-6` to `px-8` |
| Hero content | `max-w-[1280px]` | `px-7` | `md:px-8` |
| Salon PDP grid | `max-w-[1180px]` | `px-4` | `md:px-6` |
| /business hero | `max-w-[1400px]` | `px-4` | `md:px-8` |
| Search bar (collapsed, desktop) | `md:max-w-[820px]` | — | — |
| SearchBar (mobile) | `max-w-[540px]` | — | — |
| FAQ section | `max-w-[820px]` | `px-4` | `md:px-8` |

### Sticky header offset

- Site header: `sticky top-0`, h=79px, z-50
- CityTopBar (above header when mounted): `sticky top-0`, h=52px
- Salon sticky tab nav: `fixed top-0`, h=~52px, z-[60] (above site header per V3-D206)
- Sidebar sticky-pinned: `sticky top-24` (24 = 6rem = 96px clearance for site header + breathing room)
- Scroll-margin for anchor jumps: `scroll-mt-24`

### Breakpoints

```
sm: 640px / md: 768px / lg: 1024px / xl: 1280px / 2xl: 1536px
```

Mobile = below md (768). Desktop = md and up. Most components mobile-first.

### Grid patterns

- Salon-card horizontal carousel: `grid-flow-col` with `gap-3` (12px) mobile, `gap-5` (20px) desktop
- Search result grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` (2-col when map open)
- Team carousel: cards `w-[112px] md:w-[120px]`, gap-6
- Photo gallery (3+ photos): 1 big left + 2 stacked right (1+2 layout)
- Photo gallery (2 photos): 1+1 horizontal split
- Bento (4-card feature grid): `grid-cols-1 md:grid-cols-2 lg:grid-cols-2`

---

## §8 — Reference sources (in priority order)

When capturing a section, use these sources in this order:

1. **`fresha-section-capture` skill** (primary) — Playwright live capture of fresha.com
2. **User's curated screenshots** at `/Users/sulo/solen/screenshots/IMG_47*.png` — ground-truth Fresha refs the user manually selected; cross-check against fresh capture
3. **`pixel-ref-collect`** — when starting fresh on a brand-shaped surface, multi-source brand capture (Playwright + Mobbin + measurements in one shot)
4. **Mobbin MCP** (`mcp__mobbin__search_screens`) — fallback when Fresha capture is paywalled / auth-gated / structurally broken
5. **`pixel-spec-auto`** — extra pixel measurements from any saved screenshot when computed-style data is incomplete
6. **`site-teardown`** — full-URL teardown for global chrome or unfamiliar route shapes
7. **`gemini-visual-check`** — multimodal second-eye on contested verifier verdicts

For Solen-original surfaces (Entdecken / loyalty / referral) where no Fresha equivalent exists: **first-principles design with these locked primitives + tokens.** Don't force a Fresha-shaped wrapper on Solen content (uncanny valley).

---

## §9 — Provenance ranges in use

| Range | Owner |
|---|---|
| V3-D1 to V3-D234 | Already used (latest: D234 salon-team austerity) |
| V3-D235 | THIS FILE |
| V3-D236-D239 | Reserved for golden-route fixes |
| V3-D240-D250 | Reserved for Phase 2 W2 (browse) |
| V3-D251-D261 | Reserved for W3 (sub-PDPs) |
| V3-D262-D269 | Reserved for W4 (landings) |
| V3-D270-D275 | Reserved for W5 (marketing) |
| V3-D276-D280 | Reserved for W6 (commerce side) |
| V3-D281-D295 | Reserved for W7 (profile + account) |
| V3-D296-D310 | Reserved for W8 (help + legal) |
| V3-D311-D315 | Reserved for W9 (global chrome polish) |
| V3-D316+ | Reserved for aesthetic-coherence pass + carve-outs |

Subagents take their block from this table to avoid collisions.

---

## §10 — Conflict-resolution rule + DUAL-AXIS SOURCE-OF-TRUTH (V3-D338, 2026-05-28)

### §10.0 — The dual-axis rule (THE MOST IMPORTANT RULE — read first)

User flag 2026-05-28: "structure n evrth like fresha but colorways typography contrast like ubers."

Every design decision sits on ONE of two axes. Each axis has its own source-of-truth. Conflating them = the failure mode that's bitten this project ≥4 times.

| Axis | Source of truth | Examples |
|---|---|---|
| **STRUCTURE** (IA, layout, components, sections, hero pattern, sticky nav, grid layouts, what-section-goes-where, what-affordances-exist, copy density, primitive composition) | **Fresha** (via `fresha-section-capture` skill → `public/_pixel-refs/fresha/<section>/SPEC.md`) | "PDP hero = 3-photo grid not full-bleed-with-floating-card", "Services has category sub-sections", "Sticky tab nav after hero", "Team carousel below services not above", "Pricing-per-hour shows ab CHF X format" |
| **AESTHETIC** (colors, type role recipes, contrast pairings, accent application, eyebrow policy, imagery rules, spacing rhythm, motion timing, hover affordances) | **Uber** (via LOCKFILE §1.5 / §2.5 / §11 / §6, all measured from Uber web + iOS via `public/_pixel-refs/uber/`) | "Accent only on focus-visible + Spinner", "No eyebrow decoration dots", "Sentence case CTAs not uppercase", "Border-radius 0 on images", "Lighthouse a11y ≥95 per wave" |

**Both axes apply to every change. Never apply one without verifying the other.**

#### Wrong (what bit us in T4):
- Saw "Pattern 3 hero" in §11 imagery registry
- Built mockup with full-bleed photo + floating booking card (= Uber Eats hero pattern)
- That's an AESTHETIC pattern from Uber. Applied as if it were a STRUCTURE pattern.
- Fresha's PDP hero is a 3-photo grid. Structure was already correct. Should have done aesthetic-polish only (rounded-none per §11), not restructure.

#### Right:
1. **Identify the axis:** is this a structure question (where does X go, what does X contain) or an aesthetic question (what color is X, what tracking, what radius)?
2. **Hit the right source:** Fresha for structure, Uber/LOCKFILE for aesthetic.
3. **Verify both before shipping:** structure-match against Fresha SPEC + aesthetic-match against LOCKFILE registries.

#### Concrete decision tree (apply before any non-trivial edit):

```
Is this change about WHAT or WHERE?     → STRUCTURE → fire fresha-section-capture
Is this change about HOW IT LOOKS?      → AESTHETIC → check LOCKFILE §1-§11
Both?                                    → both. Structure first, then aesthetic.
```

#### Concrete examples of each axis:

| Change | Axis | Source |
|---|---|---|
| "Add a Highlights section between hero and Services" | STRUCTURE | Fresha (does Fresha PDP have Highlights? where? what content?) |
| "Drop the eyebrow dot decoration" | AESTHETIC | Uber/LOCKFILE §2.5 V3-D331 |
| "Hero photo aspect ratio 3:2" | AESTHETIC | Uber/LOCKFILE §11 canonical aspects |
| "Hero should be 3-photo grid not single photo" | STRUCTURE | Fresha PDP hero pattern |
| "Primary CTA = sentence case 15px" | AESTHETIC | Uber/LOCKFILE §2.5 type roles |
| "Booking card lives in sidebar not overlay" | STRUCTURE | Fresha PDP layout |
| "Sticky tab nav after hero" | STRUCTURE | Fresha PDP IA |
| "Tab labels = sentence case not uppercase" | AESTHETIC | Uber/LOCKFILE §2.5 Tab label role |

### §10.5 — Conflict resolution (refined per dual-axis rule)

When a captured Fresha SPEC.md contradicts LOCKFILE:

1. **Identify which axis the conflict is on.**
   - Fresha says "use RoobertPRO" → AESTHETIC axis → LOCKFILE wins (Geist Sans per §2)
   - Fresha says "PDP hero is 3-photo grid" → STRUCTURE axis → Fresha wins (LOCKFILE doesn't override structure)
2. **Apply the correct source per axis.** Don't make LOCKFILE win on structure or Fresha win on aesthetic.
3. **Surface conflicts in return message:** `"CONFLICT [axis]: Fresha says X, LOCKFILE says Y. Applied [Fresha if STRUCTURE | LOCKFILE if AESTHETIC]."`
4. **Orchestrator decides** only when the axis is genuinely ambiguous (e.g. "what color is the floating card" — color = aesthetic, but card-existence = structure).

Examples (refined):

| Conflict | Old rule (wrong) | New rule (V3-D338) |
|---|---|---|
| Fresha uses `RoobertPRO` | LOCKFILE wins (Geist) | LOCKFILE wins — AESTHETIC axis |
| Fresha uses purple `#6950F3` accent | LOCKFILE wins (royal blue) | LOCKFILE wins — AESTHETIC axis |
| Fresha PDP has 3-photo grid hero | "LOCKFILE wins" (but LOCKFILE has §11 Pattern 3 = floating-card) → CONFUSION | **Fresha wins** — STRUCTURE axis. §11 Pattern 3 is the Uber Eats AESTHETIC pattern for *what kind of card*, not a STRUCTURE rule for PDP hero |
| Fresha PDP has separate Highlights section | n/a | Fresha wins — STRUCTURE axis. Add the section, then aesthetic-polish per LOCKFILE |
| Fresha sidebar uses thin border | LOCKFILE wins (s-border token) | Both — STRUCTURE: sidebar has a border (Fresha). AESTHETIC: token = s-border (LOCKFILE) |

### §10.6 — Verification checklist (per route / per component edit)

Every non-trivial edit gets BOTH checks:

1. **Structure check (Fresha):**
   - Have I run `fresha-section-capture` against the matching Fresha route recently?
   - Does the Solen IA match Fresha's section order + count + affordance set?
   - Are sections in the right place (hero before sticky-tab before services before team etc.)?
   - If unsure → run capture, don't guess.

2. **Aesthetic check (LOCKFILE):**
   - Every class string traces to LOCKFILE §1-§11 OR has a V3-D{n} comment justifying inline value?
   - Drift rules A1-A12 pass on the touched file?
   - Per-wave verifier gates (Lighthouse a11y ≥95, LCP ≤2.5s, contrast 0 failures) pass?

If either check fails: don't ship. Document the failure + axis in summary doc as PENDING.

### §10.7 — The wrong way (anti-pattern catalogue)

| Failure | Why it's wrong | Right move |
|---|---|---|
| Apply LOCKFILE §11 "Pattern 3" to PDP hero | §11 patterns are AESTHETIC (about card appearance, image rules), NOT structural (where hero goes). PDP hero structure = Fresha 3-photo grid. | Use Fresha PDP capture for hero structure, apply LOCKFILE §11 imagery rules (rounded-none) within whatever structure Fresha defines |
| Sweep tracking values without checking Fresha section uses them | Drift rule fires on canonical-tracking but the Fresha section may genuinely use a non-canonical value for a reason | Run capture, see if Fresha's actual value matches canonical. If yes, sweep. If no, surface conflict. |
| Build a route ground-up using only LOCKFILE | Resulting route is aesthetically correct but structurally invented — won't match user's "Fresha-clone" expectation | Capture Fresha equivalent first, then compose per Fresha IA + LOCKFILE aesthetic |
| Pivot a mockup variant choice based on "what feels right" instead of "what does Fresha do here" | Aesthetics pivot becomes structural drift over time | Anchor structure decisions to Fresha capture. Anchor aesthetic decisions to LOCKFILE. |

---

### §10.8 — Operations: skills, signals, self-auto-verification (V3-D338-ops)

User flag 2026-05-28: "u need to put in how to achieve wich skill to use when to know when ur drifitng or maiking self auto verifications etc bro."

This is the operational layer of the dual-axis rule. The rule above says WHAT. This says HOW.

#### §10.8a — Skill / tool stack per axis

**STRUCTURE axis (Fresha source-of-truth):**

| When | Tool | Output path | Notes |
|---|---|---|---|
| Before any route rebuild OR major section change | `fresha-section-capture` skill | `public/_pixel-refs/fresha/<section>/SPEC.md` + `<section>/static-{mobile|desktop}-{viewport}.png` | Fires Playwright at fresha.com URL. Captures DOM + computed CSS + interactive states + screenshots. FIRST tool to fire for any structural work. |
| Cross-reference for prior captures | Read `public/_pixel-refs/fresha/<section>/SPEC.md` | (read-only) | If section already captured AND <30 days old, reuse. Otherwise re-capture. |
| Pattern reference | Read `_design-system/AGENT_BRIEF_TEMPLATE.md` | (read-only) | "Fresha bones + Solen skin" formula for sub-agent dispatch. |

**AESTHETIC axis (Uber/LOCKFILE source-of-truth):**

| When | Tool | Output path | Notes |
|---|---|---|---|
| Before any non-trivial edit | Read `_design-system/LOCKFILE.md` §1.5 / §2.5 / §11 / §6 | (read-only) | Token + type role + imagery + copy rules. Never stale. |
| After any sweep | `/solen-drift-check` skill | `_design-system/_drift-report.md` + `_design-system/_pending-migration.md` | Python scanner. Validates aesthetic gates A1-A12. |
| Pattern reference (Uber-measured) | Read `public/_pixel-refs/uber/{blue,feedback-blue,imagery}/UBER-*.md` | (read-only) | Measured Uber patterns underlying the LOCKFILE rules. |
| Per-wave gates | Read `_design-system/WORK_TYPES.md` | (read-only) | Lighthouse a11y ≥95, LCP ≤2.5s, contrast 0 failures. |

**Cross-axis (both):**

| When | Tool | Output | Notes |
|---|---|---|---|
| End of every wave | Compare BOTH SPEC.md + drift-report → screenshot | `_audits/screenshots/<wave>/` | Visual diff catches what neither axis-1 nor axis-2 check alone would catch. |
| Multi-model second opinion on ambiguous calls | `llm-council` skill | console | Per Ambiguity-Resolution Ladder Rung 4 in WAVE_PLAN F9. |
| Read-only investigation of consumer impact | `Agent` tool with `Explore` subagent type | Subagent return message | Use when "which routes import X" / "does Y exist anywhere" type questions arise. |

#### §10.8b — Drift signals (concrete tells you're conflating axes)

If ANY of these fires, STOP the edit. Re-anchor via §10.0 decision tree.

| Signal | What it means | Recovery |
|---|---|---|
| **Eyeballing a Fresha screenshot to "rebuild"** instead of firing `fresha-section-capture` | You're guessing structure from a pixel image. Will miss interactive states, computed CSS, copy density. | STOP. Fire the skill. Wait for SPEC.md. Then proceed. |
| **Inventing a new design token** not in LOCKFILE §1-§11 | You've made an aesthetic decision unilaterally. Will cascade into drift across consumers. | STOP. Either find the existing token that fits OR raise as design-system addition (mockup + recommendation in summary). Never invent inline. |
| **Picking a layout pattern based on "what feels right"** instead of "what does Fresha do here?" | You've made a structure decision unilaterally. Will diverge from Fresha-clone mission. | STOP. Check Fresha SPEC.md. If missing, fire capture. If present, follow it. |
| **Building variants for a visual decision** without first checking Fresha or LOCKFILE | You're framing as a user-choice when the source-of-truth already answers it. | STOP. Read SPEC.md (structure) or LOCKFILE (aesthetic) first. Only build variants if BOTH sources are silent OR conflict requires user pick. |
| **Asking user for a design choice** that Fresha already answered | You're shifting cognitive cost to user instead of doing the homework. | STOP. Fire capture / read LOCKFILE. Surface to user only if both sources are silent. |
| **Applying a LOCKFILE §11 pattern as if it were structural** | You're using AESTHETIC rules to make a STRUCTURE decision. T4 of overnight run made this exact mistake. | STOP. Re-read §10.0 decision tree. Identify the right axis. Hit the right source. |
| **Skipping the drift-check after a sweep** because "it's just a small fix" | Surgical fixes still need axis-2 verification. The "just small" frame is how drift sneaks in. | STOP. Run drift-check. Confirm 0 hard breakages on touched files. |
| **Marking a route done without screenshot diff** | You're claiming completion without visual evidence. Both axes need visual verification. | STOP. Screenshot before-AND-after. Eyeball diff. Only then mark done. |

#### §10.8c — Self-auto-verification triggers (when to run each check)

| Trigger | Action | Skill / tool |
|---|---|---|
| **Before every non-trivial edit** | 60-second pre-edit check (§10.8d below) | Mental script |
| **After every route sweep** | (a) drift-check on touched files (b) confirm Fresha SPEC.md exists & is current | `/solen-drift-check` + ls check |
| **After every component sweep** | (a) drift-check (b) screenshot each consumer route | `/solen-drift-check` + Playwright |
| **After every ground-up rebuild** | (a) Fresha SPEC.md re-read (b) drift-check = 0 hard (c) screenshot mobile + desktop (d) verifier subagent PASS | Multi-tool |
| **Every 60 min in autonomous runs** | Re-anchor by re-reading LOCKFILE §10 + the active wave's task description | Read |
| **When pivoting a mockup variant** | Stop. Ask: "am I pivoting on axis (data tells me to) or eyeballing (taste tells me to)?" If eyeballing → re-anchor before pivoting | Mental script |
| **When a sweep > 30 min** | Re-anchor mid-sweep: re-read the relevant §X.Y rule for the pattern being swept | Read |
| **When console errors appear** | (a) Read the error (b) trace to last edit (c) if root cause unclear after 15 min, fire `llm-council` | Bash + Playwright + (optional) llm-council |
| **When tempted to invent a token / pattern** | STOP. Check if existing fits. If not, file as design-system recommendation in summary doc | Read LOCKFILE first |

#### §10.8d — The 60-second pre-edit check (mental script)

Before any edit that's NOT a 1-3 line surgical fix, run this script in order. Write the answers in the summary doc (or mentally for trivial cases). Skipping this = the failure mode that bit T4.

```
Q1: WHAT AXIS is this change on?
   - STRUCTURE (IA / layout / section / affordance / "what or where")
   - AESTHETIC (color / type / contrast / accent / radius / "how it looks")
   - BOTH (most non-trivial edits)

Q2: WHERE'S THE SOURCE OF TRUTH?
   - For STRUCTURE: Fresha SPEC.md at public/_pixel-refs/fresha/<section>/
     → if SPEC.md missing or stale, FIRE `fresha-section-capture` first
   - For AESTHETIC: LOCKFILE §1.5/§2.5/§11/§6
     → cite the section number explicitly

Q3: HAVE I READ THE SOURCE IN THE LAST HOUR?
   - If no → re-read NOW before editing
   - If yes → cite the rule/spec line in the V3-D{n} comment

Q4: DOES MY PROPOSED EDIT MATCH IT?
   - If yes → proceed
   - If no → either revise to match OR surface as conflict per §10.5

Q5: WHAT'S THE POST-EDIT VERIFICATION?
   - Drift-check on touched files (always)
   - Screenshot diff if visual change
   - Fresha-diff if structural change
   - Lighthouse a11y if a11y could regress

If Q1-Q5 takes >2 min, the work is bigger than you scoped. Reclassify per WORK_TYPES.md.
```

#### §10.8e — Cache invalidation: when is a Fresha SPEC.md stale?

Default TTL: **30 days** (Fresha doesn't redesign frequently; 30 days is the safety window before assumed-stale).

INVALIDATE EARLY (re-capture immediately) if ANY of:

1. User flags "Fresha changed" or "doesn't look like Fresha anymore"
2. A visual diff comparing current fresha.com against the SPEC.md screenshot shows ≥10% pixel difference
3. The section being rebuilt has no SPEC.md yet (initial capture)
4. The component being rebuilt has structural questions the existing SPEC.md doesn't answer (e.g. SPEC.md captured the hero but not the sticky tab; rebuild needs sticky tab → re-capture extended scope)
5. Fresha announces a public redesign (rare; check Fresha changelog / blog before assuming)

**LOCKFILE never goes stale** — it's the project's truth. Updates to LOCKFILE are intentional + dated with V3-D{n} markers.

#### §10.8f — Concrete drift-or-not test (for the moment of ambiguity)

When you're about to make a decision and unsure if it's structure or aesthetic:

**Ask: "If I open Fresha right now and look at the same section, would my proposed change MATCH what I see or DIVERGE?"**

- If MATCH → you're on axis 2 (aesthetic refinement of a structurally-correct surface). Proceed.
- If DIVERGE → you're on axis 1 (structural change). STOP. Either don't change OR fire capture to verify your divergence is intentional.
- If "I don't know what Fresha does here" → that's the answer. Fire `fresha-section-capture` BEFORE editing.

This single test catches 80% of axis-confusion mistakes.

---

## §11 — Imagery Pattern Registry (V3-D330, 2026-05-28)

**Rule:** All imagery on Solen surfaces uses one of 5 enumerated patterns + obeys 5 non-negotiable rules. Inspired by measured Uber inventory (`public/_pixel-refs/uber/imagery/UBER-IMAGERY-PATTERN.md` — 116 desktop images across 8 surfaces). Sourced finding: Uber is illustration-first (34%), photo-as-trust-layer (28%), chrome (38%). Zero video. 0px border-radius on every image.

### The 5 patterns

| # | Pattern | Layout | Solen surfaces |
|---|---|---|---|
| 1 | **Split-hero** | Text+CTA LEFT, 1:1 or 3:2 visual RIGHT. No overlay. | Homepage (add salon photo RIGHT of search), `/fuer-salons` hero, `/warum-solen` hero |
| 2 | **Full-bleed editorial photo** | 1440×700 art-directed photo, text in natural empty negative space. No rgba scrim. | Category landings (`/coiffeur` / `/barbershop` / `/nails` / `/spa` / `/makeup` / `/waxing`) — ~6 photos |
| 3 | **Search-card over full-bleed photo** | Solid white card on top of lifestyle photo. Card is opaque (not glass). | Salon PDP `/salon/[slug]` — promote salon's cover photo to full-bleed, float booking card |
| 4 | **Alternating image-text rows** | One ~558×372 image + adjacent text+CTA, alternating sides. | `/fuer-salons` features (upper funnel), `/business` alt layout |
| 5 | **Magazine grid** | 3-col 16:9 thumbnails + one feature card 2× others. 1-col vertical on mobile (same count). | `/entdecken` mode-2 (toggle: stream-feed / magazine-grid) |

### Non-negotiable rules (drift rule A10 enforces)

| Rule | Why |
|---|---|
| **`border-radius: 0` on all images** | Uber doesn't round photos. Rounding implies avatar/icon. Sole exception: avatar circles in `Avatar` primitive. |
| **No `rgba(0,0,0,*)` overlay scrims** | Art-direct the photo so text falls on naturally-empty zone. Saves a layer + reads cleaner. |
| **No `<video>` on marketing surfaces** | Uber's 8 surfaces use zero. Stills + Lottie illustrations only. (Carve-out: `/entdecken` TikTok-stream feature exempt — that's content, not chrome.) |
| **Single image-CDN pipeline** | All images route through `next/image` + Supabase Storage. Mirror Uber's `cn-geo1.uber.com/image-proc` pattern. |
| **Same images mobile + desktop, stacked** | Don't hide images on mobile. Crop/resize the same asset. Hero photos resize from 1440×700 desktop → 375×480 mobile (same image, different crop). |

### Sourcing policy (V3-D330)

User locked path: **AI placeholders during sweep, swap real photos lazily.** Pattern 2 (full-bleed) + Pattern 5 (magazine grid) both depend on photography. During phase 2 sweep, use AI-generated salon-scene placeholders. Real Swiss salon shoot scheduled lazily (out of scope for this sweep). When real photos arrive, swap by uploading to Supabase Storage + replacing the `src` — no code change.

### Migration mapping (phase 2 sweep)

| Surface | Current state | Pattern to apply | Photo source |
|---|---|---|---|
| Homepage hero | Search card alone on grey | Pattern 1 split-hero | AI placeholder 1:1 |
| `/fuer-salons` (new) | (being built) | Pattern 1 hero + Pattern 4 features | AI placeholders |
| `/warum-solen` | Text-only hero | Pattern 1 split-hero | AI placeholder 3:2 |
| `/coiffeur` etc (6 categories) | Plain grey hero | Pattern 2 full-bleed editorial | AI placeholders × 6 |
| `/salon/[slug]` | Static grey hero band | Pattern 3 search-card-over-photo | Salon's existing cover photo |
| `/entdecken` (mode 2) | TikTok stream only | Pattern 5 magazine grid (toggle) | Stylist work photos |

### Aspect ratios (canonical set, drift rule A11)

Per Uber measurement: `1:1` (split-hero squares), `3:2` (alternating rows + card thumbs), `16:9` (magazine grid + newsroom), `21:9` (full-bleed wide heroes). Allowed values: `aspect-square`, `aspect-[3/2]`, `aspect-video`, `aspect-[21/9]`, `aspect-[4/3]` (PDP cover photos only). Anything else = drift A11.
Example: Fresha closes "Closed" in burnt amber `#B7570B`. LOCKFILE has `s-urgency #9A3412` as urgency amber. → LOCKFILE wins (visually equivalent, our token is the source).

---

## §12 — Operator dashboard skin (VIBRANT — distinct from customer B&W) (V3-D347, 2026-05-29)

User flag 2026-05-29: dashboard "too monochrome … I want vibrancy, same saturation as the blue … if the pill is green I don't want black text inside … more rounded, modern." Reframe: **the customer-facing marketplace stays B&W (§1–§11); the OPERATOR dashboard (`/dashboard/*`) is a separate, vibrant skin.** Customers never see the dashboard, so its vibrancy doesn't touch the public brand.

### §12.1 — Structure source = Fresha B2B (Mobbin-captured)
Dashboard IA mirrors Fresha for Business (verified via Mobbin web screens, 2026-05-29): **icon rail** (Übersicht · Kalender · Katalog · Kund:innen · Marketing · Verkäufe · Team · Berichte · Einstellungen) + topbar (location switcher · setup · search · notifications · avatar). **Calendar = staff-as-columns** (day/week), blocks colored by **service type**, slide-in detail panel. **Verkäufe** consolidates sales/payments/gift-cards/memberships. Home = KPI overview (sales line chart · upcoming bar chart · activity · today · top services · top team). Multi-category support stays **conditional/hybrid** (a salon's `categories[]`), folded into Katalog/Team — NOT per-category nav soup. **No makeup** (dropped from `SalonCategory`).

### §12.2 — Vibrant palette (full saturation, consistent with accent blue)
| Role | Token | Notes |
|---|---|---|
| Primary CTA + active nav | `s-accent.bright` `#276EF1` | The vibrant blue. Hover → `s-accent` `#185CE0`. (Dashboard ONLY — customer site keeps ink CTAs per §0.2.) |
| Status pill text | **saturated semantic** (`text-s-success`/`s-error`/`s-warning.text`/`s-ink-2`) | NEVER ink/black text on a colored pill. Resolves the §1 "pastel+ink" vs §2.5 "semantic text" conflict in favor of **§2.5 semantic text** for dashboard. |
| `s-warning.text` | `#B45309` | Readable darker amber for warning text on `s-warning.bg` (amber DEFAULT fails contrast as text). |
| Charts (data-vis) | accent-blue + universal semantics | Line/bar charts use `#276EF1` / `#16A34A` / `#D32F2F` — NOT chart-grey. (Chart-grey §1 Layer-4 is for the *customer* competitor-chart only.) |
| Calendar service colors | service palette (W3, to be locked) | blue cut / pink color / orange beard / violet nails / green spa — vibrant, store-defined service types, tinted block bg + colored border. |

### §12.3 — Radii (rounder/modern)
Dashboard cards/panels = `rounded-card-lg` (20px). Calendar blocks = 12px. Pills/buttons = `rounded-btn`/`rounded-full`. Softer than the customer-site 16px.

### §12.4 — Drift-checker scope
Files under `app/[locale]/dashboard/**` and `app/[locale]/_components/dashboard/**` are **exempt from A9** (accent-restriction) and may use `s-accent-bright` as primary + the vibrant semantics/service palette. They are NOT exempt from A4 (retired easings), A5 (RETIRED tokens like s-coral/s-amber/makeup), A6 (emoji). Primitives: `DashButton` (primary=`s-accent-bright`), `DashStatusPill` (semantic colored text). See `_components/dashboard/DashboardUI.tsx` + `_design-system/components/DashboardUI.md`.
