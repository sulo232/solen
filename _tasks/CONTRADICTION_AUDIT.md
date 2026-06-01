# Design-System Contradiction Audit (2026-06-01)

**Method:** 4 read-only agents cross-checked all three layers: design-system docs vs each other, docs vs token code (`tailwind.config.js` / `globals.css`), docs/registry vs component `.tsx`, and the `public/*.html` mockups vs shipped canon.

**Goal:** you adjudicate the canonical value per row, then a Magic-builder + subagent sweep fixes the codebase to match. **Mark the `DECIDE` column** (✔ = take my recommendation, or write your call).

---

## ✅ DECISIONS LOG (2026-06-01, user review)

**Accepted (take recommendation):** Decision 0 (precedence: LOCKFILE + code = truth, ratified by implication), A1, A2, A3, A5, A6, A7 (tracking → 0.08em), B2, B3, B5, B6, B8, B9, C1, C2, C3 + R2 (ratify ink-default + dashboard-accent + /business white-on-photo exceptions), D1, D2-D5 (SalonHeader registry → code), D6 (badge bottom-center), D7, D8, D9, E1, E2, E3, E4, F3, R1 + B7 (closed = red `#DC2626`).

**RESOLVED (2026-06-01, round 2), now locked in `_design-system/CANON.md`:** B1 = `s-accent #276EF1` (Uber's real blue; `#185CE0` retired). R5 = `s-warning #F1AE27` (the accent's amber twin, same HSL S+L, hue 40°). F4-F6 = corner check badge, applied to ALL staff pickers. R4 = archive stale mockups. AGENT_BRIEF already synced. Fix-sweep ready. (Original open questions kept below for history.)
- **B1** (accent-blue DEFAULT): user leans `#185CE0` but wants confirmation it matches Uber's real blue. → verify Uber blue, then confirm/adjust.
- **R5** (amber/warning): user does NOT want Uber's amber. → identify Uber's amber to avoid; propose a non-Uber warning amber.
- **F4-F6** (walk-in barber selected-state): user unsure; wants more options. → build option set.
- **R4** (archive ~11 stale Hanken-era mockups): not yet addressed → confirm.

---

## HOW TO USE THIS (fast path)

~43 contradictions, but they collapse:
- **Decision 0** (precedence) auto-resolves ~30 "stale doc vs LOCKFILE/code" rows in one ruling.
- **5 real taste-decisions** genuinely need you (§Real decisions).
- The rest are mechanical doc-sync or code-fix, listed for completeness.

**The dominant pattern:** for every dated conflict, the truth = **LOCKFILE + actual code/config**; the stale side is always **SOURCE.md §2.1/§3 + CLAUDE.md:47 + AGENT_BRIEF_TEMPLATE.md**.

---

## ⚠️ FIX BEFORE ANY SUBAGENT / MAGIC-BUILDER SWEEP

`_design-system/AGENT_BRIEF_TEMPLATE.md` is the brief subagents copy verbatim, and it is wholesale stale on the aesthetic axis: body **Hanken Grotesk 300** + "NEVER 400" (lines 98, 152), **accent `#276EF1` on eyebrows + bullets "Don't flag"** (line 155), accent `#276EF1` (29, 91, 154). All four are reversed by LOCKFILE. If the sweep runs first, every rebuilt component re-introduces the retired rules. **This file is fix #1.**

---

## DECISION 0 — Precedence (resolves the bulk)

| The conflict | Recommendation | DECIDE |
|---|---|---|
| `SOURCE.md:31` "among docs, SOURCE wins" vs `LOCKFILE.md:3` "LOCKFILE wins" vs `CLAUDE.md:35` "LOCKFILE = single source of truth". Three docs each claim authority. | **Ratify: LOCKFILE = literal-values authority; actual code/config = ground truth; SOURCE.md = prose/rationale only (demote its "SOURCE wins" clause).** Then all "stale-doc vs LOCKFILE/code" rows below resolve to the LOCKFILE/code side automatically. | ☐ |

---

## REAL DECISIONS (taste calls only you can make)

| # | Decision | Current reality | Options | My lean | DECIDE |
|---|---|---|---|---|---|
| R1 | **Closed-status color** | Code SHIPS **red** `s-closed #DC2626` (StatusPill.tsx:54, StatusInline.tsx:39, per a 2026-05-30 user call). Docs variously say grey `s-ink-2`, **amber**, and red. | red / amber / muted-grey | **Red** (matches shipped + the universal error/closed convention). Then fix StatusPill.md, StatusInline docstring, LOCKFILE:443/454, SOURCE:106/278 to red. | ☐ |
| R2 | **/business hero CTA** | White-on-photo button; `QUESTIONS.md Q34` flags it as an unratified V3-D192 (ink-CTA) violation. | ratify white-on-photo exception / change to ink | **Ratify the exception** (it's over a photo, white reads; document it in LOCKFILE §0.2 so the drift-checker stops flagging). | ☐ |
| R3 | **Eyebrow tracking** | LOCKFILE contradicts *itself*: §2 line 174 = `0.16em`, §2.5 line 236 = `0.08em` (the drift-A8 canonical). | 0.08em / 0.16em | **0.08em** (it's the enforced canonical set). Fix LOCKFILE §2:174 + SOURCE:338. | ☐ |
| R4 | **Stale mockups** (~11 Hanken-era) | walkin-join / on-salon / pay-variants / pay-b / ticket-mockup / ticket-styles / shape / hybrid / middleground / detail-styles / live-styles + shadow-warmth: all pre-V3-D410 (Hanken + emoji), superseded by shipped panel/pay. | delete / archive to a folder / leave | **Archive** them to `public/_archive-mockups/` (out of the served root) so they can't be mis-cited as spec. | ☐ |
| R5 | **`s-amber` zombie** | LOCKFILE:83 says "PERMANENTLY KILLED", but `tailwind.config.js:82` still aliases `s-amber #F59E0B` AND `globals.css:65` defines a THIRD amber `--color-warning #F3A864`. | remove alias + warning def / keep one as s-warning | **Collapse to `s-warning #F59E0B`**, delete the `s-amber` alias + the `#F3A864` warning def. | ☐ |

---

## A. Typography (stale docs vs LOCKFILE/code — resolved by Decision 0)

| # | Subject | Stale says | Truth (LOCKFILE/code) | Conf |
|---|---|---|---|---|
| A1 | Body font | Hanken Grotesk (SOURCE §3, CLAUDE.md:47, AGENT_BRIEF ×3, CardText/FAQItem/Step/BentoCard .md, ~5 .tsx docstrings) | **Inter** (LOCKFILE §2, tailwind.config.js:221, globals.css:118) — V3-D410 | H |
| A2 | Body weight | 300 / "NEVER 400" (SOURCE:330-332, AGENT_BRIEF:98) | **400** (LOCKFILE:190; Inter loaded 400-700) | H |
| A3 | Display font | Bricolage Grotesque (SOURCE §20/21, LoadingStates.md, SalonCard.md) | **Inter Tight** (LOCKFILE; Bricolage retired V3-D190) | H |
| A4 | "Active" font = Geist | DashboardUI.md:23, SalonResultCard.md:61, Hero.tsx:189 + WhySolen.tsx:116 docstrings | **No Geist** (rejected; Inter Tight + Inter + JetBrains) | H |
| A5 | Hero H1 weight | 800 (SOURCE:323); SalonHeader registry:49 = 800 | **700** (LOCKFILE; 800 explicitly banned §2:195) | H |
| A6 | Section H2 | 700 / 23px / -0.03em (SOURCE:325) | **600 / 20px / -0.01em** (LOCKFILE) | H |
| A7 | Eyebrow font/size | 13px Hanken 0.18em (SectionTitle.md:50) | **11-12px Inter** (LOCKFILE) | H |

## B. Color tokens (mostly SOURCE §2.1 stale vs config/LOCKFILE)

| # | Token | Stale says | Truth (config/LOCKFILE) | Conf |
|---|---|---|---|---|
| B1 | `s-accent.DEFAULT` | `#1638C4` (SOURCE:163); `#276EF1` (CLAUDE.md:47, AGENT_BRIEF) | **`#185CE0`** (tailwind.config.js:210, LOCKFILE:51); `#276EF1` = `.bright` only | H |
| B2 | `s-accent.deep` | `#0F2A99` (SOURCE:164) | **`#185CE0`** (config, collapsed V3-D329) | H |
| B3 | `s-accent.pale` | `#EBEFFA` (SOURCE:165) | **`#EAEFFE`** (config, LOCKFILE) | H |
| B4 | `s-accent` retired? | SOURCE §2.2:246 lists "s-accent #FFC32B family retired V3-D189" | **Live royal blue** (SOURCE §2.1 + LOCKFILE) — strike the stale amber-retirement note | H |
| B5 | Heart fill | `s-love #CC4A60` (SOURCE:215) | **`--heart-active #FF3366`** (SOURCE:226, LOCKFILE:65, code) | H |
| B6 | `s-love` family | live (SOURCE:215-217) | **retired** (LOCKFILE:86) → use `--heart-active` / `s-error` | H |
| B7 | `s-closed` vs `s-error` for closed | SOURCE §1:106 folds closed into `s-error #D32F2F` | **`s-closed #DC2626`** distinct (SOURCE:224, LOCKFILE:67, code) — see R1 | M |
| B8 | `s-border` | "warm `#EFE7DD`" (globals.css:106-108,419 comments/fallback) | **`#E7E5E4`** (tailwind.config.js:134, globals.css:61) | M |
| B9 | `--heart-active` as a token | docs call it a CSS token (LOCKFILE:65, SOURCE:226) | hex matches but **no CSS var exists**; used inline `#FF3366` (HeartButton.tsx:111). Add the var, or stop calling it a token. | M |

## C. Accent / decoration rules

| # | Subject | "Yes" side | "No" side (LOCKFILE §1.5) | Truth | Conf |
|---|---|---|---|---|---|
| C1 | Accent on eyebrows/links/dots/step-circles | SOURCE §1, AGENT_BRIEF:155 ("don't flag"), SectionTitle.md, Step.md (blue numeral) | LOCKFILE §1.5/A9: accent = focus-ring + Spinner + input only, **never** decoration | **LOCKFILE** (accent is functional-only) | H |
| C2 | Eyebrow leading dot/bullet | SOURCE:74/163/169, REGISTRY:78, SectionTitle.md (● `::before`) | LOCKFILE A12 + WORK_TYPES:84: plain text, **no dot** (already swept) | **No dot** | H |
| C3 | Primary CTA = ink "always" | LOCKFILE §0.2 "accent NEVER on primary" reads absolute | LOCKFILE §12: dashboard DashButton primary = accent `#276EF1` | Both true; §0.2 must **name the dashboard exception** (wording gap) | M |

## D. Component code vs registry / per-component docs (code is truth)

| # | Component | Doc/registry claims | Code actually does | Conf |
|---|---|---|---|---|
| D1 | SalonHeader H1 | "Inter Tight 800, 28-44px" (REGISTRY:49) | `clamp(22,2.8vw,26) font-semibold` (600) | H |
| D2 | SalonHeader eyebrow | "royal-blue category eyebrow" (REGISTRY:49, V3-D206) | none rendered (removed) | H |
| D3 | SalonHeader status | "StatusPill" (REGISTRY:49) | renders `StatusInline` (V3-D232) | H |
| D4 | SalonHeader pills | "+ Featured + Last-Minute pills" (REGISTRY:49) | none (moved elsewhere) | M |
| D5 | SalonTeam avatar | "88px mobile / 112px desktop" (REGISTRY:53) | avatar fixed 88px (112 = card width) | M |
| D6 | SalonTeam rating badge | "bottom-left" (REGISTRY:53) | bottom-center (SalonTeam.tsx:123) | H |
| D7 | TabPill active | "ink fill + white text + elevation-1" (TabPill.md:43) | soft-grey fill, flat, no shadow (V3-D420) | H |
| D8 | HeartButton size | "32px glass, icon 18" (HeartButton.md, REGISTRY:45) | 28px glass (h-7), icon 16 (V3-D354) | H |
| D9 | FROST_GLASS extraction | "done; SaveHeart/overlays stop re-deriving" (frost-glass.ts, REGISTRY:31) | HeartButton.tsx:85-94 still re-derives inline | M |
| D10 | Step numeral | REGISTRY: blue `text-s-accent/30`; docstring "Inter Tight 800" | code `font-semibold` 600; + LOCKFILE §1.5 bans accent on step circles | M |

## E. Off-system hardcoded values in components (tokens win)

| # | Where | Hardcoded | Should be | Conf |
|---|---|---|---|---|
| E1 | SalonCard monogram (homepage) :42-45 | retired V2 `#142F4A`/`#E58840`/`#E9DFC8`/`#F0C25A` | B&W `avatarColor()` / s-bg-sunken + s-ink | H |
| E2 | SalonCard availability chips :120-215 | `#15803D`/`#D1F0DC`/`#FAD2DA` | `s-success.bg` / `s-love.soft` | M |
| E3 | MobileCategoriesRow:91 | `bg-[#F3F3F3]` / hover `#EFEFEF` | `bg-s-bg-sunken` (#F5F5F4) | M |
| E4 | `components-legacy/**` (30+ files) | retired `#1B4D1B` (old green, now invisible) + `#F3A864` (amber): SalonCard, SalonBadge, LastMinuteCard, CardFilterRow, FeaturedSalonCarousel, BrowseByCity, HeroStampCard, dashboard charts | B&W + universal tokens. Large legacy cluster; some mislabeled "Coral". | M |
| — | Star `#FFC32B` / heart `#FF3366` inline literals (~8 files) | NOT a contradiction (= token value; Lucide `fill` needs a literal). Accepted pattern. | — | — |

## F. Mockups vs canon (mostly stale/superseded — see R4)

| # | Mockup | Contradiction | Resolution | Conf |
|---|---|---|---|---|
| F1 | solen-control-elevation.html | footer calls warm shadow "open question / future cool-grey re-tint" | warm KEPT — strike the caveat (rest is canon) | H |
| F2 | solen-control-elevation.html + add-stepper | depict `QuantityStepper` as shippable | doesn't exist; spec-only (CONTROL_ELEVATION.md:91) | H |
| F3 | solen-add-stepper-mockups.html | recommends borderless soft-grey "+" | banned (contrast trap); icon controls = bordered-white | H |
| F4 | solen-walkin-panel-redesign.html | "ink ring = locked selected" + white+shadow (i) | shipped = photo-overlay+check + flat bare (i) | H |
| F5 | solen-walkin-picker-options.html | recommends ink-badge + "remove green dots" | shipped = photo-overlay + green dots | H |
| F6 | solen-walkin-mockups-round2.html | "blue overlay" for selected | shipped = ink overlay (blue would break §1.5) | H |
| F7 | shadow-warmth + ~11 Hanken-era walk-in mockups | Hanken font + emoji + reversed decisions | archive (R4) | H |
| — | walkin-icon-preview, salon-walkin-toggle(+v2) | NOT contradictions (PersonSimpleWalk + correct fonts/hex/bordered-+ all shipped) | keep | — |

---

## ONCE DECIDED → output for 21st.dev Magic builder

After you mark the DECIDE columns, I'll emit a clean **`CANON.md`** (resolved token table + type scale + the accent/elevation/closed rules, single value each) to paste as design-context when the Magic builder regenerates/refines components, plus a **fix-list** partitioned into: (1) doc-sync edits, (2) code token-swaps, (3) components worth regenerating via Magic. Fix order: AGENT_BRIEF first, then docs, then code.
