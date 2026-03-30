# Partner Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/partner/page.tsx` (497 lines) — B2B marketing landing page for salon onboarding.
> **Zone: 1 (Maximalist)** — This is a conversion page. Rich typography, coral accents, premium feel. Blobs allowed but not present — keep it clean.
>
> ⚠️ **CRITICAL — DO NOT TOUCH:**
> - JSON-LD structured data block (lines 448–464)
> - `InteractiveHoverButton` component (import + usage)
> - `useTranslations` / `t()` i18n calls — all text rendered via `t()`
> - `expandedFaq` state machine + FAQ accordion logic
> - Pricing bar chart widths (`style={{ width: "3.3%" }}`) — these are data-driven
> - `FAQ_KEYS` and `FEATURES` arrays

---

## Violations Found (by section)

| Section | Location | Issue | Fix |
|---|---|---|---|
| Hero | Line 41 | `from-s-coral/5` non-standard `/5` opacity | → inline rgba |
| Hero h1 | Line 46 | Missing eyebrow above | → coral eyebrow |
| Hero subtitle | Line 51 | `text-lg` — fine ✅ | Keep |
| Hero subtext | Line 60 | `text-xs text-s-ink/40` | → `font-heading uppercase tracking` |
| Hero mockup images | Line 74, 84 | `rounded-card shadow-warm-md` | → `rounded-[12px]` |
| Hero floating badges | Lines 90–97 | `rounded-card font-body font-medium` | → `rounded-[12px] font-heading font-semibold` |
| Features section h2 | Line 105 | No eyebrow | Add `"Features"` eyebrow |
| Feature cards | Line 114 | `rounded-card border-s-ink/5` | → `rounded-[14px]` |
| Feature card icon | Line 115 | `rounded-card bg-s-coral/10` | → `rounded-[10px]` |
| Feature card h3 | Line 118 | `font-heading font-semibold text-sm` ✅ | Keep |
| Categories section h2 | Line 129 | No eyebrow | Add `"Kategorien"` eyebrow |
| Category cards | Line 145 | `rounded-card border-s-ink/5` | → `rounded-[14px]` |
| How It Works section h2 | Line 159 | No eyebrow | Add `"Wie es funktioniert"` eyebrow |
| Steps time badge | Lines 187, 206, 225 | `font-body font-medium` | → `font-heading font-bold` |
| Social Proof section h2 | Line 238 | No eyebrow | Add `"Partner sagen"` eyebrow |
| Trust badges | Line 254 | `rounded-card border-s-ink/5` | → `rounded-[14px]` |
| Trust badge label | Line 256 | `font-body font-semibold` | → `font-heading font-bold` |
| Testimonials | Line 264 | `rounded-card border-s-ink/5` | → `rounded-[14px]` |
| Testimonial author | Line 274 | `font-body font-semibold` | → `font-heading font-semibold` |
| Pricing section h2 | Line 289 | No eyebrow | Add `"Preise"` eyebrow |
| Pricing card | Line 299 | `rounded-card shadow-warm-md border-s-ink/5` | → `rounded-[18px]` warm shadow |
| Pricing badge | Line 301 | `font-body font-semibold` | → `font-heading font-bold uppercase` |
| Pricing feature list | Line 327 | `text-sm text-s-ink/80` ✅ | Keep |
| Compare card | Line 334 | `rounded-card` | → `rounded-[16px]` |
| Compare label | Line 335 | `font-heading font-semibold text-lg` ✅ | Keep |
| Savings callout | Line 385 | `rounded-card border-s-sage/20` | → `rounded-[12px]` |
| Savings text | Lines 387–388 | `font-body font-semibold` | → `font-heading font-bold` |
| FAQ section h2 | Line 400 | No eyebrow | Add `"Häufige Fragen"` eyebrow |
| FAQ cards | Line 414 | `rounded-card` | → `rounded-[16px]` |
| CTA gradient | Line 467 | `from-s-bg-surface to-s-coral/5` non-standard | → inline rgba backgrounds |
| CTA h2 | Line 469 | No eyebrow | Add `"Jetzt starten"` eyebrow |
| CTA consult link | Line 484 | `font-body font-medium` | → `font-heading font-semibold` |

---

## Phase 1 — Hero Section

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)

**Line 39–63** — hero section:
```tsx
{/* Page bg */}
<div className="min-h-screen bg-white dark:bg-s-dm-bg">
  {/* Hero — Split Layout */}
  <div className="pt-24 pb-16 overflow-hidden"
    style={{ background: "linear-gradient(180deg, rgba(232,98,74,.04) 0%, rgba(255,255,255,0) 100%)" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

      {/* Left — Text + CTA */}
      <div className="text-center lg:text-left">
        <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-coral mb-3">
          Für Saloninhaber
        </p>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-s-ink dark:text-s-dm-text mb-4 leading-tight">
          {t("hero_title_1")}{" "}
          <span className="text-s-coral">{t("hero_title_accent")}</span>
          <br />{t("hero_title_2")}
        </h1>
        <p className="text-lg font-body text-s-ink/60 dark:text-s-dm-text/60 max-w-lg mb-8">
          {t("hero_subtitle")}
        </p>
        <Link href={`/${locale}/onboarding/salon?utm_source=partner_page&utm_content=hero`}>
          <InteractiveHoverButton text={t("hero_cta")} className="w-auto px-8 py-4" />
        </Link>
        <p className="text-[10px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/35 dark:text-s-dm-text/35 mt-3">
          {t("hero_subtext")}
        </p>
      </div>
```

**Lines 68–97** — mockup images + floating badges:
```tsx
{/* Laptop mockup */}
<div className="relative w-full max-w-md lg:max-w-lg">
  <Image
    src="/images/partner/dashboard-mockup.png"
    alt={t("alt_dashboard")}
    width={600} height={400}
    className="rounded-[12px]"
    style={{ boxShadow: "0 4px 8px rgba(26,18,9,.08), 0 16px 48px rgba(26,18,9,.12)" }}
    priority
  />
  {/* Phone mockup */}
  <div className="absolute -bottom-6 -right-4 sm:-right-8 w-28 sm:w-36">
    <Image
      src="/images/partner/profile-mockup.png"
      alt={t("alt_profile")}
      width={180} height={360}
      className="rounded-[12px] border-4 border-white dark:border-s-dm-surface"
      style={{ boxShadow: "0 4px 8px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.14)" }}
    />
  </div>
</div>

{/* Floating value badges */}
<div className="hidden lg:flex absolute top-4 -left-2 bg-white dark:bg-s-dm-surface rounded-[12px] px-3 py-2 border border-s-ink/[0.06] items-center gap-2"
  style={{ boxShadow: "0 2px 8px rgba(26,18,9,.08)" }} aria-hidden="true">
  <TrendingUp className="w-4 h-4 text-s-sage" />
  <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("badge_bookings")}</span>
</div>
<div className="hidden lg:flex absolute bottom-12 -left-4 bg-white dark:bg-s-dm-surface rounded-[12px] px-3 py-2 border border-s-ink/[0.06] items-center gap-2"
  style={{ boxShadow: "0 2px 8px rgba(26,18,9,.08)" }} aria-hidden="true">
  <Star className="w-4 h-4 text-s-yellow" />
  <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("badge_rating")}</span>
</div>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P1: hero → eyebrow, inline gradient, rounded-[12px] images, font-heading badges"`

---

## Phase 2 — Section h2 Eyebrows (all sections)

All 7 section headings get a coral/muted eyebrow label above. Pattern:
```tsx
<div className="text-center mb-10">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.24em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
    [EYEBROW LABEL]
  </p>
  <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
    {t("[key]")}
  </h2>
  ...
```

| Section | Eyebrow label | Line |
|---|---|---|
| Features | `"Funktionen"` | 104 |
| Categories | `"Kategorien"` | 128 |
| How It Works | `"Wie es funktioniert"` | 158 |
| Social Proof | `"Partner sagen"` | 237 |
| Pricing | `"Preise"` | 288 |
| FAQ | `"Häufige Fragen"` | 399 |
| CTA | `"Jetzt starten"` | 468 |

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)
Apply eyebrow pattern to each of the 7 `<div className="text-center mb-...">` section headers above.

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P2: all 7 section h2s → eyebrow labels above"`

---

## Phase 3 — Feature Cards + Category Cards: rounded-[14px]

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)

**Line 114** — feature cards:
```tsx
<div key={i} className="p-5 rounded-[14px] bg-s-bg-surface dark:bg-s-dm-surface border border-s-ink/[0.05] dark:border-white/[0.06] hover:shadow-warm-sm transition-shadow duration-200">
  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
    style={{ background: "rgba(232,98,74,.09)" }}>
    <f.icon className="w-5 h-5 text-s-coral" />
  </div>
  <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text mb-1">{t(f.title)}</h3>
  <p className="text-xs font-body text-s-ink/55 dark:text-s-dm-text/55 leading-relaxed">{t(f.desc)}</p>
</div>
```

**Line 145** — category cards:
```tsx
<div key={cat.key} className="p-5 rounded-[14px] bg-white dark:bg-s-dm-bg border border-s-ink/[0.05] dark:border-white/[0.06] hover:border-s-coral/20 hover:shadow-warm-sm transition-all duration-200">
  <cat.icon className="w-6 h-6 text-s-coral mb-3" />
  <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text mb-1">{t(`${cat.key}_title`)}</h3>
  <p className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50 leading-relaxed">{t(`${cat.key}_desc`)}</p>
</div>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P3: feature + category cards → rounded-[14px], icon box rounded-[10px]"`

---

## Phase 4 — How It Works: Step Time Badges

### Current state (lines 187, 206, 225)
```tsx
<span className="inline-block text-xs font-body font-medium text-s-coral bg-s-coral/10 px-3 py-1 rounded-pill">
  {t("hiw_step1_time")}
</span>
```

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)
**Lines 187, 206, 225** — 3× step time badges:
```tsx
<span className="inline-block text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-coral px-3 py-1.5 rounded-pill"
  style={{ background: "rgba(232,98,74,.10)" }}>
  {t("hiw_step{N}_time")}
</span>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P4: step time badges → 9px font-heading uppercase, 3 instances"`

---

## Phase 5 — Social Proof: Trust Badges + Testimonials

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)

**Line 254** — trust badge cards:
```tsx
<div key={badge.key} className="flex flex-col items-center text-center p-4 bg-s-bg-surface dark:bg-s-dm-surface rounded-[14px] border border-s-ink/[0.05] dark:border-white/[0.06]">
  <badge.icon className="w-6 h-6 text-s-coral mb-2" />
  <span className="text-xs font-heading font-bold text-s-ink dark:text-s-dm-text">{t(badge.key)}</span>
</div>
```

**Line 264** — testimonial cards:
```tsx
<div key={key} className="bg-s-bg-surface dark:bg-s-dm-surface rounded-[16px] p-6 border border-s-ink/[0.05] dark:border-white/[0.06]">
  <Quote className="w-5 h-5 text-s-coral/30 mb-3" />
  <p className="text-sm font-body text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed mb-4 italic">
    &ldquo;{t(`${key}_quote`)}&rdquo;
  </p>
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full flex items-center justify-center"
      style={{ background: "rgba(232,98,74,.12)" }}>
      <span className="text-xs font-heading font-bold text-s-coral">{t(`${key}_initial`)}</span>
    </div>
    <div>
      <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{t(`${key}_name`)}</p>
      <p className="text-xs font-body text-s-ink/50 dark:text-s-dm-text/50">{t(`${key}_role`)}</p>
    </div>
  </div>
</div>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P5: trust badges rounded-[14px] font-heading; testimonials rounded-[16px] + font-heading author"`

---

## Phase 6 — Pricing Section

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)

**Line 299** — pricing card:
```tsx
<div className="bg-white dark:bg-s-dm-surface border border-s-ink/[0.05] dark:border-white/[0.06] rounded-[18px] p-8 relative overflow-hidden"
  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.06), 0 8px 32px rgba(26,18,9,.09)" }}>
```

**Line 301** — pricing badge:
```tsx
<div className="absolute top-4 right-4 text-s-coral text-[9px] font-heading font-bold uppercase tracking-[.14em] px-3 py-1.5 rounded-pill"
  style={{ background: "rgba(232,98,74,.10)" }}>
  {t("pricing_badge")}
</div>
```

**Line 334** — compare card:
```tsx
<div className="bg-s-bg-surface dark:bg-s-dm-surface rounded-[16px] p-8">
```

**Lines 385–390** — savings callout:
```tsx
<div className="mt-8 p-4 rounded-[12px] border border-s-sage/20"
  style={{ background: "rgba(107,166,120,.08)" }}>
  <p className="text-sm font-body text-s-sage-text dark:text-s-sage">
    <span className="font-heading font-bold">{t("compare_savings_bold")}</span>{" "}
    {t("compare_savings_text")}
  </p>
</div>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P6: pricing card rounded-[18px], badge font-heading, compare rounded-[16px], savings callout rounded-[12px]"`

---

## Phase 7 — FAQ Cards + Bottom CTA

### Files to modify

#### [MODIFY] [partner/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/partner/page.tsx)

**Line 414** — FAQ cards:
```tsx
className={`snap-start shrink-0 w-72 sm:w-80 text-left rounded-[16px] border transition-all duration-300 ${
  expandedFaq === i
    ? "bg-white dark:bg-s-dm-surface border-s-coral/30 shadow-warm-md"
    : "bg-white dark:bg-s-dm-surface border-s-ink/[0.05] dark:border-white/[0.06] shadow-warm-sm hover:shadow-warm-md hover:border-s-coral/20"
}`}
```

**Line 467** — bottom CTA section:
```tsx
<div className="py-20"
  style={{ background: "linear-gradient(180deg, rgba(26,18,9,.025) 0%, rgba(232,98,74,.05) 100%)" }}>
```

**Line 484** — consult link:
```tsx
<a href={`mailto:info@solen.ch?subject=${encodeURIComponent(t("cta_consult_subject"))}`}
  className="text-xs font-heading font-semibold text-s-coral hover:text-s-coral/80 transition-colors underline underline-offset-4">
  {t("cta_consult")}
</a>
```

**Git commit:** `git add app/[locale]/partner/page.tsx && git commit -m "PARTNER-P7: FAQ cards rounded-[16px]; CTA gradient inline; consult link font-heading"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P2 | Section h2 eyebrows (7 headers) | ✅ Start first |
| P1 | Hero section | ✅ Independent |
| P4 | How It Works time badges | ✅ Independent |
| P3 | Feature + Category cards | After P2 (same area) |
| P5 | Social Proof | After P2 |
| P6 | Pricing | After P2 |
| P7 | FAQ + CTA | After P2 |

> P1, P2, P4 all parallel.
> P3, P5, P6, P7 parallel after P2.

---

## PARTNER PAGE COMPLIANCE CHECK

```bash
npm run build

# rounded-card removed:
grep -n "rounded-card" app/[locale]/partner/page.tsx
# Expected: 0

# font-medium removed (non-heading uses):
grep -n "font-body font-medium\|font-semibold[^)]*text-s-ink" app/[locale]/partner/page.tsx
# Inspect — should be near 0

# Non-token opacity variants removed:
grep -n "s-coral/5\b\|s-ink/5\b" app/[locale]/partner/page.tsx
# Expected: 0 (replaced with [0.05])

# i18n + InteractiveHoverButton untouched:
grep -n "InteractiveHoverButton\|useTranslations\|FAQ_KEYS\|FEATURES" app/[locale]/partner/page.tsx
# Expected: all present

# JSON-LD untouched:
grep -n "application/ld+json" app/[locale]/partner/page.tsx
# Expected: present on line ~448

# Manual checklist:
# ✅ Hero: "Für Saloninhaber" coral eyebrow, inline rgba gradient
# ✅ Hero: mockup images rounded-[12px], warm shadows
# ✅ Hero: floating badges font-heading uppercase, rounded-[12px]
# ✅ All 7 section h2s: muted eyebrow label above
# ✅ Feature + category cards: rounded-[14px], icon box rounded-[10px]
# ✅ Step time badges: 9px font-heading uppercase
# ✅ Trust badges: rounded-[14px], font-heading
# ✅ Testimonials: rounded-[16px], font-heading author name
# ✅ Pricing card: rounded-[18px] warm shadow
# ✅ Pricing badge: font-heading uppercase
# ✅ Compare + Savings cards: correct radii
# ✅ FAQ cards: rounded-[16px]
# ✅ CTA: inline gradient, font-heading consult link
# ✅ JSON-LD: NOT TOUCHED
# ✅ expandedFaq logic: NOT TOUCHED
```

---

## Final Step — Push

```bash
git push
```
