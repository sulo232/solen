# Roadmap: SEO, i18n & Review Enhancements

> **Claude Code Instance**: CC-3 (SEO + i18n + Reviews)
> **Scope**: Add hreflang alternates to all pages, fix hardcoded German/CHF strings, enhance review display (verified badge, photos, read more), add canonical URLs, enhance sitemap with city×category pages, fix marketing stats honesty.
> **Safe to run in parallel with**: CC-1 (Salon), CC-2 (Animations), CC-4 (Mobile/Map). No file conflicts — CC-3 touches i18n files, SEO lib, and review components only.
> **⚠️ CONFLICT ZONES**: CC-3 OWNS all `messages/*.json` files. If CC-1 has already added i18n keys ahead of you, merge them into your changes. CC-2 may modify `ReviewBreakdown.tsx` for bar animations — if it runs first, add your i18n changes to the already-modified file.

---

## Pre-Flight: What Already Exists (DO NOT DUPLICATE)
- ✅ `lib/seo.ts` — has `generateSalonSchema()`, `generateBreadcrumbSchema()`, `buildAlternates()`, `generateFaqSchema()`, `generateCategoryListSchema()`, `generateWebsiteSchema()`
- ✅ `app/sitemap.ts` — already generates salon pages, category pages, discovery items across 4 locales
- ✅ `generateMetadata()` — exists on 18+ pages (homepage, category pages, salon layout, search, etc.)
- ✅ `lib/format-currency.ts` — exists with `formatCurrency(amount, locale)` function
- ❌ `hreflang` tags — NOT on any page (confirmed by grep: 0 results)
- ❌ `buildAlternates()` — exists in `lib/seo.ts` but NOT used by any page (never imported)
- ❌ Hardcoded "CHF" — 4 customer-facing files: `FeaturedSalonCarousel.tsx:190`, `HeroVisualCard.tsx:59`, `ServiceAutosuggest.tsx:188`, `SalonCard.tsx:344`
- ❌ Hardcoded German in `ReviewBreakdown.tsx` — "Bewertungen", "Noch keine Bewertungen", "Ergebnis", "Atmosphäre", "Preis-Leistung"
- ❌ Hardcoded German in `HomePage.tsx:295` — "Wachse mit Solen"
- ❌ Review verified badge — NOT implemented
- ❌ Review photo display — NOT implemented (data exists in `review_photos` table)
- ❌ Review "Read more" truncation — NOT implemented

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Missing i18n keys crash non-DE locales | Add keys to ALL 4 locale files in same commit |
| Phase 2 | 🟢 SAFE | Nothing — additive metadata change | — |
| Phase 3 | 🟢 SAFE | Nothing — additive sitemap entries | — |
| Phase 4 | 🟡 MEDIUM | Currency display if formatCurrency returns unexpected format | Test with locale "de", "en", "fr", "it" |
| Phase 5 | 🟡 MEDIUM | ReviewBreakdown if translation key missing in one locale | Add to ALL 4 files |
| Phase 6 | 🟢 SAFE | Nothing — additive UI enhancement | — |
| Phase 7 | 🟢 SAFE | Nothing — docs update | — |

---

## 🤖 CLAUDE CODE PHASES

### Phase 0: Pre-Flight Scan
1. Read `_rules/UI_RULES.md` — ALL of it. Design bible.
2. Read `_rules/LESSONS_LEARNED.md` — critical i18n lessons (no `fallback` option in next-intl, keys in ALL 4 files).
3. Read `_rules/ROADMAP_RULES.md` — follow every rule.
4. Read `lib/seo.ts` — understand existing SEO utilities.
5. Read `lib/format-currency.ts` — understand the correct currency formatting function. **CRITICAL**: `formatCurrency(amount, locale)` expects BCP 47 locale like `"de-CH"`, NOT just `"de"`. If a component only has `"de"` from `useLocale()`, you must convert: either pass `\`${locale}-CH\`` or create a tiny helper. Verify the function signature before using it.
6. Run: `grep -rn "buildAlternates" app/ --include="*.tsx" | head -10` — confirm it's unused.
7. Run: `grep -c "CHF" components/SalonCard.tsx components/ui/FeaturedSalonCarousel.tsx components/ui/HeroVisualCard.tsx components/ui/ServiceAutosuggest.tsx` — confirm hardcoded currency.
8. Read `messages/de.json` — understand existing key structure and namespaces.
9. Read `components/ui/Breadcrumb.tsx` — it has hardcoded German in `SEGMENT_LABELS` (lines 8-23) and "Zurück" (line 58).

---

### Phase 1: Fix Hardcoded German Strings in Customer-Facing Components
**Goal**: Replace all hardcoded German with `t()` keys across customer-facing components.

#### Files to modify:

#### [MODIFY] `components/ReviewBreakdown.tsx`
**Lines 37-39**: Hardcoded sub-category labels
**Line 47**: Hardcoded "Neu"
**Line 61**: Hardcoded "Bewertungen" / "Noch keine Bewertungen"

✅ DO:
```tsx
import { useTranslations } from "next-intl";

export default function ReviewBreakdown({ reviews, averageRating, reviewCount, onReviewCountClick }: ReviewBreakdownProps) {
  const t = useTranslations("reviews");
  
  // Line 37-39: Use t() keys for sub-categories
  const subCategories = [
    { label: t("result"), avg: calcAvg("score_ergebnis") },
    { label: t("atmosphere"), avg: calcAvg("score_atmosphaere") },
    { label: t("pricePerformance"), avg: calcAvg("score_preis_leistung") },
  ].filter(({ avg }) => avg > 0);
  
  // Line 47: "Neu" → t("new")
  {reviewCount >= 5 ? averageRating.toFixed(1) : t("new")}
  
  // Line 61: review count text
  {reviewCount > 0 ? t("reviewCount", { count: reviewCount }) : t("noReviews")}
}
```

❌ DON'T:
```tsx
// Don't use next-intl's fallback option — it doesn't exist (LESSONS_LEARNED.md)
t("reviewCount", { fallback: "Bewertungen" }) // ❌ BROKEN — renders raw key
// Don't add keys to only de.json — must be ALL 4
```

#### [MODIFY] `components/HomePage.tsx`
**Line 295**: "Wachse mit Solen" → `t("partnerCTA.title")`

#### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
Add under `"reviews"` namespace:
```json
"reviews": {
  "result": "Ergebnis",          // EN: "Result", FR: "Résultat", IT: "Risultato"
  "atmosphere": "Atmosphäre",     // EN: "Atmosphere", FR: "Atmosphère", IT: "Atmosfera"
  "pricePerformance": "Preis-Leistung", // EN: "Value for money", FR: "Rapport qualité-prix", IT: "Rapporto qualità-prezzo"
  "new": "Neu",                   // EN: "New", FR: "Nouveau", IT: "Nuovo"
  "reviewCount": "{count} Bewertungen", // EN: "{count} reviews", FR: "{count} avis", IT: "{count} recensioni"
  "noReviews": "Noch keine Bewertungen", // EN: "No reviews yet", FR: "Pas encore d'avis", IT: "Nessuna recensione"
  "verifiedBooking": "Verifizierte Buchung", // EN: "Verified booking", FR: "Réservation vérifiée", IT: "Prenotazione verificata"
  "readMore": "Mehr anzeigen",    // EN: "Read more", FR: "Voir plus", IT: "Mostra di più"
  "readLess": "Weniger anzeigen"  // EN: "Read less", FR: "Voir moins", IT: "Mostra meno"
}
```

Add under `"home"` or appropriate namespace:
```json
"partnerCTA": {
  "title": "Wachse mit Solen",    // EN: "Grow with Solen", FR: "Grandissez avec Solen", IT: "Cresci con Solen"
}
```

#### [MODIFY] `components/ui/Breadcrumb.tsx`
Replace hardcoded `SEGMENT_LABELS` (lines 8-23) with `useTranslations()` keys:

✅ DO:
```tsx
import { useTranslations } from "next-intl";

export default function Breadcrumb() {
  const t = useTranslations("breadcrumb");
  // ...
  const label = t.has(segment) ? t(segment) : decodeURIComponent(segment);
  // Also fix line 58: "Zurück" → t("back")
}
```

Add i18n keys under `"breadcrumb"` namespace (ALL 4 locales):
```json
"breadcrumb": {
  "back": "Zurück",        // EN: "Back", FR: "Retour", IT: "Indietro"
  "coiffeur": "Coiffeur",  // Same in all locales
  "barbershop": "Barbershop",
  "nails": "Nails",
  "spa": "Spa",
  "makeup": "Makeup",
  "waxing": "Waxing",
  "salon": "Salon",
  "profile": "Profil",     // EN: "Profile", FR: "Profil", IT: "Profilo"
  "bookings": "Buchungen", // EN: "Bookings", FR: "Réservations", IT: "Prenotazioni"
  "settings": "Einstellungen" // EN: "Settings", FR: "Paramètres", IT: "Impostazioni"
}
```

> ⚠️ **BE CAREFUL**:
> - Per LESSONS_LEARNED.md: "Adding a translation key to one locale file but not all 4 causes runtime errors." Add to ALL 4 files in the SAME commit.
> - Per LESSONS_LEARNED.md: "`t('key', { fallback: '...' })` is not supported by next-intl." Never use fallback option.
> - `ReviewBreakdown.tsx` is a client component (`"use client"`) — use `useTranslations()`, NOT `getTranslations()`.
> - Verify the existing namespace structure in `messages/de.json` before adding keys. The "reviews" namespace may already exist — merge, don't overwrite.
> - Run: `grep -c "reviews" messages/de.json messages/en.json messages/fr.json messages/it.json` after adding keys — all 4 must match.

**Verification:**
```bash
npm run build
# Visit /en/salon/any-slug → reviews section should show "reviews" not "Bewertungen"
# Visit /fr/salon/any-slug → should show "avis"
# Visit /it/salon/any-slug → should show "recensioni"
grep -c "verifiedBooking\|readMore\|noReviews\|atmosphere" messages/de.json messages/en.json messages/fr.json messages/it.json
# All 4 files should return same count
```

**Git commit:** `git commit -m "i18n: replace hardcoded German strings in ReviewBreakdown and HomePage"`

---

### Phase 2: Wire hreflang Alternates on All Pages
**Goal**: Tell Google about locale variants to prevent duplicate content penalties.

`lib/seo.ts` already has `buildAlternates(path, locale)` — it generates canonical + hreflang for all 4 locales. But NO page uses it.

#### [MODIFY] All pages with `generateMetadata()` — add `alternates` field

Pages to update (each gets the same pattern):
- `app/[locale]/page.tsx` (homepage)
- `app/[locale]/coiffeur/page.tsx`
- `app/[locale]/barbershop/page.tsx`
- `app/[locale]/nails/page.tsx`
- `app/[locale]/spa/page.tsx`
- `app/[locale]/makeup/page.tsx`
- `app/[locale]/waxing/page.tsx`
- `app/[locale]/search/page.tsx`
- `app/[locale]/salon/[slug]/layout.tsx`
- `app/[locale]/[city]/[category]/page.tsx`
- `app/[locale]/[city]/page.tsx`
- `app/[locale]/partner/layout.tsx`
- `app/[locale]/last-minute/layout.tsx`
- `app/[locale]/angebote/layout.tsx`

✅ DO:
```tsx
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: "...",
    description: "...",
    alternates: buildAlternates("coiffeur", locale), // ← ADD THIS LINE
  };
}
```

For dynamic pages like salon:
```tsx
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  return {
    title: `${salon.name} – solen.ch`,
    alternates: buildAlternates(`salon/${slug}`, locale), // ← path includes slug
  };
}
```

❌ DON'T:
```tsx
// Don't hardcode the alternates object — use buildAlternates()
alternates: {
  canonical: "https://solen.ch/de/coiffeur",
  languages: { de: "...", en: "...", fr: "...", it: "..." }, // ❌ Redundant — buildAlternates does this
}

// Don't forget to pass the locale — it determines the canonical
buildAlternates("coiffeur") // ❌ Missing locale, defaults to "de"
```

> ⚠️ **BE CAREFUL**:
> - Per LESSONS_LEARNED.md: `params` must be `Promise<T>` in Next.js 15+ and awaited.
> - `buildAlternates()` already handles the `x-default` hreflang (set to `de`).
> - Don't modify the page's existing title/description — ONLY add the `alternates` field.
> - For salon layout.tsx: verify it already has `generateMetadata` — if so, just add `alternates` inside the return object.
> - Some pages may use `Metadata` type import — ensure `alternates` is a valid field (it is in Next.js 14+).

**Verification:**
```bash
npm run build
# Visit /en/coiffeur → View Source → search for "hreflang"
# Should see: <link rel="alternate" hreflang="de" href="https://solen.ch/de/coiffeur">
# Should see: <link rel="alternate" hreflang="en" href="https://solen.ch/en/coiffeur">
# Should see: <link rel="alternate" hreflang="fr" href="https://solen.ch/fr/coiffeur">
# Should see: <link rel="alternate" hreflang="it" href="https://solen.ch/it/coiffeur">
# Should see: <link rel="alternate" hreflang="x-default" href="https://solen.ch/de/coiffeur">
```

**Git commit:** `git commit -m "seo: wire hreflang alternates on all 14+ pages via buildAlternates()"`

---

### Phase 3: Enhance Sitemap with City×Category Pages
**Goal**: Add city-specific category URLs to sitemap for local SEO.

#### [MODIFY] `app/sitemap.ts`

Add city×category entries after existing category loop:

✅ DO:
```tsx
// After the existing category loop (line 76), add:
const CITIES = ["basel", "zurich", "bern", "luzern", "winterthur", "st-gallen"];
const CATEGORIES = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

for (const city of CITIES) {
  // City-level pages
  for (const locale of LOCALES) {
    entries.push({
      url: `${APP_URL}/${locale}/${city}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  // City×Category pages
  for (const category of CATEGORIES) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${APP_URL}/${locale}/${city}/${category}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
}
```

❌ DON'T:
```tsx
// Don't hardcode hundreds of URLs manually
entries.push({ url: "https://solen.ch/de/basel/coiffeur" }); // ❌ Not maintainable
entries.push({ url: "https://solen.ch/de/basel/nails" }); // ❌

// Don't add cities that don't have corresponding pages
// Verify that /[locale]/[city]/[category] actually resolves
```

> ⚠️ **BE CAREFUL**:
> - Verify that `app/[locale]/[city]/[category]/page.tsx` and `app/[locale]/[city]/page.tsx` actually exist before adding URLs. Adding sitemap entries for nonexistent pages is worse than not having them.
> - Don't add too many URLs — Google recommends <50,000 per sitemap. The current count is manageable.
> - `createAdminSupabaseClient()` is already used in the sitemap — don't change the import pattern.

**Verification:**
```bash
npm run build
curl http://localhost:3000/sitemap.xml | grep "basel/coiffeur" | head -5
# Should show URLs for all 4 locales
```

**Git commit:** `git commit -m "seo: add city×category pages to sitemap for local SEO"`

---

### Phase 4: Replace Hardcoded "CHF" with formatCurrency()
**Goal**: All customer-facing price displays use `formatCurrency()` from `lib/format-currency.ts`.

#### [MODIFY] `components/SalonCard.tsx` (line 344)
```tsx
// BEFORE:
ab CHF {priceToShow}
// AFTER:
{locale === "de" ? "ab" : locale === "fr" ? "dès" : "from"} {formatCurrency(priceToShow, locale)}
```

Better approach — use i18n:
```tsx
{t("fromPrice", { price: formatCurrency(priceToShow, locale) })}
```
Add i18n key: `"fromPrice": "ab {price}"` (DE), `"from {price}"` (EN), `"dès {price}"` (FR), `"da {price}"` (IT)

#### [MODIFY] `components/ui/FeaturedSalonCarousel.tsx` (line 190)
Same pattern — replace `ab CHF {salon.min_price}` with `formatCurrency()`.

#### [MODIFY] `components/ui/ServiceAutosuggest.tsx` (line 188)
Replace the manual locale switch + "CHF":
```tsx
// BEFORE:
{locale === "de" ? "ab" : locale === "fr" ? "dès" : "from"} CHF {item.price}
// AFTER:
{t("fromPrice", { price: formatCurrency(item.price, locale) })}
```

#### [MODIFY] `components/ui/HeroVisualCard.tsx` (line 59)
Replace hardcoded `CHF 45`:
```tsx
// BEFORE:
Ab <strong>CHF 45</strong>
// AFTER:
{t("fromPrice", { price: formatCurrency(45, locale) })}
```

**NOTE**: Dashboard components with hardcoded CHF (`LastMinuteManager`, `StaffComparison`, etc.) are DEFERRED — dashboard is Zone 4 and not customer-facing priority.

> ⚠️ **BE CAREFUL**:
> - `formatCurrency()` requires `locale` — ensure each component has access to locale via `useLocale()` or props.
> - `FeaturedSalonCarousel` may not have `useLocale()` imported — add it.
> - `HeroVisualCard` has hardcoded "45" — this is a DECORATIVE/ILLUSTRATIVE number. Per UI_RULES.md Rule 32: label it as illustrative or use real data.
> - Don't change dashboard components in this roadmap — they're deferred to a future sprint.
> - Per LESSONS_LEARNED.md: i18n keys in ALL 4 locale files.

**Verification:**
```bash
npm run build
# Visit /fr/coiffeur → salon cards should show "dès CHF 45" not "ab CHF 45"
# Visit /en/coiffeur → should show "from CHF 45"
grep -rn "CHF" components/SalonCard.tsx components/ui/FeaturedSalonCarousel.tsx components/ui/HeroVisualCard.tsx components/ui/ServiceAutosuggest.tsx | grep -v "formatCurrency\|import\|//"
# Should return 0 results (no more hardcoded CHF)
```

**Git commit:** `git commit -m "i18n: replace hardcoded CHF with formatCurrency() in customer-facing components"`

---

### Phase 5: Review Verified Booking Badge
**Goal**: Show "Verifizierte Buchung" badge on reviews that have a linked booking_id.

#### [MODIFY] Salon page review rendering (salon/[slug]/page.tsx OR new SalonReviews.tsx if CC-1 has extracted it)

**IMPORTANT**: If CC-1 has already run and created `components/salon/SalonReviews.tsx`, modify THAT file. If not, modify the review section in `app/[locale]/salon/[slug]/page.tsx`.

✅ DO:
```tsx
import { ShieldCheck } from "lucide-react";

// For each review card, after the reviewer name:
{review.booking_id && (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-s-success-bg text-s-success text-xs font-medium">
    <ShieldCheck size={12} />
    {t("verifiedBooking")}
  </span>
)}
```

❌ DON'T:
```tsx
// Don't show badge on ALL reviews — only those with booking_id
<span>Verifizierte Buchung</span> // ❌ Hardcoded + shown on all

// Don't use hardcoded German
"Verifizierte Buchung" // ❌ Use t("verifiedBooking")

// Don't use banned tokens
className="bg-green-100 text-green-800" // ❌ Use s-success tokens
```

> ⚠️ **BE CAREFUL**:
> - The review data includes `booking_id` from the database — verify this field is in the Supabase select query. Run: `grep -n "booking_id" app/[locale]/salon/[slug]/page.tsx`
> - If `booking_id` is NOT in the select query, add it to the `.select()` call.
> - The i18n key `verifiedBooking` was added in Phase 1 — don't re-add it.
> - Per UI_RULES.md Rule 33: badges must be data-driven, not hardcoded.

**Verification:**
```bash
npm run build
# Visit salon page with reviews → reviews from real bookings should show green "Verified" badge
# Reviews without booking_id should NOT have the badge
```

**Git commit:** `git commit -m "feat: add verified booking badge to reviews with linked booking_id"`

---

### Phase 6: Review Photos + Read More Truncation
**Goal**: Display review photos as thumbnails and truncate long reviews with "Read more".

#### [MODIFY] Salon page review section (same file as Phase 5)

**Review photos**: Show thumbnails below review text.
```tsx
{review.review_photos && review.review_photos.length > 0 && (
  <div className="flex gap-2 mt-2">
    {review.review_photos.map((photo) => (
      <button
        key={photo.id}
        onClick={() => onOpenLightbox(photo.photo_url)}
        className="w-16 h-16 rounded-input overflow-hidden bg-s-bg-sunken shrink-0"
      >
        <Image
          src={photo.photo_url}
          alt=""
          width={64}
          height={64}
          className="object-cover w-full h-full"
        />
      </button>
    ))}
  </div>
)}
```

**Read more truncation**: Truncate at 150 characters.
```tsx
const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

const isExpanded = expandedReviews.has(review.id);
const needsTruncation = (review.comment?.length ?? 0) > 150;
const displayText = !isExpanded && needsTruncation
  ? review.comment?.slice(0, 150) + "..."
  : review.comment;

// In JSX:
<p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">
  {displayText}
  {needsTruncation && (
    <button
      onClick={() => {
        const next = new Set(expandedReviews);
        isExpanded ? next.delete(review.id) : next.add(review.id);
        setExpandedReviews(next);
      }}
      className="ml-1 text-s-coral font-medium hover:underline"
    >
      {isExpanded ? t("readLess") : t("readMore")}
    </button>
  )}
</p>
```

> ⚠️ **BE CAREFUL**:
> - The `review_photos` field must be included in the Supabase `.select()` query. Verify: `grep -n "review_photos" app/[locale]/salon/[slug]/page.tsx`
> - Photo thumbnails must have `rounded-input` (12px) per UI_RULES.md, NOT `rounded-lg`.
> - Don't add `transition-all` for height animation — just show/hide text. If you want smooth height, use framer-motion `AnimatePresence` with `initial={{ height: 0 }}` but ONLY in Zone 2.
> - The lightbox click should reuse the existing `PhotoLightbox` component if available.
> - i18n keys `readMore` and `readLess` were added in Phase 1.

**Verification:**
```bash
npm run build
# Visit salon page → reviews → long reviews should truncate at ~150 chars
# "Mehr anzeigen" button should expand the text
# Reviews with photos should show 64×64 thumbnails
# Clicking a photo should open lightbox (if available) or zoom
```

**Git commit:** `git commit -m "feat: add review photos display and read-more truncation"`

---

### Phase 7: Fix Marketing Stats Honesty + Update CLAUDE.md
**Goal**: Per UI_RULES.md Rule 32 — hardcoded marketing numbers must be labeled as illustrative.

#### [MODIFY] Any component with hardcoded stats
Find with: `grep -rn "5000\|247\|1200\|500+" components/ --include="*.tsx" | grep -v node_modules | grep -v dashboard`

For each hardcoded number, prefix with "~" or add illustrative styling:
```tsx
// BEFORE:
<span>5000+ Buchungen</span>
// AFTER:
<span>~5'000+ {t("bookings")}</span>
```

#### [MODIFY] `CLAUDE.md`
Update Section 3.2 (Directory Tree) to note new i18n keys added. Document the `buildAlternates()` usage pattern.

#### Full Smoke Test:
```bash
# 1. Build
npm run build

# 2. Type check
npx tsc --noEmit 2>&1 | head -20

# 3. i18n completeness
for key in verifiedBooking readMore readLess noReviews atmosphere result pricePerformance fromPrice; do
  echo "=== $key ==="
  grep -c "$key" messages/de.json messages/en.json messages/fr.json messages/it.json
done
# Each key should appear in ALL 4 files

# 4. No hardcoded CHF in customer-facing
grep -rn "CHF" components/SalonCard.tsx components/ui/FeaturedSalonCarousel.tsx components/ui/HeroVisualCard.tsx components/ui/ServiceAutosuggest.tsx | grep -v "formatCurrency\|import\|//"
# Must return 0

# 5. Hreflang present
grep -rn "buildAlternates" app/ --include="*.tsx" | wc -l
# Should be 14+ (one per page with generateMetadata)

# 6. Banned token check
grep -Ern "bg-green-|text-green-|rounded-lg[^a]|shadow-sm[^a]" components/ReviewBreakdown.tsx
# Must return 0
```

> ⚠️ **BE CAREFUL**:
> - Feature is NOT complete until ALL checks pass.
> - If CC-1 has already created SalonReviews.tsx, your Phase 5+6 changes go there — NOT the original salon page.

**Git commit:** `git commit -m "docs: update CLAUDE.md with SEO patterns, complete i18n smoke test"`

---

## 🧑 MANUAL PHASES

### Manual A: Google Search Console Verification
1. After deployment, check Google Search Console → Coverage
2. Verify no "Duplicate without canonical" errors
3. Check hreflang implementation in International Targeting report
4. Submit enhanced sitemap URL

### Manual B: Test Social Sharing Previews
1. Share a salon URL on WhatsApp → verify preview shows salon name + image
2. Share on Telegram → verify same
3. Use Facebook Debugger (developers.facebook.com/tools/debug/) → verify OpenGraph tags

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 0 | 🤖 | Pre-flight scan | Nothing |
| Phase 1 | 🤖 | Fix hardcoded German strings | Nothing |
| Phase 2 | 🤖 | Wire hreflang alternates | Nothing |
| Phase 3 | 🤖 | Enhance sitemap | Nothing |
| Phase 4 | 🤖 | Replace hardcoded CHF | Phase 1 (needs i18n keys) |
| Phase 5 | 🤖 | Verified booking badge | Phase 1 (needs i18n keys) |
| Phase 6 | 🤖 | Review photos + read more | Phase 5 (same file area) |
| Phase 7 | 🤖 | Stats honesty + CLAUDE.md + smoke test | All above |
| Manual A | 🧑 | Google Search Console verification | After deployment |
| Manual B | 🧑 | Social sharing preview test | After deployment |
