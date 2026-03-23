# Partner Page — Topic 1: Product Screenshots & Value-Proposition Hero

> **Status**: 📋 ROADMAP READY (not yet executed)
> **Owner**: TBD
> **Depends on**: Nothing — this is self-contained
> **Part of**: Partner Page Overhaul (Topic 1 of 12)
> **Cross-topic note**: Topics 2-6 (Pricing, FAQ, How-it-works, Testimonials, Feature Grid) all ADD new sections below this hero. This roadmap ONLY touches the hero section (lines 29-47). The Benefits and CTA sections below are NOT modified.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | New image files only, no code changes |
| Phase 2 | 🟡 MEDIUM | Partner page hero layout | Only modifies lines 1-5 (imports) + 29-47 (hero). Test mobile + desktop after |
| Phase 3 | 🟢 SAFE | Nothing | Only adds translation keys, no code logic |
| Phase 4 | 🟢 SAFE | Nothing | Design token validation only |

---

## ⚠️ CROSS-TOPIC DEPENDENCY ANALYSIS

**What exists NOW that we depend on:**
- ✅ `app/[locale]/partner/page.tsx` — exists (85 lines)
- ✅ `components/ui/interactive-hover-button.tsx` — exists (used on HomePage)
- ✅ `components/index.ts` — exports `InteractiveHoverButton`
- ✅ `next/image` — available in Next.js
- ✅ `lucide-react` — installed, `Store`, `TrendingUp`, `Calendar`, `ArrowRight` already imported

**What does NOT exist yet but we need:**
- ❌ `public/images/` directory — does NOT exist. Only `public/icons/` and `public/illustrations/` exist. Must create `public/images/partner/`.
- ❌ Partner page i18n keys — the current page has ZERO translations. All text is hardcoded German. We need to add keys to all 4 locale files.

**What we must NOT break for future topics:**
- The Benefits section (lines 50-61) — Topics 5, 6 add sections near here
- The CTA section (lines 64-81) — Topic 2 (Pricing) goes before this
- The overall page structure (`<div className="min-h-screen">`) — all topics add children inside this

---

## Phase 1: Generate Mockup Images 🤖

### 1.1 Create directory
```bash
mkdir -p public/images/partner
```

### 1.2 Dashboard Mockup (Laptop Frame)
Generate a mockup image showing the Solen salon dashboard inside a laptop frame:
- **Content**: Weekly calendar view with colored booking blocks, sidebar with salon stats
- **Fake data**: 3-4 bookings for the week, staff names, today's revenue "CHF 420"
- **Brand**: Solen colors — `#E8624A` coral, `#FAF6EF` cream, `#1A1209` ink, `#6BA3C8` blue accents
- **Style**: Clean, modern, light mode — matches the actual Solen dashboard aesthetic
- **Frame**: Minimal MacBook-style frame, slightly angled (5-10° perspective)
- **Format**: `.webp`, optimized under 200KB

[NEW] `public/images/partner/dashboard-mockup.webp`

### 1.3 Salon Profile Mockup (Phone Frame)
Generate a mockup showing a customer's view of a salon profile on a phone frame:
- **Content**: Salon cover photo, name, rating stars, "Jetzt buchen" button, service list preview
- **Fake data**: "Studio Bella Basel" — 4.8 stars, 127 Bewertungen, "Haarschnitt Damen CHF 65"
- **Brand**: Same Solen color palette
- **Frame**: iPhone-style frame, slightly angled opposite to laptop

[NEW] `public/images/partner/profile-mockup.webp`

> ⚠️ **BE CAREFUL**:
> - Images MUST use Solen brand colors, NOT generic blue/green
> - `.webp` format, under 200KB each
> - No stock photos of random salons
> - These mockups represent the ACTUAL product — they must look plausible as the real dashboard/profile

---

## Phase 2: Rewrite the Hero Section 🤖

### 2.1 Changes to imports (lines 1-5)

[MODIFY] `app/[locale]/partner/page.tsx`

```diff
 "use client";

 import Link from "next/link";
+import Image from "next/image";
 import { useLocale } from "next-intl";
-import { Store, TrendingUp, Calendar, ArrowRight } from "lucide-react";
+import { useTranslations } from "next-intl";
+import { Store, TrendingUp, Calendar, ArrowRight, Star } from "lucide-react";
+import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
```

### 2.2 Replace the hero section (lines 29-47)

**✅ DO — Use InteractiveHoverButton for CTA, i18n for all text, design tokens only:**
```tsx
{/* Hero — Split Layout */}
<div className="bg-gradient-to-b from-s-coral/5 to-white dark:from-s-coral/10 dark:to-s-dm-bg pt-24 pb-16 overflow-hidden">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
    
    {/* Left — Text + CTA */}
    <div className="text-center lg:text-left">
      <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-s-ink dark:text-s-dm-text mb-4 leading-tight">
        {t("hero_title_1")}{" "}
        <span className="text-s-coral">{t("hero_title_accent")}</span>
        <br />{t("hero_title_2")}
      </h1>
      <p className="text-lg text-s-ink/60 dark:text-s-dm-text/60 max-w-lg mb-8">
        {t("hero_subtitle")}
      </p>
      <InteractiveHoverButton
        as="a"
        href={`/${locale}/onboarding/salon`}
        className="inline-flex"
      >
        {t("hero_cta")}
      </InteractiveHoverButton>
      <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-3">
        {t("hero_subtext")}
      </p>
    </div>

    {/* Right — Product Mockups */}
    <div className="relative flex items-center justify-center lg:justify-end">
      {/* Laptop mockup */}
      <div className="relative w-full max-w-md lg:max-w-lg">
        <Image
          src="/images/partner/dashboard-mockup.webp"
          alt={t("alt_dashboard")}
          width={600}
          height={400}
          className="rounded-card shadow-warm-md"
          priority
        />
        {/* Phone mockup — overlapping bottom-right */}
        <div className="absolute -bottom-6 -right-4 sm:-right-8 w-28 sm:w-36">
          <Image
            src="/images/partner/profile-mockup.webp"
            alt={t("alt_profile")}
            width={180}
            height={360}
            className="rounded-card shadow-warm-md border-4 border-white dark:border-s-dm-surface"
          />
        </div>
      </div>

      {/* Floating value badges — desktop only */}
      <div className="hidden lg:flex absolute top-4 -left-2 bg-white dark:bg-s-dm-surface rounded-card px-3 py-2 shadow-warm-sm border border-s-ink/5 dark:border-s-dm-text/10 items-center gap-2" aria-hidden="true">
        <TrendingUp className="w-4 h-4 text-s-sage" />
        <span className="text-xs font-body font-medium text-s-ink dark:text-s-dm-text">{t("badge_bookings")}</span>
      </div>
      <div className="hidden lg:flex absolute bottom-12 -left-4 bg-white dark:bg-s-dm-surface rounded-card px-3 py-2 shadow-warm-sm border border-s-ink/5 dark:border-s-dm-text/10 items-center gap-2" aria-hidden="true">
        <Star className="w-4 h-4 text-s-yellow" />
        <span className="text-xs font-body font-medium text-s-ink dark:text-s-dm-text">{t("badge_rating")}</span>
      </div>
    </div>
  </div>
</div>
```

**❌ DON'T — Don't use these patterns:**
```tsx
// ❌ DON'T: Raw <Link> for primary CTA — CLAUDE.md says InteractiveHoverButton
<Link href="..." className="...bg-s-coral...">Kostenlos registrieren</Link>

// ❌ DON'T: Hardcoded German text — must use useTranslations
<h1>Werde Solen-Partner</h1>

// ❌ DON'T: rounded-2xl — banned token, use rounded-card
<Image className="rounded-2xl shadow-md" />

// ❌ DON'T: shadow-md — banned token, use shadow-warm-md
<Image className="shadow-md" />

// ❌ DON'T: rounded-full on phone frame — use rounded-pill  
<div className="rounded-full" />

// ❌ DON'T: Show floating badges on mobile — clutters small screens
<div className="flex absolute..." />  // Missing hidden lg:flex
```

### 2.3 Add `useTranslations` hook to component

```diff
 export default function PartnerPage() {
   const locale = useLocale();
+  const t = useTranslations("partner");
```

### 2.4 Check InteractiveHoverButton supports `as="a"` prop

Before using, verify the component accepts `as` prop for rendering as a link. If it doesn't, wrap it:
```tsx
// Fallback if InteractiveHoverButton doesn't support as="a":
<Link href={`/${locale}/onboarding/salon`}>
  <InteractiveHoverButton>
    {t("hero_cta")}
  </InteractiveHoverButton>
</Link>
```

### 2.5 Mobile responsiveness rules

- `< lg` (mobile): Stack vertically — text on top, mockup below, centered
- `lg+` (desktop): Side-by-side grid with `items-center`
- Floating badges: `hidden lg:flex` — hidden on mobile to avoid clutter
- Phone mockup: `w-28` mobile, `w-36` desktop

### 2.6 Dark mode

- Mockup images stay light-mode (they pop against dark backgrounds)
- Badge backgrounds: `dark:bg-s-dm-surface`
- Phone frame border: `dark:border-s-dm-surface`
- All text: has `dark:text-s-dm-text` or `dark:text-s-dm-text/60` pair

> ⚠️ **BE CAREFUL**:
> - `max-w-6xl` (NOT `max-w-4xl`) for the hero — needed for split layout
> - `priority` on the laptop Image — this is LCP
> - Phone mockup uses `absolute` positioning — test on 375px width for overflow
> - Do NOT touch Benefits section (lines 50-61) or CTA section (lines 64-81)
> - Do NOT import `Header` or `BottomNav` — they're in the root layout (Rule 27)
> - The BENEFITS array and its rendering are UNTOUCHED in this phase

---

## Phase 3: Add i18n Translation Keys 🤖

[MODIFY] `messages/de.json` — add under a new `"partner"` section:
```json
{
  "partner": {
    "hero_title_1": "Dein Salon.",
    "hero_title_accent": "Mehr Kunden.",
    "hero_title_2": "Weniger Aufwand.",
    "hero_subtitle": "Registriere deinen Salon kostenlos auf solen.ch — Basels Beauty-Plattform. Online-Buchungen, Dashboard, Kundenverwaltung — alles in einem.",
    "hero_cta": "Kostenlos starten",
    "hero_subtext": "Keine Kreditkarte nötig · In 5 Minuten live",
    "alt_dashboard": "Solen Dashboard — Buchungskalender und Salonverwaltung",
    "alt_profile": "Salon-Profil auf solen.ch — so sehen Kunden deinen Salon",
    "badge_bookings": "+47 Buchungen/Woche",
    "badge_rating": "4.8 Bewertung"
  }
}
```

[MODIFY] `messages/en.json`:
```json
{
  "partner": {
    "hero_title_1": "Your salon.",
    "hero_title_accent": "More clients.",
    "hero_title_2": "Less hassle.",
    "hero_subtitle": "Register your salon for free on solen.ch — Basel's beauty platform. Online bookings, dashboard, client management — all in one.",
    "hero_cta": "Get started for free",
    "hero_subtext": "No credit card required · Live in 5 minutes",
    "alt_dashboard": "Solen Dashboard — booking calendar and salon management",
    "alt_profile": "Salon profile on solen.ch — how customers see your salon",
    "badge_bookings": "+47 bookings/week",
    "badge_rating": "4.8 rating"
  }
}
```

[MODIFY] `messages/fr.json`:
```json
{
  "partner": {
    "hero_title_1": "Votre salon.",
    "hero_title_accent": "Plus de clients.",
    "hero_title_2": "Moins d'effort.",
    "hero_subtitle": "Inscrivez votre salon gratuitement sur solen.ch — la plateforme beauté de Bâle. Réservations en ligne, tableau de bord, gestion clients — tout en un.",
    "hero_cta": "Commencer gratuitement",
    "hero_subtext": "Pas de carte de crédit nécessaire · En ligne en 5 minutes",
    "alt_dashboard": "Tableau de bord Solen — calendrier de réservation et gestion de salon",
    "alt_profile": "Profil de salon sur solen.ch — comment les clients voient votre salon",
    "badge_bookings": "+47 réservations/semaine",
    "badge_rating": "Note de 4.8"
  }
}
```

[MODIFY] `messages/it.json`:
```json
{
  "partner": {
    "hero_title_1": "Il tuo salone.",
    "hero_title_accent": "Più clienti.",
    "hero_title_2": "Meno fatica.",
    "hero_subtitle": "Registra il tuo salone gratuitamente su solen.ch — la piattaforma beauty di Basilea. Prenotazioni online, dashboard, gestione clienti — tutto in uno.",
    "hero_cta": "Inizia gratis",
    "hero_subtext": "Nessuna carta di credito richiesta · Online in 5 minuti",
    "alt_dashboard": "Dashboard Solen — calendario prenotazioni e gestione salone",
    "alt_profile": "Profilo salone su solen.ch — come i clienti vedono il tuo salone",
    "badge_bookings": "+47 prenotazioni/settimana",
    "badge_rating": "Valutazione 4.8"
  }
}
```

> ⚠️ **BE CAREFUL**:
> - All 4 locale files (de, en, fr, it) MUST have the same keys — missing keys cause runtime crashes
> - The `"partner"` key must be added as a TOP-LEVEL key in each JSON, not nested inside another section
> - Check that the existing JSON is valid after adding — watch for missing commas

---

## Phase 4: Validation & Smoke Test 🤖

### 4.1 Banned token check
```bash
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|text-dark|bg-dark|bg-black|bg-gray-|text-gray-" app/\[locale\]/partner/page.tsx | head -10
# Must return 0 results
```

### 4.2 Dark mode pair check
```bash
grep -n "bg-white" app/\[locale\]/partner/page.tsx | grep -v "dark:"
# Must return 0 results (every bg-white needs a dark: pair)
```

### 4.3 Build check
```bash
npm run build
# Must pass with 0 errors
```

### 4.4 Dead code check
```bash
grep -rn "InteractiveHoverButton" app/\[locale\]/partner/page.tsx
# Must return at least 1 result (component is used, not dead import)
```

### 4.5 Visual verification
- Open `/de/partner` on desktop (1440px) — text left, mockups right
- Open `/de/partner` on mobile (375px) — text stacked on top, mockup below, no overflow
- Toggle dark mode — badges and borders adapt, mockup images still visible
- Switch to `/en/partner`, `/fr/partner`, `/it/partner` — all text renders translated
- Check image load: each `.webp` under 200KB, no 404s

---

## Files Changed Summary

| Tag | File | What |
|---|---|---|
| [NEW] | `public/images/partner/dashboard-mockup.webp` | Generated laptop dashboard mockup |
| [NEW] | `public/images/partner/profile-mockup.webp` | Generated phone salon profile mockup |
| [MODIFY] | `app/[locale]/partner/page.tsx` | Hero rewrite: split layout, imports, InteractiveHoverButton, i18n |
| [MODIFY] | `messages/de.json` | Add `"partner"` section with 10 keys |
| [MODIFY] | `messages/en.json` | Add `"partner"` section with 10 keys |
| [MODIFY] | `messages/fr.json` | Add `"partner"` section with 10 keys |
| [MODIFY] | `messages/it.json` | Add `"partner"` section with 10 keys |

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Create directory + generate images | Nothing |
| Phase 2 | 🤖 | Rewrite hero section | Phase 1 (images must exist) |
| Phase 3 | 🤖 | Add i18n keys to all 4 locales | Phase 2 (code references translation keys) |
| Phase 4 | 🤖 | Validation + smoke test | Phases 1-3 all complete |

---

## Git Strategy

```bash
# One commit per sub-phase (CLAUDE.md Rule 3):
git add public/images/partner/
git commit -m "partner page topic 1.1: add product mockup images"

git add app/\[locale\]/partner/page.tsx
git commit -m "partner page topic 1.2: split hero with product mockups and InteractiveHoverButton"

git add messages/
git commit -m "partner page topic 1.3: add partner i18n keys (de/en/fr/it)"
```
