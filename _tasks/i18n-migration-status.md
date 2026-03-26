# i18n Migration Status

## Progress
- **Total components**: 210
- **Migrated**: 76 (36%)
- **Remaining**: 134 (64%)

## Completed (Batch 1)
✅ 5 barber components migrated:
- `components/barber/LoyaltyCard.tsx`
- `components/barber/LoyaltyCardList.tsx`
- `components/barber/RemoteQueueJoin.tsx`
- `components/barber/WaitTimeDisplay.tsx`
- `components/barber/WalkinQueue.tsx`

All use `useTranslations()` with proper namespace structure and aria-labels.
Committed and pushed to main (commit 45a6dfa).

## Remaining High-Priority Components
These are user-facing and should be migrated next:

### Homepage & Discovery (15 components)
- `SalonCard.tsx` ⚠️ HIGH - used everywhere
- `CategoryHero.tsx` - category page headers
- `LastMinuteCard.tsx` - last minute offers
- `NearbySalons.tsx` - discovery section
- `RecentlyViewed.tsx` - homepage widget
- `ServiceTile.tsx` - booking flow
- Plus 9 more discovery/* components

### Booking Flow (8 components)
- `BookingSuccess.tsx` - confirmation page
- `booking/GuestBookingForm.tsx` - guest checkout
- `booking/PackageRedeemBanner.tsx` - package redemption
- `booking/StaffPicker.tsx` - staff selection
- Plus 4 more booking/* components

### Reviews & Social (4 components)
- `ReviewCarousel.tsx` - salon pages
- `ReviewBreakdown.tsx` - rating display
- `MapView.tsx` - location map
- `ChatWindow.tsx` - direct messaging

### Dashboard (40+ components)
- All `dashboard/*` components (lower priority - admin-facing)
- All `dashboard/nail/*` components
- All `dashboard/barber/*` components

### UI Components (30+ components)
- `ui/EmptyState.tsx`
- `ui/SearchBar.tsx`
- `ui/LanguageSwitcher.tsx`
- `ui/ThemeToggle.tsx`
- Plus 26 more ui/* components

### Other Categories (37+ components)
- `coiffeur/*, nail/*, makeup/*, discovery/*, editor/*, onboarding/*`

## Translation Key Structure
Following existing patterns in `messages/{de,en,fr,it}.json`:
- Namespaces use underscore notation: `barber.loyalty_title` not `barber.loyalty.title`
- All 4 locales must be updated in sync
- Existing barber namespace has 80+ keys ready to use

## Next Steps
1. Migrate SalonCard.tsx (highest impact)
2. Migrate booking flow components (user-facing)
3. Migrate discovery/homepage components
4. Batch migrate dashboard components (can be done in groups of 10)
5. Batch migrate UI primitives

## Automation Opportunity
Consider creating a codemod script to:
1. Add `import { useTranslations } from "next-intl"`
2. Extract hardcoded German strings
3. Generate translation key placeholders
4. Add aria-labels where missing

This would reduce manual work for the remaining 134 components.
