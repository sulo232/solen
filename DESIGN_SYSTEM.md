# Solen.ch Design System

> Source of truth. If something isn't here, it isn't decided yet.
> Format per rule: **Default** / **Why** / **Escape hatch** / **Banned**.
> Tokens, tables, grep checks: see `DESIGN_SYSTEM_REFERENCE.md`.

---

## 0. The single sentence

> Built like Stripe, booked like Fresha, branded with coral.

Clean white surfaces. Pill interactives. One brand color doing real work. No decorative blobs, no carpet washes, no shadow-on-everything, no fancy display fonts on UI text. Identity comes from rigor, not ornament.

---

## 1. Core rules (locked, no escape hatch)

- **Brand color:** `#E8624A` (`s-coral`). Never `#E8735A`.
- **Salon card cover:** `aspect-square` 1:1, all viewports.
- **Touch targets:** ≥44×44px.
- **Contrast:** WCAG AA minimum, AAA on body text.
- **`prefers-reduced-motion`:** honored globally in `globals.css`.
- **i18n:** every user-facing string via `useTranslations()` in de/en/fr/it.

---

## 2. Use this, don't rebuild

| Need | Use |
|---|---|
| Listing card | `SalonCard` |
| Primary CTA | `InteractiveHoverButton` |
| Date picker | `SolenDatePicker` |
| Filter row | `FilterBar` |
| Loading / empty / error | `<PageState state="..." />` |
| Empty (custom) | `EmptyState` |
| Skeleton | `Skeleton` / `SalonCardSkeleton` |
| Spinner | `Spinner` |
| Modal | `Modal` / `BottomSheet` |
| Toast | `Toast` |
| Bottom nav | `BottomTabBar` |
| Dashboard shell | `DashboardLayout` |

Live render: visit `/design-system`. Before creating `FooBar.tsx`, grep — if it exists, extend it, don't fork.

---

## 3. Surfaces (NO cream, NO gradients, NO blobs)

- **Page background:** white `#FFFFFF`. The platform reads as clean and calm. No paper-cream warmth, no gradients, no carpet wash, no decorative blob layers anywhere.
- **Sunken (inputs, wells):** `#F4F4F2` — barely off-white. Used only inside form inputs and code blocks.
- **Raised (modals, popovers):** white `#FFFFFF` with shadow.

**Why:** the cream + blob aesthetic was the #1 source of visual slop. Every "trendy 2024 startup" has the same warm-cream + gradient-blob look. Going white is what makes Stripe/Linear/Vercel read as confident — they don't need decoration to look premium.

**Escape hatch:** marketing landing pages (homepage hero only) may use a single soft tint behind the headline (max 4% opacity coral OR amber). No blue/plum/sage tints. No gradients. No blobs.

**Banned:** background gradients, carpet blob divs, ambient-v5 wash classes, `#FAF6EF` cream, decorative SVG shapes behind content.

---

## 4. Color

**Active (use these):**
- `s-coral` `#E8624A` — primary action, brand
- `s-amber` `#D4870A` — urgency / promo
- `s-blue` `#6BA3C8` — info / links
- `s-ink` `#1A1209` — text on white

**Reserved (category defaults — okay to use, note the why in PR):**
- `s-plum` barbershop · `s-sage` spa · `s-sand` makeup · `s-yellow` top-rated

**Banned:** arbitrary hex (`#xyz`), Tailwind defaults (`text-gray-700`, `bg-red-500`), pure black `#000`, pure dark grey shadows.

---

## 5. Typography (TWO fonts, no Syne)

- **Display — Bebas Neue** — ≥40px, uppercase. Hero, impact headers, section labels. The brand's only "loud" voice.
- **Body — DM Sans** — everything else. Headings (16–36px), paragraphs, metadata, buttons, forms. Use 400/500/600/700 to create hierarchy. Numbers use `tabular-nums`.

**Why:** three fonts is one too many. Syne reads as wannabe at the sizes where it sits. DM Sans at weight 600/700 covers the headings job cleanly without trying to be fancy. Bebas keeps the brand identity at hero scale only.

**Escape hatch:** none.

**Banned:** Syne, Space Grotesk, DM Serif Display, Inter, system-ui, Roboto, Arial.

---

## 6. Shape

| Element | Radius | Why |
|---|---|---|
| Buttons | `99px` (pill) | universal interactive affordance |
| Tags / badges | `99px` (pill) | same |
| Filter pills | `99px` (pill) | same |
| Time slots | `99px` (pill) | selectable = pill |
| Form inputs | `12px` | functional, not organic |
| Cards (content) | `16px` | content container |
| Hero / modal | `20px` | larger container |
| Dashboard card | `12px` | precise, not decorative |

**Banned:** sharp corners (0px), blob shapes on anything interactive, morphing radius on hover.

---

## 7. Shadows (ONLY on truly floating UI)

Shadows say "this is above everything else." Cards aren't above everything — they sit ON the page.

- **Card at rest:** flat + 1px border `rgba(26,18,9,0.08)`. **No shadow.**
- **Card on hover (marketing only):** -4px lift, *very* soft shadow `0 4px 12px rgba(26,18,9,0.06)`. No layered Apple-glow. Nothing dramatic.
- **Modals, dropdowns, popovers, tooltips:** real shadow `shadow-elevation-2` — these are the only places shadow earns its keep.
- **Buttons:** zero shadow. The fill color and active scale do all the work.

**Why:** universal shadows are 2015 Material Design. Modern luxury (Stripe, Linear, Notion, Apple.com) uses borders + whitespace for content separation, reserving shadow for true elevation.

**Escape hatch:** none in `app` zone. Marketing zone hero may use a one-off shadow if visually justified (rare).

**Banned:** `shadow-md` / `shadow-lg` / `shadow-xl` Tailwind defaults, coral-glow shadows on buttons, layered Apple-style multi-shadow on cards, shadow on listing-card photos, shadow on inputs.

---

## 8. Glass — almost never

The cream + blob system needed glass to create depth. White surfaces don't.

- **Allowed only on:** sticky header pill on scroll, mobile bottom tab bar, modal overlay backdrop.
- **Two canonical classes** in `globals.css`: `.glass` and `.glass-subtle`. Aliases (`.glass-frost`, `.glass-search`, `.glass-toolbar`, `.glass-pill`) remain as context names — same material, different label.

**Banned:** glass on listing cards, glass on form inputs, glass on dashboard panels, glass in zone `app`.

---

## 9. Motion

**Defaults**
- Press: 100ms · hover: 150ms · modal enter: 180ms · card lift: 200ms · UI ceiling: 300ms.
- Easing: `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)`.
- Card lift: `-4px` (allow `-2px` <200px tall, `-6px` >400px). Never `≥-8px`.
- Stagger: 60ms between children, marketing zone only.
- Active press: `active:scale-[0.97]` everywhere. Small (<32px) icons may use 0.92–0.95 with a code comment.

**Banned**
- `transition-all` in production
- Springs on modals or layout
- `duration-500+` on UI
- `scale(0)` on entering elements (start ≥0.95)
- `ease-in` on entering UI
- Idle float / hero pulse animations (banned along with blobs)

---

## 10. Zones (3, not 4)

| Zone | Pages | Animation | Glass | Cards |
|---|---|---|---|---|
| **marketing** | homepage, category, discover, search, brand pages | stagger reveal, card hover lift | header pill + modal only | flat rest, hover lift |
| **transitional** | salon detail, booking confirmation, profile | stagger on first paint only | header pill + modal only | flat rest, subtle lift |
| **app** | booking flow, dashboard, auth, settings, checkout | fade ≤150ms on state change only | none | flat, no lift |

Props: `zone: "marketing" | "transitional" | "app"`.

**Why 3:** salon detail and confirmation pages aren't "app" (people browse) or fully "marketing" (close to converting). Forcing one bucket created weird UX.

---

## 11. Spacing — 4px grid

All spacing is a multiple of 4. Use Tailwind's scale: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `gap-6` (24px), `gap-8` (32px), `gap-12` (48px), `gap-16` (64px).

**Banned:** arbitrary `p-[7px]`, `gap-[13px]`, anything off-grid.

---

## 12. Components state contract

Every list/grid page renders **one** `<PageState state="loading|empty|error" />`, not three ad-hoc implementations.

**Escape hatch:** custom illustration / zone-specific empty state → use `<EmptyState>` directly. Loading and error always go through `<PageState>`.

---

## 13. Pre-commit checklist

- Design tokens only — no arbitrary hex, no Tailwind defaults
- Zone declared
- `useTranslations()`; keys in all 4 locales
- `active:scale-[0.97]` on pressables
- Durations ≤300ms; no `transition-all`
- `aria-label` on icon buttons
- Image aspect matches §6
- No new shadow on a non-floating element
- No new gradient, blob, or wash
- `npm run build` passes

Grep checks: `DESIGN_SYSTEM_REFERENCE.md §Grep`.

---

## 14. The never list (with reasons)

1. **Never use Bebas Neue below 36px** — letters merge, becomes illegible. Exception: 22px nav logo.
2. **Never use Bebas Neue on buttons or body text** — destroys readability.
3. **Never use Syne, Inter, Roboto, Arial, system-ui** — Solen is Bebas + DM Sans only.
4. **Never set text below 11px** — accessibility violation.
5. **Never use blob shapes on buttons, inputs, or any interactive element** — users need to recognize what's clickable.
6. **Never use blob shapes anywhere** — this isn't the textile-carpet aesthetic anymore.
7. **Never use background gradients or carpet washes** — strip slop.
8. **Never use cream `#FAF6EF` as page background** — white only.
9. **Never use sharp 0px corners** — minimum 12px on containers, 99px on interactive.
10. **Never use teal, pure black `#000`, pure dark-grey shadows** — clashes with the warm coral system.
11. **Never hardcode hex in components** — design tokens only.
12. **Never use coral text on coral background** — zero contrast.
13. **Never use `rgba(0,0,0,x)` shadows** — use warm ink `rgba(26,18,9,x)`.
14. **Never put shadow on a card at rest** — borders only at rest. Hover lift adds the only allowed listing-card shadow.
15. **Never use `shadow-md`/`shadow-lg` Tailwind defaults** — too generic, too dark.
16. **Never use coral-glow / multi-layer Apple-style shadow on buttons** — fill + active scale is the affordance.
17. **Never use glassmorphism on a white background** — nothing to blur, just costs GPU.
18. **Never stack >3 glass elements visible at once** — frame-rate hit on mobile.
19. **Never omit `-webkit-backdrop-filter`** — breaks iOS Safari.
20. **Never use emoji as functional icons** — render differently per OS, don't inherit color.
21. **Never show a salon card without price AND availability** — both are required for the card to earn its place.
22. **Never show "0+" stats** — empty platform signal worse than no stats.
23. **Never show "Coming soon" placeholder sections** — looks unfinished.
24. **Never omit `prefers-reduced-motion`** — accessibility + legal requirement.
25. **Never use `transition-all`** — layout jank hazard.

**Override protocol:** if you genuinely need to break one, write the reason in one sentence, wait 24 hours, and document the exception in the PR.

---

## When rules disagree

- This doc wins over `CLAUDE.md §3.3` (legacy V5).
- `DESIGN_SYSTEM_REFERENCE.md` supplies tokens; this doc supplies principles. If reference contradicts principle, fix the reference.
- Find a better default? Update the doc — defaults evolve. Want a one-off? Use the escape hatch.

---

## Pending visual migrations (live code lags this doc)

The codebase still has cream `#FAF6EF` backgrounds, carpet blob divs, Syne loading, and shadow-everywhere in many places. They aren't yet ripped out — that's a separate, visible decision that will change every page.

**To execute the migration**, the next agent should:

1. Replace `#FAF6EF` page bg → `#FFFFFF` in `app/globals.css` body rule.
2. Remove Syne from font import + drop `"Syne"` from h1-h6 default; set `font-heading` alias to DM Sans.
3. Delete blob divs from homepage hero + remove `<BlobBackground>` mounts.
4. Delete `.ambient-v5` and any wash gradient classes from `globals.css`.
5. Strip card-rest shadows (where present) — replace with 1px border.
6. Remove coral-glow shadow from button styles.

Don't run that without explicit approval — it changes how every page looks.
