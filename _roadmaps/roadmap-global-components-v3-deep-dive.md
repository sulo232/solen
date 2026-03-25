# Global Shared Components — Deep-Dive V3 Roadmap

> **Scope:** `components/layout/Header.tsx`, `components/layout/Footer.tsx`, `components/layout/BottomNav.tsx`, `components/ui/Toast.tsx`, `components/ui/ThemeToggle.tsx`, `components/ui/LanguageSwitcher.tsx`, `components/ui/Spinner.tsx`, `components/ui/Skeleton.tsx`, `components/ui/TrustBadges.tsx`, `components/SalonCard.tsx`.
> **Zone: Contextual** — these components appear across all zones. They must comply with the strictest zone they appear in.
> **Critical Warning:** Changes to `Header.tsx`, `Toast.tsx`, and `SalonCard.tsx` affect EVERY page on the platform. Test each in isolation before proceeding.

---

## Cross-Zone Compliance Rules for Global Components

| Component | Zone | Rules |
|---|---|---|
| Header | Z1/Z2 (Homepage, Category) | Glass Tier 2 scrolled pill, warm shadow |
| Toast | All zones | No glass (Z3/Z4 pages would break) — use solid white with warm shadow |
| Footer | Z1 (dark ink bg — exempt) | Bebas Neue `font-display` IS allowed for SOLEN wordmark, no blobs |
| BottomNav | Z3/Z4 on mobile | No glass, no blurs — solid white, border-t only |
| SalonCard | Z2/Z1 | Per-page context — addressed separately |
| ThemeToggle | All | Smallest footprint possible — icon only |
| Skeleton | All | Warm `bg-s-bg-sunken` only, `animate-pulse` |

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Header: scroll morph | 🔴 High | Affects every non-dashboard, non-auth page. Mobile menu in same file. |
| P2 — Header: mobile menu | 🔴 High | `scale(0.96)` on open — NEVER violation in Z3/Z4 contexts |
| P3 — Header: category label motion | 🟡 Medium | `width: 0 → auto` animation — check for reflow |
| P4 — Header: profile button scale | 🔴 High | `hover:scale-105 active:scale-95` — NEVER in Z3/Z4 |
| P5 — Toast: shadow + glass fix | 🟡 Medium | Changes every toast platform-wide |
| P6 — Toast: per-type icon colour | 🟢 Low | Semantic colours |
| P7 — Toast: animation variant | 🟢 Low | Animation only |
| P8 — Footer: section heading labels | 🟢 Low | Font-only change |
| P9 — Footer: link hover style | 🟢 Low | CSS only |
| P10 — Footer: bottom wordmark | 🟢 Low | Bebas Neue is allowed here (brand lockup) |
| P11 — Footer: TrustBadges | 🟢 Low | Read and verify the component |
| P12 — BottomNav | 🟡 Medium | Safe-area + active state |
| P13 — Spinner: warm colour | 🟢 Low | CSS only |
| P14 — Skeleton: warm token | 🟢 Low | CSS only |
| P15 — SalonCard: NEVER violations | 🔴 Critical | Platform-wide — blob morph on hover, cold shadows |

---

## Phase 1 — Header: Scroll Morph Fix

### Current state (Header.tsx lines 99–104)
```tsx
<div className={cn(
  "flex items-center justify-between transition-all duration-500 ease-out rounded-full",
  scrolled
    ? "mt-3 max-w-3xl glass shadow-warm-sm py-2 px-4 sm:px-6 dark:bg-s-dm-surface/80"
    : "mt-2 max-w-5xl bg-s-bg-base/60 backdrop-blur-lg py-3 px-5 sm:px-8 dark:bg-s-dm-bg/60"
)}>
```
**Issues:**
- `glass` utility class — needs to be inspected. If it applies `shadow-glass` anywhere, remove it.
- The scrolled pill is Z1-correct: `glass` (Tier 2 = backdrop-blur-md, bg-white/70, warm border) ✅
- Non-scrolled: `bg-s-bg-base/60 backdrop-blur-lg` — `backdrop-blur-lg` is too heavy. Use `backdrop-blur-md`.
- `transition-all duration-500` on the container — transitions entire box incl layout. Restrict to `transition-[background,box-shadow,max-width,padding] duration-300`.

### ⚠️ BE CAREFUL
- The scroll handler (`window.scrollY > 50`) and its cleanup must remain untouched.
- `isHidden` check for dashboard/auth pages must remain untouched.
- Don't touch the Supabase session check — it's critical for `isLoggedIn`.

### Files to modify

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)
**Lines 99–104** — nav pill wrapper:
```tsx
<div className={cn(
  "flex items-center justify-between rounded-full transition-[background,box-shadow,padding,max-width] duration-300 ease-out",
  scrolled
    ? "mt-3 max-w-3xl py-2 px-4 sm:px-6 dark:border-white/[0.06]"
    : "mt-2 max-w-5xl py-3 px-5 sm:px-8 bg-s-bg-base/50 dark:bg-s-dm-bg/50"
)}
style={scrolled ? {
  background: "rgba(255,255,255,.82)",
  backdropFilter: "blur(16px) saturate(1.3)",
  WebkitBackdropFilter: "blur(16px) saturate(1.3)",
  border: "1px solid rgba(255,255,255,.70)",
  boxShadow: "0 2px 6px rgba(26,18,9,.08), 0 8px 24px rgba(26,18,9,.06)"
} : {
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)"
}}>
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "GLOBAL-P1: Header scroll pill → warm glass spec, restrict transition props"`

---

## Phase 2 — Header: Mobile Menu NEVER Fix

### Current state (Header.tsx lines 203–208)
```tsx
<motion.div
  initial={{ opacity: 0, y: -8, scale: 0.96 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -8, scale: 0.96 }}
  className="md:hidden mt-2 rounded-card glass p-4 dark:bg-s-dm-surface/90 shadow-warm-md">
```
**Issues:**
- `scale: 0.96 → 1` — **NEVER rule**: no scale animation on UI containers
- `rounded-card` → `rounded-[16px]` (nav dropdown can use slightly larger radius since it's a floating panel)
- `glass` utility — use explicit warm glass spec

### ⚠️ BE CAREFUL — The mobile menu must still slide in smoothly. Replace scale with a pure `opacity + y` entry.

### Files to modify

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)
**Lines 203–208** — mobile menu motion:
```tsx
<motion.div
  initial={{ opacity: 0, y: -6 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -6 }}
  transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
  className="md:hidden mt-2 rounded-[16px] p-4 dark:border-white/[0.06] overflow-hidden"
  style={{
    background: "rgba(255,255,255,.92)",
    backdropFilter: "blur(20px) saturate(1.3)",
    WebkitBackdropFilter: "blur(20px) saturate(1.3)",
    border: "1px solid rgba(255,255,255,.75)",
    boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.08)"
  }}>
```

Mobile menu links:
```tsx
// V3 mobile nav link:
<Link key={key} href={...} onClick={() => setMobileOpen(false)}
  className={cn(
    "flex items-center py-3 px-2 text-sm font-heading font-semibold transition-colors rounded-[10px] min-h-[44px]",
    isActive ? "text-s-coral" : "text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03]"
  )}>
  {t(key)}
</Link>
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "GLOBAL-P2: mobile menu → no scale, opacity+y only, warm glass panel"`

---

## Phase 3 — Header: Category Label Animation

### Current state (Header.tsx lines 116–129)
```tsx
<motion.span
  initial={{ opacity: 0, width: 0 }}
  animate={{ opacity: 1, width: "auto" }}
  exit={{ opacity: 0, width: 0 }}
  className="text-sm font-medium hidden sm:inline overflow-hidden whitespace-nowrap">
```
- `font-medium` → `font-heading font-semibold`
- Width animation from 0→auto triggers layout reflow — acceptable but wrap in `will-change: width`

### Files to modify

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)
**Lines 118–127** — category label:
```tsx
<motion.span key="category-label"
  initial={{ opacity: 0, width: 0 }}
  animate={{ opacity: 1, width: "auto" }}
  exit={{ opacity: 0, width: 0 }}
  transition={{ duration: 0.25, ease: "easeOut" }}
  style={{ willChange: "width" }}
  className="text-xs font-heading font-semibold hidden sm:inline overflow-hidden whitespace-nowrap text-s-coral">
  {categoryInfo.label}
</motion.span>
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "GLOBAL-P3: category label → font-heading, will-change: width"`

---

## Phase 4 — Header: Profile Button Scale Fix

### Current state (Header.tsx lines 188–197)
```tsx
<Link className="... hover:scale-105 active:scale-95 ... shadow-warm-sm ...">
  <User className="w-5 h-5" />
</Link>
```
**Issues:**
- `hover:scale-105` — **NEVER rule**: no scale on interactive elements
- `active:scale-95` — allowed (active feedback only ≤ -2%) ✅ but `scale-95` = 5% = exceeds limit. Use `active:scale-[0.98]`

### Files to modify

#### [MODIFY] [Header.tsx](file:///c:/Users/sulod/solen/components/layout/Header.tsx)
**Lines 188–197** — profile button:
```tsx
<Link href={profileHref}
  className={cn(
    "hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-s-coral text-white hover:bg-s-coral-hover active:scale-[0.98] transition-all duration-200 shrink-0",
    scrolled ? "mt-3" : "mt-2"
  )}
  style={{ boxShadow: "0 2px 4px rgba(232,98,74,.30)" }}
  aria-label="Profil">
  <User className="w-4 h-4" />
</Link>
```

**Git commit:** `git add components/layout/Header.tsx && git commit -m "GLOBAL-P4: profile button → remove hover:scale-105, active:scale-[0.98] only"`

---

## Phase 5 — Toast: Remove shadow-glass + rounded-card

### Current state (Toast.tsx lines 55–61)
```tsx
className={cn(
  "flex items-center gap-3 min-w-[260px] max-w-[360px]",
  "bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-glass border border-white/80",
  "rounded-card shadow-glass px-4 py-3",
  ...
)}
```
**Issues:**
- `shadow-glass` — **NEVER rule #1**: cold shadow on toasts shown in all zones including Z3/Z4
- `rounded-card` — check pixel value
- `backdrop-blur-glass` — unnecessary on a toast (solid white `bg-white/95` doesn't need blur for trust)

### Files to modify

#### [MODIFY] [Toast.tsx](file:///c:/Users/sulod/solen/components/ui/Toast.tsx)
**Lines 55–61** — toast item className:
```tsx
className={cn(
  "flex items-center gap-3 min-w-[260px] max-w-sm",
  "bg-white dark:bg-s-dm-surface border",
  "rounded-[14px] px-4 py-3.5",
  item.type === "error" && "border-s-coral/25",
  item.type === "success" && "border-[#4CAF6F]/25",
  item.type === "info" && "border-s-ink/[0.08]"
)}
style={{ boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 28px rgba(26,18,9,.08)" }}
```

**Git commit:** `git add components/ui/Toast.tsx && git commit -m "GLOBAL-P5: Toast → remove shadow-glass, warm shadow spec, rounded-[14px]"`

---

## Phase 6 — Toast: Correct Icon Colours Per Type

### Current state (Toast.tsx lines 31–35)
```tsx
const icons = {
  success: <CheckCircle size={18} className="text-s-coral flex-shrink-0" />,
  error:   <XCircle    size={18} className="text-s-coral flex-shrink-0" />,
  info:    <Info       size={18} className="text-s-ink/50 flex-shrink-0" />,
};
```
**Issues:**
- `success` icon is coral — should be green
- `error` icon is coral ✅ — correct
- `info` icon is muted ink — should be amber for better visibility

### Files to modify

#### [MODIFY] [Toast.tsx](file:///c:/Users/sulod/solen/components/ui/Toast.tsx)
**Lines 31–35**:
```tsx
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="flex-shrink-0" style={{ color: "#4CAF6F" }} />,
  error:   <XCircle    size={16} className="text-s-coral flex-shrink-0" />,
  info:    <Info       size={16} className="text-s-amber flex-shrink-0" />,
};
```

Toast message text — bump to `font-heading font-semibold`:
```tsx
<p className="flex-1 text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text leading-snug">
  {item.message}
</p>
```

**Git commit:** `git add components/ui/Toast.tsx && git commit -m "GLOBAL-P6: Toast icons — green success, amber info, font-heading message"`

---

## Phase 7 — Toast: Entry Animation Fix

### Current state (lib/animations.ts — toastVariants)
- Check what `toastVariants` currently defines
- Must be: `opacity: 0 → 1` + `y: 8 → 0` (from below, slides up)
- Must NOT be `scale: 0.9 → 1`

### Files to modify

#### [MODIFY] [lib/animations.ts](file:///c:/Users/sulod/solen/lib/animations.ts)
Find `toastVariants` and update:
```tsx
export const toastVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.25, ease: [0.25, 1, 0.5, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: "easeIn" } },
};
```

**Git commit:** `git add lib/animations.ts && git commit -m "GLOBAL-P7: toastVariants → opacity+y only, no scale"`

---

## Phase 8 — Footer: Section Heading Labels

### Current state (Footer.tsx lines 43–47, 64–66, 90–92, 128–131)
```tsx
<h3 className="text-sm font-medium text-white/60 uppercase tracking-[.20em] mb-4 font-body">
```
**Issues:**
- `font-body font-medium` → `font-heading font-bold`
- `text-sm` = 14px. Footer column labels should be `text-[9px]` to match eyebrow standard

### Files to modify

#### [MODIFY] [Footer.tsx](file:///c:/Users/sulod/solen/components/layout/Footer.tsx)
All footer `<h3>` column labels — 4 occurrences:
```tsx
<h3 className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-white/45 mb-5">
  {t("categories")}
</h3>
```

Footer link text — slight upgrade:
```tsx
// All footer links — from font-body to font-heading font-medium:
<Link href={...}
  className="text-xs font-heading font-medium text-white/55 hover:text-white transition-colors">
  {label}
</Link>
```

**Git commit:** `git add components/layout/Footer.tsx && git commit -m "GLOBAL-P8: footer column labels → font-heading eyebrow, 9px uppercase"`

---

## Phase 9 — Footer: Link Hover Style + Spacing

### Current state (Footer.tsx lines 53–55)
```tsx
className="text-sm text-white/70 hover:text-white hover:underline underline-offset-4 transition-colors font-body"
```
- `hover:underline` — underlines are visually heavy for footer links. Use opacity transition only.
- `text-sm` → `text-xs`
- `font-body` → `font-heading font-medium`

### Files to modify

#### [MODIFY] [Footer.tsx](file:///c:/Users/sulod/solen/components/layout/Footer.tsx)
All link `<Link>` and `<a>` elements in the 4 footer columns — unified class:
```tsx
className="block text-xs font-heading font-medium text-white/50 hover:text-white/90 transition-colors duration-150 leading-relaxed"
```

**Git commit:** `git add components/layout/Footer.tsx && git commit -m "GLOBAL-P9: footer links → xs font-heading, opacity hover, no underline"`

---

## Phase 10 — Footer: Bottom Wordmark + Copyright

### Current state (Footer.tsx lines 155–168)
```tsx
<span className="font-display text-5xl sm:text-6xl tracking-[0.06em] uppercase text-white/90">
  so<span className="text-s-coral">.</span>len
</span>
```
- `font-display` (Bebas Neue) ✅ — allowed in footer brandmark (dark `bg-s-ink` exempt from Zone rules)
- Size `text-5xl` ✅
- Copyright text: `text-xs text-white/40 font-body` → `text-[10px] font-heading text-white/35`
- nDSG compliance line: upgrade to more visible

### Files to modify

#### [MODIFY] [Footer.tsx](file:///c:/Users/sulod/solen/components/layout/Footer.tsx)
**Lines 158–168** — copyright + compliance block:
```tsx
<div className="text-center sm:text-right">
  <p className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-white/30">
    {t("copyright", { year: new Date().getFullYear() })}
  </p>
  <p className="text-[9px] font-heading uppercase tracking-[.10em] text-white/20 mt-1">
    {t("compliance")}
  </p>
  <div className="flex items-center justify-center sm:justify-end gap-1.5 mt-3">
    <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF6F]" />
    <p className="text-[9px] font-heading uppercase tracking-[.08em]" style={{ color: "rgba(76,175,111,.60)" }}>
      nDSG-konform · Schweizer Datenschutz
    </p>
  </div>
</div>
```

**Git commit:** `git add components/layout/Footer.tsx && git commit -m "GLOBAL-P10: footer copyright → 10px font-heading, green nDSG dot indicator"`

---

## Phase 11 — TrustBadges: Read + Verify

### ⚠️ Must read `components/ui/TrustBadges.tsx` before implementing

```bash
cat components/ui/TrustBadges.tsx
```

Expected issues:
- Badge cards may use `rounded-card` or glass → replace with outlined pill/chip style
- Text labels should be `font-heading font-bold uppercase`
- TrustBadges appear inside the dark footer — tokens need to use `text-white/70` not the default ink tokens

### Files to modify

#### [MODIFY] [TrustBadges.tsx](file:///c:/Users/sulod/solen/components/ui/TrustBadges.tsx)
```tsx
// Each badge should be a clean pill on dark bg:
<div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10">
  <Icon size={13} className="text-white/50 shrink-0" />
  <span className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-white/50">
    {label}
  </span>
</div>
```

Wrapper:
```tsx
<div className="flex flex-wrap items-center justify-center gap-2 py-8 border-t border-b border-white/[0.06] my-8">
  {badges.map(badge => <BadgePill key={badge.label} {...badge} />)}
</div>
```

**Git commit:** `git add components/ui/TrustBadges.tsx && git commit -m "GLOBAL-P11: TrustBadges → pill chips on dark bg, font-heading labels"`

---

## Phase 12 — BottomNav: Read + Zone 3/4 Fix

### ⚠️ Must read `components/layout/BottomNav.tsx` before implementing

```bash
cat components/layout/BottomNav.tsx
```

Expected issues:
- `bg-white/80 backdrop-blur-md` — glass on mobile bottom nav is heavy for Z3/Z4 pages. Replace with `bg-white border-t border-s-ink/[0.06]`
- Safe-area padding: `pb-[env(safe-area-inset-bottom)]`
- Active icon: `text-s-coral` ✅, active label: font-heading

### Files to modify

#### [MODIFY] [BottomNav.tsx](file:///c:/Users/sulod/solen/components/layout/BottomNav.tsx)
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-s-dm-surface border-t border-s-ink/[0.06] dark:border-white/[0.05]"
  style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
  <div className="flex items-stretch max-w-lg mx-auto">
    {tabs.map(tab => {
      const active = pathname.includes(tab.href);
      return (
        <Link key={tab.href} href={tab.href}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
            active ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink/70"
          }`}>
          <tab.Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
          <span className="text-[8px] font-heading font-bold uppercase tracking-[.08em]">
            {tab.label}
          </span>
        </Link>
      );
    })}
  </div>
</nav>
```

**Git commit:** `git add components/layout/BottomNav.tsx && git commit -m "GLOBAL-P12: BottomNav → solid white, safe-area pb, coral active, no glass"`

---

## Phase 13 — Spinner: Warm Colour Token

### ⚠️ Must read `components/ui/Spinner.tsx`

```bash
cat components/ui/Spinner.tsx
```

Expected issues:
- Spinner uses `border-gray-200 border-t-gray-800` — cold tokens
- Replace with warm: `border-s-ink/10 border-t-s-ink/60`
- `invert` prop (for white CTAs): `border-white/30 border-t-white`

### Files to modify

#### [MODIFY] [Spinner.tsx](file:///c:/Users/sulod/solen/components/ui/Spinner.tsx)
```tsx
interface SpinnerProps { size?: "sm" | "md" | "lg"; invert?: boolean; }

const sizeMap = { sm: "w-3.5 h-3.5", md: "w-5 h-5", lg: "w-8 h-8" };

export default function Spinner({ size = "md", invert }: SpinnerProps) {
  return (
    <div role="status" aria-label="Laden…"
      className={cn(
        "animate-spin rounded-full border-2",
        sizeMap[size],
        invert
          ? "border-white/30 border-t-white"
          : "border-s-ink/[0.10] border-t-s-ink/60"
      )} />
  );
}
```

**Git commit:** `git add components/ui/Spinner.tsx && git commit -m "GLOBAL-P13: Spinner → warm ink tokens, white invert mode"`

---

## Phase 14 — Skeleton: Warm Pulse Token

### ⚠️ Must read `components/ui/Skeleton.tsx`

```bash
cat components/ui/Skeleton.tsx
```

Expected issues:
- `bg-gray-200 animate-pulse` — cold token
- Replace with `bg-s-bg-sunken animate-pulse`

### Files to modify

#### [MODIFY] [Skeleton.tsx](file:///c:/Users/sulod/solen/components/ui/Skeleton.tsx)
```tsx
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-[8px] bg-s-bg-sunken dark:bg-white/[0.06]", className)}
      style={style}
    />
  );
}
```

**Git commit:** `git add components/ui/Skeleton.tsx && git commit -m "GLOBAL-P14: Skeleton → bg-s-bg-sunken warm token, rounded-[8px]"`

---

## Phase 15 — SalonCard: NEVER Violation Triage (CRITICAL)

### Current state (SalonCard.tsx — from previous audit)
```tsx
// Hover blob morph:
className="... group-hover:rounded-blob-d transition-all ..."

// Cold shadow:
className="... shadow-[0_4px_16px_rgba(0,0,0,.12)] ..."

// Scale on hover:
className="... hover:scale-[1.02] ..."
```
**All three are NEVER violations.**

### ⚠️ BE CAREFUL — SalonCard is used on Homepage, Category, Salon Profile (related salons), and Search. This is the highest-risk refactor on the platform.

1. Pull up EVERY page that imports SalonCard and check the surrounding context zone.
2. Refactor ONLY the violating properties — preserve all logic, click handlers, image loading.
3. Run `npm run build` AND manually test on /coiffeur grid before treating as done.

### Files to modify

#### [MODIFY] [SalonCard.tsx](file:///c:/Users/sulod/solen/components/SalonCard.tsx)

**Remove blob morph on hover:**
```tsx
// Before:
className="... rounded-card group-hover:rounded-blob-d transition-all ..."

// After — Zone 2 compliant hover (lift only):
className="... rounded-[16px] transition-[transform,box-shadow] duration-300 ..."
```

**Remove scale on hover:**
```tsx
// Before:
className="... hover:scale-[1.02] ..."

// After:
className="... hover:-translate-y-[6px] ..."
```

**Fix cold shadow:**
```tsx
// Before:
style={{ boxShadow: "0 4px 16px rgba(0,0,0,.12)" }}

// After — warm shadow:
style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 24px rgba(26,18,9,.08)" }}
```

**Hover shadow enhancement:**
```tsx
// Add hover shadow upgrade:
className="... hover:shadow-warm-md ..."
// OR inline:
// onMouseEnter: style.boxShadow = "0 4px 8px rgba(26,18,9,.10), 0 16px 32px rgba(26,18,9,.12)"
```

**Availability pill** — verify it uses `rounded-pill` (99px) not `rounded-btn`:
```tsx
// Correct for availability pill:
<span className="px-2.5 py-1 rounded-pill text-[9px] font-heading font-bold uppercase tracking-[.08em]
  bg-[#4CAF6F]/15 text-[#1f6535]">
  Verfügbar
</span>
```

**Git commit:** `git add components/SalonCard.tsx && git commit -m "GLOBAL-P15: SalonCard CRITICAL — remove blob morph hover (NEVER #6), cold shadow, hover scale"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Header scroll pill | ✅ Start here |
| P2 | Header mobile menu scale | After P1 (same file) |
| P3 | Header category label | After P1 (same file) |
| P4 | Header profile button | After P1 (same file) |
| P5 | Toast shadow | ✅ Independent |
| P6 | Toast icon colours | After P5 (same file) |
| P7 | Toast animation | ✅ Independent (lib/animations.ts) |
| P8 | Footer labels | ✅ Independent |
| P9 | Footer links | After P8 (same file) |
| P10 | Footer bottom | After P8 (same file) |
| P11 | TrustBadges | ✅ Independent (read first) |
| P12 | BottomNav | ✅ Independent (read first) |
| P13 | Spinner | ✅ Independent (read first) |
| P14 | Skeleton | ✅ Independent (read first) |
| P15 | SalonCard NEVER fixes | 🔴 LAST — test thoroughly |

> P1→P4 sequential (Header file).
> P5→P6 sequential (Toast file).
> P7–P14 all parallel.
> P15 **must** be absolute last — build + visual check.

---

## GLOBAL COMPONENTS FINAL COMPLIANCE CHECK

```bash
npm run build

# Verified: no scale between 0-1 or >1.02 on motion/hover:
grep -rn "scale: 0\|scale-\[1\.\|hover:scale\|scale-105\|scale-110" components/layout/ components/ui/ components/SalonCard.tsx
# Expected: 0 results (hover:scale-[0.98] for active states is OK)

# Verified: no cold shadows:
grep -rn "rgba(0,0,0\|shadow-glass\|shadow-black" components/layout/ components/ui/ components/SalonCard.tsx
# Expected: 0 results

# Verified: no blob morphing on SalonCard:
grep -rn "rounded-blob" components/SalonCard.tsx
# Expected: 0 results

# Verified: no font-body for structural labels:
grep -rn "font-body font-medium\|font-body font-semibold" components/layout/Header.tsx components/layout/Footer.tsx
# Expected: 0 results (font-body only for body copy)

# Manual checklist:
# ✅ Header pill shrinks smoothly on scroll — warm glass border visible
# ✅ Mobile menu: slides in with opacity+y, NO scale pop
# ✅ Profile button: no scale on hover, active:scale-[0.98] only
# ✅ Toast: green checkmark for success, amber info icon, warm shadow
# ✅ Footer column labels: tiny 9px uppercase eyebrow labels
# ✅ TrustBadges: pill chips not cards on dark bg
# ✅ BottomNav: solid white, no blur, safe-area padding
# ✅ Spinner: warm ink border, correct invert for CTA buttons
# ✅ SalonCard: no blob morph, no cold shadow, lift-translate on hover
# ✅ SalonCard grid on /coiffeur: cards align, no layout shift on hover
```
