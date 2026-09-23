# CANON , FOLDED into LOCKFILE.md (owner-approved 2026-07-10)

This file was the 2026-06-01 single-value truth resolved from the contradiction audit. Every live value now lives in **`_design-system/LOCKFILE.md`**, which had grown FRESHER than this file on every conflicting row. This tombstone exists so historical citations ("CANON §N") still resolve.

**Precedence note:** CANON's old header claimed `CANON > LOCKFILE > SOURCE`. That claim is retired. Current law: the Solen precedence section of the project CLAUDE.md.

## 1. Color tokens

| Token | Value | Notes |
|---|---|---|
| `s-ink` | `#0A0A0A` | primary text / ink fills / primary CTA |
| `s-ink-2` | `#6B6B6B` | secondary text |
| `s-ink-3` | `#6B6B6B` | tertiary / eyebrows (collapsed onto ink-2 per V3-D138; same hex). Disabled glyph = `s-ink.disabled` `#C5C8C4`. |
| `s-border` | `#E7E5E4` | hairlines (neutral, NOT warm #EFE7DD) |
| `s-bg-sunken` | `#F5F5F4` | calm surfaces / flat controls |
| **`s-accent`** | **`#276EF1`** | **Uber blue.** Single value (the old `#185CE0` default + `#276EF1` bright split is collapsed). |
| `s-accent.pale` | `#EAEFFE` | accent tint |
| **`s-warning`** | **`#F1AE27`** | **the amber twin.** Derived from the accent: same HSL S+L (88% / 55%), hue rotated to 40°. `.bg #FDF6E7`, `.text #906309`. |
| `s-success` | `#16A34A` | available / open |
| **`s-closed`** | **`#DC2626`** | closed status = RED (user call 2026-05-30). Distinct from `s-error #D32F2F`. |
| `s-error` | `#D32F2F` | form / payment errors |
| `s-star` | `#FFC32B` | rating stars (inline literal OK, Lucide needs it) |
| `--heart-active` | `#FF3366` | saved heart fill |
| `s-urgency` | `#9A3412` on `#FFF1E6` | scarcity / "last minute" |

**Retired (never use):** `#185CE0` (folded into accent), `s-amber` + `#F3A864` (folded into `s-warning #F1AE27`), `s-love #CC4A60` (use `--heart-active`), warm border `#EFE7DD`, V2 monogram hues (`#142F4A`/`#E58840`/`#E9DFC8`/`#F0C25A`), legacy `#1B4D1B` green + `#F3A864` amber across `components-legacy/**`.

## 2. Accent rule (functional-only)

`s-accent #276EF1` appears ONLY on: focus rings (`focus-visible`), the Spinner, and form input active/focus states. **NEVER** on eyebrows, link text, decorative dots, step circles, hero spans, badges, or as a resting fill on a primary CTA. Eyebrows = plain `text-s-ink-3`, no leading bullet. Links = `text-s-ink`. (Exception: `info` semantic surfaces may use accent blue.)

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

When a staff member / barber is selected in ANY picker (walk-in panel, booking `StaffPicker`, `StaffListSheet`, anywhere): **corner check badge** = avatar stays full + visible, with a small **ink circle (`bg-s-ink`) + white check**, 22-24px, bottom-right, 2px white border. **Do NOT use** a photo-overlay (hides the face), an ink ring alone, or a blue/accent overlay (breaks §2). Face-visible is the rule, because you are choosing a person. One shared treatment across all staff pickers (universal-components rule).

## 7. Shadows = warm, kept

Shadow tokens stay warm-tinted `rgba(50,47,44, …)` (elevation-1/2/3 + pressed). Intentional (beauty-domain softening), decided 2026-06-01. `FROST_GLASS` keeps its pure-black over-photo shadow (imperceptible over images, so no conflict).

---

## 8. Open housekeeping
- **R4:** archive the ~11 stale Hanken-era mockups to `public/_archive-mockups/` (out of the served root).
- Amber `#F1AE27` is tuned to the accent's lightness (55%); if it reads too golden for a warning, the deeper sibling is `#E09A0C` (same hue + sat, L ~46%).
