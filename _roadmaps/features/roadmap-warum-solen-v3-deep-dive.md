# Warum Solen Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/warum-solen/page.tsx` (404 lines) — marketing/value prop page with 5 feature sections + hero + bottom CTA. Single file. No external component dependencies except `StampCard`, `SolenExclusiveBadge`, and standard Lucide icons.
> **Zone: 1 (Maximalist)** — This is a marketing page. Rich radial gradients ✅, subtle mesh backgrounds ✅. No glass on the bottom CTA card (currently violating). Blob shapes NOT permitted (NEVER #6). Inline mock UIs (MockChat, MockCompare, MockMap, photo demo) are editorial illustrations — keep their overall visual concept, refine their radius and font tokens.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| `animate-photo-upload` (line 242) | `scale(0.8) → scale(1)` in globals.css keyframe **NEVER #8** | Fixed in Token Sweep P6 — verify applies |
| `animate-price-appear` (line 247) | `translateY(8px) → translateY(0)` — compliant ✅ | Keep |
| `Section` wrapper (line 50–51) | `translate-y-8` → `translate-y-0` CSS class animation — compliant (no scale) ✅ | Keep |
| `animate-bounce` on ChevronDown (line 197) | Vertical bounce only — compliant ✅ | Keep |
| Hero CTA button (line 194) | `font-body font-medium rounded-btn` — correct radius, wrong font | → `font-heading font-bold uppercase` |
| Hero h1 (line 186) | No eyebrow above — marketing hero needs context label | Add coral eyebrow |
| Hero subtitle (line 189) | `font-body` fine, `text-lg` — increase to `text-xl` for impact | → `text-xl sm:text-2xl` |
| Feature section headings (lines 211, 259, etc.) | `text-2xl sm:text-3xl font-heading` ✅ but no eyebrow | Add eyebrow per section |
| Section icon badges (lines 208, 256, etc.) | Raw icon + `SolenExclusiveBadge` inline — no icon box | Wrap icons in coral icon box |
| Feature check items (lines 215–226) | `font-body text-s-ink/60` — fine but `Check` icon tiny at `w-4` | Keep — compliant |
| `MockChat` outer card (line 64) | `rounded-2xl shadow-lg border border-s-ink/5` | → `rounded-[16px] shadow-warm-lg border-s-ink/[0.06]` |
| MockChat bubble radius (lines 76, 81, 86) | `rounded-2xl rounded-br-md` — keep these! (chat bubble aesthetic) | Keep |
| `MockCompare` outer (line 112) | `rounded-xl border border-s-ink/5` | → `rounded-[14px] border-s-ink/[0.06]` |
| MockCompare "Empfehlung" badge (line 120) | `font-medium rounded-t-lg` | → `font-heading uppercase rounded-t-[8px]` |
| MockCompare salon names (line 124) | `font-heading font-semibold` ✅ | Keep |
| `MockMap` outer (line 149) | `rounded-xl bg-gradient-to-br from-s-coral-50` — non-token classes | → `rounded-[14px]` + explicit inline gradient |
| Photo demo frame (line 242) | `rounded-card` | → `rounded-[12px]` |
| Price offer card (line 247) | `rounded-xl shadow-lg border border-s-ink/5` | → `rounded-[12px] shadow-warm-md border-s-ink/[0.06]` |
| Price offer card "font-medium" (line 250) | `font-medium` | → `font-heading font-semibold` |
| Bottom CTA section bg (line 374) | `bg-gradient-to-b from-gray-900 to-dark` — cold colors, non-token | → warm ink gradient |
| Bottom CTA card (line 376) | `bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20` | → solid white `rounded-[20px] shadow-warm-float` |
| CTA buttons (lines 384, 391) | `font-body font-medium` | → `font-heading font-bold uppercase` |
| SolenExclusiveBadge wrapper (lines 207–209, etc.) | Plain `flex items-center gap-2 mb-4` — no section structure | Add eyebrow label above |
| Section alternating backgrounds | `bg-s-coral-50/50 dark:bg-s-coral-900/10` — non-standard token | → `bg-s-bg-surface dark:bg-s-dm-surface/30` |

---

## Phase 1 — Hero Section: Eyebrow + Font Fixes

### Current state (lines 182–200)
```tsx
<section className="relative overflow-hidden py-20 sm:py-32">
  {/* Radial gradient — OK */}
  <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl ...">
    Was <span className="text-s-coral">Solen</span> anders macht
  </h1>
  <p className="mt-4 text-lg sm:text-xl text-s-ink/60 font-body max-w-xl">
    Nicht nur buchen — sondern erleben.
  </p>
  <button className="... rounded-btn bg-s-coral font-body font-medium ...">
    Jetzt entdecken <ChevronDown animate-bounce />
  </button>
```

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Lines 185–199** — hero content:
```tsx
<div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-coral mb-4">
    warum solen
  </p>
  <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-s-ink dark:text-s-dm-text leading-tight">
    Was <span className="text-s-coral">Solen</span> anders macht
  </h1>
  <p className="mt-4 text-xl sm:text-2xl text-s-ink/55 dark:text-s-dm-text/55 font-body max-w-xl mx-auto leading-relaxed">
    Nicht nur buchen — sondern erleben.
  </p>
  <button
    onClick={() => document.getElementById("section-chat")?.scrollIntoView({ behavior: "smooth" })}
    className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
    style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
    Jetzt entdecken
    <ChevronDown className="w-4 h-4 animate-bounce" />
  </button>
</div>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P1: hero → coral eyebrow, text-xl subtitle, font-heading CTA uppercase"`

---

## Phase 2 — Section Feature Headings: Eyebrow + Icon Box

### Pattern found in all 5 feature sections (lines 207–212, 255–261, 285–291, 305–311, 346–352)
```tsx
<div className="flex items-center gap-2 mb-4">
  <MessageCircle className="w-6 h-6 text-s-coral" />
  <SolenExclusiveBadge ... />
</div>
<h2 className="font-heading font-bold text-2xl sm:text-3xl ... mb-4">Heading</h2>
```

**Replace with consistent Section Header Block:**
```tsx
{/* Section header block — use for every feature section */}
<div className="mb-5">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <Icon size={14} className="text-s-coral" />
    <SolenExclusiveBadge ... />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
    {eyebrowLabel}
  </p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text">
    {heading}
  </h2>
</div>
```

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)

**Section 1 (lines 207–213):**
```tsx
<div className="mb-5">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <MessageCircle size={14} className="text-s-coral" />
    <SolenExclusiveBadge featureDescription="Chatte direkt mit deinem Salon — nur bei Solen!" />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Direkte Kommunikation</p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
    Chatte direkt mit deinem Salon
  </h2>
</div>
```

**Section 2 (lines 255–261):**
```tsx
<div className="mb-5">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <Camera size={14} className="text-s-coral" />
    <SolenExclusiveBadge featureDescription="Schick ein Foto und erhalte einen individuellen Preis!" />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Foto-Preisangebot</p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
    Schick ein Foto, bekomm einen Preis
  </h2>
</div>
```

**Section 3 (lines 285–292) — centered version:**
```tsx
<div className="text-center mb-10">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <BarChart3 size={14} className="text-s-coral" />
    <SolenExclusiveBadge featureDescription="Vergleiche bis zu 3 Salons — nur bei Solen!" />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Salon-Vergleich</p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
    Vergleiche Salons nebeneinander
  </h2>
  <p className="text-s-ink/55 dark:text-s-dm-text/55 font-body max-w-md mx-auto">
    Preise, Bewertungen und Verfügbarkeit auf einen Blick.
  </p>
</div>
```

**Section 4 (lines 305–311):**
```tsx
<div className="mb-5">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <Star size={14} className="text-s-coral" />
    <SolenExclusiveBadge featureDescription="Sammle Stempel bei jedem Besuch!" />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Treueprogramm</p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
    Sammle Stempel, bekomm Belohnungen
  </h2>
</div>
```

**Section 5 (lines 346–352):**
```tsx
<div className="mb-5">
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
    style={{ background: "rgba(232,98,74,.08)" }}>
    <MapPin size={14} className="text-s-coral" />
    <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
  </div>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">Preiskarte</p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
    Preise direkt auf der Karte
  </h2>
</div>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P2: all 5 section headers → icon pill + eyebrow + h2 block pattern"`

---

## Phase 3 — Alternating Section Backgrounds

### Current state
```tsx
// Odd sections:
<Section className="bg-s-coral-50/50 dark:bg-s-coral-900/10">
// Even sections:
<Section className="bg-white dark:bg-s-dm-bg">
```
- `bg-s-coral-50/50` — not a real token (`s-coral-50` undefined in tailwind.config)
- `bg-s-coral-900/10` — same issue

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)

Replace all alternating section class variants:
```tsx
// Tinted sections (was: bg-s-coral-50/50):
<Section className="bg-s-bg-surface dark:bg-s-dm-surface/40">

// White sections (was: bg-white):
<Section className="bg-white dark:bg-s-dm-bg">
```

Lines 203, 235, 282, 301, 341 — update accordingly.

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P3: section backgrounds → s-bg-surface token (was non-token coral-50/50)"`

---

## Phase 4 — MockChat Card: Radius + Shadow

### Current state (lines 64–99)
```tsx
<div className="w-full max-w-xs mx-auto bg-white rounded-2xl shadow-lg border border-s-ink/5 overflow-hidden">
```
**Issues:**
- `rounded-2xl` → `rounded-[16px]`
- `shadow-lg` (cold shadow) → `shadow-warm-lg`
- `border-s-ink/5` → `border-s-ink/[0.06]`
- Chat bubble radius (`rounded-2xl rounded-br-md`) — editorial illustration, **keep as-is**
- `text-xs font-heading font-bold` on the "S" avatar ✅ — keep
- `text-sm font-heading font-semibold` on salon name ✅ — keep

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Line 64** — MockChat outer:
```tsx
<div className="w-full max-w-xs mx-auto bg-white dark:bg-s-dm-surface rounded-[16px] border border-s-ink/[0.06] dark:border-white/[0.08] overflow-hidden"
  style={{ boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)" }}>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P4: MockChat → rounded-[16px], shadow-warm-lg, warm border token"`

---

## Phase 5 — Photo Demo Cards: Radius + Font

### Current state (lines 242–251)
```tsx
{/* Photo frame card */}
<div className="animate-photo-upload w-48 h-48 rounded-card ... border-dashed border-s-amber/30 ...">
  <p className="text-xs text-s-amber-text font-medium">Foto hochgeladen</p>
</div>
{/* Price offer card */}
<div className="animate-price-appear absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg border border-s-ink/5 px-4 py-3 w-44">
  <p className="text-[10px] text-s-ink/40">Preisangebot</p>
  <p className="data-text font-bold text-lg">CHF 120</p>
  <p className="text-xs text-s-coral font-medium">Balayage + Pflege</p>
</div>
```
**Issues:**
- `rounded-card` → `rounded-[12px]`
- `font-medium` (2 instances) → `font-heading font-semibold`
- `rounded-xl shadow-lg` on price card → `rounded-[12px] shadow-warm-md`

> The `animate-photo-upload` class violation (scale) will be fixed by Token Sweep P6. Verify it applies by running: `grep -n "photoUpload" app/globals.css`

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Lines 242–251** — photo demo:
```tsx
<div className="animate-photo-upload w-48 h-48 rounded-[12px] dark:from-s-amber/10 dark:to-s-amber/5 border-2 border-dashed border-s-amber/30 dark:border-s-amber/20 flex flex-col items-center justify-center gap-2"
  style={{ background: "linear-gradient(135deg, rgba(212,135,10,.08) 0%, rgba(212,135,10,.04) 100%)" }}>
  <Camera className="w-8 h-8 text-s-amber" />
  <p className="text-xs font-heading font-semibold text-s-amber">Foto hochgeladen</p>
</div>
{/* Price offer card */}
<div className="animate-price-appear absolute -bottom-4 -right-4 bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.08] px-4 py-3 w-44"
  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)" }}>
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/35 dark:text-s-dm-text/35">Preisangebot</p>
  <p className="data-text font-bold text-xl text-s-ink dark:text-s-dm-text">CHF 120</p>
  <p className="text-xs font-heading font-semibold text-s-coral">Balayage + Pflege</p>
</div>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P5: photo demo → rounded-[12px], warm shadow, font-heading, eyebrow label"`

---

## Phase 6 — MockCompare Card: Radius + Badge

### Current state (lines 112–135)
```tsx
<div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-s-ink/5">
  {/* Empfehlung badge */}
  <span className="absolute ... bg-s-coral text-white text-[9px] px-2 py-0.5 rounded-t-lg font-medium">
    Empfehlung
  </span>
```
**Issues:**
- `rounded-xl` → `rounded-[14px]`
- `border-s-ink/5` → `border-s-ink/[0.06]`
- `font-medium` badge → `font-heading font-bold uppercase`
- `rounded-t-lg` badge → `rounded-t-[6px]`

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Line 112** — MockCompare outer:
```tsx
<div className="w-full max-w-md mx-auto overflow-hidden rounded-[14px] border border-s-ink/[0.06] dark:border-white/[0.08]">
```

**Lines 119–122** — Empfehlung badge:
```tsx
{s.highlight && (
  <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-s-coral text-white text-[8px] px-2 py-0.5 rounded-t-[6px] font-heading font-bold uppercase tracking-[.08em]">
    Empfehlung
  </span>
)}
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P6: MockCompare → rounded-[14px], Empfehlung badge font-heading uppercase"`

---

## Phase 7 — MockMap Card: Radius + Gradient

### Current state (lines 149–170)
```tsx
<div className="relative w-full max-w-md mx-auto h-64 rounded-xl bg-gradient-to-br from-s-coral-50 to-s-coral-100 dark:from-s-coral-900/20 ...">
```
- `rounded-xl` → `rounded-[14px]`
- `from-s-coral-50 to-s-coral-100` — non-token classes → inline gradient

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Line 149** — MockMap outer:
```tsx
<div className="relative w-full max-w-md mx-auto h-64 rounded-[14px] overflow-hidden border border-s-coral/[0.15] dark:border-s-coral/[0.12]"
  style={{ background: "linear-gradient(135deg, rgba(232,98,74,.07) 0%, rgba(250,236,231,.95) 100%)" }}>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P7: MockMap → rounded-[14px], inline gradient (replace non-token from-s-coral-50)"`

---

## Phase 8 — Bottom CTA Section: Full Overhaul

### Current state (lines 373–399)
```tsx
<section className="relative py-20 sm:py-28 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-dark" />  {/* cold dark bg */}
  <div className="relative max-w-xl mx-auto px-4 sm:px-6">
    <div className="bg-white/80 dark:bg-s-ink/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
      <h2 className="font-heading font-bold text-2xl sm:text-3xl ...">Bereit?</h2>
      <p className="font-body mb-8">...</p>
      <Link className="... rounded-btn bg-s-coral font-body font-medium ...">Jetzt ausprobieren</Link>
      <Link className="... font-body font-medium ...">Bist du ein Salon?</Link>
```
**Issues:**
- `from-gray-900 to-dark` — cold, non-token background
- `backdrop-blur-xl rounded-2xl shadow-2xl` — Zone 1 exception is OK for marketing glass, but we're on a white-bg page section, not a dark hero — use solid warm card instead
- `rounded-2xl` → `rounded-[20px]`
- `shadow-2xl` → `shadow-warm-float`
- Both CTAs: `font-body font-medium` → `font-heading font-bold uppercase`

### Files to modify

#### [MODIFY] [warum-solen/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/warum-solen/page.tsx)
**Lines 373–399** — bottom CTA section:
```tsx
{/* ── Bottom CTA ── */}
<section className="relative py-20 sm:py-28 overflow-hidden">
  {/* Warm ink gradient (not cold gray-900) */}
  <div className="absolute inset-0"
    style={{ background: "linear-gradient(180deg, rgba(26,18,9,.92) 0%, rgba(14,9,4,1) 100%)" }} />

  <div className="relative max-w-xl mx-auto px-4 sm:px-6">
    {/* Coral ambient glow behind card */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
      style={{ background: "radial-gradient(ellipse, rgba(232,98,74,.15) 0%, transparent 70%)" }} />

    <div className="relative rounded-[20px] bg-white p-8 sm:p-10 text-center"
      style={{ boxShadow: "0 24px 72px rgba(26,18,9,.48)" }}>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-coral mb-3">
        Dein nächster Schritt
      </p>
      <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink mb-3">
        Bereit für bessere Beauty-Termine?
      </h2>
      <p className="text-s-ink/55 font-body mb-8 text-sm leading-relaxed">
        Entdecke Basels beste Salons — mit Chat, Stempelkarten und mehr.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
          style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
          Jetzt ausprobieren
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link href={`/${locale}/partner`}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn border border-s-ink/[0.10] text-xs font-heading font-bold uppercase tracking-[.04em] text-s-ink/60 hover:border-s-coral/50 hover:text-s-coral transition-colors">
          Bist du ein Salon?
        </Link>
      </div>
    </div>
  </div>
</section>
```

**Git commit:** `git add app/[locale]/warum-solen/page.tsx && git commit -m "WARUM-P8: bottom CTA → warm ink gradient, solid white card, coral ambient glow, font-heading CTAs"`

---

## Phase 9 — Verify animate-photo-upload Fix Applied

### Check that Token Sweep P6 has been applied before this phase

```bash
grep -A 5 "photoUpload" app/globals.css
# Expected: translateY only, no scale(0.8)

grep -n "animate-photo-upload" app/[locale]/warum-solen/page.tsx
# Expected: used on line 242 — verify it no longer scales
```

If Token Sweep P6 has NOT been done yet, apply the globals.css fix here directly:

```css
/* In globals.css — replace the current photoUpload keyframe */
@keyframes photoUpload {
  0%   { opacity: 0; transform: translateY(8px); }
  50%  { opacity: 1; transform: translateY(-2px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

**Git commit (only if Token Sweep P6 not done):** `git add app/globals.css && git commit -m "WARUM-P9: photoUpload keyframe → opacity+translateY only (NEVER fix — scale eliminated)"`

---

## Phase 10 — Section Scroll Animation: prefers-reduced-motion

### Current state (Section component, line 50)
```tsx
className={`py-16 sm:py-24 transition-all duration-700 ${
  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
}`}
```
The `transition-all duration-700` is correct but needs a `prefers-reduced-motion` guard. The global CSS already covers this via `@media (prefers-reduced-motion: reduce)` in globals.css which zeroes all transitions. Verify it applies cleanly here.

```bash
grep -n "prefers-reduced-motion" app/globals.css
# Expected: present at line ~220
```

If the global rule is present ✅ this component is already compliant — no code change needed.

**Git commit:** No change needed if global rule present.

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P9 | Verify/fix animate-photo-upload globals.css | ✅ Start here (dependency check) |
| P1 | Hero eyebrow + CTA font | ✅ Independent |
| P3 | Section backgrounds | ✅ Independent |
| P4 | MockChat radius | ✅ Independent |
| P2 | All 5 section headers | After P1 (same regions) |
| P5 | Photo demo cards | After P9 confirmed |
| P6 | MockCompare radius | ✅ Independent |
| P7 | MockMap gradient | ✅ Independent |
| P8 | Bottom CTA | After P1 (same CTA style reference) |
| P10 | prefers-reduced-motion verify | Last (verification only) |

> P1, P3, P4, P6, P7, P9 all parallel.
> P2 after P1.
> P5 after P9.
> P8 last major phase.

---

## WARUM SOLEN COMPLIANCE CHECK

```bash
npm run build

# Cold shadow removed:
grep -n "shadow-lg\|shadow-2xl\|shadow-xl\b\|from-gray-900" app/[locale]/warum-solen/page.tsx
# Expected: 0 results

# Non-token coral class removed:
grep -n "s-coral-50\|s-coral-100\|s-coral-900" app/[locale]/warum-solen/page.tsx
# Expected: 0 results

# rounded-2xl / rounded-xl removed:
grep -n "rounded-2xl\|rounded-xl\b" app/[locale]/warum-solen/page.tsx
# Expected: 0 results

# glass removed from CTA section:
grep -n "backdrop-blur\|bg-white/80" app/[locale]/warum-solen/page.tsx
# Expected: 0 results

# font-body on CTAs:
grep -n "font-body font-medium" app/[locale]/warum-solen/page.tsx
# Expected: 0 in CTA buttons (body copy paragraphs are expected)

# Manual checklist:
# ✅ Hero: "warum solen" coral eyebrow, text-2xl subtitle, font-heading CTA
# ✅ All 5 sections: icon pill + eyebrow label + heading
# ✅ Section tinted bg: s-bg-surface (not s-coral-50/50)
# ✅ MockChat: rounded-[16px], shadow-warm-lg
# ✅ Photo demo: rounded-[12px], animate-photo-upload scale-free  
# ✅ Price card: rounded-[12px], eyebrow label, font-heading service name
# ✅ MockCompare: rounded-[14px], Empfehlung badge font-heading uppercase
# ✅ MockMap: rounded-[14px], inline warm gradient
# ✅ Bottom CTA: warm ink gradient, solid white card, coral glow, font-heading uppercase
```
