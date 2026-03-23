# PROMPT — Design Fixes + Design System v1.0 Integration

> **Execution mode**: Phase-by-phase. Each phase is self-contained.
> **Priority**: Phase 1 first (critical bugs), then Phase 2–6 in order.
> **File ownership**: This prompt owns `components/layout/Header.tsx`, `components/ui/LanguageSwitcher.tsx`, `components/CategoryHero.tsx`, `components/CategoryPage.tsx`, `app/globals.css`, `tailwind.config.js`

---

## BE CAREFUL

- **Do NOT modify** any files in `app/api/`, `middleware.ts`, `lib/supabase.ts`, or dashboard components
- **Do NOT remove** existing Tailwind utility classes that are working
- **Do NOT change** the routing structure (`app/[locale]/coiffeur/page.tsx`, etc.)
- **Test** `npm run build` after each phase to catch errors
- **Dark mode** uses `.dark` class (Tailwind) AND `[data-theme="dark"]` attribute — support both
- **prefers-reduced-motion**: ALL animations MUST be wrapped

---

## Phase 1 — Critical Bug Fixes

### 1.1 Fix Language Switcher Duplication

**File**: `components/ui/LanguageSwitcher.tsx`

**Bug**: `LOCALE_FLAGS` (lines 14-19) and `LOCALE_LABELS` (lines 7-12) have identical values (`"DE"`, `"EN"`, etc.). Line 73 renders `{LOCALE_FLAGS[key]}` and line 74 renders `{label}` — producing `DE DE`, `EN EN`.

**Fix**: Remove the `LOCALE_FLAGS` constant entirely. In the dropdown, render only `{label}` once per language option. The button trigger should show globe icon + `{LOCALE_LABELS[locale]}`.

```tsx
// REMOVE this duplicate constant:
// const LOCALE_FLAGS: Record<string, string> = { de: "DE", en: "EN", fr: "FR", it: "IT" };

// In the dropdown, change from:
//   <span>{LOCALE_FLAGS[key]}</span>
//   <span>{label}</span>
// To just:
//   <span>{label}</span>
```

---

### 1.2 Fix Sub-site Header Duplication

**File**: `components/layout/Header.tsx`

**Bug**: When on `/de/coiffeur`, the header shows `so.len | ✂️ Coiffeur` (lines 98-104) AND `CategoryHero.tsx` also renders `Coiffeur in Basel` as `<h1>`. Users see "Coiffeur" twice.

**Fix — Smooth scroll-based category transition**:

When `scrolled === false` (at top of page): show full `so.len | ✂️ Coiffeur`
When `scrolled === true`: animate the "Coiffeur" text out with `framer-motion`, leaving only `so.len | ✂️`

```tsx
// Replace lines 98-104 with:
{CategoryIcon && categoryInfo && (
  <div className="flex items-center gap-1.5 text-s-coral ml-1">
    <span className="text-s-ink/20 dark:text-s-dm-text/20">|</span>
    <CategoryIcon size={18} />
    <AnimatePresence>
      {!scrolled && (
        <motion.span
          initial={{ opacity: 0, x: -8, width: 0 }}
          animate={{ opacity: 1, x: 0, width: "auto" }}
          exit={{ opacity: 0, x: -12, width: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="text-sm font-medium hidden sm:inline overflow-hidden whitespace-nowrap"
        >
          {categoryInfo.label}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
)}
```

---

### 1.3 Fix Scroll Transition — Jarring Square-to-Circle

**File**: `components/layout/Header.tsx`

**Bug**: Lines 87-89 jump between `rounded-none` (top) and `rounded-full` (scrolled). The border-radius change from 0 to 999px is jarring and looks glitchy.

**Fix**: Always use `rounded-full` (pill shape). Vary only width, padding, shadow, and backdrop:

```tsx
// Replace lines 85-90 with:
<div className={cn(
  "mx-auto flex items-center justify-between transition-all duration-500 ease-out rounded-full",
  scrolled
    ? "mt-3 max-w-3xl glass shadow-warm-sm py-2 px-4 sm:px-6 gap-2 dark:bg-s-dm-surface/80 dark:border-white/5"
    : "mt-2 max-w-5xl bg-s-bg-base/60 backdrop-blur-lg py-3 px-5 sm:px-8 gap-4 border border-transparent dark:bg-s-dm-bg/60"
)}>
```

Key: both states use `rounded-full`. The `max-w` transition (5xl → 3xl) creates a smooth shrink effect. `transition-all duration-500` handles it smoothly.

---

### 1.4 Fix Sticky Bar Cramped Spacing

**File**: `components/layout/Header.tsx`

When scrolled, elements are too cramped. Fix by:
- Increasing `gap` between nav links: `gap-4` → `gap-3` when scrolled, `gap-6` at top
- Hiding the "Profil" button text when scrolled (show only icon):

```tsx
// In the Account button (lines 142-149), add scrolled condition:
<Link
  href={profileHref}
  className={cn(
    "hidden sm:flex items-center rounded-full bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-200",
    scrolled ? "p-2 min-h-10 min-w-10 justify-center" : "gap-1.5 px-3 py-1.5 min-h-12"
  )}
  aria-label="Profil"
>
  <User className="w-4 h-4" />
  {!scrolled && <span>{t("account")}</span>}
</Link>
```

---

### 1.5 Fix Desktop Nav Links Hiding When Scrolled

When scrolled, hide category nav links on smaller screens and reduce gap:

```tsx
// In desktop nav (line 108), make responsive to scroll:
<nav className={cn(
  "hidden md:flex items-center",
  scrolled ? "gap-1" : "gap-4"
)} aria-label="Hauptnavigation">
  {NAV_LINKS.map(({ key, href }) => {
    const isActive = pathname.includes(href);
    return (
      <Link
        key={key}
        href={`/${locale}${href}`}
        className={cn(
          "text-sm font-medium transition-all duration-200 rounded-full",
          scrolled ? "px-2 py-1 text-xs" : "px-3 py-1.5",
          isActive
            ? "text-s-coral bg-s-coral/8"
            : "text-s-ink/70 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/70"
        )}
      >
        {t(key)}
      </Link>
    );
  })}
</nav>
```

---

## Phase 2 — Design System CSS Token Integration

### 2.1 Add Full v1.0 Tokens to globals.css

**File**: `app/globals.css`

Add ALL design system tokens to `:root`. The existing HSL-based shadcn tokens (`--border`, `--input`, etc.) should remain for component library compatibility. Add the v1.0 tokens alongside them.

**Add to `:root` block:**

```css
/* ── SOLEN DESIGN SYSTEM v1.0 ────────────────────────── */

/* Surfaces */
--s-bg-base:         #FAF6EF;
--s-bg-surface:      #F3EDE2;
--s-bg-raised:       #FFFFFF;
--s-bg-overlay:      rgba(250,246,239,0.88);
--s-bg-sunken:       #EDE5D8;

/* Coral family */
--s-coral:           #E8624A;
--s-coral-hover:     #CC4E35;
--s-coral-subtle:    #FAECE7;
--s-coral-text:      #7A2415;

/* Amber family */
--s-amber:           #D4870A;
--s-amber-hover:     #B3700A;
--s-amber-subtle:    #FEF4E0;
--s-amber-text:      #6B4005;

/* Blue family */
--s-blue:            #6BA3C8;
--s-blue-hover:      #4E8AB5;
--s-blue-subtle:     #EAF3FB;
--s-blue-text:       #1A4D72;

/* Plum family */
--s-plum:            #4A1E3C;
--s-plum-hover:      #3A1630;
--s-plum-subtle:     #F0E8F0;
--s-plum-text:       #4A1E3C;

/* Sand */
--s-sand:            #C9A96E;
--s-sand-subtle:     #F7F0E3;
--s-sand-text:       #6B5430;

/* Sage */
--s-sage:            #7BA688;
--s-sage-subtle:     #EBF5EE;
--s-sage-text:       #2E5E3A;

/* Yellow */
--s-yellow:          #F2C144;
--s-yellow-subtle:   #FEF8E0;
--s-yellow-text:     #7A5C00;

/* Ink */
--s-ink:             #1A1209;
--s-ink-secondary:   #4A3D2E;
--s-ink-tertiary:    #8A7A66;
--s-ink-disabled:    #C4B8A6;

/* Borders */
--s-border-light:    rgba(26,18,9,0.08);
--s-border-mid:      rgba(26,18,9,0.16);
--s-border-strong:   rgba(26,18,9,0.32);

/* Semantic */
--s-success:         #3B6D11;
--s-success-bg:      #EAF3DE;
--s-warning:         #854F0B;
--s-warning-bg:      #FAEEDA;
--s-error:           #A32D2D;
--s-error-bg:        #FCEBEB;
--s-info:            #185FA5;
--s-info-bg:         #E6F1FB;

/* Blobs */
--s-blob-1:          rgba(232,98,74,0.14);
--s-blob-2:          rgba(107,163,200,0.16);
--s-blob-3:          rgba(212,135,10,0.12);
--s-blob-4:          rgba(123,166,136,0.10);

/* Shadows */
--s-shadow-sm:       0 2px 8px rgba(26,18,9,0.07);
--s-shadow-md:       0 6px 24px rgba(26,18,9,0.10);
--s-shadow-lg:       0 16px 56px rgba(26,18,9,0.14);
--s-shadow-float:    0 24px 72px rgba(26,18,9,0.18);

/* Spacing (8pt grid) */
--s-space-1:  4px;
--s-space-2:  8px;
--s-space-3:  12px;
--s-space-4:  16px;
--s-space-5:  24px;
--s-space-6:  32px;
--s-space-7:  48px;
--s-space-8:  64px;
--s-space-9:  96px;
--s-space-10: 128px;

/* Border radius */
--s-radius-sm:       8px;
--s-radius-md:       16px;
--s-radius-pill:     999px;
--s-radius-blob-a:   40% 60% 70% 30% / 40% 50% 60% 50%;
--s-radius-blob-b:   60% 40% 45% 55% / 50% 60% 40% 50%;
--s-radius-blob-c:   50% 50% 40% 60% / 60% 40% 60% 40%;
--s-radius-blob-d:   40% 60% 55% 45% / 30% 30% 70% 70%;
--s-radius-blob-e:   70% 30% 50% 50% / 40% 60% 40% 60%;

/* Typography */
--s-font-display:    'Bebas Neue', sans-serif;
--s-font-heading:    'Syne', sans-serif;
--s-font-body:       'DM Sans', sans-serif;

--s-text-xs:   11px;
--s-text-sm:   13px;
--s-text-md:   15px;
--s-text-base: 16px;
--s-text-lg:   18px;
--s-text-xl:   24px;
--s-text-2xl:  32px;
--s-text-3xl:  48px;
--s-text-4xl:  64px;
--s-text-5xl:  96px;
--s-text-hero: 140px;

/* Transitions */
--s-ease:            cubic-bezier(0.4, 0, 0.2, 1);
--s-ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
--s-duration-fast:   150ms;
--s-duration-mid:    300ms;
--s-duration-slow:   500ms;
--s-duration-float:  6000ms;

/* Z-index */
--s-z-blob-bg:  -2;
--s-z-blob-mid: -1;
--s-z-base:      0;
--s-z-raised:    1;
--s-z-overlay:  10;
--s-z-nav:      20;
--s-z-modal:    30;
--s-z-toast:    40;
```

### 2.2 Add Dark Mode Overrides

**File**: `app/globals.css`

Add dark mode to BOTH `.dark` (Tailwind) and `[data-theme="dark"]`:

```css
.dark, [data-theme="dark"] {
  /* Base surfaces — WARM, never cool grey */
  --s-bg-base:         #151009;
  --s-bg-surface:      #1E1710;
  --s-bg-raised:       #26201A;
  --s-bg-overlay:      rgba(21,16,9,0.90);
  --s-bg-sunken:       #120D07;

  /* Brand colours — brightened for dark */
  --s-coral:           #F07560;
  --s-coral-hover:     #F28E7D;
  --s-coral-subtle:    rgba(240,117,96,0.15);
  --s-coral-text:      #F9BFB5;

  --s-amber:           #E8A030;
  --s-amber-hover:     #F0B450;
  --s-amber-subtle:    rgba(232,160,48,0.15);
  --s-amber-text:      #F9D99A;

  --s-blue:            #85BCD8;
  --s-blue-hover:      #A3CDE4;
  --s-blue-subtle:     rgba(133,188,216,0.15);
  --s-blue-text:       #BCD9EC;

  --s-plum:            #C090B4;
  --s-plum-hover:      #D4A8CA;
  --s-plum-subtle:     rgba(192,144,180,0.15);
  --s-plum-text:       #E0C4D8;

  --s-sand:            #D4B880;
  --s-sand-subtle:     rgba(212,184,128,0.12);
  --s-sand-text:       #EDD9B0;

  --s-sage:            #96C0A0;
  --s-sage-subtle:     rgba(150,192,160,0.12);
  --s-sage-text:       #C0DEC8;

  --s-yellow:          #F5CC60;
  --s-yellow-subtle:   rgba(245,204,96,0.15);
  --s-yellow-text:     #FAE4A0;

  /* Ink — inverted */
  --s-ink:             #F5EEE4;
  --s-ink-secondary:   #C8BAA8;
  --s-ink-tertiary:    #8A7A66;
  --s-ink-disabled:    #4A4035;

  /* Borders */
  --s-border-light:    rgba(245,238,228,0.08);
  --s-border-mid:      rgba(245,238,228,0.14);
  --s-border-strong:   rgba(245,238,228,0.28);

  /* Semantic */
  --s-success:         #97C459;
  --s-success-bg:      rgba(99,153,34,0.15);
  --s-warning:         #EF9F27;
  --s-warning-bg:      rgba(239,159,39,0.15);
  --s-error:           #F09595;
  --s-error-bg:        rgba(226,75,74,0.15);
  --s-info:            #85B7EB;
  --s-info-bg:         rgba(55,138,221,0.15);

  /* Blobs (darker) */
  --s-blob-1:          rgba(240,117,96,0.10);
  --s-blob-2:          rgba(133,188,216,0.08);
  --s-blob-3:          rgba(232,160,48,0.08);
  --s-blob-4:          rgba(150,192,160,0.06);

  /* Shadows */
  --s-shadow-sm:       0 2px 8px rgba(0,0,0,0.25);
  --s-shadow-md:       0 6px 24px rgba(0,0,0,0.35);
  --s-shadow-lg:       0 16px 56px rgba(0,0,0,0.45);
  --s-shadow-float:    0 24px 72px rgba(0,0,0,0.55);
}
```

### 2.3 Add Animation Keyframes & Utilities

**File**: `app/globals.css`

Add to `@layer utilities`:

```css
/* Blob interactions */
.blob-interactive {
  transition:
    border-radius 500ms cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 300ms cubic-bezier(0.4, 0, 0.2, 1),
    background 150ms cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.blob-interactive:active {
  transform: scale(0.97);
  transition-duration: 100ms;
}

/* Hero float — Zone 1 only, 1 per page max */
@keyframes solen-float {
  0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
  50%      { transform: translateY(-14px) rotate(0.5deg); }
}
.hero-float {
  animation: solen-float 6s ease-in-out infinite;
}

/* Page load reveals — Zone 1 and 2 */
@keyframes solen-reveal {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.reveal-1 { animation: solen-reveal 400ms cubic-bezier(0.4,0,0.2,1) 80ms both; }
.reveal-2 { animation: solen-reveal 400ms cubic-bezier(0.4,0,0.2,1) 160ms both; }
.reveal-3 { animation: solen-reveal 400ms cubic-bezier(0.4,0,0.2,1) 240ms both; }
.reveal-4 { animation: solen-reveal 400ms cubic-bezier(0.4,0,0.2,1) 320ms both; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-float { animation: none; }
  .reveal-1, .reveal-2, .reveal-3, .reveal-4 {
    animation: none;
    opacity: 1;
    transform: none;
  }
  .blob-interactive { transition: none; }
}

/* Grain texture overlay — desktop only */
.grain-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  opacity: 0.04;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.dark .grain-overlay, [data-theme="dark"] .grain-overlay {
  mix-blend-mode: overlay;
  opacity: 0.03;
}
@media (max-width: 768px) {
  .grain-overlay { display: none; }
}

/* Background blob system */
.blob-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}
.blob-bg .blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(1px);
}
.blob-bg .blob-coral  { width: 500px; height: 500px; right: -140px; top: -100px; background: var(--s-blob-1); }
.blob-bg .blob-blue   { width: 380px; height: 380px; left: -80px; bottom: -80px; background: var(--s-blob-2); }
.blob-bg .blob-amber  { width: 220px; height: 220px; left: 45%; top: 5%; background: var(--s-blob-3); }

@media (max-width: 768px) {
  .blob-bg .blob { opacity: 0.6; }  /* Reduce 40% on mobile */
}
```

### 2.4 Update tailwind.config.js

**File**: `tailwind.config.js`

Ensure the following are exposed as Tailwind utilities. Check existing config and ADD any missing entries:

```js
// In theme.extend.colors — add these if missing:
's-coral-hover': '#CC4E35',
's-coral-subtle': '#FAECE7',
's-coral-text': '#7A2415',
's-amber': '#D4870A',
's-amber-hover': '#B3700A',
's-amber-subtle': '#FEF4E0',
's-amber-text': '#6B4005',
's-blue': '#6BA3C8',
's-blue-hover': '#4E8AB5',
's-blue-subtle': '#EAF3FB',
's-blue-text': '#1A4D72',
's-plum': '#4A1E3C',
's-plum-hover': '#3A1630',
's-plum-subtle': '#F0E8F0',
's-plum-text': '#4A1E3C',
's-sand': '#C9A96E',
's-sand-subtle': '#F7F0E3',
's-sand-text': '#6B5430',
's-sage': '#7BA688',
's-sage-subtle': '#EBF5EE',
's-sage-text': '#2E5E3A',
's-yellow': '#F2C144',
's-yellow-subtle': '#FEF8E0',
's-yellow-text': '#7A5C00',
's-ink-secondary': '#4A3D2E',
's-ink-tertiary': '#8A7A66',
's-ink-disabled': '#C4B8A6',

// Border radius:
'blob-a': '40% 60% 70% 30% / 40% 50% 60% 50%',
'blob-b': '60% 40% 45% 55% / 50% 60% 40% 50%',
'blob-c': '50% 50% 40% 60% / 60% 40% 60% 40%',
'blob-d': '40% 60% 55% 45% / 30% 30% 70% 70%',
'blob-e': '70% 30% 50% 50% / 40% 60% 40% 60%',

// Box shadow:
'warm-sm': '0 2px 8px rgba(26,18,9,0.07)',
'warm-md': '0 6px 24px rgba(26,18,9,0.10)',
'warm-lg': '0 16px 56px rgba(26,18,9,0.14)',
'warm-float': '0 24px 72px rgba(26,18,9,0.18)',
```

---

## Phase 3 — Nav Active Indicator Animation

### 3.1 Sliding Active Pill

**File**: `components/layout/Header.tsx`

Add a `framer-motion` `layoutId` sliding pill under the active nav link:

```tsx
// Wrap each nav link in a relative container, add:
{isActive && (
  <motion.div
    layoutId="nav-active-pill"
    className="absolute inset-0 bg-s-coral/8 rounded-full -z-10"
    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
  />
)}
```

This creates a smooth sliding highlight effect when navigating between categories.

---

## Phase 4 — Background Blobs (Zone 1 Pages)

### 4.1 Add Blobs to Homepage & Category Pages

**File**: `components/CategoryHero.tsx` and homepage layout

Add the blob background system to Zone 1 pages (homepage, category pages). Use the `.blob-bg` class from the CSS utilities added in Phase 2.

```tsx
// Inside CategoryHero, add:
<div className="relative overflow-hidden">
  <div className="blob-bg" aria-hidden="true">
    <div className="blob blob-coral" />
    <div className="blob blob-blue" />
    <div className="blob blob-amber" />
  </div>
  {/* existing content */}
</div>
```

### 4.2 Add Grain Overlay to Layout

**File**: `app/[locale]/layout.tsx`

Add the grain texture overlay at the layout level (Zone 1 + 2 pages only):

```tsx
// Add to layout body:
<div className="grain-overlay" aria-hidden="true" />
```

---

## Phase 5 — Blob Shapes on Salon Cards

### 5.1 Apply blob-d to Salon Cards

Find the salon card component and apply:
- Resting state: `border-radius: var(--s-radius-blob-d)` (or `rounded-blob-d` if Tailwind configured)
- Hover: morph to `blob-b` + `translateY(-8px)` + `rotate(0.8deg)` + shadow increase
- Add `blob-interactive` class for smooth transitions

```css
.salon-card {
  border-radius: var(--s-radius-blob-d);
}
.salon-card:hover {
  border-radius: var(--s-radius-blob-b);
  transform: translateY(-8px) rotate(0.8deg);
  box-shadow: var(--s-shadow-lg);
}
```

---

## Phase 6 — Button Blob Shapes (Zone 1 + 2 only)

### 6.1 Primary CTA Buttons

For primary CTA buttons on Zone 1 + 2 pages:

```css
.btn-blob-primary {
  border-radius: var(--s-radius-blob-a);
  background: var(--s-coral);
  color: white;
  font-family: var(--s-font-heading);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 14px 32px;
}
.btn-blob-primary:hover {
  border-radius: var(--s-radius-blob-b);
  background: var(--s-coral-hover);
  transform: scale(1.04) rotate(-1.5deg);
}
.btn-blob-primary:active {
  border-radius: var(--s-radius-blob-c);
  transform: scale(0.98) rotate(0deg);
}
```

### 6.2 ZONE RULES — Non-negotiable

- **Zone 1** (Homepage, discovery, category pages): Full blob shapes, blobs, grain, animations
- **Zone 2** (Salon profiles, search results): Blob-d on cards only, no idle animation
- **Zone 3** (Booking, payment, auth): Blob on CTA buttons ONLY. `radius-md` on all containers. ZERO grain, ZERO animation, ZERO blobs
- **Zone 4** (Dashboard, admin): `radius-md` max. No blob shapes ever. No animation. Syne 700 headings only.

---

## Verification

After each phase:
```bash
npm run build
```

After all phases:
1. Visit each sub-site — verify no text duplication
2. Toggle language switcher — verify no `DE DE`
3. Scroll on each page — verify smooth pill transition
4. Click Profile — verify no 500
5. Toggle dark mode — verify warm tones (not cold grey)
6. Check blob shapes on salon cards
7. Check background blobs on homepage/category pages
