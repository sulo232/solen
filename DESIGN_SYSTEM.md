# Solen.ch Design System — Principles

> Single source of truth for design decisions. Read before touching any `.tsx` or CSS.
>
> **Format:** every rule is `Default` / `Why` / `Escape hatch` / `Banned`. Defaults evolve as we learn. Escape hatches exist — use them with a rationale in the PR.
>
> Tokens, tables, and grep checks live in **`DESIGN_SYSTEM_REFERENCE.md`**.

---

## 0. Core rules (these don't flex)

- **Brand color:** `#E8624A` (`s-coral`). Never `#E8735A`.
- **Salon card cover:** `aspect-square` on all viewports.
- **Touch targets:** ≥44×44px.
- **WCAG:** AA on body text, AAA on critical paths.
- **`prefers-reduced-motion`:** honored globally (see `globals.css`).
- **i18n:** every user-facing string goes through `useTranslations()` in de/en/fr/it.

These are non-negotiable. Brand / accessibility / legal.

---

## 1. Zones

Three zones. Every component declares one via `zone: "marketing" | "transitional" | "app"`.

| Zone | Pages | Animation | Glass | Cards |
|---|---|---|---|---|
| **marketing** | homepage, category (`/coiffeur`, `/nails`, …), `/discover`, `/search`, brand pages | full stagger + reveal + hover choreography | on floating chrome only | flat rest + lift on hover |
| **transitional** | `/salon/[slug]`, booking confirmation, profile, receipts | stagger on first paint only; no per-interaction motion | on floating chrome only | flat rest + subtle lift |
| **app** | booking flow, dashboard, auth, settings, checkout, admin | fade ≤150ms on state change; no scroll/stagger | never | flat, no lift |

**Why 3 and not 2:** a salon detail page isn't "app" (people browse it) nor fully "marketing" (they're close to converting). Forcing it into one bucket created weird UX.

**Escape hatch:** a single page section may borrow a neighboring zone's behavior if justified (comment why). Example: a "Similar salons" module on a booking page may render as `marketing` even though the page is `app`.

---

## 2. Use this, don't rebuild

If a component exists, import it. Full canonical table in `DESIGN_SYSTEM_REFERENCE.md §0`.

**Rule:** before creating `FooBar.tsx`, run `grep -ri "FooBar" components/`. If anything matches, rename/extend the existing one — never coexist.

**Escape hatch:** if you genuinely need a second implementation, put it in `components/_staging/` and log it in `_tasks/INCOMPLETE_FEATURES.md`.

---

## 3. Colors

**Active colors** — use these by default:
- `s-coral` primary action · `s-amber` urgency/promo/premium · `s-blue` info/links · `s-ink` text

**Reserved colors** — defaults for their category, not banned elsewhere:
- `s-plum` barbershop · `s-sage` spa/wellness · `s-sand` makeup/partnership · `s-yellow` top-rated/achievement

**Why:** hard "you cannot use these" caused Claude to refuse valid uses (sage on organic testimonial, sand on an editorial strip). Categories are defaults, not fences.

**Escape hatch:** using a reserved color outside its category is fine — note the intent in the PR description or a code comment.

**Banned:** arbitrary hex (`#123456`), Tailwind defaults (`text-gray-700`, `bg-red-500`).

---

## 4. Typography

Three typefaces. Each owns a size range.

- **Display — Bebas Neue** — ≥40px, always uppercase. Hero, impact headers, section labels.
- **Heading — Syne** — 16–36px. Card titles, section headings, nav items.
- **Body — DM Sans** — 12–15px. Paragraphs, metadata, form labels. Use `tabular-nums` for numeric data.

**Why three, not two:** Bebas is condensed and uppercase — wrong at 20–32px where Syne sits comfortably. DM Sans is too soft for display. The "luxury brands use 2" heuristic was overruled by Solen's actual range (editorial + functional).

**Escape hatch:** if a component mixes ranges (e.g., Bebas at 28px for a specific editorial effect), comment the intent.

**Banned:** Space Grotesk, DM Serif Display, anything from the retired monolith.

---

## 5. Motion

**Defaults**
- **Durations:** press 100ms · hover/tab 150ms · modal enter 180ms · card lift 200ms · UI ceiling 300ms.
- **Easing:** `var(--ease-out)` = `cubic-bezier(0.16, 1, 0.3, 1)` (Apple/Linear easeOutExpo). Legacy `--ease-out-strong` remains valid.
- **Card lift:** `-4px` default · allow `-2px` (small cards <200px tall) · allow `-6px` (hero cards >400px). Never `≥-8px`.
- **Stagger:** 60ms between children. Marketing zone = always. Transitional = on first paint only. App = never.
- **Active press:** `active:scale-[0.97]` on every pressable. Small icon buttons (<32px) may use `0.92–0.95` with a code comment explaining why.

**Why 300ms ceiling on UI:** responsiveness. Scene-entering animations (section reveals, illustration micro-plays) may go up to 600ms — they're not UI feedback.

**Escape hatches**
- Springs on **mobile bottom sheets**: `{ stiffness: 500, damping: 35, mass: 0.5 }` for iOS-native feel.
- Image zoom on **hero/featured/editorial** cards in marketing zone only (never alongside card lift on the same element).
- Durations 400–600ms on **section reveal / illustration** plays only.

**Banned**
- `transition-all` in production components (layout jank).
- Springs on modals / page transitions / grid reveals.
- `duration-500+` on anything pressed or hovered.
- `scale(0)` on entering elements (start from 0.95+).
- `ease-in` on entering UI (use ease-out).

---

## 6. Elevation & surfaces

- **Card rest:** flat + 1px border `rgba(26,18,9,0.08)`. No shadow.
- **Card hover (marketing/transitional):** `-4px` lift + layered shadow.
- **`shadow-elevation-1`:** reserved for elevated dashboard surfaces (modals, popovers, tooltips) — not listing cards.
- **Glass:** two canonical classes — `.glass` (floating chrome) and `.glass-subtle` (interactive pills in marketing).

**Why keep the 4 context aliases (`.glass-frost`, `.glass-search`, `.glass-toolbar`, `.glass-pill`):** naming conveys *where you are* even when the material is identical. Dedup is already free via CSS alias. I was wrong to call them smell.

**Escape hatch:** none needed — use the right class for the context.

---

## 7. Radii

| Token | Size | Use |
|---|---|---|
| `rounded-input` | 12px | inputs, dashboard cards (default in dashboard) |
| `rounded-card` | 16px | feature cards, content blocks |
| `rounded-card-lg` | 20px | hero, modals |
| `rounded-btn` | 99px | CTA buttons |
| `rounded-pill` | 9999px | tags, badges |

**Default in dashboard:** `rounded-input`. Use `rounded-card` only for large feature blocks.

**Banned:** arbitrary `rounded-[14px]`, standard Tailwind `rounded-lg`/`rounded-xl`.

---

## 8. Images

- **Salon card cover:** `aspect-square` (locked — §0).
- **Editorial / featured cards:** may use `aspect-[4/5]` for visual weight.
- **Category tiles:** `aspect-square`.
- **Hero imagery:** free-form, but lock the intrinsic ratio via Tailwind.

**Banned:** `img-hover-zoom` *plus* card lift on the same element. Pick one.

---

## 9. Interaction patterns

Canonical utility classes in `globals.css`:

- `.btn-primary` — coral, white text, `hover:brightness-[1.06]`, `active:scale-[0.97]`
- `.btn-ghost` — border, neutral text, coral-on-hover
- `.link-inline` — neutral text → coral transition
- `.filter-pill` — inactive/active state pair
- `.interactive-card` — rest + lift + press

**Why extract these:** the previous doc had copy-exact classNames — 200 components meant 200 update points. One CSS utility = one update.

**Escape hatch:** if a utility doesn't fit, extend it in `globals.css` — don't inline a bespoke className string.

---

## 10. Versioning of class names

`.card-v4`, `shadow-v5-*`, `.ambient-v5` — **keep the version numbers.** They encode the last intentional redesign and help git-blame. New canonical names (`.card`, `.shadow-card`) are aliases, not replacements.

**Why reversed from previous doc:** fear of a V6 migration was premature. Cross that bridge when it appears.

---

## 11. Illustrations

**Constants** (never vary): coral line weight, cream background, 2px strokes, rounded caps.
**Variables** (per category): subject, composition, palette accent from the category's reserved color.

Locked prompt lives in `_rules/GENERATION_TOOLS.md`. First illustration shouldn't accidentally set the aesthetic for all categories — follow the template.

---

## 12. Components state contract

Every page using list/grid data should render **one** state component, not three ad-hoc implementations.

Use **`<PageState state="loading" | "empty" | "error" />`** (see `components/ui/PageState.tsx`) — it wraps `Skeleton`, `EmptyState`, and `ErrorFallback` behind a single API.

**Escape hatch:** if the empty state needs deep customization (custom illustration, zone-specific behavior), bypass `<PageState>` and use `<EmptyState>` directly — but keep loading and error on `<PageState>`.

---

## 13. Pre-commit checklist

Before committing a new/modified component:

- Design tokens only (no arbitrary hex, no Tailwind defaults)
- Zone declared (`marketing` / `transitional` / `app`)
- `useTranslations()` used; keys in all 4 locales
- `active:scale-[0.97]` on pressables (or 0.92–0.95 for small icons with comment)
- Durations ≤300ms on UI; no `transition-all`
- `aria-label` on icon buttons
- Image aspect matches §8
- `npm run build` passes

Grep-check commands: `DESIGN_SYSTEM_REFERENCE.md §Grep`.

---

## When rules disagree

- This doc wins over `CLAUDE.md §3.3` (legacy V5 section).
- `DESIGN_SYSTEM_REFERENCE.md` supplies facts; this doc supplies principles. If reference contradicts principle, fix the reference.
- If you find a better default, propose an update — defaults evolve. If you want a one-off exception, use the escape hatch.
