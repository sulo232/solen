# Agent Prompts — Copy-Paste Into Each Claude Code Window

> Open 7 separate Claude Code sessions. Paste one prompt per window. Let them run.

---

## WINDOW 1 — R1: Design Tokens & Dark Mode

```
Read _tasks/roadmap-R1-design-tokens-dark-mode.md and execute every phase (1.1 through 1.7) without stopping or asking questions.

Context: This is a comprehensive UI audit fix for Solen.ch (Next.js + Tailwind + Supabase beauty booking platform). You are migrating ALL hardcoded hex colors, shadows, border radii, and font sizes to design tokens defined in tailwind.config.js and globals.css. You are also fixing every dark mode gap so the entire site works in both light and dark mode with zero white flashes.

Rules:
- Read CLAUDE.md first for the full design system reference
- npm run build after every 5-10 file changes — if it fails, fix immediately
- git commit after each phase completes with descriptive message
- git push origin main after each commit
- Do NOT ask permission between phases — just execute continuously
- Do NOT touch animation/transition properties (R3 handles those)
- Do NOT touch translation strings (R4 handles those)
- Do NOT restructure components (R5/R6/R7 handle those)
- Focus ONLY on: colors, shadows, border-radius, font-sizes, dark mode variants

Start with Phase 1.1 (audit) and work through to Phase 1.7 (dark mode sweep). Go.
```

---

## WINDOW 2 — R2: Mobile UX & Interactions

```
Read _tasks/roadmap-R2-mobile-ux-interactions.md and execute every phase (2.1 through 2.6) without stopping or asking questions.

Context: This is a mobile UX overhaul for Solen.ch (Next.js + Tailwind beauty booking platform). 80%+ of users are on mobile. You are fixing every touch target to 44px minimum, fixing mobile layout overflow issues, adding scroll snap/momentum to horizontal containers, standardizing hover/press/active states on every interactive element, adding keyboard focus states, and handling safe area insets.

Rules:
- Read CLAUDE.md first for the full design system reference
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change colors or shadows (R1 handles those)
- Do NOT change animation timings or easing curves (R3 handles those)
- Do NOT change translation strings (R4 handles those)
- Focus ONLY on: touch targets, layout sizing, scroll behavior, interaction states (hover/press/focus), safe areas

Start with Phase 2.1 (touch targets) and work through to Phase 2.6 (safe areas). Go.
```

---

## WINDOW 3 — R3: Animation & Motion System

```
Read _tasks/roadmap-R3-animations-motion.md and execute every phase (3.1 through 3.7) without stopping or asking questions.

Context: This is the animation system overhaul for Solen.ch (Next.js + Tailwind + Framer Motion beauty booking platform). You are centralizing all animation variants into lib/animations.ts, removing duplicate variant definitions across files, adding page transition crossfades, grid stagger reveals, micro-interactions (heart bounce, star cascade, counter animations), prefers-reduced-motion support, and fixing undefined animation classes.

Rules:
- Read CLAUDE.md first — especially the V5 Motion Philosophy and Animation Pattern Reference sections
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change colors (R1 handles those)
- Do NOT change layout/sizing (R2 handles those)
- Do NOT change translation strings (R4 handles those)
- Focus ONLY on: animation variants, easing curves, durations, Framer Motion props, CSS keyframes, prefers-reduced-motion
- Zone rules: Heavy animations in Zone 1-2 (homepage, discovery). Minimal in Zone 3-4 (booking, dashboard).

Start with Phase 3.1 (centralize lib/animations.ts) and work through to Phase 3.7 (undefined animations). Go.
```

---

## WINDOW 4 — R4: i18n & Accessibility

```
Read _tasks/roadmap-R4-i18n-accessibility.md and execute every phase (4.1 through 4.6) without stopping or asking questions.

Context: This is the internationalization and accessibility sweep for Solen.ch (Next.js + next-intl, 4 locales: de/en/fr/it). You are finding every hardcoded German string in the codebase (50+), adding proper translation keys to all 4 locale files, replacing hardcoded strings with useTranslations() calls, adding ARIA labels to all interactive elements, fixing text contrast ratios to WCAG AA, and verifying locale-aware routing.

Rules:
- Read CLAUDE.md first — especially Section 15 (i18n Standards)
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change colors or styling (R1/R2 handle those)
- Do NOT change animation properties (R3 handles those)
- Do NOT restructure components (R5/R6/R7 handle those)
- Focus ONLY on: translation keys in messages/*.json, useTranslations() calls, aria-label attributes, aria-live regions, aria-pressed/expanded/selected, text contrast opacity values, locale-aware routing
- Provide ACTUAL translations for all 4 languages — not empty strings or German copies in other locale files
- For French and Italian translations you're unsure about, provide your best translation — imperfect is better than missing

Start with Phase 4.1 (find all hardcoded strings) and work through to Phase 4.6 (routing check). Go.
```

---

## WINDOW 5 — R5: Navigation & Salon Detail

```
Read _tasks/roadmap-R5-navigation-salon-detail.md and execute every phase (5.1 through 5.5) without stopping or asking questions.

Context: This is the navigation overhaul and salon detail page fix for Solen.ch (Next.js + Tailwind beauty booking platform). You are replacing emoji category tabs with Airbnb-style SVG icon tabs in the header, removing duplicate navigation on the salon detail page (SalonTabBar vs SalonSectionNav — keep SectionNav, remove TabBar), consolidating to one CTA per context (desktop sidebar OR mobile bottom bar, not both plus tab bar), adding a salon page loading skeleton, and fixing section spacing consistency.

Rules:
- Read CLAUDE.md first — especially the Header/Navigation and Salon Detail sections
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change colors (R1 handles those)
- Do NOT change touch targets or interaction states (R2 handles those)
- Do NOT change animation timings (R3 handles those)
- Do NOT change translation strings (R4 handles those)
- Focus ONLY on: Header.tsx navigation structure, emoji→icon replacement, salon page nav de-duplication, CTA consolidation, skeleton loading, section spacing
- The category SVG icons already exist: CoiffeurIcon, BarberIcon, NailsIcon, SpaIcon, MakeupIcon, WaxingIcon — import and use them
- Keep BottomTabBar.tsx unchanged (it handles core nav, not categories)

Start with Phase 5.1 (header icons) and work through to Phase 5.5 (section spacing). Go.
```

---

## WINDOW 6 — R6: Booking Flow & Coral Rebalance

```
Read _tasks/roadmap-R6-booking-flow-coral-rebalance.md and execute every phase (6.1 through 6.4) without stopping or asking questions.

Context: This is the booking flow condensation and coral color rebalance for Solen.ch (Next.js + Tailwind beauty booking platform). You are condensing the booking wizard from 6 steps to 4 (merge service+staff, merge date+time), polishing the visual design of each step, rebalancing coral (#E8624A) usage sitewide so it only appears on primary CTAs and key accent moments (removing it from informational icons, generic borders, link hovers), and polishing the booking success page.

Rules:
- Read CLAUDE.md first — especially the booking flow and design system sections
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change dark mode tokens (R1 handles those)
- Do NOT change touch targets (R2 handles those)
- Do NOT change animation system (R3 handles those)
- Do NOT change translation strings (R4 handles those)
- Focus ONLY on: BookingWizard.tsx step structure, booking step components, coral color usage reduction across ALL components, BookingSuccess.tsx
- For coral rebalance: grep for all text-s-coral/bg-s-coral/border-s-coral/fill-s-coral usages, categorize as KEEP (CTAs) or REPLACE (informational), and replace the informational ones with text-s-ink/50 or text-s-ink/60
- Coral STAYS on: Book Now buttons, active filter pills, progress bars, star ratings, active hearts, price highlights
- Coral GOES from: calendar/clock/mappin icons, reply indicators, close button hovers, generic link hovers, non-CTA borders

Start with Phase 6.1 (condense wizard) and work through to Phase 6.4 (success page). Go.
```

---

## WINDOW 7 — R7: Loading States, Empty States, Fallbacks & Polish

```
Read _tasks/roadmap-R7-loading-states-empty-states-image-fallbacks.md and execute every phase (7.1 through 7.7) without stopping or asking questions.

Context: This is the loading states, empty states, image fallback, and component polish sweep for Solen.ch (Next.js + Tailwind beauty booking platform). You are creating a warm blur gradient image fallback system for salons without photos, adding loading skeletons to every async section, adding branded empty states (using the existing EmptyState component) to every list/grid, adding inline error states with retry buttons, defining all missing CSS animation classes (animate-coral-pulse, img-hover-zoom, stamp-new, solen-press-effect), polishing individual components (Toast, Footer, BookingCard, etc.), and removing all 'as any' type casts.

Rules:
- Read CLAUDE.md first
- npm run build after every batch of changes
- git commit + push after each phase
- Do NOT ask permission — execute continuously
- Do NOT change color tokens (R1 handles those)
- Do NOT change touch targets or layout (R2 handles those)
- Do NOT change animation variants or easing (R3 handles those)
- Do NOT change translation strings (R4 handles those)
- Do NOT change navigation structure (R5 handles those)
- Do NOT change booking flow structure (R6 handles those)
- Focus ONLY on: new ImageFallback component, new skeleton components, EmptyState usage, error state patterns, CSS keyframe definitions, component-specific visual fixes, TypeScript type cleanup
- Image fallbacks should use warm gradients matching the brand palette (cream/terracotta/sand tones) with optional noise texture overlay
- Empty states must use the existing <EmptyState> component with lucide icons and translated strings
- Error states must show inline with retry button — never silent failures

Start with Phase 7.1 (image fallback system) and work through to Phase 7.7 (type cleanup). Go.
```

---

## EXECUTION ORDER

**No dependencies — start all 7 simultaneously:**
- Window 1 (R1) — tokens/dark mode
- Window 4 (R4) — i18n/accessibility  
- Window 7 (R7) — loading/empty/error states

**These can also start immediately but if you want to stagger:**
- Window 2 (R2) — mobile UX (benefits from R1 finishing first but not required)
- Window 3 (R3) — animations (independent)
- Window 5 (R5) — navigation (benefits from R1 finishing Header.tsx first)
- Window 6 (R6) — booking/coral (independent)

**After all 7 complete:**
1. Run `npm run build` — must pass
2. Run `npx tsc --noEmit` — zero type errors
3. Visual check on localhost: homepage, category, salon detail, booking, profile
4. Toggle dark mode — verify everything works
5. Switch language to EN — verify all text translates
6. Test on mobile viewport (375px) — verify touch targets, layout, no overflow
