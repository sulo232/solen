# TypeScript Type Errors — TODO List

> **Status**: Phase 1 (ignoreBuildErrors removal) — 15 critical errors fixed, 24 remaining documented.
> **Last Updated**: 2026-04-02

---

## Summary

- **Total Errors Remaining**: 24
- **Fixed in Phase 1**: 15 (confirmation arrays, booking Salon type, EmptyState props, LastMinuteManager, vouchers, category page, angebote, PaymentStep, LastMinuteManager button)
- **Remaining Categories**: 5 (Next.js auto-gen params, i18n namespace mismatches, test file)

---

## Remaining Errors (by category)

### Category 1: Next.js Generated Types (5 errors)
**Impact**: LOW — These are auto-generated type files from `.next/types/`. They'll regenerate on next build.
**Status**: Can be safely ignored — the source files are correct.

| File | Line | Error | Fix |
|---|---|---|---|
| `.next/types/app/[locale]/[city]/[category]/page.ts` | 34 | params type mismatch | Auto-generated, will fix on rebuild |
| `.next/types/app/[locale]/[city]/[category]/page.ts` | 38 | params type mismatch | Auto-generated, will fix on rebuild |
| `.next/types/app/[locale]/referral/[code]/page.ts` | 34 | Props type mismatch | Auto-generated, will fix on rebuild |
| `.next/types/app/api/salon/closures/[id]/route.ts` | 244 | params type mismatch | Auto-generated, will fix on rebuild |
| `.next/types/app/api/salons/by-slug/[slug]/route.ts` | 49 | params type mismatch | Auto-generated, will fix on rebuild |

---

### Category 2: i18n Namespace Mismatches (18 errors)
**Impact**: MEDIUM — Using translation keys from the wrong namespace. Will cause runtime `MISSING_MESSAGE` errors.
**Status**: Need to be fixed by moving keys to correct namespaces or using correct namespace in components.

#### Issue: Salon page components using wrong namespace
These components are in the salon page (which has its own namespace) but trying to access keys from a different namespace.

| File | Line | Key | Expected Namespace | Actual Namespace | Fix |
|---|---|---|---|---|
| `salon/[slug]/page.tsx` | 478 | "shareProfile" | salon | booking | Add key to salon namespace |
| `components/salon/SalonHero.tsx` | 72 | "showAllPhotos" | salon | salon | Add key to salon namespace |
| `components/salon/SalonMobileCTA.tsx` | 78 | "bookAppointment" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 153 | "whatCustomersSay" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 158 | "noReviews" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 185 | "sortBy" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 228 | "verifiedBooking" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 242 | "readMore" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 242 | "readLess" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 266 | "flagReasonLabel" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 312 | "enlargePhoto" | salon | salon | Add key to salon namespace |
| `components/salon/SalonReviews.tsx` | 331 | "salonReplied" | salon | salon | Add key to salon namespace |
| `components/salon/SalonSidebar.tsx` | 84 | "instantBooking" | salon | salon | Add key to salon namespace |

#### Issue: LastMinuteManager using wrong namespace
| File | Line | Key | Expected Namespace | Actual Namespace | Fix |
|---|---|---|---|---|
| `components/dashboard/LastMinuteManager.tsx` | 24 | "dashboard.marketing" | N/A (doesnt exist) | dashboard | Change to "marketing" or create "dashboard.marketing" namespace |

---

### Category 3: Test/Staging Files (2 errors)
**Impact**: LOW — tmp2.tsx appears to be a test file not in production.
**Status**: Can be deleted if it's not needed.

| File | Line | Error | Fix |
|---|---|---|---|
| `tmp2.tsx` | 129 | Missing 'visits' property | Delete file or add missing properties |
| `tmp2.tsx` | 129 | Missing 'recordVisit' property | Delete file or add missing properties |

---

## How to Fix (Priority Order)

### 1. **i18n Keys** (18 errors — should fix these)
1. Check `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
2. Verify which namespace each key should belong to
3. Add missing keys to the correct namespace in all 4 locale files
4. Re-run `npx tsc --noEmit` to verify

**Example fix pattern**:
```json
// messages/de.json
{
  "salon": {
    "shareProfile": "Profil teilen",
    "showAllPhotos": "Alle Fotos anzeigen",
    ...
  }
}
```

### 2. **Test Files** (2 errors)
Check if `tmp2.tsx` is needed. If not, delete it:
```bash
rm components/tmp2.tsx
```

### 3. **Next.js Auto-Gen Types** (5 errors)
These will auto-fix on the next build. No action needed — they regenerate from source.

---

## Verification Checklist

- [ ] All i18n keys added to ALL 4 locale files
- [ ] Run `npx tsc --noEmit` and verify < 10 errors remaining
- [ ] Run `npm run build` and verify clean build
- [ ] Tested on staging/preview that translations render correctly

---

## Related Files
- `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json` — i18n sources
- `app/[locale]/salon/[slug]/page.tsx` — Main salon page
- `components/salon/SalonReviews.tsx` — Review display component
- `components/salon/SalonHero.tsx` — Hero section
- `components/salon/SalonMobileCTA.tsx` — Mobile CTA buttons
- `components/salon/SalonSidebar.tsx` — Sidebar component
