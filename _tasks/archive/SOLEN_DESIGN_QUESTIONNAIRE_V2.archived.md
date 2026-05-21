# Solen Design System — Questionnaire V2 (Q17 onwards)

> **Status:** in flight. Same shape as Q1–Q16 in `_tasks/SOLEN_DESIGN.md`. Each answered Q gets locked into `SOLEN_DESIGN.md` with a §20 Decisions Log row.

> **How to answer:** read each question, pick A/B/C/D (D = wildcard, may be much better or much worse). Write your pick as a Decisions Log row format: `Q## (date) | Lock: <variant>+<one-line-summary> | Rationale: <why>`. Then in conversation say "lock Q##" and I'll port it into `SOLEN_DESIGN.md`.

> **Source data:** synthesized from `_audits/COMMIT_TIMELINE.md`, `_audits/LOST_DECISIONS.md`, `_audits/CURRENT_STATE.md`, `_audits/STRUCTURE_AUDIT.md`, `_tasks/BACKEND_NEEDS_UI.md`, `_tasks/GAP_AUDIT_V2.md`, plus today's uncommitted green/amber/Anton/Figtree pivot.

---

## Categories

- **A1** — State primitives (Q17–Q22)
- **A2** — Surfaces (Q23–Q26)
- **A3** — Forms (Q27–Q32)
- **A4** — Domain widgets (Q33–Q39)
- **A5** — Page layouts (Q40–Q44)
- **A6** — Post-pivot refit (Q45–Q50)
- **A7** — Doc/code contradictions to resolve (Q51–Q55)
- **A8** — Cleanup sequencing (Q56–Q58)

---

## A1 — State primitives

### ~~Q17 — Focus ring~~ (SKIPPED 2026-05-01 — user opted out)
**Description.** The system rule for keyboard `:focus-visible`. Affects every interactive element. Existing precedent: WCAG AAA double box-shadow ring in coral/cream introduced in batch 52 commit a72755 (`components/ui/HomepageHero.tsx` + others), plus card-specific outline rule in `public/solen-coral.html:216` (`outline:2px solid var(--coral); outline-offset:2px`). The two precedents conflict.

**Variants.**
- **A** — Single coral outline 2px, 2px offset (matches `solen-coral.html` precedent). Simplest.
- **B** — Warm-ink outline + halo, adapts on dark/coral bgs (only one that survives all four real Solen surfaces: white / plum / coral / ink).
- **C** — Amber outline + soft halo (warm accent feel; halo can crash dense pill rows).
- **D wildcard** — Hard 3px ink border, no offset, no halo, square corners (editorial-magazine vibe; conflicts with pill brand language).

**Files relevant.** `components/ui/HomepageHero.tsx`, `public/solen-coral.html:216`, `app/globals.css` (where the rule will live).

**My pick:** B.

---

### ~~Q18 — Disabled state~~ (LOCKED 2026-05-01 → variant B: token swap to --ink4 / --ink3)
**Description.** No system rule. Each button/input/pill currently invents its own disabled visual.

**Variants.**
- **A** — Opacity 0.4, cursor not-allowed, disable hover. (Cheapest CSS.)
- **B** — Replace fill with `--ink4` (#A89C90 placeholder/disabled token already in palette per CLAUDE.md), text `--ink3`, cursor not-allowed. (Token-aware.)
- **C** — Reduce saturation 50% + opacity 0.6 + cursor not-allowed. (Preserves brand-color semantic, just dampened.)
- **D wildcard** — Replace with skeleton-shimmer style on disabled buttons (signals "waiting for something" not "blocked").

**My pick:** B.

---

### Q19 — Loading skeleton
**Description.** No reusable skeleton component in `components/ui/`. Per audit, multiple ad-hoc skeletons exist (`SalonPageSkeleton.tsx`, `CategorySkeleton`, `Skeleton` in `app/[locale]/loading.tsx`).

**Variants.**
- **A** — Single `<Skeleton />` primitive in `components/ui/Skeleton.tsx` with variant prop (text/avatar/card/image), `--sur` background, opacity-pulse animation.
- **B** — Pre-composed skeleton-of-each-component pattern: `SkeletonSalonCard`, `SkeletonHero`, etc. (more files, but lower per-use friction).
- **C** — CSS-only `.skeleton` utility class on globals.css with `aria-hidden`+`aria-busy` semantics. (No JS, fastest.)
- **D wildcard** — No skeletons at all — use a low-opacity actual content with disabled interaction until loaded. ("Optimistic placeholder" pattern.)

**My pick:** A + C combined (primitive + utility class).

---

### Q20 — Empty state pattern
**Description.** Used on cold-start homepage, no-search-results, empty-favorites, no-bookings, no-reviews. No system rule.

**Variants.**
- **A** — Centered illustration (lucide icon at 48px, ink3) + heading + 1-line subtext + 1 CTA. Simple, scannable.
- **B** — Same but with a soft `--coral-s` (now `--green-tint` post-pivot) background block to soften the void.
- **C** — Editorial: illustration + headline in display font + 2 secondary CTAs (browse alternatives + "we'll notify you").
- **D wildcard** — No empty state — just don't render the section at all when empty (silent disappear). Forces the rest of the page to fill the void with what's available.

**My pick:** A. (Magazine-quiet.)

---

### Q21 — Error state pattern
**Description.** For payment fail, network fail, form invalid, 500 page. Different from `app/[locale]/not-found.tsx` 404 (which already has visual treatment). Currently inconsistent — some places use `console.error` only, others throw.

**Variants.**
- **A** — Inline error: `--error-red` (#A33028) text, no icon, no banner. Next to the input that errored.
- **B** — Toast for transient errors + inline for form-field errors + full-page with "retry" CTA for fatal errors. (3-tier system.)
- **C** — Banner at top of view with `--error-red` border-left, icon, message, retry button. (Loud, hard to miss.)
- **D wildcard** — All errors as full-page modals (Apple-style "Something went wrong"). Most disruptive but unmissable.

**My pick:** B. (3-tier matches actual error contexts.)

---

### Q22 — Success / confirmation pattern
**Description.** Booking confirmed, salon saved to favorites, email sent, password updated. No system pattern.

**Variants.**
- **A** — Toast (matches Q23 toast spec) — auto-dismiss 4s, sage tint, checkmark.
- **B** — Inline: brief sage banner above the action that just succeeded, fades after 3s.
- **C** — Full-screen success state (BookingSuccess.tsx pattern) for major moments only — the rest use toast. (2-tier.)
- **D wildcard** — Confetti animation for major successes (booking confirmed) — scoped to 1 viewport-second, prefers-reduced-motion respected.

**My pick:** C. (Most success moments are minor → toast; booking deserves big.)

---

## A2 — Surfaces

### Q23 — Toast / snackbar
**Description.** Notification surface for transient feedback. No current spec.

**Variants.**
- **A** — Bottom-center, `--raised` bg, `--sh-md`, 320px max-width, slide-up entrance, auto-dismiss 4s. Variants: info/success/warn/error via left-border color.
- **B** — Top-right stack, dismissable, persistent until clicked. (Apple-style notifications.)
- **C** — Bottom-left, single-toast-only (replaces previous), shorter (3s). (Cleanest, fewest UI states.)
- **D wildcard** — Inline "ghost" toast that appears next to the triggering element (not at screen edge). More contextual, harder to engineer.

**My pick:** A.

---

### Q24 — Modal / dialog
**Description.** Beauty profile edit, GDPR confirm, login prompt, AI matcher wizard. No locked spec.

**Variants.**
- **A** — Center, `rgba(26,17,8,.55)` overlay, white panel `--r20`, `--sh-lg`, max-width 520px, scale-in 200ms entrance. Close button top-right + ESC + click-outside.
- **B** — Center, blurred overlay (`backdrop-blur-md`) — but Q6 restricts glass; this might be a glass-overuse violation.
- **C** — Slide from bottom (mobile-first), with desktop fallback to A.
- **D wildcard** — Full-screen takeover (no overlay, no panel, just a new view). Most immersive but contradicts "modal" affordance.

**My pick:** A.

---

### Q25 — Bottom sheet (mobile)
**Description.** Used for "Wann" picker, mobile filter, map pin preview. `BottomSheet.tsx` already exists per audit (introduced batch 09).

**Variants.**
- **A** — Snap detents at 30% / 60% / 100% viewport (Airbnb-style). Drag handle at top. Swipe-down-to-close.
- **B** — Single height (auto fit content), no detents, swipe-down to close. Simpler.
- **C** — Full-height takeover (no auto-detent), close via X button only.
- **D wildcard** — Side drawer (right-from-edge) on mobile too, not bottom-sheet. Different mental model.

**My pick:** A.

---

### Q26 — Dropdown / popover
**Description.** Profile menu, filter dropdowns. Currently inconsistent.

**Variants.**
- **A** — Anchor-positioned via Radix Popover. White bg, `--r12`, `--sh-md`, 8px arrow toward anchor.
- **B** — Same as A but no arrow (cleaner).
- **C** — Full-width dropdown attached to bottom of nav (not anchored to specific button).
- **D wildcard** — Replace dropdowns entirely with bottom sheets on mobile + dropdowns on desktop (responsive context-aware).

**My pick:** B.

---

## A3 — Forms

### Q27 — Form input states
**Description.** Text input, textarea, select. States: rest, focus, error, disabled, read-only. Multiple ad-hoc styles in audit.

**Variants.**
- **A** — Border 1.5px `--b2` rest; `--coral` (post-pivot: `--green`) on focus; `--error-red` 1.5px on error; `--sur` bg + `--ink4` text on disabled; `--sun` bg on read-only.
- **B** — Filled style: `--sur` bg in all states, no border, just bottom-border accent on focus/error.
- **C** — Mixed: filled mobile, outlined desktop.
- **D wildcard** — Floating-label pattern (Material Design) with no border at all.

**My pick:** A.

---

### Q28 — Autocomplete dropdown
**Description.** Search bar suggestions: grouped by salons/services/cities. `SearchAutocomplete.tsx` exists per batch 17.

**Variants.**
- **A** — Inline below search input, grouped sections with eyebrow headers ("Salons", "Services", "Cities"), max 5 per group.
- **B** — Full-screen takeover on mobile, inline on desktop.
- **C** — No grouping — flat list, ranked by relevance only.
- **D wildcard** — Visual results: salon thumbnails inline as suggestions appear (image-rich autocomplete).

**My pick:** A.

---

### Q29 — Filter chip
**Description.** Active filters as removable pills above results. `SearchCriteriaChips.tsx` exists per batch 35.

**Variants.**
- **A** — `--coral-s` bg, `--coral-t` text, "× close" icon on the right, click X removes; click chip toggles? No, keep simple.
- **B** — Per-category color coding (categories use their tint, locations use blue tint, dates use amber).
- **C** — Outline-only style (transparent bg, 1.5px border).
- **D wildcard** — Filter chips as full pills with toggle behavior (active/inactive states), no separate "applied" row.

**My pick:** B (color-coded matches Q1c hero chip spec.)

---

### Q30 — Toggle / switch
**Description.** Settings, notification prefs. No system spec.

**Variants.**
- **A** — iOS-style toggle: pill bg, knob slides, 44×24px, sage when on, ink4 when off.
- **B** — Square checkbox-style on/off (no slide animation).
- **C** — Text toggle: pill with two labels ("EUR" | "CHF") that swap which is highlighted.
- **D wildcard** — No toggles — replace all toggles with explicit text-button pairs ("On" / "Off" buttons side by side).

**My pick:** A.

---

### Q31 — Checkbox / radio
**Description.** Booking add-ons, preferences.

**Variants.**
- **A** — Standard square checkbox, `--coral` (now `--green`) when checked, white knob when unchecked. 18×18px tap zone with 32×32px hit area.
- **B** — Pill-style multi-select (looks like a chip group, no explicit checkbox — selection = filled).
- **C** — Card-select pattern (each option is a card; selection = card has coral border + check icon top-right).
- **D wildcard** — Hidden checkbox; user just clicks anywhere on the row to toggle — no visible affordance. Polished but discoverability risk.

**My pick:** C for booking add-ons (more visual). A for compact lists.

---

### Q32 — Step indicator (booking wizard)
**Description.** Booking wizard 4-step flow needs progress indication. `BookingWizard.tsx` exists per batch 44.

**Variants.**
- **A** — Numbered dots at top: 1-2-3-4 with line connecting, current step is coral filled, completed are sage check, future are ink4 outlined.
- **B** — Progress bar (no numbers, just % filled).
- **C** — Step pill row at top: "Service · Staff · Date · Confirm" — current pill highlighted.
- **D wildcard** — No step indicator — instead, a sticky bottom bar shows "Schritt 2 von 4" + back/next CTAs.

**My pick:** C.

---

## A4 — Domain widgets

### Q33 — Solen Favorit badge (Q10 lock — visual spec)
**Description.** Q10 locked yellow algorithmic badge but no shape/size/icon. Needs spec.

**Variants.**
- **A** — `--yellow` bg, `--yellow-t` text, `--r99` pill, 22px height (xs pill size per current pill scale), 10px Fraunces 700 uppercase, NO icon, just text "Solen Favorit".
- **B** — Same but with a small star or sparkle icon left of text.
- **C** — Bigger square badge with icon — more visual weight.
- **D wildcard** — Animated subtle shimmer on the badge (like an iOS App Store featured badge). Stands out, may distract.

**My pick:** B (sparkle icon adds personality).

---

### Q34 — Claim ribbon (Q13 lock — visual spec)
**Description.** Q13 locked: scraped salon profiles get "Claim this listing" ribbon + faint watermark. No visual.

**Variants.**
- **A** — Ribbon at top-right corner, 45° rotated, `--ink` bg, `--bg` text, "Claim this listing →".
- **B** — Inline banner above salon name: `--sur` bg, "This salon hasn't claimed their listing yet · Claim →" link.
- **C** — Subtle pill below salon name: amber-tinted, "Unclaimed listing" with claim CTA on hover.
- **D wildcard** — No ribbon — entire scraped salon card has a subtle desaturation filter; hover reveals the claim CTA. (Ambient signal vs explicit.)

**My pick:** B.

---

### Q35 — Swipeable image carousel (Q3 lock — visual spec)
**Description.** Q3 locked Airbnb-pattern swipe carousel. No spec for dots, snap behavior, lazy-load.

**Variants.**
- **A** — CSS scroll-snap, dots at bottom-center, 6px dots active=coral inactive=white/40, lazy-load images via `IntersectionObserver`.
- **B** — Same but no dots — just arrow chevrons that fade in on hover.
- **C** — Both dots AND arrows.
- **D wildcard** — Vertical swipe (TikTok-style) instead of horizontal — different gesture but breaks card layout.

**My pick:** A.

---

### Q36 — Loyalty stamp + QR card
**Description.** Backend HMAC-signed stamp card per BACKEND_NEEDS_UI. No UI.

**Variants.**
- **A** — Visual punch card: 8 grid squares, filled ones = sage stamp icon, empty = ink4 outline. QR at bottom.
- **B** — Progress bar with "5 von 8" text + QR button modal.
- **C** — Coffee-shop-style coupon: Bebas-style serial number + reward description + QR.
- **D wildcard** — NFT-style card with rotating gradient + serial — more "premium" feel but adds visual noise.

**My pick:** A.

---

### Q37 — Walk-in queue card (barber-specific)
**Description.** Real-time barbershop queue status display. Backend ready.

**Variants.**
- **A** — Card with current wait estimate ("~25 min"), "Join queue" CTA, position when queued ("3 ahead of you").
- **B** — Same + sliding mini-avatars showing the 3 people ahead.
- **C** — Live-update "now serving #14 / 12 ahead" arcade-style display.
- **D wildcard** — Map-style: visual representation of barbers + chairs; user sees free chair, taps to claim.

**My pick:** A.

---

### Q38 — Nail picker (shape + length, hand chart)
**Description.** Nail-specific service customization. No UI.

**Variants.**
- **A** — Two horizontal scroll rows: 10 nail-shape SVG buttons + 4 length options (short/medium/long/xlong). Hand chart with tappable nails for per-nail customization.
- **B** — Card-based: each option is a card with shape preview + name + estimated price.
- **C** — Wheel selector for shape + slider for length (more compact).
- **D wildcard** — AI-generated preview: user uploads a hand photo and shape/length options render onto it. Highest engagement, highest dev cost.

**My pick:** A.

---

### Q39 — Allergy warning banner
**Description.** Booking flow, legal-relevant. Currently `⚠️` emoji (banned per §16 lucide-only icons).

**Variants.**
- **A** — `--amber-s` bg, `--amber-t` text, `<AlertTriangle />` lucide icon, "This service contains [allergens]. Please confirm." + checkbox.
- **B** — Modal that interrupts the booking flow until acknowledged.
- **C** — Inline below the service description, no checkbox, just text.
- **D wildcard** — Two-step: banner first, then forced typing of "Yes I understand" — most legally safe but high friction.

**My pick:** A + checkbox required to proceed.

---

## A5 — Page layouts

### Q40 — Salon detail page
**Description.** Currently `components/SalonProfilePage.tsx` + many sub-components introduced in batches 09 + 45. Layout never locked.

**Variants.**
- **A** — Photo carousel at top (Q35) → name + meta + CTA → tabbed sections (Services / Staff / Reviews / About / Map). Sticky CTA on scroll.
- **B** — Single-scroll layout, no tabs, all sections stacked vertically.
- **C** — Two-column on desktop (left: details + booking; right: photos + reviews).
- **D wildcard** — Asymmetric editorial layout — large photos with text wrapping, magazine feel.

**My pick:** A.

---

### Q41 — Booking wizard (4-step)
**Description.** Q-locked at 4 steps but no visual flow spec.

**Variants.**
- **A** — Full-screen takeover, step indicator (Q32) at top, current step content centered, sticky bottom bar with back/next.
- **B** — Modal on desktop, full-screen on mobile.
- **C** — Inline below salon detail (no separate route), wizard expands in place.
- **D wildcard** — Single-page form (no steps) — all fields visible at once with smart defaults; "advanced options" section collapsed.

**My pick:** A.

---

### Q42 — Profile page layout
**Description.** Per audit, lost Discovery + Referral sections in batch 12. Currently `ProfilePage.tsx` exists.

**Variants.**
- **A** — Sidebar nav (avatar + name + 6 nav items: Bookings / Favorites / Beauty Profile / Loyalty / Settings / Logout) + content area.
- **B** — Top tab bar instead of sidebar (mobile-first).
- **C** — Cards-on-grid (no nav, all sections expanded vertically).
- **D wildcard** — No profile page — single-screen "My Solen" dashboard with widgets you can rearrange.

**My pick:** B.

---

### Q43 — Discovery page
**Description.** Inspiration / browse mood-board. Mostly empty in audits — many components added then removed.

**Variants.**
- **A** — Pinterest-style masonry grid of inspiration photos with category filters at top.
- **B** — TikTok-style vertical full-screen scroll with swipe-up between photos.
- **C** — Horizontal carousel rows by category ("Popular cuts", "Trending colors", etc.).
- **D wildcard** — AI-curated daily — single hero photo per day + "explore similar" — minimal but maybe too quiet.

**My pick:** A.

---

### Q44 — Dashboard shell (B2B)
**Description.** Currently `_tasks/SOLEN_DESIGN.md` is consumer-only. B2B side has its own components (added batch 23 — Coiffeur, Barber, Makeup, Spa, Waxing dashboards) but no system spec.

**Variants.**
- **A** — Left sidebar nav + top breadcrumb + content area. Standard SaaS shell.
- **B** — Top horizontal nav (no sidebar) — more space for content.
- **C** — Hybrid: collapsible sidebar that minimizes to icons.
- **D wildcard** — Mobile-first dashboard (no sidebar at all even on desktop) — bottom nav like consumer.

**My pick:** C.

---

## A6 — Post-pivot refit (today's green/amber/Anton/Figtree work)

### Q45 — Pivot scope: token-only or full design refit?
**Description.** Today's uncommitted work in `public/solen-coral.html` swaps coral→green primary, adds amber accent, swaps Bebas/Fraunces/DM Sans → Anton/Figtree. But ~250 components have drift (dark/zone/dm-token/font hardcodes).

**Variants.**
- **A** — Pure token swap only — leave layouts identical, just remap CSS variables + font-family declarations. (What user picked earlier.)
- **B** — Token swap + opportunistic component refit (e.g. hero, nav, cards) — refit the most-visible 5–10 components only.
- **C** — Token swap + full sweep — all 250 drifted components updated to conform.
- **D wildcard** — Roll back the pivot entirely; stay coral. Re-evaluate after launch.

**My pick:** A short-term + C as a backlog (incremental).

---

### Q46 — Lock the green palette
**Description.** Today's tokens: `--green: #1B4D1B`, `--amber: #F3A864`, `--bg: #FFFBFA`. Replaces `--coral: #E8624A`, white `#FFFFFF`.

**Variants.**
- **A** — Lock as proposed: green primary, amber accent, cream-tinted white bg.
- **B** — Lock green primary but keep coral as third accent (so the heritage isn't fully retired).
- **C** — Adjust green darker for more contrast (`#0F3010`) — better WCAG.
- **D wildcard** — Keep coral; demote green to "spa/sage tier" accent only. (Inverts the pivot.)

**My pick:** A — but I'd like one more pass on the green's saturation in real photos.

---

### Q47 — Lock the type system (Anton + Figtree)
**Description.** Today: Anton replaces Bebas Neue (display); Figtree replaces both Fraunces (heading) and DM Sans (body).

**Variants.**
- **A** — Lock as proposed: Anton + Figtree, two fonts.
- **B** — Anton + Figtree + a serif accent (Fraunces or similar) for special moments — three fonts.
- **C** — Anton only for hero; everything else Figtree (no Anton outside hero).
- **D wildcard** — Drop Anton; use Figtree at extreme weights/sizes for display. One font, max range.

**My pick:** A.

---

### Q48 — Logged-in nav state
**Description.** Today's work added an avatar + name + chevron pill to replace "Anmelden" when logged in. Need to lock the pattern.

**Variants.**
- **A** — Lock as built: avatar + name + chevron, opens a profile dropdown.
- **B** — Avatar only (no name), opens dropdown.
- **C** — "Hi, {name}" link + separate avatar (two affordances).
- **D wildcard** — Bottom-nav-only on mobile (no top nav action) — desktop keeps the pill.

**My pick:** A.

---

### Q49 — Pill size system (today's work)
**Description.** Today locked 4 sizes: xs 22px / sm 28px / md 36px / lg 44–52px. Need to confirm.

**Variants.**
- **A** — Lock 4 sizes as set.
- **B** — Add a 5th size: xxs 18px (for tiny micro-tags inline).
- **C** — Reduce to 3 sizes: xs/md/lg only — kill sm.
- **D wildcard** — Pill heights are auto-derived from font-size + padding, not fixed. More flexible but breaks the rhythm.

**My pick:** A.

---

### Q50 — Hero refit (today's work)
**Description.** Today's hero: 3 colored chips (green/amber/blue tints) + line-height 1.0 + in-hero search bar + scroll-peek cue. Need to confirm.

**Variants.**
- **A** — Lock as built.
- **B** — Replace 3 chips with a single longer one-liner subhead (less visual weight).
- **C** — Move search bar back below hero (separate section), right column shows a salon thumbnail card instead.
- **D wildcard** — Full-bleed editorial hero (no right column at any breakpoint), big centered text, search at bottom of hero.

**My pick:** A.

---

## A7 — Doc/code contradictions to resolve

### Q51 — Plum Last Minute section
**Description.** Q16 in current `SOLEN_DESIGN.md` says plum Last Minute exists; batch 29 reverted it; current `solen-coral.html` shows it. Live code state is unclear.

**Variants.**
- **A** — Restore in code, doc is right.
- **B** — Remove from doc, code is right.
- **C** — Keep both — feature flag controls whether plum section shows on the homepage.
- **D wildcard** — Rebuild as a standalone `/angebote` page only, never on homepage.

**My pick:** A.

---

### Q52 — `_rules/UI_RULES.md` (lost 234 lines)
**Description.** File created in batches 12+24, deleted at HEAD. Was content valuable?

**Variants.**
- **A** — Restore — reconstruct from `git show` of the deletion commit + merge with current `SOLEN_DESIGN.md`.
- **B** — Don't restore — `SOLEN_DESIGN.md` already covers everything that mattered.
- **C** — Restore but only the parts not duplicated in `SOLEN_DESIGN.md` — split into `_rules/UI_RULES_INTERACTIONS.md` (motion/states only).
- **D wildcard** — Replace with a `_rules/UI_INVARIANTS.md` that lists what MUST be true (one rule per line, no descriptions) — extreme brevity.

**My pick:** B.

---

### Q53 — 115-line canonical interaction utility classes (lost in batch 54)
**Description.** `.btn-primary`, `.filter-pill`, etc. added then silently removed. "Highest-value lost work."

**Variants.**
- **A** — Restore from `git show` of the deletion commit. Re-add to `app/globals.css`.
- **B** — Don't restore as global utilities; instead make each one a Tailwind component variant in `tailwind.config.js` (`@layer components`).
- **C** — Restore inline as React components (`<PrimaryButton />`, `<FilterPill />`) — pure JS, no globals.
- **D wildcard** — Don't restore at all. Use Tailwind's apply directive in component files instead — colocate everything.

**My pick:** A short-term + C as a refactor target.

---

### Q54 — Skip-to-content link (lost a11y, batch 08)
**Description.** Lost in V5 era. WCAG-required.

**Variants.**
- **A** — Restore as visually-hidden link that becomes visible on focus, top-left of every page.
- **B** — Restore as bottom-nav-style permanent link.
- **C** — Restore + add additional skip-links to nav, footer, search.
- **D wildcard** — Don't restore — instead use semantic landmarks (`<main>`, `<nav>`) and trust screen readers' built-in jump.

**My pick:** A.

---

### Q55 — Phone OTP step in B2B salon registration
**Description.** Removed in batch 18 (174 lines deleted, 3-step → 2-step). Security/UX trade-off.

**Variants.**
- **A** — Restore — SMS verification is standard B2B practice.
- **B** — Replace with email-link verification only (cheaper, no Twilio cost).
- **C** — Email verification + optional phone for power users.
- **D wildcard** — No verification at all at signup — only when first booking comes in.

**My pick:** C.

---

## A8 — Cleanup sequencing

### Q56 — Order of operations for the post-pivot drift cleanup
**Description.** 250+ files have V5 Zone or `s-dm-*` retired tokens, 250+ have dead `dark:*` classes. Need to fix all eventually. Order matters.

**Variants.**
- **A** — Highest-blast-radius first (globals.css, tailwind.config.js), then shared primitives (Button, Card), then page components.
- **B** — Most-visible first (homepage components, salon detail, booking flow), then admin/dashboard, then archived.
- **C** — Component-by-component A-Z (mechanical, predictable, slow).
- **D wildcard** — Don't fix incrementally; do one massive cleanup commit on a feature branch, deploy a preview, ship if it looks right.

**My pick:** B.

---

### Q57 — Folder consolidation
**Description.** 11 underscore folders. Some redundant.

**Variants.**
- **A** — Consolidate `_docs/`, `_specs/`, `_roadmaps/` → single `_docs/`. Keep others.
- **B** — Aggressive consolidation: only keep `_docs/`, `_tasks/`, `_audits/`, `_rules/`. Merge everything else.
- **C** — Keep current 11 folders, just add a top-level `_README.md` mapping their purposes.
- **D wildcard** — No underscore folders at all — flatten everything into `docs/` with clear filename prefixes.

**My pick:** A.

---

### Q58 — Scratch file cleanup
**Description.** 30+ tmp/lint/tsc/build outputs in repo root.

**Variants.**
- **A** — Add to `.gitignore` + delete from git history (git filter-branch / git rm).
- **B** — Add to `.gitignore` + delete current copies (no history rewrite — keep them in past commits).
- **C** — Move to `_logs/` (new folder) + add `_logs/` to `.gitignore`.
- **D wildcard** — Don't touch — they're useful debugging context.

**My pick:** B.

---

## How to use this document

1. Read each Q in order
2. Pick A/B/C/D + a short rationale
3. Tell me "lock Q##" in conversation — I'll port the answer into `_tasks/SOLEN_DESIGN.md` with a §20 Decisions Log row + commit
4. After all locks, request **Phase 2 — the big map** (sequenced rollout plan + CLAUDE.md updates)

Total Qs: **42** (Q17–Q58).
