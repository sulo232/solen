# Batch 29 Audit — e7fae6 to b7ca7e

Date range: 2026-03-29 16:08 – 18:23

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | e7fae6 | 2026-03-29 16:08 | phase-c: unified squircle category row, all viewports | components/HomePage.tsx | +9/-44 | cleanup | YES | PARTIAL | YES | Collapsed mobile + desktop category layouts into a single unified row; deleted the desktop 6-col card grid entirely. Icons changed from `rounded-full` to `rounded-2xl` (squircle). Desktop grid with card-v4 shadow/hover is lost; unified row survives but later overwritten. |
| 2 | d2b73e | 2026-03-29 16:09 | phase-d: all grids 2-col mobile, remove snap-scroll carousels | components/HomePage.tsx | +7/-11 | cleanup | YES | PARTIAL | YES | Removed `overflow-x-auto snap-x` horizontal scroll from several sections, enforced 2-col mobile grids. Snap-scroll pattern removed from HomePage. Change alive in spirit but later iterations continued adjusting grid layouts. |
| 3 | c4300e | 2026-03-29 16:10 | phase-e: hero left-align, AI tagline, no glow, city selector fix, hide partner link | components/HomePage.tsx | +20/-24 | rewrite | YES | PARTIAL | YES | Hero alignment shifted left; glow/radial decoration removed from hero text; partner link hidden in hero. Likely superseded by later hero reworks, but the anti-glow direction is consistent with current design. |
| 4 | 7fef9ce | 2026-03-29 16:12 | phase-f: remove bg-s-plum last-minute, flatten partner/trust/rebook, cut SocialProofStrip | components/HomePage.tsx | +38/-43 | pivot | YES | PARTIAL | YES | Major flattening: last-minute section `bg-s-plum` dark bg replaced with flat white; partner banner gradient/shadow hero replaced with minimal border-t layout; trust strip demoted from card to divider-only; SocialProofStrip import cut. SocialProofStrip file still exists at HEAD but is no longer imported in HomePage. |
| 5 | da933e | 2026-03-29 16:16 | fix: remove card-v4 from compact SalonCard variant | components/SalonCard.tsx | +1/-1 | bug-fix | NO | YES | NO | Replaced `card-v4` utility class on compact SalonCard with explicit border+bg classes. Single-line surgical fix. Change still present at HEAD. |
| 6 | c7aa2f | 2026-03-29 16:19 | session2: LastMinuteCard — flat card, faint border, coral left accent via style | components/LastMinuteCard.tsx | +3/-4 | rewrite | YES | YES | YES | Replaced `shadow-elevation-2` + Tailwind `border-s-coral` with flat faint border + inline `style` for `borderLeftColor`. Removed card-v4-style elevation. Coral urgency accent kept but moved to inline style. Change alive at HEAD. |
| 7 | 57debb | 2026-03-29 16:20 | session2: CategoryPage — 2-col grid, halve hero gradients, remove ambient-v5 | components/CategoryPage.tsx | +9/-9 | cleanup | YES | PARTIAL | YES | Category gradient opacities halved (e.g. 0.12→0.06). Grid changed from 1-col mobile to 2-col mobile. `ambient-v5` class removed from page wrapper. Comment in HEAD still mentions ambient-v5 removal; grid change alive; gradient values may differ at HEAD. |
| 8 | 73299f | 2026-03-29 16:21 | session2: ReviewCarousel — remove glass from cards, remove snap-scroll carousel | components/ReviewCarousel.tsx | +4/-14 | cleanup | YES | YES | YES | Glass card style (backdropFilter, glass-bg-subtle, glass-shadow-inset) removed and replaced with simple faint border. Snap-scroll carousel replaced with responsive CSS grid. Both changes survived to HEAD. |
| 9 | 420d82 | 2026-03-29 18:23 | V5 Session 3: page bg #F7F5F2, update --base token + hero-cinematic base color | app/globals.css | +5/-4 | pivot | YES | NO | YES | Changed `--base` and `--bg` tokens from `#FAF6EF` to `#F7F5F2` (cooler cream). Also set `body { background-color: var(--base) }`. Token subsequently overridden at HEAD to `#FFFFFF` (Q15 lock: page bg reverted to white 2026-04-22). This pivot is entirely lost. |
| 10 | b7ca7e | 2026-03-29 18:23 | V5 Session 3: hide empty sections, fix typography (Title Case categories, font-heading headings) | components/HomePage.tsx | +14/-30 | cleanup | YES | PARTIAL | YES | Category labels changed from ALL-CAPS to Title Case. Section headers switched from `font-display` to `font-heading font-extrabold`. Empty sections now conditionally hidden (`salons.length > 0`, `lastMinuteSlots.length > 0`). Empty-state fallback card removed. Typography direction alive; specific font/size values likely further adjusted at HEAD. |

---

## Summary

**Date range:** 2026-03-29 16:08 – 18:23 (single day, two sessions)

**Defining theme:** Aggressive V5 "de-decoration" pass — stripping glass morphism, elevated shadows, bg-zone color blocking, snap-scroll carousels, gradient hero banners, and decorative glow. The entire session was a systematic flattening: every section that used a colored background token (`bg-[--base]`, `bg-[--raised]`, `bg-s-plum`) had it removed to a plain white/transparent base; every glass card was replaced with a simple border; every mobile scroll carousel was replaced with a 2-col CSS grid.

**Components introduced:** none (pure cleanup)

**Components rewritten:** HomePage.tsx (5 commits), CategoryPage.tsx, ReviewCarousel.tsx, LastMinuteCard.tsx, SalonCard.tsx

**Components deleted (import removed):** SocialProofStrip (import cut from HomePage; file still exists at HEAD)

**Design tokens added:** `--base: #F7F5F2` (session 3, subsequently lost to white revert at Q15)

**Design tokens removed/neutralized:** `bg-s-plum` on last-minute section, `bg-[--base]` / `bg-[--raised]` section backgrounds, `card-v4` utility on SalonCard compact and rebook strip, glass CSS variables on ReviewCarousel

**Patterns adopted:** flat border-only cards (`border border-s-ink/[0.05]`), coral accent via inline `style` attribute rather than Tailwind class, 2-col mobile grids universally, conditional section hide-if-empty

**Patterns rejected:** snap-scroll horizontal carousels (removed from ReviewCarousel and HomePage), glass morphism on review cards, elevated box-shadows on section backgrounds, colored bg-zone alternation (`--base` / `--raised`)

### Commits flagged for drill-down

| sha | reason |
|-----|--------|
| e7fae6 | phase-c: large delete (44 lines); removed entire desktop 6-col category grid — verify no a11y or layout regression |
| 7fef9ce | phase-f: 43-line delete covers partner banner, trust strip, rebook, SocialProofStrip in one commit — highest risk commit of batch |
| c7aa2f | LastMinuteCard inline style for borderLeftColor bypasses Tailwind token system — flag as a design-debt candidate |
| 420d82 | Base token changed to `#F7F5F2` then reverted to white at HEAD — confirms Q15 lock, but intermediate sessions may have shipped with wrong bg |
| b7ca7e | Session 3 typography normalization — font-display → font-heading is a visible hierarchy change worth verifying in the preview |
