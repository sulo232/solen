# Roadmap 07 — Design System & Global Polish

> **Scope**: Typography, colors, spacing, buttons, forms, a11y, performance
> **All changes here are CSS/design-system level — no DB needed.
> **Already done in this session**: Typography scale, color tokens, selection highlight, scroll-fade gradient fix, skeleton-shimmer utility, font anti-aliasing, body color, heading letter-spacing.
> **Effort**: 🟢 Small-Medium (~60 audit points)

---

## Phase 1: Typography Standardization

### 1.1 ✅ DONE — Typography scale CSS custom properties

**WHY**: Without a defined type scale, developers pick arbitrary font sizes (13px here, 15px there, 18px elsewhere). This creates visual inconsistency that makes the platform feel unpolished. A CSS custom property scale ensures everyone uses the same sizes. Airbnb and Fresha both use strict type scales — you can verify this by inspecting their CSS.

**WHAT WAS DONE**: Added 7-step scale to `:root` in `globals.css`:
```css
--text-xs: 0.75rem;       /* 12px — badges, metadata */
--text-sm: 0.875rem;      /* 14px — secondary text */
--text-base: 1rem;        /* 16px — primary body */
--text-lg: 1.125rem;      /* 18px — section subtitles */
--text-xl: 1.375rem;      /* 22px — section titles (Airbnb H2 size) */
--text-2xl: 1.75rem;      /* 28px — page titles */
--text-3xl: 2rem;         /* 32px — hero text */
```

### 1.2 ✅ DONE — Text color tokens

**WHY**: Airbnb famously uses a 3-level text color hierarchy: `#222222` (headings — maximum contrast, commands attention), `#484848` (body — slightly lighter, comfortable for reading paragraphs), and `#717171` (muted — de-emphasized metadata). This hierarchy creates visual structure without relying on font size alone. Solen was using various shades inconsistently.

**WHAT WAS DONE**: Added semantic color tokens:
```css
--color-heading: #222222;
--color-body: #484848;
--color-muted: #6A6A6A;   /* Upgraded from #717171 to 5.0:1 WCAG AA contrast */
```
Set `body { color: var(--color-body) }` and `h1-h6 { color: var(--color-heading); letter-spacing: -0.02em }`

### 1.3 ✅ DONE — Selection highlight
**WHY**: Text selection defaults to an ugly system blue. A coral-tinted selection matches Solen's brand and feels intentional.
**WHAT WAS DONE**: `::selection { background: rgba(232, 98, 74, 0.15) }`

### 1.4 ✅ DONE — Font anti-aliasing
**Already existed**: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;` on `html` element.

---

## Phase 2: Color System Cleanup

### 2.1 Standardize border colors to `#EBEBEB`

**WHY**: Mixed border colors (#DDDDDD, #E5E5E5, #E0E0E0, #F0F0F0) across different components create a subtle but noticeable inconsistency. When card borders, input borders, dividers, and table borders all use different grays, the UI feels patched together rather than designed. Airbnb uses `#EBEBEB` everywhere — cards, dividers, inputs, form fields. This unification is one of the simplest yet most impactful polishing steps.

**BENCHMARK**:
- **Airbnb**: `border-color: #EBEBEB` universally. Inspect any card, input, or divider.
- **Fresha**: Uses `#E5E5E5` primarily.

**HOW**:
- Create `--color-border: #EBEBEB` ✅ (already done — added to `:root`)
- Grep the entire codebase for border color patterns:
  - `border-gray-200` (Tailwind default = #E5E7EB, close but not exact)
  - `border-[#DDDDDD]`, `border-[#E5E5E5]`, `border-[#E0E0E0]`
  - `rgba(26, 18, 9, 0.05)` to `rgba(26, 18, 9, ~0.12)` (the warm border shades)
- Replace with `border-[#EBEBEB]` or create Tailwind utility `border-solen`
- **Exception**: Active/focus borders stay coral (`#E8624A`)

**IMPACT**: Subtle but significant — the entire platform looks cohesive. Users can't pinpoint what changed, but it "feels" more polished.

---

### 2.2 Standardize hover backgrounds to `#F7F7F7`

**WHY**: Hover states on interactive elements (dropdown items, list rows, secondary buttons) need a consistent, visible-but-subtle background change. Too dark makes the hover feel aggressive, too light is invisible. `#F7F7F7` is the Airbnb standard for hover backgrounds — barely visible but perceptible.

**HOW**:
- `--color-hover-bg: #F7F7F7` ✅ (already added)
- Apply to: dropdown menu items, table rows, list items, secondary button hover, nav links
- Tailwind: `hover:bg-[#F7F7F7]` or use the token

---

### 2.3 ✅ DONE — `--bg` and `--base` fixed
**Changed**: From `#F7F7F7` (warm off-white) to `#FFFFFF` (pure white). This aligns with the "white canvas" design direction established in previous sessions.

---

## Phase 3: Spacing Improvements

### 3.1 Increase desktop horizontal padding

**WHY**: Content that touches the edges of a wide monitor feels cramped and amateurish. Airbnb uses generous edge padding that scales with viewport width — on a 27" monitor, there's ~80px of whitespace on each side. This "breathing room" makes content more readable and the platform feel luxurious.

**BENCHMARK**:
- **Airbnb**: `padding: 0 80px` on widescreen, `padding: 0 40px` on normal desktop, `padding: 0 24px` on tablet
- **Fresha**: Similar generous padding

**HOW**:
- **Files**: `components/layout/Header.tsx`, page layouts, `components/HomePage.tsx`
- Change edge padding: `px-4 md:px-6 lg:px-10 xl:px-20`
- Maintain `max-w-[2520px]` container (prevents content from stretching on ultrawide monitors)
- Center content: `mx-auto`

**IMPACT**: Platform feels spacious and premium on large screens.

---

### 3.2 Increase mobile horizontal padding

**WHY**: `px-4` (16px) was the standard 5 years ago. Modern phones have wider screens, and 16px feels cramped — content is too close to the edges. Both Airbnb and iOS system apps now use 20px (`px-5`) as their standard horizontal padding. This extra 4px per side makes content feel more breathable.

**HOW**:
- Change `px-4` → `px-5` (20px) on mobile-specific content areas
- Apply to: listing cards, section headers, form inputs, modals

**IMPACT**: More breathing room on mobile. Small change, big feel improvement.

---

## Phase 4: Button System

### 4.1 Create standardized button variants

**WHY**: Buttons are the primary action elements in any UI. Without standardized variants, every developer creates buttons differently — different heights, padding, border-radius, font weights, hover states. This inconsistency makes the platform feel like it was built by 5 different people. A button system ensures every button on the platform looks and feels identical.

**BENCHMARK**:
- **Airbnb**: 3 button variants — Primary (black/coral, filled), Secondary (white, outlined with dark border), and Ghost (underlined text link)
- **Fresha**: Similar 3-tier hierarchy

**HOW**:
- **File**: `components/ui/Button.tsx` (may already exist from shadcn/ui — check first)
- **Variants**:
  1. **Primary**: `bg-[#E8624A] text-white font-bold rounded-[12px] h-12 px-6 hover:brightness-95 active:scale-[0.98] transition-all`
     - Usage: Main CTAs — "Jetzt buchen", "Weiter", "Registrieren"
  2. **Secondary**: `bg-white border-[1.5px] border-[#222] text-[#222] font-semibold rounded-[12px] h-12 px-6 hover:bg-[#F7F7F7] active:scale-[0.98]`
     - Usage: Secondary actions — "Alle anzeigen", "Filter", "Teilen"
  3. **Ghost**: `bg-transparent text-[#222] underline underline-offset-4 font-medium hover:text-[#000]`
     - Usage: Tertiary actions — "Mehr erfahren", "Überspringen"
  4. **Danger**: `bg-[#D32F2F] text-white font-bold rounded-[12px] h-12`
     - Usage: Destructive actions — "Stornieren", "Löschen"
- **States**:
  - Disabled: `opacity-50 cursor-not-allowed pointer-events-none`
  - Loading: Content replaced with inline spinner (Lucide `Loader2` with `animate-spin`)
- **Accessibility**: All buttons minimum `min-h-[44px] min-w-[44px]` (Apple's touch target guidelines)
- **Props**: `variant`, `size` (sm/md/lg), `loading`, `disabled`, `fullWidth`

**IMPACT**: Every button on the platform is consistent. New features built with the button system automatically look correct.

---

## Phase 5: Form Inputs

### 5.1 Standardize input styles

**WHY**: Form inputs (text fields, text areas, selects) appear throughout the app — search bar, booking flow, review form, login, onboarding. Inconsistent input styling (different heights, border colors, focus states, border-radii) makes forms feel fragmented. Airbnb uses a very specific input style that's consistent across all contexts.

**BENCHMARK**:
- **Airbnb**: Inputs are **48px height**, `8px border-radius`, `1px solid #B0B0B0` border (slightly darker than #EBEBEB for form context), on focus: `2px solid #222` border. Floating label that animates from placeholder to above-field.
- **Fresha**: Similar 48px inputs with clean focus states.

**HOW**:
- **Standard styles**:
  - Border: `1px solid #EBEBEB` (matches standard border color)
  - Focus: `2px solid #E8624A` (coral, matches brand)
  - Height: `48px` minimum (large enough for comfortable tapping)
  - Border-radius: `8px` (matches button radius)
  - Padding: `px-4` (16px horizontal)
  - Font size: `16px` (prevents iOS zoom-on-focus for inputs below 16px)
  - Error state: `border-[#D32F2F]` + red error message below input
- **Floating labels** (Airbnb pattern):
  - Label starts as placeholder text (centered in input)
  - On focus or when field has value: label shrinks and moves to top of input
  - Animation: `transform: translateY()` + `font-size` transition, 200ms

**IMPACT**: All forms feel unified. The floating label pattern is more space-efficient and feels premium.

---

## Phase 6: Accessibility

### 6.1 ✅ DONE — Skip-to-content link
**Already exists**: `<a href="#main-content" class="sr-only focus:not-sr-only ...">Zum Inhalt springen</a>` in `layout.tsx`.

### 6.2 ✅ DONE — Reduced motion support
**Already exists**: `@media (prefers-reduced-motion: reduce)` in `globals.css` line 584-592.

### 6.3 ARIA label audit

**WHY**: Buttons and links without text content (icon buttons like the heart, share arrow, close X) need `aria-label` attributes so screen readers can announce them. Similarly, all images need `alt` text, and all modals need `role="dialog" aria-modal="true"`. This isn't just an accessibility checkbox — it's legally required in many contexts and affects SEO (Google reads alt text).

**HOW**:
- Grep for all `<button>` elements without text content → add `aria-label="Schliessen"`, `aria-label="Teilen"`, etc.
- Grep for all `<img>` tags without `alt` → add descriptive alt text (salon name for salon photos, "Logo" for logo, etc.)
- All modals: add `role="dialog" aria-modal="true"` + focus trap (focus stays inside modal when tabbing)
- All interactive elements: ensure they're keyboard-accessible (focusable, Enter/Space triggers action)

### 6.4 Color contrast verification

**WHY**: WCAG AA requires 4.5:1 contrast ratio for normal text and 3:1 for large text. If muted text is too light, vision-impaired users can't read it. This also affects readability in bright sunlight (common use case for mobile phones).

**HOW**: 
- **Already addressed**: Changed `--color-muted` from `#717171` (4.48:1 — fails) to `#6A6A6A` (5.0:1 — passes)
- Verify coral text on white: `#E8624A` on white = 3.5:1 — acceptable for large text only. Use coral for accents/buttons (with white text), not for body text.

---

## Phase 7: Performance

### 7.1 Image optimization

**WHY**: `<img>` tags don't get automatic optimization from Next.js. `<Image>` from `next/image` provides: automatic WebP conversion (40% smaller files), responsive `srcset` (serves appropriate size per device), lazy loading (images below the fold load only when scrolled to), and blur placeholder (LQIP). This directly improves Core Web Vitals (LCP, CLS) which affects SEO ranking.

**BENCHMARK**: Every production Next.js app uses `<Image>` — raw `<img>` is an anti-pattern in Next.js.

**HOW**:
- Found 8 `<img>` tags in components (from grep):
  - `SearchAutocomplete.tsx` (line 244)
  - `ReviewForm.tsx` (line 217)
  - `CommentSection.tsx` (line 125)
  - `AiArtGenerator.tsx` (line 146)
  - `ClientPhotosTab.tsx` (lines 108, 119, 137)
  - `CategoryPage.tsx` (line 75)
- Replace each with `import Image from 'next/image'` → `<Image src={...} alt={...} width={...} height={...} className={...} />`
- Add Supabase Storage domain to `next.config.js` `images.remotePatterns`:
  ```js
  images: { remotePatterns: [{ hostname: 'tocfnsmxmdxkrcmjzzdw.supabase.co' }] }
  ```

### 7.2 Preload critical assets

**WHY**: Preloading tells the browser to fetch important assets (logo, fonts, hero images) ASAP, before the rendering engine discovers them naturally. This reduces First Contentful Paint (FCP).

**HOW**:
- Add to layout `<head>`: `<link rel="preload" href="/logo.svg" as="image" />`
- If using self-hosted fonts: preload font files with `<link rel="preload" href="/fonts/..." as="font" type="font/woff2" crossOrigin="anonymous" />`

### 7.3 ✅ DONE — Skeleton shimmer utility
**Added** `.skeleton-shimmer` class to `globals.css` referencing the existing `skeletonShimmer` keyframes.

### 7.4 ✅ DONE — Scroll-fade gradient fix
**Fixed**: Changed from cream `#F5F0EB` / `#F7F7F7` to white `#FFFFFF` to match the white canvas direction.
