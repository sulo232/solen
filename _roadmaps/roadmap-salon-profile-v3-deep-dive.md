# Salon Profile Page — Deep-Dive V3 Roadmap

> **Scope:** Every section of `app/[locale]/salon/[slug]/page.tsx` and its direct sub-components.
> **Zone:** Zone 2 (Soft Maximalist) — max 1 background blob at 50% opacity, glass Tier 2 allowed, no grain.
> **File size:** 1,103 lines — plan phases carefully to isolate changes.

---

## Breakage Risk Assessment

| Phase | Risk | Reason |
|---|---|---|
| P1 — Page background + blob | 🟢 Low | CSS wrapper only |
| P2 — Photo gallery | 🟡 Medium | Nav button glass upgrade, lightbox improvement |
| P3 — Breadcrumb | 🟢 Low | Typography only |
| P4 — Salon header (name, meta, category tags) | 🟢 Low | Visual-only |
| P5 — Off-Peak countdown widget | 🟢 Low | Component-level only |
| P6 — Tab bar (sticky nav) | 🟡 Medium | Sticky position + bg change |
| P7 — Opening hours | 🟢 Low | Styling only |
| P8 — Salon info tiles | 🟢 Low | Card design upgrade |
| P9 — Services list | 🟡 Medium | Row interaction + category label |
| P10 — Staff / Team cards | 🟢 Low | Avatar + card styling |
| P11 — Review cards | 🟡 Medium | Glass upgrade + eyebrow |
| P12 — Sidebar booking panel | 🔴 High | Sticky sidebar is the core CTA — test thoroughly |
| P13 — Empty/loading states | 🟢 Low | Skeleton + not-found pages |
| P14 — Mobile bottom sheet | 🟡 Medium | BottomSheet component styling |
| P15 — Nearby salons section | 🟢 Low | Section header + card grid |

---

## Phase 1 — Page Wrapper: Zone 2 Background + Single Blob

### Current state (line 384)
```tsx
<div className="min-h-screen bg-white dark:bg-s-dm-bg">
```
- Pure white — misses the warm cream Z2 base
- No background blob

### ⚠️ BE CAREFUL
- Zone 2 = max 1 blob at 50% opacity. Use `#FAF6EF` (var --bg) as base, NOT pure white.
- The blob must be `position: absolute`, `pointer-events-none`, `z-index: 0`. Content must be `z-10`.
- Dark mode: base stays `#151009` (--dm-bg). Blob: `rgba(232,98,74,0.05)`.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Line 384** — outer wrapper

✅ DO:
```tsx
<div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg relative overflow-x-hidden">
  {/* Zone 2: max 1 blob — top-right, 50% opacity */}
  <div className="absolute w-[400px] h-[400px] rounded-full right-[-100px] top-[-100px] pointer-events-none z-0"
    style={{ background: "rgba(232,98,74,.07)" }} />
  {/* All content goes in z-10 */}
  <div className="relative z-10">
    {/* ... everything inside ... */}
  </div>
</div>
```

❌ DON'T:
```tsx
// Don't use pure bg-white — warm cream only
className="min-h-screen bg-white"
// Don't add MORE than 1 blob — Zone 2 strict limit
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P1: Zone 2 warm cream bg, single coral blob top-right"`

---

## Phase 2 — Photo Gallery: Edge-to-Edge Mosaic + Glass Nav Buttons

### Current state (lines 400–440)
- `aspect-[16/7] rounded-card` — small aspect ratio, rounded corners on a full-width element
- Nav buttons: `bg-white/80 backdrop-blur` — missing inset highlight, cold shadow
- Dot indicators: small `h-1.5` pills — too small to tap
- No lightbox (variable `lightboxPhoto` exists but no lightbox component found inline)
- No photo count badge ("1 / 5")
- No keyboard navigation aria

### ⚠️ BE CAREFUL
- Photo gallery is the visual hero of the salon page — it's the first thing users see after the hero. Get the details right.
- Don't change the `AnimatePresence + crossfade` logic — it's correct. Only restyle the container.
- `priority` on the first image must stay for LCP.
- The `rounded-card` on a section-level container is inconsistent — a full-width gallery that goes edge-to-edge should have `rounded-[20px]` with `overflow-hidden` or be flush to the edges entirely on mobile.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 400–440** — Gallery block

```tsx
{/* Photo gallery */}
<div className="relative w-full aspect-[16/7] rounded-[20px] overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg mb-8 select-none">
  <AnimatePresence mode="wait" initial={false}>
    {photos[photoIndex] && (
      <motion.div key={photoIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
        <Image src={photos[photoIndex]} alt={`${salon.name} — Foto ${photoIndex + 1}`}
          fill className="object-cover" priority={photoIndex === 0} />
      </motion.div>
    )}
  </AnimatePresence>

  {photos.length === 0 && (
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="font-display text-[80px] text-s-ink/10 dark:text-white/10">{salon.name[0]}</span>
    </div>
  )}

  {photos.length > 1 && (
    <>
      {/* Left nav */}
      <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
        aria-label="Vorheriges Foto"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(8px)",
                 WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.50)",
                 boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
        <ChevronLeft className="w-5 h-5 text-s-ink" />
      </button>
      {/* Right nav */}
      <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
        aria-label="Nächstes Foto"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(8px)",
                 WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.50)",
                 boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
        <ChevronRight className="w-5 h-5 text-s-ink" />
      </button>

      {/* Photo counter badge */}
      <span className="absolute top-3 right-3 text-xs font-heading font-bold px-2.5 py-1 rounded-btn"
        style={{ background: "rgba(26,18,9,.55)", color: "rgba(255,255,255,.90)" }}>
        {photoIndex + 1} / {photos.length}
      </span>

      {/* Dot indicators — tappable */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, i) => (
          <button key={i} onClick={() => setPhotoIndex(i)} aria-label={`Foto ${i + 1}`}
            className={`rounded-full transition-all ${i === photoIndex ? "bg-white w-3 h-3" : "bg-white/50 w-2 h-2"}`} />
        ))}
      </div>
    </>
  )}
</div>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P2: gallery glass nav buttons, photo counter, tappable dots, 20px radius"`

---

## Phase 3 — Breadcrumb: Eyebrow-Style Micro Nav

### Current state (lines 386–396)
- `text-xs text-s-ink/40` — too faint, no visual weight
- No chevron styling consistency

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 386–396** — breadcrumb

```tsx
<nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-3">
  <ol className="flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-[.12em]">
    <li><Link href={`/${locale}`} className="text-s-ink/35 hover:text-s-coral transition-colors">Home</Link></li>
    <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
    {salon.categories[0] && (
      <>
        <li><Link href={`/${locale}/${salon.categories[0]}`}
          className="text-s-ink/35 hover:text-s-coral capitalize transition-colors">{salon.categories[0]}</Link></li>
        <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
      </>
    )}
    <li className="text-s-ink/70 truncate max-w-[200px]" aria-current="page">{salon.name}</li>
  </ol>
</nav>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P3: breadcrumb → eyebrow nav, uppercase tracking, aria-current"`

---

## Phase 4 — Salon Header: Name, Status, Category Tags, Meta Links

### Current state (lines 447–518)
- H1: `font-heading font-bold text-[clamp(28px,4vw,44px)]` ✅ good
- Open/closed dot: `bg-s-success animate-pulse` — pulse on the dot is distracting (animate-pulse on a tiny dot is noisy). Replace with static dot.
- Category tags: `bg-s-coral/10 text-s-coral px-2.5 py-1 rounded-pill` — all using coral regardless of category — WRONG per rulebook ch16
- Meta links (address, phone, etc.): `text-s-ink/60 hover:text-s-coral` ✅ fine

### ⚠️ BE CAREFUL
- The open/closed status readout is a live indicator — keep the functional logic (todayHours parsing) entirely, only remove the `animate-pulse` animation.
- Category tags per-colour must match the CAT_COLOURS map from R32-P2.
- The `ReportContentButton` (line 517) stays where it is — it's correctly positioned.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 447–518** — header block

1. **Remove `animate-pulse` from the open/closed dot** (line 452):
```tsx
// Before:
<span className={`w-2 h-2 rounded-full ${isOpen ? "bg-s-success animate-pulse" : "bg-s-sand-dark"}`} />
// After (no animate-pulse — static dot):
<span className={`w-2 h-2 rounded-full ${isOpen ? "bg-s-success" : "bg-s-ink/20 dark:bg-white/20"}`} />
```

2. **Category tags per-category colour** (lines 456–465):
```tsx
const CAT_TAG_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "rgba(212,135,10,.12)",  text: "#6B4005" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(232,98,74,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2E5E3A" },
  makeup:     { bg: "rgba(212,135,10,.10)",  text: "#6B4005" },
  waxing:     { bg: "rgba(107,163,200,.15)", text: "#1A4D72" },
};
// In JSX:
{salon.categories.map((cat) => {
  const colours = CAT_TAG_COLOURS[cat] ?? { bg: "rgba(232,98,74,.12)", text: "#7A2415" };
  return (
    <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em]"
      style={{ background: colours.bg, color: colours.text }}>
      {cat}
    </span>
  );
})}
```

3. **Meta links row**: Add `gap-3` and ensure each link has a `rounded-[6px]` hover bg state:
```tsx
className="flex flex-wrap gap-3 mt-3"
// Each link:
className="flex items-center gap-1.5 text-sm text-s-ink/55 dark:text-s-dm-text/55 hover:text-s-coral transition-colors px-2 py-1 rounded-[8px] hover:bg-s-coral/[0.06]"
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P4: header — remove dot pulse, category tag colours, meta link hover states"`

---

## Phase 5 — Off-Peak Countdown: Glass Tier 2 + Pulse Ring

### Current state (lines 204–222 — `OffPeakCountdown` component)
- `bg-s-coral/10 border border-s-coral/20 rounded-card` — flat tinted
- `w-9 h-9 rounded-full bg-s-coral/15` icon container — flat
- Countdown: `data-text font-bold text-lg text-s-coral` ✅ good

### ⚠️ BE CAREFUL
- This widget uses a live countdown tick (setInterval). Don't touch the timer logic.
- The coral animate-pulse ring around the icon is correct here (it's a time-urgency signal, not a status dot).
- Hidden when no active slot (`if (!slot || !remaining) return null`) ✅ — keep.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 204–221** — `OffPeakCountdown` return

```tsx
return (
  <div className="flex items-center gap-4 px-5 py-4 rounded-[20px]"
    style={{ background: "rgba(232,98,74,.08)", border: "1px solid rgba(232,98,74,.18)",
             boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
    <div className="relative shrink-0">
      <div className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "rgba(232,98,74,.15)" }}>
        <Clock size={18} className="text-s-coral" />
      </div>
      {/* Pulse ring for urgency */}
      <div className="absolute inset-0 rounded-full animate-coral-pulse" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
        Off-Peak: {slot.discount_percent}% Rabatt
      </p>
      <p className="text-xs text-s-ink/50 mt-0.5">
        Heute {slot.start_time}–{slot.end_time} Uhr
      </p>
    </div>
    <div className="shrink-0 text-right">
      <div className="font-display text-[32px] leading-none text-s-coral">{remaining}</div>
      <div className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-s-ink/35 mt-0.5">verbleibend</div>
    </div>
  </div>
);
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P5: off-peak countdown → glass card, Bebas Neue timer, pulse ring"`

---

## Phase 6 — Tab Bar: Glass Tier 1 Sticky Nav

### Current state (lines 524–537)
- `bg-white dark:bg-s-dm-bg border-b border-s-ink/5` — flat opaque white
- `sticky top-[57px]` — depends on nav height; fragile
- Active tab: `border-b-2 border-s-coral text-s-coral` ✅ correct indicator
- Tab font: `text-sm font-medium` — should be `font-heading font-bold text-xs uppercase tracking-[.10em]`

### ⚠️ BE CAREFUL
- The sticky offset `top-[57px]` must match the actual nav height. If nav height changes, this breaks. Add a CSS custom property `--nav-h: 57px` in the nav itself and reference it here.
- Glass on sticky elements requires `isolation: isolate` on the parent to prevent z-index bleed.
- Don't change the active state detection logic (scroll to section on click) — only restyle.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 524–537** — Tab bar

```tsx
<div className="hidden md:flex items-center gap-0 border-b border-s-ink/[0.06] dark:border-white/[0.06] sticky top-[57px] z-10 isolate"
  style={{ background: "rgba(250,246,239,.82)", backdropFilter: "blur(28px) saturate(1.3)",
           WebkitBackdropFilter: "blur(28px) saturate(1.3)",
           boxShadow: "inset 0 -1px 0 rgba(26,18,9,.06)" }}
  role="tablist">
  {TABS.map(({ key, label }) => (
    <button key={key} role="tab" aria-selected={activeTab === key} aria-controls={`section-${key}`}
      onClick={() => { setActiveTab(key); document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
      className={`px-5 py-3.5 text-[11px] font-heading font-bold uppercase tracking-[.12em] transition-colors border-b-2 -mb-px ${
        activeTab === key
          ? "border-s-coral text-s-coral"
          : "border-transparent text-s-ink/45 hover:text-s-ink dark:text-s-dm-text/45 dark:hover:text-s-dm-text"
      }`}>
      {label}
    </button>
  ))}
</div>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P6: tab bar → glass Tier 1 sticky, uppercase tracking, role=tablist"`

---

## Phase 7 — Opening Hours: Clean Data Table

### Current state (lines 540–589)
- Mobile: today preview + collapse expand ✅ (good pattern)
- Desktop: `grid-cols-2 gap-x-8` table ✅
- Today's row: not visually highlighted vs other days
- `data-text` class on times ✅ (tabular nums)

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 574–588** — Desktop hours grid, add today highlight:

```tsx
{DAY_KEYS.map((key, i) => {
  const h = salon.opening_hours[key];
  const isToday = key === dayKey;
  const label = locale === "de" ? DAYS_DE[i] : DAYS_EN[i];
  return (
    <div key={key} className={`flex justify-between text-sm py-1.5 px-2 rounded-[8px] ${isToday ? "bg-s-coral/[0.08]" : ""}`}>
      <span className={`${isToday ? "font-heading font-bold text-s-ink" : "text-s-ink/50"}`}>{label}</span>
      <span className={`data-text ${h ? (isToday ? "font-bold text-s-coral" : "text-s-ink dark:text-s-dm-text") : "text-s-ink/20"}`}>
        {h ? `${h.open}–${h.close}` : "Geschlossen"}
      </span>
    </div>
  );
})}
```

**Also:** Wrap hours in a glass Tier 2 card container:
```tsx
<div className="rounded-[20px] p-5"
  style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
           WebkitBackdropFilter: "blur(16px) saturate(1.2)",
           border: "1px solid rgba(255,255,255,.55)",
           boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
  {/* h2 + hours grid */}
</div>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P7: opening hours → today row highlighted, glass card wrap, coral time"`

---

## Phase 8 — Salon Info Tiles: Glass Tier 2 Cards

### Current state (lines 592–636)
- `bg-s-bg-surface dark:bg-s-dm-surface rounded-card` — flat surface card
- Icon: `w-4 h-4 text-s-coral` — all coral regardless of type
- Label: `text-xs font-medium text-s-ink/40 uppercase tracking-wide` — `tracking-wide` should be `tracking-[.16em]`

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 597–634** — Info tile grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {/* Per tile */}
  <div className="flex items-start gap-3 p-4 rounded-[16px]"
    style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
             WebkitBackdropFilter: "blur(16px) saturate(1.2)",
             border: "1px solid rgba(255,255,255,.55)",
             boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}>
    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
      style={{ background: "rgba(232,98,74,.10)" }}>
      <Sparkles className="w-4 h-4 text-s-coral" />
    </div>
    <div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/35 mb-1">Atmosphäre</p>
      <p className="text-sm text-s-ink dark:text-s-dm-text leading-snug">{(salon as any).atmosphere}</p>
    </div>
  </div>
</div>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P8: salon info tiles → glass Tier 2 cards, icon box, uppercase tracking fix"`

---

## Phase 9 — Services List: Row Hover + Coral Booking Chip

### Current state (lines 765–799)
- Service row: `hover:bg-s-bg-surface` — good but `bg-s-bg-surface` is flat, no radius
- Selected state: `bg-s-coral/5` ✅ coral tint for selected
- `"Buchen"` text only visible on `sm:inline` — tiny and easy to miss
- Duration: clock icon + plain text — correct
- Price: `data-text font-semibold` ✅

### ⚠️ BE CAREFUL
- Each service row is a `<button>` with `onClick` that opens booking calendar. Don't change the click logic.
- Don't add glass to individual service rows — they are in a list context (Zone 2, data-heavy). Keep simple surface UI.
- "Buchen" pill chip must always be visible, not just on sm+.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Lines 765–800** — Service rows

1. Service row container: add `rounded-[12px]` on hover:
```tsx
className={`w-full flex items-center justify-between py-3.5 px-3 rounded-[12px] text-left transition-all duration-[200ms] 
  ${selectedService === svc.id
    ? "bg-s-coral/[0.08] border border-s-coral/20"
    : "hover:bg-s-bg-surface dark:hover:bg-s-dm-surface hover:shadow-warm-xs border border-transparent"
  }`}
```

2. "Buchen" chip — always visible:
```tsx
<span className="text-[10px] font-heading font-bold uppercase tracking-[.08em] text-s-coral px-2.5 py-1 rounded-btn"
  style={{ background: "rgba(232,98,74,.10)" }}>
  Buchen
</span>
```

3. Category section label — eyebrow style:
```tsx
// Before:
<p className="text-xs font-medium text-s-ink/40 uppercase tracking-wider mb-2 capitalize">{cat}</p>
// After:
<p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3 mt-1">{cat}</p>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P9: services list — rounded row hover, coral Buchen chip always visible, amber category label"`

---

## Phase 10 — Staff / Team Cards: Avatar Ring + V3 Card Style

### Current state — Barber cards (lines 706–721):
- `rounded-card bg-white border border-s-ink/5` — flat white
- `hover:-translate-y-[5px] hover:shadow-warm-xl` ✅ correct V3 hover
- Avatar: `rounded-full bg-s-bg-surface` ✅

### Current state — NailArtistPreviewCard (lines 99–143):
- `rounded-card border border-s-ink/5 bg-white` — flat
- Portfolio grid: `rounded-[12px]` ✅

### ⚠️ BE CAREFUL — NailArtistPreviewCard is its own inline component, not extracted. Keep it inline for Phase 10, just update the card styling.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)

**Barber roster cards (lines 706–721)** — upgrade to glass Tier 2:
```tsx
<Link href={...}
  className="rounded-[20px] p-4 text-center hover:-translate-y-[5px] transition-all duration-[250ms]"
  style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
           WebkitBackdropFilter: "blur(16px) saturate(1.2)",
           border: "1px solid rgba(255,255,255,.55)",
           boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
  {/* Avatar with coral ring on hover */}
  <div className="w-14 h-14 rounded-full mx-auto mb-3 overflow-hidden ring-2 ring-transparent group-hover:ring-s-coral/40 transition-all">
    ...
  </div>
```

**NailArtistPreviewCard (lines 100–142)** — card bg upgrade:
```tsx
// Change:
className="rounded-card border border-s-ink/5 dark:border-s-dm-text/10 p-4 bg-white dark:bg-s-dm-surface"
// To:
className="rounded-[20px] p-4"
style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
         border: "1px solid rgba(255,255,255,.55)",
         boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P10: staff cards → glass Tier 2, coral avatar ring on hover"`

---

## Phase 11 — Review Cards: Glass Tier 2 + Eyebrow + Sort Pills

### Current state (ReviewBreakdown.tsx + inline reviews rendering)
- Review section has no eyebrow label
- Review cards: unknown styling (ReviewBreakdown is in a separate component)
- Sort: `reviewSort` state + buttons — styling unknown

### ⚠️ BE CAREFUL
- `ReviewBreakdown` is imported and rendered separately. Check `components/ReviewBreakdown.tsx` styling separately.
- Sort buttons must use pill style (rounded-btn, coral active, ghost inactive).
- The "Bewertung schreiben" button must be coral pill.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)

Add eyebrow above review section heading (find `id="section-bewertungen"`):
```tsx
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  Bewertungen
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text mb-4"
  style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em" }}>
  Was Kund:innen sagen
</h2>
```

Sort pill styling:
```tsx
// Active sort:
className="px-3 py-1.5 rounded-btn bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.06em]"
// Inactive sort:
className="px-3 py-1.5 rounded-btn bg-s-bg-raised border border-s-ink/[0.08] text-s-ink/60 text-xs font-heading font-bold uppercase tracking-[.06em] hover:border-s-ink/20 transition-all"
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P11: reviews → eyebrow, sort pill styling, coral write-review button"`

---

## Phase 12 — Sidebar Booking Panel: Glass Tier 2 Sticky Card

### Current state (right column on desktop — the booking trigger sidebar)
- Need to read lines 800–1000 to find exact sidebar markup — the `lg:col-span-1` right column
- Expected: `<BookingCalendar>` component embedded in a sticky panel

### ⚠️ BE CAREFUL — THIS IS THE MOST CRITICAL PHASE
- The sidebar is the primary conversion element. Any layout break = LOST BOOKINGS.
- The `<BookingCalendar>` component is 40KB — do NOT touch its internals.
- Only restyle the sidebar wrapper card (the `div` that wraps `BookingCalendar`).
- Sticky position: `sticky top-[calc(57px+1rem)]` — ensure offset is correct.
- Mobile: sidebar is hidden on mobile (`hidden lg:block`) — booking triggered via `<BottomSheet>` separately.

### Files to modify

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
Look for the right column `lg:col-span-1` div and upgrade its wrapper:

```tsx
{/* Sidebar sticky wrapper */}
<div className="hidden lg:block lg:col-span-1">
  <div className="sticky top-[calc(57px+1rem)] rounded-[20px] overflow-hidden"
    style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(24px) saturate(1.3)",
             WebkitBackdropFilter: "blur(24px) saturate(1.3)",
             border: "1px solid rgba(255,255,255,.80)",
             boxShadow: "0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08), inset 0 1px 0 rgba(255,255,255,.90)" }}>
    <BookingCalendar ... />
  </div>
</div>
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P12: sidebar booking panel → glass Tier 2 premium sticky card"`

---

## Phase 13 — Loading + Not Found States: Branded Skeletons

### Current state
- Loading (line 304–306): `<Spinner size="lg" />` centered on full page — generic
- Not found (lines 308–315): plain text, no branding

### Files to modify

#### [MODIFY] [loading.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/loading.tsx)
Upgrade to skeleton-based loading state:
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-s-bg-base">
      {/* Gallery skeleton */}
      <div className="max-w-5xl mx-auto px-4 pt-16">
        <div className="w-full aspect-[16/7] rounded-[20px] bg-s-bg-sunken dark:bg-white/10 animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-8 w-48 bg-s-bg-sunken rounded-btn animate-pulse" />
            <div className="h-5 w-32 bg-s-bg-sunken rounded-btn animate-pulse" />
            <div className="h-4 w-64 bg-s-bg-sunken rounded animate-pulse" />
          </div>
          <div className="hidden lg:block">
            <div className="h-[400px] rounded-[20px] bg-s-bg-sunken animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
**Not found state (lines 308–315)**:
```tsx
if (!salon) {
  return (
    <div className="min-h-screen bg-s-bg-base flex flex-col items-center justify-center gap-6 px-4">
      <div className="font-display text-[80px] leading-none text-s-ink/10">404</div>
      <p className="font-heading font-bold text-s-ink text-2xl">Salon nicht gefunden</p>
      <p className="font-body text-s-ink/50 text-sm text-center max-w-xs">
        Dieser Salon wurde möglicherweise entfernt oder umbenannt.
      </p>
      <Link href={`/${locale}/coiffeur`}
        className="px-6 py-3 rounded-btn bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em]"
        style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}>
        Alle Salons ansehen
      </Link>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/salon/[slug]/page.tsx app/[locale]/salon/[slug]/loading.tsx && git commit -m "SP-P13: branded skeleton loader, 404 not found V3 state"`

---

## Phase 14 — Mobile Bottom Sheet: Glass + Drag Handle

### Current state
- `<BottomSheet>` component wraps `<BookingCalendar>` on mobile (lines ~1050)
- `<button>` at page bottom triggers `setMobileSheetOpen(true)`

### ⚠️ BE CAREFUL
- `BottomSheet.tsx` is used elsewhere — style it in its own component file, not inline.
- The bottom trigger button must be a full-width coral pill, matching V3 button spec.

### Files to modify

#### [MODIFY] [BottomSheet.tsx](file:///c:/Users/sulod/solen/components/ui/BottomSheet.tsx)
Upgrade container to glass + drag handle:
```tsx
// Sheet container:
<div className="rounded-t-[28px] overflow-hidden pt-5"
  style={{ background: "rgba(250,246,239,.96)", backdropFilter: "blur(28px) saturate(1.3)",
           WebkitBackdropFilter: "blur(28px) saturate(1.3)",
           boxShadow: "0 -8px 32px rgba(26,18,9,.12), inset 0 1px 0 rgba(255,255,255,.80)" }}>
  {/* Drag handle */}
  <div className="w-10 h-1 rounded-full bg-s-ink/15 mx-auto mb-5" />
  {children}
</div>
```

#### [MODIFY] [page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/salon/%5Bslug%5D/page.tsx)
Mobile booking trigger button:
```tsx
<button onClick={() => setMobileSheetOpen(true)}
  className="fixed bottom-5 left-4 right-4 lg:hidden py-4 rounded-btn text-white font-heading font-bold text-sm uppercase tracking-[.04em] z-40"
  style={{ background: "#E8624A", boxShadow: "0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22)" }}>
  Jetzt buchen
</button>
```

**Git commit:** `git add components/ui/BottomSheet.tsx app/[locale]/salon/[slug]/page.tsx && git commit -m "SP-P14: mobile bottom sheet glass + drag handle, fixed coral booking button"`

---

## Phase 15 — Nearby Salons: Section Eyebrow + Card Grid

### Current state
- `<NearbySalons>` component at bottom of page
- Section has no eyebrow label

### Files to modify

#### [MODIFY] [NearbySalons.tsx](file:///c:/Users/sulod/solen/components/NearbySalons.tsx)
Add eyebrow label above heading:
```tsx
<span className="block font-heading font-bold text-[11px] uppercase tracking-[.22em] text-s-amber mb-2">
  In deiner Nähe
</span>
<h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text mb-6"
  style={{ fontSize: "clamp(22px, 3vw, 32px)", letterSpacing: "-0.02em" }}>
  Ähnliche Salons
</h2>
```

**Git commit:** `git add components/NearbySalons.tsx && git commit -m "SP-P15: nearby salons eyebrow label + heading V3 spec"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Page bg + blob | ✅ Start here |
| P2 | Photo gallery | ✅ Independent |
| P3 | Breadcrumb | ✅ Independent |
| P4 | Header (name/meta/tags) | ✅ Independent |
| P5 | Off-peak countdown | ✅ Independent |
| P6 | Tab bar glass | ✅ Independent |
| P7 | Opening hours | ✅ Independent |
| P8 | Info tiles | ✅ Independent |
| P9 | Services list | ✅ Independent |
| P10 | Staff cards | ✅ Independent |
| P11 | Reviews | ✅ Independent |
| P12 | Sidebar booking panel | ⚠️ After P1-P11 — most critical |
| P13 | Loading/not-found | ✅ Independent |
| P14 | Mobile bottom sheet | After P12 (same booking flow) |
| P15 | Nearby salons | ✅ Independent |

> P1–P11, P13, P15 can all run in parallel. P12 and P14 must be done together last.

---

## Final Verification

```bash
npm run build

# Test routes:
# /de/salon/[any-slug] — full page renders
# Check sticky tab bar scrolls correctly
# Check mobile booking button opens bottom sheet
# Check photo gallery nav + counter
# Check today row highlighted in hours
# Check off-peak countdown ticks live
# prefers-reduced-motion: all animations off
```
