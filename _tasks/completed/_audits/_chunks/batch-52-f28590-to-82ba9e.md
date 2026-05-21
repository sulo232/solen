# Batch 52 Audit — f28590 to 82ba9e

**Date range:** 2026-04-04 11:51 – 2026-04-04 15:09  
**Branch:** claude/vigorous-spence-0e9aa7

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | f28590 | 2026-04-04 11:51 | fix: add AnimatePresence + modalVariants to ProfileSetupModal | 1 | +24/-9 | bug-fix | NO | YES | NO | Adds `AnimatePresence` + `modalVariants` from `lib/animations` to `ProfileSetupModal`; backdrop fades (0.2s), sheet uses shared `modalVariants`; consistent with design system modal pattern. |
| 2 | 85315f | 2026-04-04 11:53 | fix: SalonCard heart bounce — framer-motion spring + aria-pressed (R6 Phase 6.3) | 1 | +15/-13 | bug-fix | NO | YES | YES | Replaces CSS inline transform bounce with `framer-motion` spring (stiffness 400, damping 15) on the favorite heart; adds `aria-pressed` for accessibility; design-correct (coral heart fill preserved). |
| 3 | 2c2b09 | 2026-04-04 11:53 | fix: FeaturedSalonCarousel heart bounce — framer-motion spring + aria-pressed | 1 | +24/-10 | bug-fix | NO | YES | YES | Same spring treatment as SalonCard applied to `FeaturedSalonCarousel`; ensures animation consistency across both card contexts. |
| 4 | 42cffe | 2026-04-04 11:53 | fix: StampCard stamp pop — framer-motion spring instead of CSS class | 1 | +6/-4 | bug-fix | NO | YES | NO | Removes `stamp-new` CSS class toggle; replaces with framer-motion scale keyframe (0.7 → 1.15 → 1.0); cleaner animation ownership in JS. |
| 5 | 35d0f3 | 2026-04-04 11:57 | a11y: prefers-reduced-motion global disable | 2 | +11/-0 | add | NO | YES | NO | Creates `MotionProvider.tsx` with `MotionConfig reducedMotion="user"` and wraps root layout; all framer-motion animations now auto-respect OS preference; globals.css unchanged (already had CSS media query). |
| 6 | 798b04 | 2026-04-04 12:00 | fix: hover/press/active states on all interactive elements (Phase 2.4) | 2 | +24/-9 | bug-fix | NO | YES | YES | Adds `fadeIn` keyframe utility to globals.css; `ReviewPrompt` gains framer-motion entrance animation; commit message claims broader touch (SalonCard, Header, BookingCard, etc.) but diff shows only 2 files — suspect other changes are squashed elsewhere. |
| 7 | a72755 | 2026-04-04 12:07 | fix: keyboard focus WCAG AAA + safe area insets for notch/Dynamic Island | 9 | +30/-14 | bug-fix | NO | YES | YES | Replaces `outline: 2px solid #222222` with double-ring pattern (`cream #FAF6EF` offset + coral `#E8624A`) in globals.css; adds `env(safe-area-inset-*)` guards across 4 components; substantial multi-file a11y+mobile pass. |
| 8 | 314527 | 2026-04-04 15:08 | refactor(R6-6.3): coral color rebalance — reserve for CTAs and key accents | 5 | +6/-6 | cleanup | NO | YES | YES | Demotes coral from decorative/informational icons to neutral (`text-s-ink/50`, `text-s-ink/60`); reassigns error icon to `text-s-amber` (semantic correction); coral now reserved for actionable elements. Significant design-token semantic shift. |
| 9 | 736951 | 2026-04-04 15:09 | fix(R6-6.4): booking success — locale-aware date/time formatting | 1 | +3/-2 | bug-fix | NO | YES | NO | `BookingSuccess` now derives `localeCode` from `useLocale()` → maps to de-CH / fr-CH / it-CH / en-GB; fixes hardcoded `de-CH` locale for all 4 supported Swiss languages. |
| 10 | 82ba9e | 2026-04-04 15:09 | docs: append R6 lessons (coral semantics, locale date formatting) | 1 | +13/-0 | docs-only | NO | YES | NO | Appends R6 lessons to `_rules/LESSONS_LEARNED.md` covering coral-as-CTA-only rule and locale-aware date formatting; housekeeping. |

---

## Summary

**Date range:** 2026-04-04 11:51 – 2026-04-04 15:09 (same calendar day)

**Defining theme:** R6 Phase 6.3–6.4 polish sprint — animation consistency (CSS → framer-motion spring), accessibility hardening (WCAG AAA focus rings, `prefers-reduced-motion`, `aria-pressed`, safe-area insets), and coral color semantics discipline.

### Components Introduced
- `components/layout/MotionProvider.tsx` — new; wraps root layout with `MotionConfig reducedMotion="user"`

### Components Modified
- `components/discovery/ProfileSetupModal.tsx` — AnimatePresence added
- `components/SalonCard.tsx` — framer-motion spring on heart + aria-pressed + focus ring
- `components/ui/FeaturedSalonCarousel.tsx` — framer-motion spring on heart + aria-pressed
- `components/loyalty/StampCard.tsx` — stamp-new CSS class → framer-motion spring
- `components/booking/ReviewPrompt.tsx` — framer-motion entrance animation
- `components/chat/BookingBubble.tsx` — coral icon → ink/50
- `components/ui/ErrorFallback.tsx` — coral error icon → amber (semantic fix)
- `components/TerminePage.tsx` — coral decorative icon → ink/60
- `components/onboarding/steps/OpeningHoursStep.tsx` — coral icon → ink/60
- `components/onboarding/steps/ScheduleStep.tsx` — coral icon → ink/60
- `components/BookingSuccess.tsx` — locale-aware date/time
- `components/layout/Header.tsx`, `components/salon/SalonMobileCTA.tsx`, `components/ui/BottomSheet.tsx`, `components/ui/FilterBar.tsx`, `components/ui/GlassModal.tsx`, `components/ui/SearchBar.tsx`, `components/ChatWindow.tsx` — safe area insets + focus ring updates

### Components Deleted
None.

### Design Tokens Added
- `@keyframes fadeIn` — in globals.css (utility)

### Design Tokens Removed / Changed
- `*:focus-visible` ring: `outline: 2px solid #222222` → double-ring `box-shadow: 0 0 0 2px #FAF6EF, 0 0 0 4px #E8624A` (cream offset + coral)

### Patterns Adopted
- **Framer-motion spring over CSS class animation** for interactive element microinteractions (heart bounce, stamp pop)
- **`MotionConfig reducedMotion="user"`** at root level for OS preference compliance
- **Coral = CTA only** — informational/decorative icons demoted to `text-s-ink/50-60`; errors → `text-s-amber`
- **Double-ring focus pattern** (`#FAF6EF` + `#E8624A`) as global WCAG AAA focus indicator
- **`env(safe-area-inset-*)`** with CSS `max()` guards for notch/Dynamic Island support

### Patterns Rejected
- CSS transform inline on framer-motion elements (replaced by `animate` prop)
- `outline` offset-based focus ring with dark colour (replaced by box-shadow double ring)
- Hardcoded `de-CH` locale for date formatting

### Commits Flagged for Drill-Down
1. **85315f** — `SalonCard.tsx` heart bounce; design-tagged `R6 Phase 6.3`; framer-motion spring implementation worth verifying against design spec
2. **2c2b09** — `FeaturedSalonCarousel.tsx` same treatment; consistency audit candidate
3. **798b04** — Commit message lists 7+ components but diff shows only 2 changed files; broader changes may have been committed separately or message is inaccurate
4. **a72755** — 9-file focus + safe-area pass; largest single-commit diff in batch; globals.css change to focus ring is systemic
5. **314527** — Coral rebalance across 5 files; establishes colour semantics rule (coral = actionable only); no matching update to `SOLEN_DESIGN.md` or `solen-coral.html` observed in this batch
