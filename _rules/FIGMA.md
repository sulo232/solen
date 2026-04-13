# Figma Rules — Claude as Designer + Coder

> Claude is both designer and developer on this project.
> All design decisions go through Figma first. Code follows Figma. Never the reverse.

**Solen DESIGN file key**: `cInKwtgkD8TjUSSLDT40eF`
**Always load `figma-use` skill before any `use_figma` call.**

---

## Figma File Structure

```
Design Identity      → tokens: colors, glass, typography, animation, radii
Page 3               → full-page designs (sections named by route: /de/, /de/coiffeur, etc.)
Components           → component designs (sections named by route + "(components)")
🎬 Animation Specs   → per-component animation rules
Animated Icons       → Iconly Pro animated icon library
```

---

## Design Tokens (from "Design Identity" page)

### Brand Colors
| Token | Hex | Use |
|---|---|---|
| s-coral | `#E8735A` | Primary CTA |
| s-amber | `#D4870A` | Accent warm |
| s-blue | `#6BA3C8` | Basel Blue |
| s-ink | `#1A1209` | Text / Ink |
| s-sage | `#7BA688` | Trust green |
| s-sand | `#C9A96E` | Warm neutral |
| s-yellow | `#F2C144` | Highlight |
| s-plum | `#4A1E3C` | Deep accent |

### Glass Tint System
| Name | Blur | Used on |
|---|---|---|
| Warm Beige | 16px | Header / Topbar |
| Coral Blush | 20px | Search backdrop |
| Frosted White | 12px | Category pills |
| Warm White | 14px | Floating cards |
| Soft Sand | 10px | Trust stats |
| Clean Frost | 18px | Bottom nav |

### Typography
| Role | Font | Tailwind class |
|---|---|---|
| Display | Bebas Neue | `font-display` |
| Heading | Syne 700 | `font-heading font-bold` |
| Title | Syne 600 | `font-heading font-semibold` |
| Body | DM Sans 400 | `font-body` |
| Caption | DM Sans 400 | `font-body text-xs` |

### Animation System
| Name | Duration | Use |
|---|---|---|
| Instant | 100ms | Button press feedback |
| Fast | 150ms | Hover states, icon taps |
| Normal | 200ms | Dropdowns, tooltips |
| Slow | 300ms | Modals, sheets |
| Dramatic | 500ms | Page reveals, marketing |
| Spring — UI | stiffness: 400, damping: 35 | UI spring interactions |
| Spring — Bounce | stiffness: 500, damping: 25 | Bouncy micro-interactions |

**Easing:**
- Enter: `cubic-bezier(0.23, 1, 0.32, 1)`
- Exit: `cubic-bezier(0.77, 0, 0.175, 1)`
- Drawer: `cubic-bezier(0.32, 0.72, 0, 1)`

### Border Radii
| Token | Value | Use |
|---|---|---|
| `rounded-pill` | 9999px | Tags, pills, CTAs |
| `rounded-btn` | 99px | Buttons |
| `rounded-card-lg` | 20px | Modals, hero cards |
| `rounded-card` | 16px | Salon cards |
| `rounded-input` | 12px | Form inputs |
| `rounded-sheet` | 28px | Bottom sheets |

---

## How Pages Are Organized

### "Page 3" — Full Page Designs
Each route is a named Section. Find the route you need:
```
/de/                → id=3:9220
/de/coiffeur        → id=3:10668
/de/barbershop      → id=3:11930
/de/nails           → id=3:13180
/de/makeup          → id=3:13773
/de/spa             → id=3:14404
/de/waxing          → id=3:14984
/de/search          → id=3:16264
/de/last-minute     → id=3:17183
/de/discover        → id=3:19441
/de/fuer-salons     → id=3:22086
/de/auth/login      → id=3:24059
/de/auth/register   → id=3:24342
```

### "Components" page — Component Designs by Route

**🧱 Shared Components** (`id=98:2529`) — Reusable atoms + molecules used across all pages:
```
Badge (component set)       → 4 frosted glass variants (White/Coral/Sage/Dark Frost)
Heart (component set)       → 2 states: Default ↔ Favorited (Smart Animate on click)
Card / Salon (component set)→ 2 states: Default ↔ Hover (Smart Animate on hover)
```

Each route also has a section named `[route] (components)` for page-specific component specs:
```
/de/ (components)           → id=3:8063
/de/coiffeur (components)   → id=3:9825
/de/last-minute (components)→ id=3:16777
/de/discover (components)   → id=3:18560
/de/fuer-salons (components)→ id=3:21445
/de/auth/login (components) → id=3:23920
```

### "🎬 Animation Specs" page — Per-Component Animation
Every component has its own animation card (440×440). Check here before writing any motion code:
```
Buttons & CTAs      → Primary CTA, Secondary, InteractiveHoverButton, Ghost
Cards               → SalonCard, GlassCard, HeroVisualCard, CategoryTile
Navigation          → Header, BottomTabBar, Sidebar, ExpandableTabs, CategoryStickyRow
Search & Filter     → SearchBar, FilterBar, FilterBottomSheet, SearchAutocomplete
Modals & Sheets     → BottomSheet, GlassModal, QuickPreviewSheet, WaitlistModal
Forms               → Input, DateRangePicker, SolenDatePicker
Feedback            → Toast, EmptyState, Spinner, Skeleton, ErrorFallback
Badges & Pills      → SalonBadge, TrustBadges, SubCategoryChips
Homepage Sections   → HomepageHero, HowItWorks, LastMinuteStrip, FeaturedSalonCarousel
```

---

## Component-First Workflow (MANDATORY)

> **Rule: Never design directly on a page. Build the component first, then instantiate.**

### The Law

1. **Components page is the source of truth.** Every UI element — cards, badges, buttons, sections — exists as a Figma Component (or Component Set) on the Components page FIRST.
2. **Pages are compositions of instances.** The `/de/`, `/de/coiffeur`, etc. pages only contain *instances* of components from the Components page. Never detach instances on pages.
3. **Changes flow one way: Components → Pages.** If a card needs to change, edit the component. All page instances update automatically. Never edit an instance on a page — go back to the source.

### What Every Component Needs

| Layer | Required | Example |
|---|---|---|
| **Base state** | Always | Card at rest, button idle |
| **Hover state** | If interactive | Card lifted + shadow, button glow |
| **Active/Pressed** | If clickable | Scale 0.97, color shift |
| **Variants** | When multiple configs exist | Badge=None / Single / Double |
| **Prototype wiring** | Between states | Default ↔ Hover (Smart Animate 250ms) |
| **Description** | Always | What it is, where it's used |

### Component Naming Convention

```
Category / Component / Variant
```

Examples:
```
Card / Salon / Default
Card / Salon / Hover
Badge / White Frost
Badge / Coral Frost
Badge / Sage Frost
Badge / Dark Frost
Heart / Default
Heart / Favorited
```

### Frosted Glass System (4 variants)

| Variant | Background | Border | Text | Use |
|---|---|---|---|---|
| **White Frost** | `rgba(255,255,255,0.78)` + blur(16) | `rgba(0,0,0,0.06)` | dark `rgba(26,18,9,0.85)` | Default: "Beliebt", "Neu" |
| **Coral Frost** | `rgba(232,98,74,0.18)` + blur(16) | `rgba(232,98,74,0.15)` | white `rgba(255,255,255,0.95)` | Rating: "★ 4.9", "Top bewertet" |
| **Sage Frost** | `rgba(123,166,136,0.22)` + blur(16) | `rgba(123,166,136,0.15)` | white `rgba(255,255,255,0.95)` | Availability: "Sofort buchbar" |
| **Dark Frost** | `rgba(26,18,9,0.45)` + blur(16) | `rgba(255,255,255,0.08)` | white `rgba(255,255,255,0.90)` | Heart button, price overlay |

All frost badges get: `border-radius: 9999px`, `stroke-weight: 1px`, `drop-shadow: 0 1px 4px rgba(0,0,0,0.10)`.

### Salon Card Component Structure

```
Card / Salon (280×330)
├── Image Block (280×240, rounded-card 16px, clipsContent)
│   ├── [Salon photo — full bleed]
│   ├── Badge / * Frost (top-left, instance swap)
│   ├── Badge / Coral Frost (bottom-left, rating)
│   └── Heart / Default (top-right)
├── Salon Name (Syne 15px SemiBold, outside image)
├── Location (DM Sans 13px, muted 50%)
└── Price · Rating (DM Sans 13px Medium, 70%)
```

Text lives OUTSIDE/underneath the image block — not inside a white strip.

### Build Order for New Components

```
1. Build atoms     → badges, icons, buttons
2. Prototype atoms → default ↔ hover ↔ pressed
3. Build molecules → card (composed of atoms)
4. Prototype card  → default ↔ hover (Smart Animate)
5. Screenshot      → show user for approval
6. Push instances  → swap onto pages
7. Code it         → implement from Figma spec
```

### When to Create a New Component

- **Any element that appears 2+ times** across pages → must be a component
- **Any element with states** (hover, active, empty, loading) → must be a component set with variants
- **Any badge, pill, or tag** → must use the Frosted Glass System above

### Anti-Patterns (BANNED)

- Designing directly on a page without a component
- Detaching an instance on a page to "quick fix" something
- Having two versions of the same element that aren't linked to one component
- Frosted glass without using one of the 4 defined variants
- Building a card with text inside a white strip at the bottom (text goes outside/underneath)

---

## Phase-by-Phase Workflow

### Phase 0 — Find the Right Frame Before Anything
1. Is this a page-level change? → go to "Page 3", find the section by route name
2. Is this a component-level change? → go to "Components", find `[route] (components)`
3. Does the component have animation? → check "🎬 Animation Specs" for its card
4. Need a token? → go to "Design Identity"

---

### Phase 1 — Designer: Update Figma First

Use `use_figma` to update the relevant section/frame. Rules:

**What belongs in Figma as a Component Property** (data-driven):
- Empty / zero state (`Photo`, `HasReviews`, `HasBadge`)
- Loading state (`Loading`)
- Conditional UI (`Badge=None|TopRated|New`, `Availability=None|Today|Tomorrow`)
- Size variants (`Size=Default|Compact`)

**What stays in code only** (interaction):
- Hover → `hover:` Tailwind
- Focus → global focus ring
- Pressed → `active:scale-[0.97]`
- Animations → Framer Motion using timings from "Design Identity"
- Dark mode → design tokens

After updating → `get_screenshot` → show user → wait for approval before coding.

---

### Phase 2 — Coder: Implement from Figma

**Token mapping — never deviate from these:**
```
s-coral #E8735A  → text-s-coral / bg-s-coral
s-ink   #1A1209  → text-s-ink
Display          → font-display (Bebas Neue)
Heading 700      → font-heading font-bold (Syne)
Title 600        → font-heading font-semibold (Syne)
Body             → font-body (DM Sans)
rounded-pill     → rounded-pill
rounded-btn      → rounded-btn
rounded-card     → rounded-card
rounded-card-lg  → rounded-card-lg
rounded-input    → rounded-input
rounded-sheet    → rounded-sheet
```

**Animation — use values from "Design Identity" exactly:**
```tsx
// Hover states
transition={{ duration: 0.15 }}  // Fast: 150ms

// Dropdowns
transition={{ duration: 0.2 }}   // Normal: 200ms

// Modals / sheets
transition={{ duration: 0.3 }}   // Slow: 300ms

// Enter easing (always)
ease: [0.23, 1, 0.32, 1]

// Exit easing
ease: [0.77, 0, 0.175, 1]

// Springs
{ type: "spring", stiffness: 400, damping: 35 }  // UI
{ type: "spring", stiffness: 500, damping: 25 }  // Bounce
```

**Banned:**
```
#E8624A          → use #E8735A (s-coral updated in DESIGN file)
bg-white         → on pages, use bg-[#FAF6EF]
transition-all   → name specific properties
hover:opacity-80 → use hover:brightness-[1.06]
shadow-md        → use shadow-elevation-* or shadow-v5-*
duration-500     → on UI elements (only ok for Dramatic/marketing)
```

---

### Phase 3 — Code Connect Mapping

Create `ComponentName.figma.tsx` next to the React component:

```tsx
import figma from "@figma/code-connect";
import MyComponent from "./MyComponent";

figma.connect(MyComponent, "https://figma.com/design/cInKwtgkD8TjUSSLDT40eF?node-id=NODE_ID", {
  props: {
    loading:  figma.boolean("Loading"),
    badge:    figma.enum("Badge", { None: null, TopRated: "top-rated", New: "new" }),
  },
  example: ({ loading, badge }) => (
    <MyComponent loading={loading} badge={badge} />
  ),
});
```

Publish:
```bash
npx figma connect publish
```

---

### Phase 4 — Verify

```bash
npm run build
npx tsc --noEmit
npx figma connect publish
```

Screenshot live → compare against Figma section → all states must match.

---

## The Override Rule

**Figma wins. Always.** If code and Figma disagree — fix the code.
