# Batch 34 Audit — 1be249 to a9deaa

Date range: 2026-03-29 23:33 → 2026-03-30 09:26 (+0200)

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 1be249 | 2026-03-29 | phase 8: enable compare toggle on category/city pages + footer link | 3 | +3/0 | add | NO | YES | NO | Surfaces pre-built compare feature by passing showCompare={true} to SalonCard in CategoryPage and CityPage; adds /compare footer link. Pure wire-up, no new UI created. |
| 2 | ce445e | 2026-03-29 | fix: address code review findings before push | 7 | +11/-6 | bug-fix | NO | YES | NO | Fixes recurring booking ID path in BookingCalendar, re-throws voucher-handler errors for Stripe retry safety, and adds compareSalons i18n key to all 4 locale files removing hardcoded German. |
| 3 | 7abd5c | 2026-03-30 | phase: add RESEND_API_KEY null checks in dispute and report routes | 2 | +12/-4 | bug-fix | NO | YES | NO | Guards two admin/booking API routes against missing RESEND_API_KEY env var to prevent silent email failures; no design impact. |
| 4 | 1c0f6f | 2026-03-30 | phase: add referral and gift-card navigation links to profile page | 1 | +33/0 | add | NO | YES | NO | Adds referral and gift-card nav links to ProfilePage component; minor UI addition following existing list pattern, no token changes. |
| 5 | 7befee | 2026-03-30 | phase: add Zod validation to waitlist route | 2 | +12/-4 | add | NO | YES | NO | Adds Zod schema to waitlist API route for input validation hardening; also adds schema to lib/validations.ts. No UI or design impact. |
| 6 | 8cc5ae | 2026-03-30 | phase: call referral completion on first booking in bookings route | 1 | +114/-10 | add | NO | YES | YES | Large addition to bookings route: wires referral completion on first booking, adds salon owner notification email, imports admin Supabase client and salonNewBooking email helper. File >200 lines. |
| 7 | e12551 | 2026-03-30 | fix(i18n): translate remaining hardcoded strings in BookingCalendar and TerminePage | 6 | +84/-23 | bug-fix | NO | YES | NO | Replaces hardcoded German strings across BookingCalendar (GROUP_LABELS, FREQ_OPTIONS, StripePaymentForm labels) and TerminePage; adds 15 translation keys to all 4 locale files. |
| 8 | c9e036 | 2026-03-30 | fix(nav): replace raw <a> tags with Next.js <Link> for internal routes | 7 | +21/-14 | bug-fix | NO | YES | NO | Fixes Rule 34 violations in 7 files converting raw anchor tags to Next.js Link; also fixes mismatched closing tag in staff-invite. No design impact. |
| 9 | 70ba40 | 2026-03-30 | fix(db): remove non-existent min_price/avg_price columns from SSR queries; fix trending route city→city_id and status→is_active | 2 | +6/-6 | bug-fix | NO | YES | NO | Removes phantom DB columns from SSR and trending API queries; fixes field name mismatches that would have caused query failures. No design impact. |
| 10 | a9deaa | 2026-03-30 | feat(search): rewrite GuidedSearch as bottom sheet with 3-segment trigger pill | 1 | +533/-369 | rewrite | YES | YES | YES | Major rewrite of GuidedSearch.tsx (902 lines, +533/-369): replaces custom SVG category icons with emoji, reduces steps from 4 to 3, converts to bottom sheet with 3-segment trigger pill, adds openSearchSheet custom event listener, adds time-of-day filter (TimeKey), and switches from cookie-only to localStorage+cookie city persistence. Custom category icon imports (CoiffeurIcon, BarberIcon, etc.) removed from this component but icons may still exist elsewhere. |

---

## Summary

**Date range:** 2026-03-29 23:33 → 2026-03-30 09:26 (+0200)

**Defining theme:** Backend hardening and feature wire-up sprint ending in a significant GuidedSearch UI rewrite. The batch spans ~10 hours of focused work: first activating an already-built compare feature, then hardening the API layer (null checks, Zod validation, referral completion, i18n fixes, Link fixes, DB column fixes), and concluding with a substantial redesign of the search entry point.

**Components introduced/rewritten/deleted:**
- `components/ui/GuidedSearch.tsx` — major rewrite (step 4→3, modal→bottom sheet, custom icons→emoji, adds time filter, adds event listener API)
- `components/ProfilePage.tsx` — extended with referral/gift-card nav links

**Design tokens added/removed:** None added or removed. No changes to tailwind.config.js, globals.css, or SOLEN_DESIGN.md.

**Patterns adopted:**
- Bottom sheet pattern for mobile search (GuidedSearch now uses slide-up sheet instead of stepped modal)
- `openSearchSheet` custom event for cross-component coordination (Header pill → GuidedSearch)
- localStorage + cookie dual persistence for city selection
- Emoji as lightweight category icons (replaces custom SVG imports in search context)

**Patterns rejected:**
- 4-step search flow (reduced to 3 steps)
- Custom category SVG icon components inside GuidedSearch (replaced with emoji; icons may persist elsewhere)

### Commits flagged for drill-down

| sha | reason |
|-----|--------|
| 8cc5ae | bookings route grew by 114 lines — referral completion + salon owner email notification; verify salonNewBooking email helper and admin client import are correct |
| a9deaa | 902-line GuidedSearch rewrite — custom category icons removed from component (CoiffeurIcon, BarberIcon, NailsIcon, SpaIcon, MakeupIcon, WaxingIcon); confirm icons still referenced elsewhere; new 3-step flow and TimeKey filter need UX verification |
