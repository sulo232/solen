# Solen CANON (resolved 2026-06-01)

**What this is.** The single-value source of truth, resolved from the contradiction audit (`_tasks/CONTRADICTION_AUDIT.md`) by user adjudication. One value per token / type / rule, no alternatives. **This is the design-context to paste into the 21st.dev Magic builder when regenerating components, and the target for the fix-sweep.** Where a doc disagrees with this, this wins (precedence: CANON + actual code > LOCKFILE > SOURCE-as-prose).

---

## 0. Design Language — LOCKED 2026-06-10 (RESTRAINT) — READ FIRST

The current, owner-locked design language. **Supersedes the v2 "blue = interactivity, generous" reconciliation** — the owner saw generous blue live and rejected it ("too much blue"); the locked references are **Apple / Airbnb / Fresha** restraint. History trail: `V2_RECONCILIATION.md`. THIS section is current truth.

**One-line model: clickability is signalled by AFFORDANCE (chevron, underline, weight, icon), NOT by colour. Colour is rare and earns its place.**

1. **SURFACES = white-first + COOL grey.** Default white `#FFFFFF`; subtle fill = cool grey `s-bg-sunken #F4F4F5`; hairline cool `s-border #E4E4E7`. NO cream / warm / peach / stone. Photography carries the warmth. No dark surfaces (except the queue-display kiosk page).
2. **BLUE = small clickable accents ONLY (`s-accent #276EF1`), SPARSE.** Allowed on: text links ("Buchung verwalten", "Mehr lesen"), small buttons / chips, small tappable secondary metadata (review counts like "(54)"), + the system states (focus-visible ring, Spinner, input focus). NEVER generous, never a wall of blue.
3. **INK / BLACK = structure.** See-all arrows (→), the primary + any big CTA (ink fill `bg-s-ink`), secondary actions (neutral outlined pill `bg-white border-s-border text-s-ink`, NOT blue), body, headings, eyebrows. They read tappable via AFFORDANCE (chevron / underline-on-hover / weight / icon), not colour. **NEVER a blue-filled button; NEVER a blue button.**
4. **GREEN = semantic, normal `s-success #16A34A`.** Availability ("Sofort frei") + success (booking confirmed / paid) + the "Bezahlt" chip + white check. **NOT deep `#15803D`** — the dark-green disc was rejected 2026-06-10; the success disc is normal `#16A34A`.
5. **Other semantic colours UNCHANGED:** star yellow `#FFC32B`, error red `#D32F2F` (closed-status `#DC2626`), warning amber `#F1AE27`, save-heart pink `#FF3366`.
6. **MOTION = tasteful** (press-scale .97, hover-lift, success mark, staggered entrance). Respect `prefers-reduced-motion`.

> **Where the v2 / "generous blue" content elsewhere in this doc or in LOCKFILE / SOURCE / memory says "blue generous / blue on everything tappable / blue-ghost secondary buttons / deep-green success #15803D" — it is SUPERSEDED by this section.** Blue is sparse (small clickable bits only); buttons are ink or neutral-outline; success is normal green.

> **Drift A9 (restraint):** flag blue on anything that is NOT a small clickable bit — a blue-FILLED button, a big blue CTA, a blue arrow, blue body/headings/eyebrows. ALLOW blue on text links / small chips / review counts + system focus.

---

## 1. Color tokens

| Token | Value | Notes |
|---|---|---|
| `s-ink` | `#0A0A0A` | primary text / ink fills / primary CTA |
| `s-ink-2` | `#6B6B6B` | secondary text |
| `s-ink-3` | `#6B6B6B` | tertiary / eyebrows (collapsed onto ink-2 per V3-D138; same hex). Disabled glyph = `s-ink.disabled` `#C5C8C4`. |
| `s-border` | `#E4E4E7` | hairlines — COOL neutral (v2; reverses the V3-D460 warm #E8E4DF). Live Tailwind token must be synced. |
| `s-bg-sunken` | `#F4F4F5` | calm surfaces / flat controls — COOL light grey, NOT warm cream/stone (v2 rule 4; reverses the V3-D460 warm #F8F5F2). Default surface stays white #FFFFFF. |
| **`s-accent`** | **`#276EF1`** | **Uber blue.** Single value (the old `#185CE0` default + `#276EF1` bright split is collapsed). |
| `s-accent.pale` | `#EAEFFE` | accent tint |
| **`s-warning`** | **`#F1AE27`** | **the amber twin.** Derived from the accent: same HSL S+L (88% / 55%), hue rotated to 40°. `.bg #FDF6E7`, `.text #906309`. |
| `s-success` | `#16A34A` | available / open status (inline chips/pills keep pastel `.bg`) |
| ~~`s-success.deep`~~ | ~~`#15803D`~~ | **REVERTED 2026-06-10 (V3-D470).** The deep-green focal disc was rejected — owner wants normal green. The FOCAL success disc now uses `s-success #16A34A` (same as inline), confident via size + solid fill + white check + spring-pop. Don't use deep #15803D for success. |
| **`s-closed`** | **`#DC2626`** | closed status = RED (user call 2026-05-30). Distinct from `s-error #D32F2F`. |
| `s-error` | `#D32F2F` | form / payment errors |
| `s-star` | `#FFC32B` | rating stars (inline literal OK, Lucide needs it) |
| `--heart-active` | `#FF3366` | saved heart fill |
| `s-urgency` | `#9A3412` on `#FFF1E6` | scarcity / "last minute" |

**Retired (never use):** `#185CE0` (folded into accent), `s-amber` + `#F3A864` (folded into `s-warning #F1AE27`), `s-love #CC4A60` (use `--heart-active`), warm border `#EFE7DD`, V2 monogram hues (`#142F4A`/`#E58840`/`#E9DFC8`/`#F0C25A`), legacy `#1B4D1B` green + `#F3A864` amber across `components-legacy/**`.

## 2. Accent rule — BLUE = INTERACTIVITY (Design Language v2, 2026-06-09)

**BLUE = INTERACTIVITY (Design Language v2, owner-approved 2026-06-09 — supersedes the functional-only ban below).** `s-accent #276EF1` is used GENEROUSLY on anything tappable: text links, see-all / view-all links, active tab / segmented states, secondary & ghost buttons, tappable row affordances, inline action labels (Buchen / Wegbeschreibung / Verwalten), interactive icon tints (icon is the tap target) — plus the system states it always had (focus-visible rings, Spinner arc, form-input focus). There is NO pixel budget on interactive blue. **GUARDRAIL:** blue marks INTERACTION, never EMPHASIS — it stays OFF all non-interactive text (body, labels, prices, headings, eyebrows stay ink / grey). If it is not tappable, it is not blue. Eyebrows = plain `text-s-ink-3`, no leading bullet. The ONE primary commit CTA per screen stays `bg-s-ink`; every other action leans blue (blue-ghost outline OR plain blue link). Never a blue-filled primary. (`info` semantic surfaces may use accent blue.)

## 3. Typography

- **Display = Inter Tight.** Hero H1 = **700**. All other headings (section H2, page H2) = **600**. Tracking **-0.02em**. NEVER 800. NEVER Bricolage / Geist.
- **Body = Inter.** Default weight **400** (body + meta). 500 = card names + sub. 600 = semibold. NEVER Hanken, NEVER 300-as-default.
- **Code = Inter Tight tabular** (confirmation codes, ticket numbers like `W-047`, voucher/gift codes). `font-variant-numeric: tabular-nums`, weight 600-700, `-0.01em`. **NOT JetBrains Mono** — retired 2026-06-10 (V3-D470, owner: "the W-047 font is different"); a mono face clashed with the all-Inter-Tight UI. See LOCKFILE §13.4.
- **Eyebrow:** Inter, 600, 11-12px, uppercase, tracking **0.08em**, `text-s-ink-3`, no dot.

## 4. Closed status = red

`StatusPill` + `StatusInline` closed state = `s-closed #DC2626` (red dot + red/maroon text on pale-red bg). Not amber, not grey. Update StatusPill.md + StatusInline docstring + LOCKFILE:443/454 + SOURCE to match.

## 5. Control elevation (V3-D420, unchanged)

A = frosted white glass (`FROST_GLASS`, `lib/frost-glass.ts`) ONLY over a photo. B = flat on calm surfaces (text → `s-bg-sunken` no shadow; icon → `bg-white border-s-border` no shadow). C = ink fill for the one primary. White+shadow on a calm control = banned.

## 6. Staff / barber selected-state (NEW, applies EVERYWHERE)

When a staff member / barber is selected in ANY picker (walk-in panel, booking `StaffPicker`, `StaffListSheet`, anywhere): **corner check badge** = avatar stays full + visible, with a small **ink circle (`bg-s-ink`) + white check**, 22-24px, bottom-right, 2px white border. **Do NOT use** a photo-overlay (hides the face), an ink ring alone, or an accent overlay (an accent wash would read as a generic selection tint and hide the face; the ink corner-check is the locked selected-state language across all pickers). Face-visible is the rule, because you are choosing a person. One shared treatment across all staff pickers (universal-components rule).

## 7. Shadows = warm, kept

Shadow tokens stay warm-tinted `rgba(50,47,44, …)` (elevation-1/2/3 + pressed). Intentional (beauty-domain softening), decided 2026-06-01. `FROST_GLASS` keeps its pure-black over-photo shadow (imperceptible over images, so no conflict).

---

## 8. Open housekeeping
- **R4:** archive the ~11 stale Hanken-era mockups to `public/_archive-mockups/` (out of the served root).
- Amber `#F1AE27` is tuned to the accent's lightness (55%); if it reads too golden for a warning, the deeper sibling is `#E09A0C` (same hue + sat, L ~46%).
