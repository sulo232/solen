# Batch 51 Audit — ed0b08 to 7a625d

Date range: 2026-04-04 11:34 – 11:50 (all within same hour, R5/R6 phases)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | ed0b08a | 2026-04-04 | fix(R5): salon section nav — improved observer margins + token fix | 1 | +2/-2 | bug-fix | NO | YES | NO | Fixes IntersectionObserver rootMargin for more responsive section detection; replaces hardcoded `#6A6A6A` hex with design token `text-s-ink/55` — good token hygiene. |
| 2 | aee893e | 2026-04-04 | fix: smooth 200ms page crossfade transitions with EASE_SOLEN | 1 | +2/-1 | bug-fix | NO | YES | NO | Replaces generic `easeOut` with `EASE_SOLEN` brand curve in PageTransition; duration stays 200ms (DURATION_NORMAL). Token compliance confirmed alive at HEAD. |
| 3 | 024b004 | 2026-04-04 | docs: append R5 lessons learned (IDE auto-revert, nav dedup patterns) | 1 | +14/-0 | docs-only | NO | YES | NO | Appends lessons to `_rules/LESSONS_LEARNED.md` about IDE auto-revert pitfalls and nav dedup patterns discovered in R5 sprint. |
| 4 | 4808d5d | 2026-04-04 | refactor: condense booking wizard from 6 steps to 4 (R6 Phase 6.1) | 5 | +357/-45 | rewrite | NO | YES | YES | Major structural refactor — merges Service+Staff into `ServicesStaffStep` and Date+Time into `DateTimeStep`; STEPS array shrinks to 4; old step files (ServiceSelectionStep, StaffSelectionStep, DateSelectionStep, TimeSelectionStep) remain as dead code at HEAD but are no longer routed. New DateTimeStep.tsx is 305 lines. |
| 5 | 02b88c6 | 2026-04-04 | feat: grid stagger reveal animations (Zone 1-2) | 2 | +17/-17 | add | NO | YES | YES | Adds `containerVariants`/`itemVariants` stagger pattern (60ms/card, EASE_SOLEN) to CategoryPage and DiscoverCarousel; signals adoption of centralized animation token approach. Message references "Zone 1-2" — old V5 zone language (per CLAUDE.md retired vocabulary). |
| 6 | db07836 | 2026-04-04 | fix: booking wizard visual polish — progress bar, step dots, back button (R6 Phase 6.2) | 1 | +1/-1 | bug-fix | NO | YES | NO | Small polish commit; despite large commit message describing ServicesStaffStep/DateTimeStep visual standards, actual diff is a single line in ConfirmationStep.tsx (rounding fix). Commit message overstates scope. |
| 7 | ab7a5af | 2026-04-04 | refactor: coral color rebalance — reserve for CTAs and key accents only (R6 Phase 6.3) | 6 | +13/-13 | pivot | NO | YES | YES | Significant design pivot — systematically demotes coral from informational icons/links to neutral `text-s-ink/*` variants across 6 components; coral reserved for CTAs, selected states, star ratings, progress bars, active pills. Design rule change alive at HEAD. |
| 8 | ae8be83 | 2026-04-04 | fix: booking success page polish + remaining coral rebalance (R6 Phase 6.4) | 7 | +16/-20 | cleanup | NO | YES | YES | Continues coral rebalance into booking flow (BookingCard, PaymentStep, BookingSuccess) and utility components (WaitTimeDisplay, SalonOpeningHours, CityPage); also removes `style jsx` scrollbar hack in DiscoverCarousel in favor of CSS utility class. |
| 9 | 5f5b2a9 | 2026-04-04 | fix: standardize modal/sheet timing to 200ms/300ms | 4 | +45/-19 | cleanup | NO | YES | YES | Standardizes modal/sheet animation timing system-wide: GlassModal backdrop → DURATION_NORMAL, BottomSheet ease → EASE_SOLEN; adds AnimatePresence+modalVariants to BeautyProfileEditModal, ProfileSetupModal, PostFromDiscover (previously static/unanimated). |
| 10 | 7a625d1 | 2026-04-04 | refactor: standardize hover/active interaction patterns (R6 Phase 6.3 follow-up) | 4 | +12/-12 | cleanup | NO | YES | NO | Standardizes hover/active states across HomePage, SalonCard, Header, StaffSection; removes `solen-press-effect` custom class in favor of inline `active:scale-[0.92]`/`brightness-[1.08]` utilities; "See all" links now muted default + coral hover. |

---

## Summary

**Date range:** 2026-04-04 11:34–11:50 (single rapid sprint session)

**Defining theme:** R6 design polish sprint — booking wizard condensation (6→4 steps) plus systematic brand token enforcement across the consumer UI. Two major threads: (1) booking UX simplification, (2) coral color discipline (reserved for CTAs/selected states only, demoted everywhere else).

### Components introduced
- `components/booking/DateTimeStep.tsx` — new 305-line merged date+time step (alive)
- `components/booking/ServicesStaffStep.tsx` — new merged service+staff step (referenced in diff, alive via index.ts)

### Components rewritten
- `components/booking/BookingWizard.tsx` — 6-step → 4-step flow, progress bar rework
- `components/profile/BeautyProfileEditModal.tsx` — added AnimatePresence + modalVariants

### Dead code introduced (not deleted)
- `components/booking/ServiceSelectionStep.tsx` — legacy 6-step file, still on disk but no longer routed
- `components/booking/StaffSelectionStep.tsx` — same
- `components/booking/DateSelectionStep.tsx` — same
- `components/booking/TimeSelectionStep.tsx` — same

### Design tokens added/enforced
- `EASE_SOLEN` now used in PageTransition, BottomSheet, DiscoverCarousel stagger
- `DURATION_NORMAL` (0.2s) enforced in GlassModal backdrop
- `text-s-ink/*` opacity variants used as replacement for coral in informational contexts
- `active:scale-[0.92]` / `active:scale-[0.97]` / `brightness-[1.08]` adopted as standard interaction pattern
- `solen-press-effect` class removed in Header (deprecated in favor of inline utilities)

### Design tokens removed/demoted
- `text-s-coral` removed from: MapPin icons, Clock icons, Calendar icons, "Read more" links, flag-review hover, "More filters" links, CreditCard icon, informational icon contexts across 9+ components

### Patterns adopted
- Coral strictly = CTAs + selected states + star ratings + progress bars + active pills
- Neutral `text-s-ink/40`–`text-s-ink/60` for all informational/decorative icons
- `containerVariants`/`itemVariants` stagger pattern standardized for grid reveals
- `AnimatePresence + modalVariants` required for all modal/sheet components

### Patterns rejected
- Coral on non-interactive informational elements
- `style jsx` scrollbar hiding (replaced with CSS utility)
- Static modals without AnimatePresence
- 6-step linear booking wizard

### Commits flagged for drill-down
- **4808d5d** — Booking wizard 6→4 step rewrite: large structural change (+357/-45), 305-line new DateTimeStep.tsx, legacy 4 step files left as dead code on disk
- **02b88c6** — Commit message describes extensive visual standards work but actual diff is a single line; possible squash/documentation mismatch worth noting
- **ab7a5af** — Coral rebalance design pivot: rule change touching 6 components — confirm coral restriction rule is documented in SOLEN_DESIGN.md
- **ae8be83** — Phase 6.4 coral continuation + DiscoverCarousel scrollbar cleanup; touches booking success flow
- **5f5b2a9** — Modal timing standardization: adds AnimatePresence to 3 previously static modals — regression risk if modalVariants not consistently defined
