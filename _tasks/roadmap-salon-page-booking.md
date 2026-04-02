# Roadmap: Salon Detail Page Extraction & Booking Flow Improvements

> **Claude Code Instance**: CC-1 (Salon + Booking)
> **Scope**: Break the 1270-line salon page monolith, add share button, Apple/Google Pay, "Next Available" quick-book, reschedule flow, 5-photo grid, price breakdown display, breadcrumbs, "Get Directions" link
> **Zone**: Salon page = Zone 2 (Soft Maximalist). Booking flow = Zone 3 (Clean Functional). See UI_RULES.md §18.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Salon page rendering if extraction misses a state variable | Keep all state in parent, pass as props. Verify every `useState` is preserved. |
| Phase 2 | 🟢 SAFE | Nothing — new component, additive | — |
| Phase 3 | 🟢 SAFE | Nothing — new API endpoint, additive | — |
| Phase 4 | 🟡 MEDIUM | Payment flow if Stripe config is wrong | Test on Stripe test mode. Don't touch existing PaymentElement, only add `wallets` option. |
| Phase 5 | 🟡 MEDIUM | Booking cancellation if reschedule creates orphan slots | Wrap in transaction: cancel old + create new atomically. |
| Phase 6 | 🟢 SAFE | Nothing — additive SEO component | — |
| Phase 7 | 🟢 SAFE | Nothing — config + docs update | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 0: Pre-Flight Scan
Before writing ANY code, run these scans and read these files:
1. Read `_rules/UI_RULES.md` — ALL of it. This is your design bible.
2. Read `_rules/LESSONS_LEARNED.md` — avoid repeating past mistakes.
3. Read `_rules/ROADMAP_RULES.md` — you MUST follow every rule.
4. Run: `grep -rn "from.*salon/\[slug\]" components/ app/ --include="*.tsx" | head -20` — find all files that import from the salon page.
5. Run: `grep -c "useState\|useEffect\|useRef\|useCallback" app/[locale]/salon/[slug]/page.tsx` — count all hooks to ensure none are lost during extraction.
6. **MANDATORY**: Read `app/[locale]/salon/[slug]/page.tsx` ALL 1270 lines — you MUST understand the ENTIRE page structure. Do NOT rely on approximate line ranges in this roadmap. Read it yourself.
7. Read `app/[locale]/salon/[slug]/layout.tsx` — this already has `generateMetadata()`. You will MODIFY it in Phase 6, not create a new one.
8. Read `lib/types.ts` — verify all types referenced in the salon page exist.
9. Read `components/ui/Breadcrumb.tsx` — understand it takes ZERO props (auto-generates from URL).
10. Check `_tasks/INCOMPLETE_FEATURES.md` for anything related to salon/booking.

---

### Phase 1: Extract Salon Page into Atomic Components
**Goal**: Break the 1270-line monolith into 6 focused, testable components.
**Zone**: Zone 2 — Syne + DM Sans (Bebas allowed ONCE for H1). Card hover lift + section heading slide-in. NO stagger.

#### [NEW] `components/salon/SalonHero.tsx`
Extract the cover photo section (currently lines ~200-350 of the page — but READ THE FULL FILE FIRST to confirm):
- **5-PHOTO GRID**: If salon has 3+ photos, render Airbnb-style grid: 1 large photo (left 50%) + 4 small photos (right 50%, 2×2 grid). If <3 photos, show single cover photo with full width. On mobile, always show 1 photo with swipe dots.
- Cover photo with aspect ratio
- Salon name (`font-heading font-bold text-2xl text-s-ink`)
- Star rating row (reuse existing `Stars` component — extract it too)
- Category pills with colored backgrounds (use existing `CAT_TAG_COLOURS`)
- Address with MapPin icon
- **NEW: Share + Favorite buttons side by side** (see Phase 2)
- "Show all photos" button triggering PhotoLightbox

**5-Photo Grid Layout:**
```tsx
// Desktop: Airbnb-style 5-photo grid
<div className="grid grid-cols-4 grid-rows-2 gap-1.5 rounded-card overflow-hidden aspect-[2/1] md:aspect-[3/1]">
  {/* Large photo: spans 2 cols + 2 rows */}
  <div className="col-span-2 row-span-2 relative img-hover-zoom cursor-pointer" onClick={() => onOpenLightbox(0)}>
    <Image src={photos[0]} alt={salon.name} fill className="object-cover" />
  </div>
  {/* 4 small photos */}
  {photos.slice(1, 5).map((photo, i) => (
    <div key={i} className="relative img-hover-zoom cursor-pointer" onClick={() => onOpenLightbox(i + 1)}>
      <Image src={photo} alt="" fill className="object-cover" />
    </div>
  ))}
</div>
// Show "Show all X photos" button overlaid on last photo if photos.length > 5
```

**Props interface:**
```tsx
interface SalonHeroProps {
  salon: SalonDetail;
  locale: string;
  photos: string[];
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenLightbox: (index: number) => void;
}
```

✅ DO:
```tsx
// Keep heavy state in parent, pass minimal props
<SalonHero
  salon={salon}
  locale={locale}
  photos={photos}
  isFavorite={isFavorite}
  onToggleFavorite={handleToggleFavorite}
  onOpenLightbox={setLightboxIndex}
/>
```

❌ DON'T:
```tsx
// Don't put fetch logic inside the extracted component
// Don't create new state that duplicates parent state
export default function SalonHero() {
  const [salon, setSalon] = useState(null); // ❌ Parent already has this
  useEffect(() => fetch(...), []); // ❌ Parent already fetches
}
```

#### [NEW] `components/salon/SalonServices.tsx`
Extract the services list with category filter:
- Reuse existing `ServiceCategoryFilter` component
- Service list with prices using `formatCurrency(price, locale)` — NEVER hardcode "CHF"
- "Book" button per service
- Accordion expand/collapse for service details (new: use framer-motion `AnimatePresence` with height animation — Zone 2 allows this)
- "Most popular" badge on the service with highest booking count (if data available, use `bg-s-yellow-subtle text-s-yellow-text` per UI_RULES.md §18)
- Show "ab" prefix for variable-price services

**Props:**
```tsx
interface SalonServicesProps {
  services: Service[];
  locale: string;
  onBookService: (serviceId: string, staffId?: string) => void;
}
```

#### [NEW] `components/salon/SalonReviews.tsx`
Extract review section:
- Rating summary with star display
- ReviewBreakdown component (already exists, just wire it)
- Review cards with "Mehr anzeigen" truncation (truncate at 150 chars)
- **NEW**: Show review photos as thumbnails (64x64, `rounded-input`, click opens PhotoLightbox)
- **NEW**: "Verifizierte Buchung" badge if review has `booking_id`

✅ DO:
```tsx
// Verified badge — joins on booking_id existence
{review.booking_id && (
  <span className="inline-flex items-center gap-1 text-xs text-s-success font-medium">
    <ShieldCheck size={12} />
    {t("verifiedBooking")}
  </span>
)}
```

❌ DON'T:
```tsx
// Don't hardcode the badge on all reviews
<span>Verifizierte Buchung</span> // ❌ Not all reviews are from bookings
// Don't use hardcoded German — use t() keys
```

#### [NEW] `components/salon/SalonAbout.tsx`
Extract about/info section:
- About text with "Show more" truncation (use locale-aware `about_text_{locale}`)
- Opening hours table with "Open now" green badge (`text-s-success bg-s-success-bg`)
- Cancellation policy preview card — IMPORTANT: show BEFORE booking, not just in BookingSuccess
- Contact links (phone, Instagram, website)

#### [NEW] `components/salon/SalonMapSection.tsx`
Wrapper around MapView for salon detail context:
- Map showing salon pin
- **NEW**: "Get directions" link below map
- Address display

✅ DO:
```tsx
// Simple Google Maps directions link
<a
  href={`https://www.google.com/maps/dir/?api=1&destination=${salon.lat},${salon.lng}`}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1.5 text-sm text-s-coral hover:brightness-[1.06] transition-[filter] duration-150"
>
  <MapPin size={14} />
  {t("getDirections")}
</a>
```

❌ DON'T:
```tsx
// Don't build your own directions component
// Don't use glass on this section (Zone 2 = dropdowns only)
```

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`
Rewrite as composition (~250 lines max):
```tsx
<SalonHero ... />
<SalonTabBar sections={...} />
<section id="services"><SalonServices ... /></section>
<section id="team"><StaffSection ... /></section>
<section id="reviews"><SalonReviews ... /></section>
<section id="about"><SalonAbout ... /></section>
<section id="location"><SalonMapSection ... /></section>
<SimilarSalons ... />
{/* Desktop booking sidebar */}
<aside className="hidden lg:block sticky top-24 ..."><BookingCalendar ... /></aside>
{/* Mobile booking bar */}
<div className="lg:hidden fixed bottom-0 ...">...</div>
<PhotoLightbox ... />
```

State management stays in the parent page. All child components receive props.

> ⚠️ **BE CAREFUL**:
> - The page has 15+ `useState` hooks — every single one MUST be preserved in the parent. Missing one = broken feature.
> - `useSectionObserver` hook drives the tab bar highlighting — its refs MUST point to the new `<section id="...">` elements.
> - The `BookingCalendar` receives many callbacks — don't change its props interface.
> - `PostHog` tracking (`posthog.capture`) must remain in the parent, not moved to children.
> - NailArtistPreviewCard is a local component — keep it in the parent file or extract to a separate file.
> - The `generateSalonSchema` JSON-LD script MUST remain in the page (or move to Phase 6).
> - **Zone 2**: NO stagger animation on section reveals. Card hover lift IS allowed. NO glass on content cards.
> - **VERIFY**: After extraction, every `useState` count must match. Run: `grep -c "useState" app/[locale]/salon/[slug]/page.tsx` before AND after.

**Verification:**
```bash
npm run build
# Visit /en/salon/any-slug — verify ALL sections render
# Check mobile layout at 375px width
# Verify booking sidebar works on desktop
# Verify mobile booking bar appears
# Verify PhotoLightbox opens on photo click
# Verify tab bar highlights correct section on scroll
```

**Git commit:** `git commit -m "refactor: extract salon page into 5 atomic components (SalonHero, SalonServices, SalonReviews, SalonAbout, SalonMapSection)"`

---

### Phase 2: Share Button on Salon Page
**Goal**: Add viral loop — users can share salon via WhatsApp, copy link, native share.
**Files affected**: `components/salon/SalonHero.tsx` [MODIFY]

Add a share button next to the heart/favorite button in SalonHero:

```tsx
const handleShare = async () => {
  const shareData = {
    title: salon.name,
    text: `${salon.name} – ${t("shareText")}`,
    url: `https://solen.ch/${locale}/salon/${salon.slug}`,
  };
  
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled — not an error
      if ((err as Error).name !== "AbortError") {
        console.error("[Share]", err);
      }
    }
  } else {
    // Desktop fallback: copy to clipboard
    await navigator.clipboard.writeText(shareData.url);
    // Show toast notification
    window.dispatchEvent(new CustomEvent("solen-toast", {
      detail: { message: t("linkCopied"), type: "success" }
    }));
  }
};
```

UI: Lucide `Share2` icon, same size as heart button, placed to its right.

✅ DO:
```tsx
<button
  onClick={handleShare}
  className="w-10 h-10 flex items-center justify-center rounded-pill bg-white shadow-warm-sm hover:shadow-warm-md transition-[box-shadow] duration-[220ms]"
  aria-label={t("share")}
>
  <Share2 size={18} className="text-s-ink" />
</button>
```

❌ DON'T:
```tsx
// Don't use transition-all (UI_RULES §21-A bans it)
className="transition-all" // ❌
// Don't use shadow-sm/shadow-md (banned, use shadow-warm-*)
className="shadow-sm hover:shadow-md" // ❌
// Don't hardcode "Teilen" — use t("share")
```

**i18n keys to add** in ALL 4 locale files (`messages/de.json`, `en.json`, `fr.json`, `it.json`) under `salonDetail` namespace:
- `"share"`: "Teilen" / "Share" / "Partager" / "Condividere"
- `"shareText"`: "auf solen.ch entdecken" / "discover on solen.ch" / ...
- `"linkCopied"`: "Link kopiert!" / "Link copied!" / ...

> ⚠️ **BE CAREFUL**:
> - `navigator.share` is NOT available on all desktop browsers — MUST have clipboard fallback.
> - `navigator.share` can throw `AbortError` if user cancels — catch it silently, don't show error toast.
> - Button must have `aria-label` for accessibility.
> - Touch target must be ≥44px (w-10 h-10 = 40px, add invisible padding: `min-w-[44px] min-h-[44px]`).
> - Per LESSONS_LEARNED.md: i18n keys must go in ALL 4 locale files in the same commit.

**Verification:**
```bash
npm run build
# Mobile: tap share button — native share sheet appears
# Desktop: tap share button — "Link copied" toast appears
# Check all 4 locales work: /de/salon/x, /en/salon/x, /fr/salon/x, /it/salon/x
grep -c "share" messages/de.json messages/en.json messages/fr.json messages/it.json
# Each should show the new keys
```

**Git commit:** `git commit -m "feat: add share button to salon detail page (WhatsApp/copy/native)"`

---

### Phase 3: "Next Available" Quick-Book API + UI
**Goal**: One-tap booking for fastest available slot. Fresha's killer conversion feature.

#### [NEW] `app/api/slots/next-available/route.ts`

**IMPORTANT DB CONTEXT**: The `availability_slots` table exists (migration `014_new_schema.sql`, line 183). Columns confirmed: `id`, `salon_id`, `staff_id`, `service_id`, `starts_at`, `ends_at`, `status`, `is_last_minute`, `booking_id`, `booked_by`. The `staff_id` FK references `staff_members(id)` (NOT `profiles`). The staff name field is `staff_members.name` (NOT `display_name`).

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  
  const supabase = createAdminSupabaseClient();
  // Find the next available slot that starts after now
  // NOTE: FK is staff_members, NOT profiles. Field is "name", NOT "display_name".
  const { data, error } = await supabase
    .from("availability_slots")
    .select("id, starts_at, ends_at, staff_id, staff_members(name)")
    .eq("salon_id", salonId)
    .eq("status", "available")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();
  
  if (error || !data) {
    return NextResponse.json({ available: false }, { status: 200 });
  }
  
  return NextResponse.json({
    available: true,
    slot: {
      id: data.id,
      starts_at: data.starts_at,
      ends_at: data.ends_at,
      staff_id: data.staff_id,
      staff_name: (data.staff_members as any)?.name,
    },
  });
}
```

#### [MODIFY] `components/salon/SalonHero.tsx` or booking sidebar
Add "Next Available" button below the main "Book" CTA:

✅ DO:
```tsx
// Secondary CTA — clean functional style (Zone 2 at edge of Zone 3)
{nextSlot && (
  <button
    onClick={() => onQuickBook(nextSlot)}
    className="w-full flex items-center justify-center gap-2 py-3 rounded-btn border border-s-ink/10 text-sm font-body text-s-ink hover:border-s-coral transition-colors duration-150"
  >
    <Zap size={14} className="text-s-coral" />
    {t("nextAvailable")}: {formatDate(nextSlot.starts_at)}
  </button>
)}
```

❌ DON'T:
```tsx
// Don't use glass on the booking CTA area (Zone 3 — no glass)
className="glass-frost" // ❌ Zone 3 violation
// Don't animate the button (Zone 3 — zero animation)
<motion.button whileHover={{ scale: 1.02 }}> // ❌ Zone 3 violation
```

**i18n keys**: `"nextAvailable"`: "Nächster freier Termin" / "Next available" / ...

**IMPORTANT**: If the `availability_slots` table doesn't exist or has a different schema, this API will silently return `{ available: false }`. Check `_rules/DB_SCHEMA.md` for the actual table structure before writing the query.

> ⚠️ **BE CAREFUL**:
> - The `availability_slots` table schema may differ — verify columns exist before deploying.
> - The API must handle the case where NO slots are available gracefully (return `{ available: false }`, NOT a 500 error).
> - Don't read `supabase.auth.getUser()` — per LESSONS_LEARNED.md Rule 25, use `getSession()` instead.
> - The quick-book button should NOT appear if no slot data came back.
> - Use `createAdminSupabaseClient()` for server-side queries, NOT `createServerClient()` (per LESSONS_LEARNED.md).

**Verification:**
```bash
npm run build
curl http://localhost:3000/api/slots/next-available?salon_id=test-id
# Should return { "available": false } or { "available": true, "slot": {...} }
```

**Git commit:** `git commit -m "feat: add next-available quick-book API and UI button"`

---

### Phase 4: Apple Pay / Google Pay in Checkout
**Goal**: Enable wallet payments in Stripe PaymentElement.

#### [MODIFY] `components/BookingCalendar.tsx`
Find the `<PaymentElement />` at **line 125** inside the `StepPayment` sub-component (NOT the main `BookingCalendar` function — it's a nested component within the same file). The current code is:
```tsx
// Line 125 — INSIDE StepPayment sub-component:
<PaymentElement options={{ layout: "tabs" }} />
```

Change it to:
✅ DO:
```tsx
// Replace line 125 with:
<PaymentElement
  options={{
    layout: "tabs",
    wallets: {
      applePay: "auto",
      googlePay: "auto",
    },
  }}
/>
```

❌ DON'T:
```tsx
// Don't force wallets to "always" — "auto" respects browser/device capability
wallets: { applePay: "always" } // ❌ Shows broken button on non-Apple devices
// Don't rearrange the existing PaymentElement props — only ADD wallets
```

This is Zone 3 (booking flow). **ZERO animation changes**, **NO glass**, **solid surfaces only**.

> ⚠️ **BE CAREFUL**:
> - Only ADD the `wallets` option. Do NOT touch any other part of BookingCalendar.tsx.
> - BookingCalendar is 1021 lines — one wrong edit can break the entire checkout.
> - Apple Pay requires HTTPS domain verification in the Stripe dashboard (Manual Phase).
> - Google Pay works in test mode automatically.
> - The `wallets` option only shows on supported devices — it won't break non-supported ones.

**Verification:**
```bash
npm run build
# Open checkout on iOS Safari — Apple Pay button should appear
# Open checkout on Chrome Android — Google Pay button should appear
# Desktop Chrome — wallet buttons may not appear (expected)
```

**Git commit:** `git commit -m "feat: enable Apple Pay and Google Pay in booking checkout"`

---

### Phase 5: Booking Reschedule Flow
**Goal**: Allow users to change their booking date/time instead of cancelling.

#### [NEW] `app/api/bookings/[id]/reschedule/route.ts`
```typescript
// POST body: { new_starts_at: string, new_ends_at: string }
// Logic:
// 1. Verify authenticated user owns the booking (getSession, not getUser!)
// 2. Verify new slot is available
// 3. Transaction: cancel old booking + create new booking
// 4. Send notification email to both user and salon
```

#### [MODIFY] `components/booking/BookingsList.tsx`
Find the stub "Reschedule" button and wire it:
- Click opens a date picker modal (use existing DatePicker component)
- After selecting new date, show available time slots
- Confirm reschedule → calls API → shows success toast

This is Zone 3 (booking flow):
- **ZERO animation** on the modal
- **NO glass** — solid `bg-white rounded-card shadow-warm-lg` modal
- **NO stagger** on time slot grid

✅ DO:
```tsx
// Zone 3 compliant modal
<div className="fixed inset-0 z-[60] flex items-center justify-center bg-s-ink/40 px-4">
  <div className="bg-white rounded-card shadow-warm-lg w-full max-w-md p-6 relative">
    {/* No motion.div — Zone 3 = zero animation */}
    <h3 className="font-heading font-bold text-xl text-s-ink mb-4">{t("reschedule")}</h3>
    {/* Date picker + time slots */}
  </div>
</div>
```

❌ DON'T:
```tsx
// Zone 3 violations:
<motion.div animate={{ opacity: 1, y: 0 }}> // ❌ ZERO animation in Zone 3
<div className="glass-frost"> // ❌ NO glass in Zone 3
<div className="backdrop-blur-sm"> // ❌ NO backdrop-filter in Zone 3
```

**i18n keys**: `"reschedule"`, `"selectNewDate"`, `"selectNewTime"`, `"confirmReschedule"`, `"rescheduleSuccess"`

> ⚠️ **BE CAREFUL**:
> - The reschedule MUST be atomic — if creating the new booking fails, don't cancel the old one.
> - Check if the booking's cancellation window has passed before allowing reschedule.
> - The API must verify the user owns the booking via session (not getUser!).
> - Must update both `bookings` table and free the old `availability_slot`.
> - Per LESSONS_LEARNED.md: Page params in Next.js 15+ must be `Promise<T>` and awaited.
> - Send reschedule notification to salon owner too.

**Verification:**
```bash
npm run build
# Test: go to Profile → Bookings → tap Reschedule on a future booking
# Select new date → select new time → confirm
# Old booking should show cancelled, new booking should appear
curl -X POST http://localhost:3000/api/bookings/test-id/reschedule -d '{"new_starts_at":"...","new_ends_at":"..."}'
# Should return 401 if not authenticated
```

**Git commit:** `git commit -m "feat: booking reschedule flow (API + modal + confirmation)"`

---

### Phase 6: Breadcrumbs + JSON-LD + Open Graph
**Goal**: SEO improvements for salon page.

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`
**IMPORTANT**: `Breadcrumb.tsx` takes ZERO props. It auto-generates breadcrumbs from `usePathname()`. Do NOT pass `items` — just render it:

```tsx
import Breadcrumb from "@/components/ui/Breadcrumb";
// At the top of the salon page content, above SalonHero:
<Breadcrumb />
// That's it. No props needed. It reads the URL segments automatically.
```

> ⚠️ `Breadcrumb.tsx` has hardcoded German labels in `SEGMENT_LABELS` (lines 8-23). CC-3 will fix those with i18n — don't touch them here.

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`
Ensure `generateSalonSchema` JSON-LD is rendered (it already exists but verify):
- Must include `aggregateRating`, `priceRange`, `openingHours`, `address`, `image`
- Add `BreadcrumbList` schema alongside `BeautySalon` schema

#### [MODIFY] `app/[locale]/salon/[slug]/layout.tsx` (NOT page.tsx!)
**IMPORTANT**: `layout.tsx` ALREADY has `generateMetadata()` at line 12. Do NOT create a new one — that would crash Next.js (duplicate metadata export). Instead, UPDATE the existing one to add `openGraph` and `alternates`:

```tsx
// In the EXISTING generateMetadata in layout.tsx — ADD these fields:
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const supabase = createAdminSupabaseClient();
  const { data: salon } = await supabase.from("salons").select("name, cover_photo_url, average_rating").eq("slug", slug).single();
  
  return {
    title: `${salon?.name || "Salon"} – solen.ch`,
    description: `Book at ${salon?.name} on solen.ch`,
    // ADD THESE TWO FIELDS to the existing return:
    openGraph: {
      title: `${salon?.name || "Salon"} – solen.ch`,
      description: `Book at ${salon?.name} on solen.ch`,
      images: salon?.cover_photo_url ? [{ url: salon.cover_photo_url }] : [],
    },
    alternates: buildAlternates(`salon/${slug}`, locale),
  };
}
```

> ⚠️ **BE CAREFUL**:
> - The salon page is currently `"use client"` — `generateMetadata` requires a server component. You may need to split into a server wrapper + client component, OR add metadata via a `layout.tsx` or `head.tsx`.
> - Per LESSONS_LEARNED.md: Don't use `getTranslations()` inside `generateMetadata` — use static strings.
> - Per LESSONS_LEARNED.md: Use `createAdminSupabaseClient()`, not `createServerClient()`.
> - Per LESSONS_LEARNED.md: `params` must be `Promise<T>` in Next.js 15+.

**Verification:**
```bash
npm run build
# Visit /en/salon/any-slug
# Right-click → View Source → search for "application/ld+json" — should show BeautySalon schema
# Check og:title, og:image meta tags in head
# Share URL on WhatsApp/Telegram — preview should show salon name + image
```

**Git commit:** `git commit -m "feat: add breadcrumbs, JSON-LD, and Open Graph meta to salon page"`

---

### Phase 7: Update CLAUDE.md + Final Verification
**Goal**: Document new patterns, run full smoke test.

#### [MODIFY] `CLAUDE.md`
Update Section 3.2 (Directory Tree) with new files:
- `components/salon/SalonHero.tsx`
- `components/salon/SalonServices.tsx`
- `components/salon/SalonReviews.tsx`
- `components/salon/SalonAbout.tsx`
- `components/salon/SalonMapSection.tsx`
- `app/api/slots/next-available/route.ts`
- `app/api/bookings/[id]/reschedule/route.ts`

#### [MODIFY] `.env.example`
No new env vars needed for this roadmap.

#### Full smoke test (MANDATORY per Rule 29):
```bash
# 1. Build passes
npm run build

# 2. Type check
npx tsc --noEmit 2>&1 | head -20

# 3. No dead components
for f in components/salon/Salon*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f"
done

# 4. No missing types
npx tsc --noEmit 2>&1 | grep "has no exported member"

# 5. No duplicate layout elements
grep -rn "import.*Header\|import.*BottomNav" app/[locale]/salon/ --include="*.tsx"
# Must return 0 — Header and BottomNav are in layout.tsx

# 6. Translations exist in all 4 locales
for key in share shareText linkCopied nextAvailable reschedule; do
  echo "=== $key ==="
  grep -c "$key" messages/de.json messages/en.json messages/fr.json messages/it.json
done
# Each key should appear in all 4 files

# 7. Banned token check
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg[^a]|rounded-lg[^a]|rounded-xl|rounded-full|transition-all" components/salon/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|rounded-card\|rounded-pill\|//"
# Must return 0 results
```

> ⚠️ **BE CAREFUL**:
> - A feature is NOT complete until ALL 9 checks from Rule 29 pass.
> - If `npm run build` fails with chunk ID errors on Windows, this is a known pre-existing issue (LESSONS_LEARNED.md). Confirm by doing `git stash` + build — if it still fails, it's safe to push.
> - Run the banned token check BEFORE committing.

**Git commit:** `git commit -m "docs: update CLAUDE.md with new salon components and API routes"`

---

## 🧑 MANUAL PHASES

### Manual A: Apple Pay Domain Verification (after Phase 4)
1. Go to Stripe Dashboard → Settings → Payment Methods
2. Enable Apple Pay
3. Add domain `solen.ch` and any staging domains
4. Download the verification file and place in `public/.well-known/apple-developer-merchantid-domain-association`
5. Verify in Stripe Dashboard

### Manual B: Test Reschedule Flow on Staging
1. Create a test booking on staging
2. Go to Profile → Bookings → Reschedule
3. Select a new date/time
4. Verify old booking is cancelled, new one appears
5. Check email notifications (both user and salon)

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🤖 | Pre-flight scan | Nothing |
| Phase 1 | 🤖 | Salon page extraction | Phase 0 |
| Phase 2 | 🤖 | Share button | Phase 1 (needs SalonHero) |
| Phase 3 | 🤖 | Next Available API + UI | Phase 1 (needs booking sidebar) |
| Phase 4 | 🤖 | Apple/Google Pay | Nothing (independent) |
| Phase 5 | 🤖 | Reschedule flow | Nothing (independent) |
| Phase 6 | 🤖 | Breadcrumbs + SEO | Phase 1 (needs page structure) |
| Phase 7 | 🤖 | CLAUDE.md + smoke test | All above |
| Manual A | 🧑 | Apple Pay domain verification | Phase 4 |
| Manual B | 🧑 | Test reschedule on staging | Phase 5 |
