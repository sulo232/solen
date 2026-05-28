# /business Rebuild Spec — 2026-05-26

> Solen B2B partner-acquisition subsite. Audited against `_design-system/SOURCE.md` V3-D183 (with locked V3-D192-fix accent + V3-D193 type weights).
>
> **Scope**: `app/[locale]/business/page.tsx` family. NOT `/dashboard/*` (post-auth product UI — out of scope).
>
> **Constraint reminder**: this is a SPEC. Do not edit application code in this round.

---

## §0 · Inventory — what exists today

| Path | Purpose | Render status |
|---|---|---|
| `app/[locale]/business/page.tsx` | The B2B landing page itself | RENDERS — V3-D147 (2026-05-25) |
| `app/[locale]/_components/homepage/BusinessTeaser.tsx` | Homepage card linking to /business | RENDERS — V3-D149 (2026-05-25), Uber image-above-text pattern |
| `app/[locale]/_components/homepage/BentoBusiness.tsx` | 4-card Apple-style bento + Join Us card with morph-dialog signup form | RENDERS — imported by `/business/page.tsx` at bottom, NOT by homepage anymore |
| `app/[locale]/_components/homepage/WhySolen.tsx` | Legacy "SalonRegister" — 2026-05-14 Fresha-style copy-LEFT + product-mockup-RIGHT | **DEAD CODE** — no longer imported. CTA points to `/business/signup` (404). |
| `app/[locale]/business/anmelden/*` | Brief refers to this | **DOES NOT EXIST** — `#anmelden` is only a hash anchor inside `/business` pointing at `<JoinUsCard>` (the inline expand-to-form modal). |
| `app/[locale]/business/how/*` | Linked from Header ("Wie es funktioniert") | **404** — no page exists |
| `app/[locale]/business/demo/*` | Linked from Header ("Demo buchen") | **404** — no page exists |
| `app/[locale]/business/signup/*` | Linked from WhySolen + MobileMenu comment | **404** — superseded by `#anmelden` anchor on `/business`, but inbound links not updated |
| `app/[locale]/business/help/*` | Linked from Footer ("Salon-Hilfe") | **404** — no page exists |

### Drift in `/business/page.tsx` (against SOURCE.md V3-D183)

| Drift | Lines | Severity | Notes |
|---|---|---|---|
| Inline `style={{ fontSize: "clamp(36px, 6.5vw, 64px)" }}` H1 | 129 | HIGH | Out of Scale B. Spec says Hero H1 `clamp(36, 9vw, 46) / weight 800 / -0.03em / lh 1.0`. Current weight is via class `font-extrabold` ✓ but size + tracking diverge. |
| Inline `style={{ fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.1 }}` Section H2 ("In 3 Schritten…") | 178-181 | MED | Spec says Section H2 `clamp(18, 2vw, 23) / 700`. Current is 28→44 → reads as Page H2 (clamp 25→40 / 800), not a Section H2. Mis-scaled — uses bigger Page-H2 size with even bigger top-end. |
| Inline `style` H2 "Keine versteckten Gebühren." `text-[22px] md:text-[26px]` | 226 | MED | Custom size — neither role table size. Closest legit role is Section H2 `clamp(18, 2vw, 23)`. |
| Eyebrow tracking `tracking-[0.18em]` (line 124) vs spec `tracking-[0.16em]` (SOURCE.md §3) | 124 | LOW | Spec says 0.16em. Two-line uppercase eyebrow inside hero overlay — could justify wider on dark surface, but spec value should win. |
| White-on-image CTA bg `bg-white` with shadow `rgba(0,0,0,0.18)` | 139 | INFO | Acceptable — CTAs on top of dark imagery override `bg-s-ink` convention for legibility. But this contradicts V3-D192-fix "primary CTAs stay `bg-s-ink`." Either restate as "hero-overlay variant" exception or restructure layout so CTA sits on white. |
| `rounded-[20px] md:rounded-[28px]` hero card radius | 99 | LOW | `rounded-card-lg` = 20px exists; the 28px md variant is arbitrary (not in `tailwind.config.js` radius scale). Either swap md variant to a token or use bare `rounded-card-lg`. |
| `pb-16 md:pb-20` (pricing) | 222 | LOW | Out-of-scale: spec uses Tailwind 4-pt scale (`py-12 md:py-20` is legit, `pb-16 md:pb-20` skips). |
| `border border-s-ink/10` | 223 | LOW | Should be `border border-s-border` per §2.1. |
| No `<main>` landmark — page sits inside layout's `<main>` ✓ | — | INFO | Verified via layout.tsx. OK. |
| No anchor at top for scroll/skip nav from hero CTA → form section | line 138 anchors `#anmelden`, line 262 wraps target div | INFO | Wiring works. Verified. |
| No accent (royal blue) used anywhere | entire file | HIGH | V3-D192 activated `s-accent #1638C4` as Apple-style highlight (eyebrows, links, bullets, status pills, selected tabs). This page has no accent moments at all → defaults to a pure-greyscale page in a system that now has color. Misses the new identity layer. |

### Drift in `BentoBusiness.tsx`

| Drift | Lines | Severity | Notes |
|---|---|---|---|
| Inline `bg-gradient` with hardcoded `rgba(22,56,196,0.22)` (royal blue) + `rgba(255,195,43,0.18)` (yellow) | 128 | INFO | The blue ✓ matches `s-accent`. Yellow stars on a glow halo are signal/visual — OK (off-budget star yellow). Migration target: bind to `--color-s-accent`. |
| `tracking-[-0.025em]`, `tracking-[-0.015em]`, `tracking-[-0.02em]` | 605, 715, 104 | MED | Spec tracking is `-0.03em` everywhere for display. Three different tracking values across the same file. Tighten to one. |
| `style={{ fontSize: "clamp(28px, 4vw, 48px)" }}` JoinUsCard title | 531 | HIGH | Out of Scale B. Closest role: Page H2 (clamp 25→40 / 800). At 28→48 it's 20% bigger at the top end. Either declare this as a new "Hero block in BentoBusiness" role in §3 OR scale down to Page H2. |
| `style={{ fontSize: "clamp(32px, 5vw, 56px)" }}` section h2 | 714 | HIGH | Same — bigger than Page H2's 40px cap. |
| `style={{ borderRadius: "24px" }}` JoinUsCard | 507 | LOW | `rounded-3xl` = 24px ✓ → use Tailwind class. |
| `font-extrabold` h3 inside BentoCard | 104 | LOW | h3 cards usually `font-bold` (700) per role table card-name row (Hanken 500-600). `font-extrabold` overshoots. |
| `background: "#F2D77B"` butter-yellow eyebrow dot (lines 524, 599, 562) | 524, 599 | HIGH | **Retired `s-butter` color** (SOURCE.md §2.2). The dot should now be `bg-s-accent` (royal blue) — that's exactly the "section eyebrow + bullet" use case in §2.1 — or `bg-white/40` if blue is wrong against ink-bg. |
| Star yellow as inline `color: "#F2D77B"` (line 564) | 564 | HIGH | Wrong yellow. Star token is `#FFC32B` (Q1). 5-star line should use `text-s-star` token, not a custom shade. |
| BentoCard hover shadow `rgba(0,0,0,0.04)` → `rgba(0,0,0,0.06)` (lines 89-91) | 89-91 | MED | Bypasses elevation-1 → elevation-2 system. Should use `shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200 ease-glide`. |
| BentoCard mouse-tilt rotateX/rotateY ±6° via Framer (lines 54-67) | 54-67 | LOW | Custom motion not in §6 motion vocabulary catalog. Add as a named pattern in `_design-system/components/BentoCard.md` with a documented exception, or remove. |
| Form `<input>` border-radius `12px` literal in className | 644 | LOW | `rounded-input` = 16px is the token. Either declare 12 as a "dark-surface input radius" variant or align. |
| Form `<input>` `bg-white` on ink bg — should follow `s-bg-active` typing convention (§2.1) | 644-666 | LOW | Acceptable on dark surface for contrast. Document the variant. |
| `transition-shadow duration-300 ease-out` (line 90) | 90 | MED | Should be `duration-200 ease-glide` per §6.1 + §6.4. |
| Whole-row tab buttons inside VisualAnalyticsTabbed (lines 420-438) — `aria-pressed`, `focus-visible:outline` ✓ | 420-438 | INFO | A11y wiring correct. Active state uses `border-s-ink text-s-ink bg-s-ink/[0.06]`; this is the *selected tab* moment which §2.1 lists as an `s-accent` use case. Should swap to `border-s-accent text-s-accent bg-s-accent-pale`. |
| Hardcoded calendar bg colors `#E5F2EA / #FFE8D8 / #D4DDC8 / #EAE0D0 / #FFF1C2` (lines 235-251) | 235-251 | INFO | These are retired warm-pastel category-tinted booking blocks (pre-B&W era). In a brand-chrome-B&W page they read as accidental color. Either flatten to grey-scale (`bg-s-bg-sunken` shades) or accept as "content illustration" (since calendar is a mockup of customer-supplied salon UI). Recommend flatten — calendar IS chrome here, not content. |

### Drift in `BusinessTeaser.tsx`

| Drift | Lines | Severity | Notes |
|---|---|---|---|
| `tracking-[-0.03em]` ✓, `font-extrabold` ✓, `leading-[1.0]` ✓, weight 800 (V3-D193) ✓ | 64-66 | OK | Perfectly matches V3-D193 Page H2 spec. |
| `font-body text-[15px] md:text-[17px]` sub | 70 | INFO | 17 is not in Scale B (closest: 16). 15→17 step is acceptable but spec says Hero sub `clamp(14, 3.5vw, 16)`. Drop the 17 step. |
| Placeholder `bg-s-bg-sunken` + `<ImageIcon>` instead of real image | 42-53 | INFO | V3-D166 deferred. Restoration path documented in code comments. |
| CTA `text-[14px] md:text-[15px]` ✓ | 76 | OK | Matches Button CTA role (15). |
| Eyebrow `tracking-[0.16em]` ✓, weight 700 ✓, `text-s-ink-3` ✓ | 58 | OK | Spec match (Q21 / V3-D192 says blue is option for accent eyebrows — but B&W eyebrow with grey bullet is also legal). |

### Drift summary verdict

`BusinessTeaser` (homepage card) is **substantially aligned** — only the 17px sub-step is wrong. `BentoBusiness` and `/business/page.tsx` both ship considerable drift, primarily:

1. **Inline display sizes outside Scale B** (5 instances of `style={{ fontSize: "clamp(...)" }}` — each pre-dates V3-D190's −10% rescale + V3-D193's 900→800 weight relock)
2. **Retired butter yellow `#F2D77B`** still appears as accent dot + star color (should be `s-accent` blue dot + `s-star` yellow stars)
3. **Custom shadow + transition values** bypassing elevation-1/2/3 + duration-200 ease-glide locks
4. **Tracking inconsistencies** across same surfaces (`-0.025em` / `-0.015em` / `-0.02em` / `-0.03em` mixed)
5. **No royal blue accent anywhere** — page reads as a pure B&W relic from the V3-D189 era, ignoring V3-D192's activation

---

## §1 · Target IA — locked

References (in priority order):

- **Mobbin Fresha business landing** (~5 distinct screens — `online-bookings`, `surge-pricing-add-on`, `insights-add-on`, marketplace landing, signup chooser)
- **Mobbin B2B SaaS landing** (8 distinct apps — GitHub, Wave, monday.com, Jobber, 7shifts, Apollo, Fibery)
- **Fresha live captures** at `public/_pixel-refs/fresha/business/`:
  - `hero-375.png`, `hero-1440.png` — hero crop only
  - `full-page-375.png`, `full-page-1440.png` — full page (used for section IA mapping)

### Cross-reference IA pattern (what every winning B2B landing has)

| Pattern | Mobbin sources confirming | What it does |
|---|---|---|
| **Hero with H1 + subhead + 2 CTAs + product visual** | Fresha (all 5 captures), GitHub, monday.com, Jobber, Wave, Apollo, Fibery, 7shifts | Primary conversion above the fold |
| **Bulleted value list under sub** (3 ticks) | Fresha online-bookings, Fresha surge-pricing, Fresha insights | Quick-scan benefits before the CTA |
| **Trust strip** (numbers, logos, awards) | Fresha hero, Apollo, monday.com, 7shifts | "Real businesses use this" social proof |
| **Big features bento / panel section** | Fresha "One platform, infinite possibilities", Apollo "AI sales platform", monday.com | Show the product without making them click |
| **Marketplace pitch** (specific to consumer-marketplace tools) | Fresha — distinct section for "we drive customers to you" | The unique value for a marketplace tool |
| **Pricing transparency** | Fresha pricing strip, Jobber "No credit card required" | Kills price-anxiety objection |
| **Testimonials / awards** | Fresha "Top-rated by industry" + customer stories | Independent credibility |
| **FAQ** | Fresha (large), nearly all SaaS landings | Last-mile objection handling |
| **Final CTA + secondary path** | Fresha "What are you waiting for?", every Mobbin ref | Conversion when scroll reaches bottom |

### Solen-specific overlays

- **Swiss positioning** — Postfinance/UBS-style royal blue accent + Swiss-spec city list ("Basel · Zürich · Bern · Lugano")
- **`du` not `Sie`** — confidential, direct German voice
- **No exclamation marks** (§18) — confidence over enthusiasm
- **30-Sekunden parallel** — the consumer page promises "Termin in 30 Sek." → the partner page promises "60-Sek. Anmeldung" (already in BentoBusiness JoinUsCard)
- **Single saturated accent** — V3-D192 royal blue. Use it sparingly: eyebrow bullets, the inline link "Mehr lesen", the "NEW" tag potential, selected tab states. NEVER on the primary CTA.

### Section list — `/business` rebuild (top to bottom)

| # | Section | Mobbin pattern | Solen treatment | Estimated viewport h (mobile) |
|---|---|---|---|---|
| 1 | **Hero** | Fresha for-business (mobile capture `hero-375.png`) + Apollo (centered) + Jobber (split image-right) | Image-FIRST mobile (4:5 illustration top), text below with eyebrow + H1 + sub + 2 CTAs (primary `bg-s-ink "Jetzt anmelden"` + ghost "Demo buchen"). Desktop: image stays full-width with bottom-left text overlay (matches V3-D147 current pattern). KEEP the V3-D147 illustration. | ~620px mobile |
| 2 | **Trust strip** | Fresha hero strip ("130,000+ businesses") | Compact band: `1'200+ Schweizer Salons · Basel · Zürich · Bern · Lugano · ★ 4.9` — currently exists in /business/page.tsx, KEEP but lighten spacing. | ~80px |
| 3 | **3-step "Wie es funktioniert"** | Fresha online-bookings 3-checkbox list, Apollo step blocks | KEEP current "01 Anmelden / 02 Verbinden / 03 Buchungen empfangen" structure — but fix H2 size (currently 28→44, should be 25→40 / weight 800). Add `s-accent` numerals (the giant "01") at 6% opacity so they read as semi-decorative — matches §2.1 accent use. | ~520px |
| 4 | **4-card feature bento (BentoBusiness)** | Fresha "One platform, infinite possibilities" (six tiles), Apollo bento, monday.com modules | REUSE current BentoBusiness 4-card grid (Sofortige Bestätigung / Direkt-Chat / Voller Kalender / Analytics) — but fix inline display sizes, swap retired butter yellow → s-accent / s-star, flatten retired calendar pastels → grey-scale, normalize tracking + duration tokens. | ~1100px |
| 5 | **Marketplace pitch (NEW SECTION)** | Fresha "popular marketplace to grow your business" (distinct section) | NEW. Solen IS a marketplace, not just calendar software. Headline: "Über 1'200 Schweizer Salons sind sichtbar auf solen.ch." Subhead: "Kund:innen finden dich — du musst nicht akquirieren." Visual: small static map of CH dots OR a stacked-cards mockup of Solen consumer SalonCards. CTA inline: "So findest du Kund:innen →" (link, no separate button — links use `text-s-accent`). | ~480px |
| 6 | **Pricing transparency** | Fresha "no cost" pricing reassurance | KEEP current "Keine versteckten Gebühren" + 3-tick checklist — but normalize to `border-s-border`, fix H2 to Section H2 spec (18→23 / 700), 4-pt scale padding (`py-12 md:py-16` not `pb-16`). | ~360px |
| 7 | **Testimonials (NEW SECTION)** | Fresha "Boss your business" customer stories, 7shifts trust block | NEW. 2-3 quote cards (`ReviewCard`-style pattern — read SOURCE.md §8 + reviews `components/ReviewCard.md` when extracted) from real Solen partners (Lara K. from Salon Maria, etc.) — quote + name + salon + city + star row. KEEP the design system's review-card grammar, NOT a custom pattern. **Empty-state**: if no real testimonials yet, OMIT this whole section in v1 — better silent than fake quotes (§18 voice rule). | ~520px (or 0 if no data) |
| 8 | **FAQ (NEW SECTION)** | Fresha large FAQ accordion, Apollo FAQ | NEW. 5-7 Q&A items in `<details>` accordions (native semantic, custom-styled). Questions cover: "Wie viel kostet Solen?" / "Wann zahle ich?" / "Wie lange dauert das Onboarding?" / "Kann ich meine bestehende Software importieren?" / "Wer kümmert sich um Zahlungen?" / "Ist Solen in [Stadt] verfügbar?" — direct answer style, no marketing-speak. | ~600-900px depending on count |
| 9 | **Final CTA + form (JoinUsCard from current BentoBusiness)** | Fresha "What are you waiting for?", Apollo final block | KEEP current JoinUsCard MorphingDialog expand-to-form pattern. This IS the `#anmelden` anchor target. Fix the dot color (retired butter `#F2D77B` → `s-accent`), fix star color (`#F2D77B` → `s-star #FFC32B`), align tracking to `-0.03em`. | ~480px collapsed, ~860px expanded |

### Header / Footer / sub-routes (out of scope for v1 rebuild but flagged)

- `/business/how` (Header link → 404) — either remove the header link, OR build a thin "Wie es funktioniert" page that's just sections #3 + #4 of `/business` on its own. **Recommend remove** — `/business` already covers it.
- `/business/demo` (Header link → 404) — either remove or wire to Calendly / form. **Recommend swap to `#anmelden`** until demo flow exists.
- `/business/signup` (still referenced from `WhySolen.tsx` → dead code anyway, and `MobileMenu.tsx` comment line 35 only) — delete WhySolen.tsx + remove the comment.
- `/business/help` (Footer "Salon-Hilfe" → 404) — out of scope; defer.

---

## §2 · Per-section spec

### §2.1 · Hero

**Spec source:** `_design-system/SOURCE.md` §3 (Hero H1 row), §1 (positioning), §18 (voice).

**Section wrapper:**
```
<section className="relative">
  <div className="relative mx-auto max-w-[1400px] px-4 pt-6 md:px-8 md:pt-10">
    <div className="relative overflow-hidden rounded-card-lg md:rounded-[28px]">
      ...
    </div>
  </div>
</section>
```

**Image:**
- Mobile aspect `4/5`, desktop `16/9` (KEEP V3-D147 pattern — measured-correct).
- Source: `/illustrations/business/business-hero.png` (1672x941, KEEP).
- `<Image fill priority sizes="(max-width: 768px) 100vw, 1400px" className="object-cover">`.

**Overlay text block** — mobile bottom-center, desktop bottom-left:
```
<div className="absolute inset-x-0 bottom-0 p-5 md:bottom-0 md:left-0 md:right-auto md:max-w-[640px] md:p-12 lg:p-16">
  <p className="mb-3 font-body text-[12px] font-bold uppercase tracking-[0.16em] text-white/85">
    Für Salons
  </p>
  <h1 className="font-display font-extrabold leading-[1.0] tracking-[-0.03em] text-white text-[clamp(36px,9vw,46px)]">
    Solen für<br />dein Geschäft.
  </h1>
  <p className="mt-4 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-light leading-[1.4] tracking-[-0.025em] text-white/85">
    Mehr Buchungen, weniger Aufwand. Vier Werkzeuge, eine Plattform.
    Über 1'200 Salons buchen schon mit Solen.
  </p>
  <div className="mt-6 flex flex-wrap items-center gap-3">
    <Link href="#anmelden" className="...bg-white text-s-ink...">Jetzt anmelden →</Link>
    <Link href="#how" className="...bg-transparent text-white border border-white/30...">Wie es funktioniert</Link>
  </div>
</div>
```

**Token changes from current:**
- H1 inline style → tokenized Tailwind: `text-[clamp(36px,9vw,46px)]` (Hero H1 role from SOURCE.md §3)
- Tracking eyebrow: `0.18em` → `0.16em` (SOURCE.md §3 Eyebrow role)
- Add second CTA "Wie es funktioniert" as ghost button — anchors to section #3 `#how`. Pattern matches Fresha + every Mobbin SaaS ref (every one has 2 CTAs in hero).
- Primary CTA stays `bg-white text-s-ink` (overlay variant — documented exception, see §2.1 anti-pattern note in SOURCE.md — needs a Q entry; flagged in §5 below).

**Motion:**
- Hero illustration: `priority` (no lazy). No entrance animation — first paint is the entrance.
- CTAs: `hover:-translate-y-[1px]` 200ms ease-glide + `active:scale-[0.97]` (matches §6.4 Primary CTA row).

**A11y:**
- `<h1>` only once on the page ✓
- Alt text: KEEP current full-sentence German alt.
- Ghost CTA `aria-describedby` pointing at the section it scrolls to (optional polish).

---

### §2.2 · Trust strip

**Spec source:** §3 (Body secondary + Caption), §4 (Section spacing).

**Wrapper:**
```
<section aria-label="Vertrauenssignale" className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12">
  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center font-body text-[13px] font-medium text-s-ink-2 md:gap-x-10 md:text-[14px]">
    <span><strong className="font-semibold text-s-ink">1'200+</strong> Schweizer Salons</span>
    <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
    <span>Basel · Zürich · Bern · Lugano</span>
    <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
    <span><Star size={12} fill="#FFC32B" stroke="none" aria-hidden /> <strong className="font-semibold text-s-ink">4.9</strong> · 1'200+ Partner</span>
  </div>
</section>
```

**Token changes from current:**
- Star is now a `lucide Star` icon at `fill="#FFC32B"` per §7 (Fill rules) + §2.1 (`s-star`). Current "★ 4.9" uses Unicode `★` (forbidden per §7 anti-patterns).
- Font weight `semibold` (600) → `medium` (500) per §3 — body secondary is light; emphasized words go semibold within the run, not the whole span.

**A11y:**
- `aria-label="Vertrauenssignale"` on `<section>` for landmark grep.

---

### §2.3 · "Wie es funktioniert" (3-step)

**Spec source:** §3 (Section H2 + Body), §4 (Section spacing), §2.1 (`s-accent` for the numerals).

**Wrapper + header:**
```
<section id="how" className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
  <div className="mb-10 text-center md:mb-12">
    <p className="mb-3 font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-accent">
      <span aria-hidden className="mr-2 inline-block h-[5px] w-[5px] rounded-full bg-s-accent align-middle" />
      So funktioniert's
    </p>
    <h2 className="font-display font-bold leading-[1.0] tracking-[-0.03em] text-s-ink text-[clamp(25px,4vw,40px)]">
      In 3 Schritten Solen-Partner.
    </h2>
  </div>
  <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
    ...
  </ol>
</section>
```

**Per-step card:**
```
<li className="rounded-card bg-s-bg-sunken p-7 md:p-8">
  <p className="font-display text-[40px] font-extrabold leading-none tracking-[-0.03em] text-s-accent/30 md:text-[48px] tabular-nums">
    01
  </p>
  <h3 className="mt-5 font-display text-[clamp(18px,2vw,23px)] font-bold tracking-[-0.03em] text-s-ink">
    Anmelden
  </h3>
  <p className="mt-2 font-body text-[14px] font-light leading-[1.55] text-s-ink-2">
    60 Sekunden Formular. Name, Salon, Stadt — fertig.
  </p>
</li>
```

**Token changes from current:**
- H2 size: `clamp(28px, 4vw, 44px)` → `clamp(25px, 4vw, 40px)` (Page H2 from §3, not custom).
- H2 weight: `font-extrabold` (800) ✓ kept at Page H2 weight (V3-D193).
- H2 tracking: `-0.025em` → `-0.03em` per §3.
- Step numerals: were grey `text-s-ink/20`, now `text-s-accent/30` (royal blue at 30% — the spec's "data-emphasis (sparingly)" use case in §2.1). This is the one place the accent shines on this page.
- Eyebrow color: was `text-s-ink-3`, now `text-s-accent` + accent bullet ✓ (§2.1 primary accent use).
- Card bg: kept `bg-s-bg-sunken` ✓.
- Card radius: `rounded-2xl` → `rounded-card` (semantic clarity, same 16px).
- h3 weight: was `font-bold` ✓ — already correct for Section H2 size class.

---

### §2.4 · 4-card feature bento (BentoBusiness — refactored)

**Spec source:** §3 (Page H2), §6.4 (Card hover), §2.1 (accent + star tokens), §8 (Card grammar).

**Section header:**
```
<div className="mx-auto mb-10 max-w-[640px] text-center md:mb-12">
  <span className="mb-4 inline-flex items-center gap-2 font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-accent">
    <span aria-hidden className="block h-[5px] w-[5px] rounded-full bg-s-accent" />
    Vier Werkzeuge
  </span>
  <h2 className="font-display font-extrabold leading-[1.0] tracking-[-0.03em] text-s-ink text-[clamp(25px,4vw,40px)]">
    Eine Plattform, vier Werkzeuge.
  </h2>
  <p className="mt-5 font-body text-[clamp(14px,3.5vw,16px)] font-light leading-[1.55] text-s-ink-2">
    Sofortige Bestätigung, Direkt-Chat, voller Kalender, Analytics — alles im Solen-Dashboard.
  </p>
</div>
```

**BentoCard refactor:**
- Hover: replace custom shadow `rgba(0,0,0,0.04)→0.06` with `shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200 ease-glide`.
- Radius: `rounded-[24px]` → `rounded-3xl` (Tailwind class) OR `rounded-card-lg` 20px to align with hero card. Recommend `rounded-3xl` (24px stays) since BentoCards are big surfaces.
- h3 weight: `font-bold` (700) — drop `font-extrabold` (it overshoots Section H2 / card name role).
- Tracking: unify all instances to `-0.03em` for display roles, `-0.01em` for body. Audit lines 104, 605, 715.
- 3D tilt: KEEP (custom motion documented in §3 below as new BentoCard.md spec).

**Per-card visual fixes:**
- `VisualBooking`: glow uses `rgba(22,56,196,0.22)` (`s-accent`-tinted) — bind to a CSS var so single-token-revert works.
- `VisualCustomerDM`: stays as-is (b-w salon bubble + grey customer bubble, both ink-only).
- `VisualCalendar`: flatten pastel category bgs → `bg-s-bg-sunken` shades 1-3 (3 ink-weight tiers in `bg-s-ink/[0.04]`, `bg-s-ink/[0.06]`, `bg-s-ink/[0.08]`). The calendar IS chrome here (mockup of Solen UI), not user content — should be B&W per §9.
- `VisualAnalyticsTabbed`: tabs at lines 420-438 → active state swap from `border-s-ink text-s-ink bg-s-ink/[0.06]` → `border-s-accent text-s-accent bg-s-accent-pale` (V3-D192 "active/selected tab state" accent use). Bar gradient at line 366 stays `s-accent`-blue per V3-D78 (already aligns).

**JoinUsCard fixes (within BentoBusiness):**
- Eyebrow dot (lines 524, 599): `background: "#F2D77B"` (retired butter) → `background: "var(--color-s-accent)"` (royal blue dot on dark ink card — high contrast pop, matches §2.1 "section eyebrow + bullet" use).
- Star line (line 564): `color: "#F2D77B"` → use a `<Star size={12} fill="#FFC32B" stroke="none" aria-hidden />` icon row (lucide, not unicode characters per §7).
- Title size (line 531): `clamp(28px, 4vw, 48px)` → `clamp(25px, 4vw, 40px)` (Page H2 from §3) OR declare new role in SOURCE.md.
- Title tracking: `-0.025em` → `-0.03em`.
- Form input radius: `12px` literal → `rounded-input` (16px) to match design system input radius.

---

### §2.5 · Marketplace pitch (NEW)

**Spec source:** §3 (Section H2 + Body), §2.1 (`s-accent` link color), §21.4 (KEEP Fresha-style marketplace section).

**Section:**
```
<section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
  <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
    {/* LEFT — copy */}
    <div>
      <span className="font-body text-[12px] font-bold uppercase tracking-[0.16em] text-s-accent">
        <span aria-hidden className="mr-2 inline-block h-[5px] w-[5px] rounded-full bg-s-accent align-middle" />
        Marktplatz
      </span>
      <h2 className="mt-4 font-display font-extrabold leading-[1.0] tracking-[-0.03em] text-s-ink text-[clamp(25px,4vw,40px)]">
        Kund:innen finden dich. Du musst nicht akquirieren.
      </h2>
      <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-light leading-[1.55] text-s-ink-2">
        Über 1'200 Schweizer Salons sind auf solen.ch sichtbar. Jeden Tag suchen Tausende Kund:innen nach Terminen — in Basel, Zürich, Bern, Lugano.
      </p>
      <Link href="/" className="mt-6 inline-flex items-center gap-1 font-body text-[14px] font-semibold text-s-accent hover:text-s-accent-deep transition-colors duration-150 ease-glide">
        So findest du Solen-Kund:innen <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
      </Link>
    </div>
    {/* RIGHT — visual: stack of 3 SalonCards (overlapping, perspective tilt) */}
    <div className="relative aspect-[4/3] w-full">
      ...stacked SalonCard mockup OR static CH-map illustration...
    </div>
  </div>
</section>
```

**Decision needed (Q entry — see §5):** which visual? Stacked SalonCard mockup wins on brand-consistency (uses the existing SalonCard component pattern, reinforces "this is what your salon looks like to Kund:innen"). CH-map dots wins on geographic claim. Recommend: stacked SalonCards. Lower lift, brand-coherent.

**Token notes:**
- Link is `text-s-accent` (§2.1 "link color" — primary accent use).
- Eyebrow + bullet are `s-accent` per §2.1.
- NO primary CTA in this section — link-only. Avoids competing with the hero CTA + the JoinUsCard CTA at end.

---

### §2.6 · Pricing transparency

KEEP current section structurally. Fixes:
- H2: `text-[22px] md:text-[26px]` → `text-[clamp(18px,2vw,23px)]` (Section H2 role from §3) + `font-bold` (700, not extrabold per V3-D193).
- H2 tracking: `-0.015em` → `-0.03em`.
- Card border: `border-s-ink/10` → `border-s-border` (token).
- Padding: `pb-16 md:pb-20` → `py-16 md:py-20` (already on the wrapping `<section>`, just normalize).
- Check icons: `size={16} strokeWidth={2.5}` ✓ keep.
- Card radius: `rounded-2xl` → `rounded-card` for semantic clarity.

---

### §2.7 · Testimonials (NEW — conditional on data)

**Decision needed (Q entry):** ship with 2-3 fake-but-marked testimonials, or omit entirely until real ones exist? **Recommend OMIT in v1.** Better silent than fake — Solen voice rule §18 anti-pattern: "Invented claims."

If shipped:
```
<section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20 bg-s-bg-sunken">
  <h2 className="text-center font-display font-extrabold leading-[1.0] tracking-[-0.03em] text-s-ink text-[clamp(25px,4vw,40px)]">
    Was Solen-Partner sagen.
  </h2>
  <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
    {/* ReviewCard pattern × 3 — see SOURCE.md §8 + future ReviewCard.md */}
    {testimonials.map(t => (
      <article className="rounded-card border border-s-border bg-white p-5">
        <div className="flex items-center gap-2">
          {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#FFC32B" stroke="none" aria-hidden />)}
        </div>
        <blockquote className="mt-3 font-body text-[14px] font-light leading-[1.55] text-s-ink line-clamp-3">
          "{t.quote}"
        </blockquote>
        <footer className="mt-4 flex items-center gap-3">
          <Image src={t.avatar} alt="" width={32} height={32} className="rounded-full" />
          <div>
            <p className="font-body text-[13px] font-medium text-s-ink">{t.name}</p>
            <p className="font-body text-[11px] font-light text-s-ink-2">{t.salon} · {t.city}</p>
          </div>
        </footer>
      </article>
    ))}
  </div>
</section>
```

**Data shape needed:** `testimonials: Array<{ quote: string; name: string; salon: string; city: string; avatar: string }>`. Source: query Supabase `salons` joined with `business_partner_testimonials` (new table) OR hardcoded array for v1.

---

### §2.8 · FAQ (NEW)

**Spec source:** §3 (Section H2 + Body), §6 (Motion — accordion expand).

**Pattern:** Native `<details><summary>` for accessibility + state, custom-styled. No JS needed.

```
<section className="mx-auto max-w-[820px] px-4 py-16 md:px-8 md:py-20">
  <h2 className="text-center font-display font-extrabold leading-[1.0] tracking-[-0.03em] text-s-ink text-[clamp(25px,4vw,40px)]">
    Häufige Fragen.
  </h2>
  <div className="mt-10 divide-y divide-s-border">
    {FAQS.map(({ q, a }, i) => (
      <details key={i} className="group py-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-[15px] font-semibold text-s-ink">
          {q}
          <ChevronDown
            size={18}
            strokeWidth={2.5}
            aria-hidden
            className="shrink-0 text-s-ink-3 transition-transform duration-200 ease-glide group-open:rotate-180"
          />
        </summary>
        <p className="mt-3 font-body text-[14px] font-light leading-[1.55] text-s-ink-2">
          {a}
        </p>
      </details>
    ))}
  </div>
</section>
```

**FAQ data (recommended starter set):**
1. **Wie viel kostet Solen?** — "Kostenlose Anmeldung, keine Setup-Gebühr, keine monatliche Grundgebühr. Du zahlst nur pro vermitteltem Termin — fair und transparent."
2. **Wann zahle ich?** — "Erst ab dem ersten erfolgreich vermittelten Termin. Bis dahin entstehen keine Kosten."
3. **Wie lange dauert das Onboarding?** — "Anmelden in 60 Sekunden, Onboarding in 7 Tagen. Wir melden uns binnen 24 Stunden nach deiner Anmeldung."
4. **Kann ich meine bestehende Kalender-Software importieren?** — "Ja. Wir unterstützen Imports aus den gängigen Schweizer Salon-Systemen. Sprich uns nach der Anmeldung an."
5. **Wer kümmert sich um Zahlungen?** — "Solen verarbeitet die Zahlungen sicher (Stripe). Du erhältst eine monatliche Auszahlung — Anteil deiner Wahl."
6. **In welchen Städten ist Solen verfügbar?** — "Aktuell Basel, Zürich, Bern und Lugano. Weitere Städte folgen 2026."
7. **Muss ich Mindestkund:innen vermitteln?** — "Nein. Solen ist ein Marktplatz — du nimmst nur die Termine an, die dir passen."

---

### §2.9 · Final CTA + form (JoinUsCard refactor)

KEEP MorphingDialog expand-to-form pattern from current BentoBusiness JoinUsCard. Fixes per §2.4 above (dot color, star color, title size, tracking, input radius). The whole section is wrapped in `<div id="anmelden">` (already done at line 262 of page.tsx) — KEEP the anchor.

---

## §3 · New components needed

Per CLAUDE.md project rule: "When creating a NEW shared component, in the same turn, write `_design-system/components/<Name>.md`."

### 3.1 · `<BentoCard>` (extract from `BentoBusiness.tsx`)

Currently inlined as `function BentoCard()` in BentoBusiness.tsx (lines 51-114). Promote to:
- **File:** `app/[locale]/_components/business/BentoCard.tsx`
- **Doc:** `_design-system/components/BentoCard.md`
- **Public API:** `{ title, description, visual, className?, accent?: boolean }`
- **Anatomy:** rounded-3xl white card · shadow-elevation-1 → elevation-2 on hover · 3D mouse-tilt ±6° (desktop only via `@media (hover: hover)`) · interior `<div>` with visual flex-1 + copy block at bottom · `transform: translateZ(20px)` for the copy depth-pop · whileInView entrance fade-up · h3 (font-display 20-22px, weight 700, tracking -0.03em) + p (body 14px, weight 300, leading 1.5)
- **Visual catalog:** Document the four visuals used (`VisualBooking`, `VisualCustomerDM`, `VisualCalendar`, `VisualAnalyticsTabbed`) as named slots — when adding a new bento card, you build a new Visual* function with the same API.
- **Motion:** 3D mouse-tilt is a documented exception to §6 (not in the standard motion vocabulary). Document why: bento cards are the primary "wow" surface, the tilt earns the attention. Constrain to ±6° max and `motion/react` `useSpring` damping.

### 3.2 · `<Step>` (3-step section)

- **File:** `app/[locale]/_components/business/Step.tsx`
- **Doc:** `_design-system/components/Step.md`
- **Public API:** `{ n: string; title: string; copy: string }`
- **Anatomy:** rounded-card · bg-s-bg-sunken · p-7/p-8 · giant accent numeral (40-48px, weight 800, accent/30) · h3 Section H2 spec · p body primary
- **Three-step grid:** `grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6` wrapping the calling site, not inside Step itself

### 3.3 · `<FAQItem>` (FAQ accordion)

- **File:** `app/[locale]/_components/business/FAQItem.tsx`
- **Doc:** `_design-system/components/FAQItem.md`
- **Public API:** `{ q: string; a: string | React.ReactNode; defaultOpen?: boolean }`
- **Anatomy:** native `<details><summary>` · custom-styled chevron rotation 180° on `group-open` · 200ms ease-glide
- **Motion:** rotate chevron only — content reveal uses native `<details>` instant show (animating `<details>` open is non-trivial without JS; accept the instant reveal as the v1 default).
- **A11y:** native `<details>` provides aria-expanded + keyboard navigation for free. No additional wiring.

### 3.4 · `<MarketplaceVisual>` (stacked SalonCard mockup in §2.5)

- **File:** `app/[locale]/_components/business/MarketplaceVisual.tsx`
- **Doc:** `_design-system/components/MarketplaceVisual.md`
- **Public API:** none (decorative)
- **Anatomy:** 3 SalonCard mockups stacked + rotated (perspective effect). Each card uses real `<SalonCard>` component import to enforce consistency.
- **A11y:** `aria-hidden` on the whole stack (decorative).
- **Defer if visual decision goes "CH map" instead** (see §5 risks).

### 3.5 · No new `<TestimonialCard>` (use existing ReviewCard pattern)

Per §21.3, reviews → ReviewCard. Use that. Don't fork.

---

## §4 · Sequence of mechanical edits

**Order matters — earlier steps don't depend on later ones, but later steps assume earlier ones landed.**

1. **Delete `app/[locale]/_components/homepage/WhySolen.tsx`** (dead code — not imported anywhere; `/business/signup` href is now 404).
2. **Update `app/[locale]/_components/layout/Header.tsx` lines 58-59:** swap `/business/how` → `/business#how`, swap `/business/demo` → `/business#anmelden`. OR delete those two header items entirely (recommend swap to anchors — keeps the convert-pressure UX in Header).
3. **Update `app/[locale]/_components/layout/Footer.tsx` line 46:** swap `/business/help` → either remove the item or wire to a placeholder mailto / contact link.
4. **Update `app/[locale]/_components/layout/MobileMenu.tsx` line 35 (comment-only):** remove the stale `business/signup` mention.
5. **Refactor `app/[locale]/_components/homepage/BentoBusiness.tsx`:**
   - Extract `BentoCard` to `app/[locale]/_components/business/BentoCard.tsx` + write `_design-system/components/BentoCard.md` SAME TURN.
   - Swap retired butter `#F2D77B` (lines 524, 599, 562) → `var(--color-s-accent)` for dots, `<Star fill="#FFC32B">` for stars.
   - Normalize tracking across all inline `style.letterSpacing` → `-0.03em` for display, `-0.01em` for body.
   - Swap inline H2 sizes to Scale B clamp tokens.
   - Replace custom shadow → `shadow-elevation-1 hover:shadow-elevation-2 transition-shadow duration-200 ease-glide`.
   - Flatten `VisualCalendar` pastel bg colors to grey tones.
   - Update VisualAnalyticsTabbed tab active state → `border-s-accent text-s-accent bg-s-accent-pale`.
   - Add V3-D{next} provenance comments per §15 — one per locked change.
6. **Refactor `app/[locale]/business/page.tsx`:**
   - Build `<Step>` component + doc, replace inline 3-step list (lines 200-216).
   - Build `<FAQItem>` component + doc, add FAQ section.
   - Build `<MarketplaceVisual>` component + doc, add Marketplace section.
   - Add Hero second CTA (ghost "Wie es funktioniert" linking `#how`).
   - Add anchor `id="how"` on the 3-step section.
   - Normalize all inline display sizes → Scale B clamp tokens.
   - Eyebrow tracking 0.18em → 0.16em.
   - Replace `border-s-ink/10` → `border-s-border`.
   - Swap `rounded-2xl` decorative→ `rounded-card` semantic where applicable.
   - Add V3-D{next} provenance comments.
7. **Test:** load `/de/business`, `/en/business`, `/fr/business`, `/it/business` — verify metadata works for each locale + visual scan.
8. **Verifier-loop round 1** (per CLAUDE.md rule 9): spawn `design-verifier` with this spec + screenshots at 375 + 1440 viewports.
9. **Drift-checker:** add `app/[locale]/business/page.tsx` + `app/[locale]/_components/business/*` to `_design-system/_rebuilt_routes.json` `strict_globs` once round-1 passes clean.

---

## §5 · Risks / open questions

Append to `_design-system/QUESTIONS.md` as Q22-Q26.

### Q22 — Marketplace section visual: stacked SalonCards or CH map?
**Severity:** MED. Stacked SalonCards = brand-consistent + lower lift but visually a self-reference. CH map = geographic claim + unique-to-Solen but adds a new visual component family. **Recommendation:** stacked SalonCards for v1; defer CH map for v2.

### Q23 — Testimonials section: ship empty or omit until real data?
**Severity:** MED. Recommendation: omit in v1 (Solen voice §18 forbids invented claims). Re-add as soon as 3+ real Solen partners write usable quotes.

### Q24 — Hero second CTA: "Wie es funktioniert" anchor scroll, "Demo buchen" (Calendly), or "Watch overview" (video)?
**Severity:** MED. Fresha uses "Watch an overview" video. We have no demo video. Recommendation: anchor scroll to `#how` for v1 — lowest friction, ships immediately, swaps to video later when produced.

### Q25 — Hero primary CTA on the image overlay: stays `bg-white text-s-ink` (current) or migrates to `bg-s-ink text-white` per V3-D192-fix?
**Severity:** HIGH (color law adjacency). The V3-D192-fix lock says primary CTAs are `bg-s-ink`. The hero CTA sits on top of a dark image with overlay gradient — `bg-s-ink` becomes black-on-dark-image, hard to see. White-on-dark-image reads better. **Recommendation:** declare a documented exception in SOURCE.md §2.1 ("Hero overlay variant — primary CTA on dark-image hero uses `bg-white text-s-ink` for legibility; this is the ONLY exception to V3-D192-fix's lock"). Same reasoning Fresha uses (white CTA on their hero) — pure ink would vanish. Document and move on.

### Q26 — Should `/business` be a single-page-anchor experience, or fork off `/business/how`, `/business/demo`, `/business/help` as separate routes?
**Severity:** MED. Currently the Header links to `/business/how` + `/business/demo` (both 404). Two paths:
- A. Make `/business` the single canonical page; convert header links to in-page anchors (`#how`, `#anmelden`). Lower maintenance, one source of truth.
- B. Build out `/business/how`, `/business/demo`, `/business/help` as real routes with their own dedicated content.
**Recommendation:** A. Single-page beats route-sprawl for a B2B landing — Fresha does it on `/for-business`, every Mobbin SaaS ref does it. Maintain the marketing surface as ONE deeply-thought page rather than 4 thin ones.

### Q27 — BentoCard 3D mouse-tilt: keep, downgrade to scale, or remove?
**Severity:** LOW. Currently uses Framer Motion `useSpring` + transform3D perspective. Adds JS weight + complexity. Recommendation: KEEP for desktop (`@media (hover: hover)`), with documented `±6°` max in components/BentoCard.md. The card is the primary "wow" surface — earns the polish. Mobile already gets nothing (no hover) so no perf hit there.

### Q28 — Provenance numbering for the rebuild PR
**Severity:** LOW. Per §15 the global counter is currently at V3-D193. The rebuild will land ~15-20 V3-D{n} provenance comments. Reserve V3-D194-V3-D213 for this PR.

### Q29 — `BusinessTeaser` (homepage card) — KEEP or refactor as part of this PR?
**Severity:** LOW. The teaser drift is tiny (one `text-[17px]` step). Recommendation: leave BusinessTeaser alone in this PR. It's substantially aligned and one inline `17px` doesn't justify churn. Touch it only when next naturally touching the homepage. (Aligns with Q17 — sweep as touched.)

---

## §6 · Out of scope (explicitly NOT in this rebuild)

- `/dashboard/*` post-auth partner UI — separate product, separate route, separate rebuild.
- `/api/business/*` endpoints — backend lift to wire JoinUsCard form to a real submission endpoint. Currently fires `alert()`. Track in `_tasks/INCOMPLETE_FEATURES.md`.
- Real demo-booking flow — Q24's video / Calendly path. Track in INCOMPLETE_FEATURES.
- Real testimonials data pipeline — Q23. Track in INCOMPLETE_FEATURES.
- French + Italian copy translations — current page has French + Italian metadata strings only; body copy is German-only. Per §17 sweep-as-touched, defer until route translation pass.

---

*End of spec. Next step: user reviews → I write Q22-Q29 to QUESTIONS.md → user decides → mechanical edit pass per §4.*
