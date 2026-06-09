# Solen CANON (resolved 2026-06-01)

**What this is.** The single-value source of truth, resolved from the contradiction audit (`_tasks/CONTRADICTION_AUDIT.md`) by user adjudication. One value per token / type / rule, no alternatives. **This is the design-context to paste into the 21st.dev Magic builder when regenerating components, and the target for the fix-sweep.** Where a doc disagrees with this, this wins (precedence: CANON + actual code > LOCKFILE > SOURCE-as-prose).

---

## 0. Design Language v2 (owner-approved 2026-06-09) — READ FIRST

The current design language. **Supersedes the prior "functional-only blue-ban" everywhere it conflicts.** Source: approved mockup `public/_mockups/design-language-v2.html` + owner verbatim criticism. Full audit trail: `V2_RECONCILIATION.md`.

1. **BLUE = INTERACTIVITY.** `s-accent #276EF1` is used GENEROUSLY on anything tappable: text links, see-all / view-all links, active tab / segmented states, secondary & ghost buttons, tappable row affordances, inline action labels (Buchen / Wegbeschreibung / Verwalten / Manage), interactive icon tints (where the icon IS the tap target), plus the system states it always had (focus-visible rings, Spinner arc, form-input focus). There is **NO pixel budget** on interactive blue.
2. **BLUE STAYS OFF NON-INTERACTIVE TEXT** (the guardrail against "vibrating blue text"). Body copy, labels, prices, headings, eyebrows, and decorative elements stay ink / grey. Blue marks INTERACTION, never EMPHASIS — if it is not tappable, it is not blue. Eyebrows remain `text-s-ink-3`, no leading dot. A blue word must be a real link; use bold weight or ink contrast for emphasis.
3. **ONE INK COMMIT BUTTON PER SCREEN** (unchanged, V3-D192-fix). The single primary commit CTA stays `s-ink #0A0A0A` fill / white text — the one strong anchor. Never two ink primaries; never a blue-FILLED primary. Every other action leans blue: the blue-ghost recipe (`bg-white border-s-accent text-s-accent`) OR a plain blue link. (Scoped exception, V3-D426: on outcome / result / status screens the primary CTA inherits the screen's semantic state colour.)
4. **WHITE-FIRST SURFACES; WARM CREAM DROPPED.** Default surface = white `#FFFFFF`. Where a subtle fill is needed use a COOL light grey `#F4F4F5` (`s-bg-sunken`), NOT warm cream / peach / stone. Reverses the V3-D460 warming of `s-bg-sunken` (#F8F5F2) and `s-border` (#E8E4DF) toward cool neutral (`s-border #E4E4E7`). *(Live Tailwind token sync is step 1 of v2 implementation.)*
5. **NO DARK SURFACES ANYWHERE.** The dark walk-in / queue panel and any dark surface are dropped. Every customer surface is light. (Sole survivor: the queue-display kiosk / TV page, a deliberate full-screen kiosk pattern.)
6. **SUCCESS = DEEP SOLID GREEN + WHITE ICON.** The success / confirmation FOCAL moment (booking confirmed, payment succeeded) is a deep solid green `s-success.deep #15803D` disc / fill with a WHITE checkmark — confident, not a pale-green tint. Overrides the refined-pastel treatment FOR THE FOCAL MOMENT ONLY. Inline status chips / badges (open/closed pills, availability pills, low-emphasis toasts) MAY still use the pastel pattern — that is the explicit boundary. Other semantic colours UNCHANGED: star yellow `#FFC32B`, error red `#D32F2F` (`s-error`; closed-status red is `#DC2626` / `s-closed`), warning amber `#F1AE27`, save-heart pink `#FF3366`.
7. **MOTION EVERYWHERE.** More animation is explicitly wanted: staggered rise-in on load (opacity 0→1 + ~10px rise, ~0.55s, staggered delays), success ring-pulse + disc spring-pop + check stroke-draw (SuccessMark), card hover-lift, blue-link hover-underline, button press-scale(.97). Prior "motion restraint / motion-is-DONE" guidance is loosened toward richer tasteful motion. Restraint now applies to STATIC depth (shadow weight) only. Always respect `prefers-reduced-motion`.

> **Icon-tint boundary (drift A9).** An icon is blue ONLY when the icon itself is the tap target (icon-only button / standalone tappable glyph). A decorative icon inside a tappable row/card stays ink — the ROW is the tap target. Drift A9 is re-scoped to flag blue only on non-interactive text + blue-filled primary; A14 allows the blue-ghost recipe.

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
| `s-success.deep` | `#15803D` | success/confirmation FOCAL moment — deep solid green disc/fill + WHITE check (booking confirmed, payment success). Confident, NOT a pale tint (v2 rule 6). Value already in code as `s-brand.mid`. |
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
- **Code = JetBrains Mono** (confirmation codes, ticket numbers).
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
