# Roadmap R27: SEO & Structured Data — JSON-LD, Sitemap, Robots, Canonical URLs

> **Scope:** Add `sitemap.ts`, `robots.ts`, JSON-LD structured data to salon/category/home pages, canonical URLs to all `generateMetadata` functions, and OG image route.
> **Design System:** V3 — read `_rules/UI_RULES.md` for brand tokens used in OG images.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing — new files | `sitemap.ts` + `robots.ts` are additive |
| Phase 2 | 🟡 MEDIUM | Page rendering if JSON-LD has syntax error | Validate JSON.stringify output — always wrap in try/catch |
| Phase 3 | 🟢 SAFE | Nothing — metadata additions | Only ADD `alternates.canonical` — don't change existing metadata |
| Phase 4 | 🟡 MEDIUM | OG route if missing env vars or wrong image dimensions | Always return 1200x630 ImageResponse — use fallback if data fetch fails |

---

## 🤖 Phase 1: Create `sitemap.ts` and `robots.ts`

#### Files
- `[NEW]` `app/sitemap.ts`
- `[NEW]` `app/robots.ts`

#### ✅ DO
```tsx
// app/sitemap.ts
import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const base = "https://www.solen.ch";
  const locales = ["de", "en", "fr", "it"];
  const categories = ["coiffeur", "barbershop", "nails", "spa", "makeup", "waxing"];

  // Static pages
  const staticPages = locales.flatMap((locale) => [
    { url: `${base}/${locale}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    ...categories.map((cat) => ({
      url: `${base}/${locale}/${cat}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    { url: `${base}/${locale}/discover`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
    { url: `${base}/${locale}/search`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.8 },
  ]);

  // Dynamic salon pages
  const { data: salons } = await supabase.from("salons").select("slug, updated_at").eq("approved", true);
  const salonPages = (salons || []).flatMap((salon) =>
    locales.map((locale) => ({
      url: `${base}/${locale}/salon/${salon.slug}`,
      lastModified: new Date(salon.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  return [...staticPages, ...salonPages];
}
```

```tsx
// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/onboarding/"],
    },
    sitemap: "https://www.solen.ch/sitemap.xml",
  };
}
```

#### ❌ DON'T
```tsx
// DON'T include /dashboard/ or /api/ in sitemap — private routes
{ url: `${base}/de/dashboard` }  // ← BAD: private route

// DON'T hardcode all salon slugs — fetch dynamically from Supabase
const salons = ["salon-a", "salon-b"];  // ← BAD: static list

// DON'T forget to handle Supabase query failures gracefully
```

#### Verification
```bash
npm run build
# Verify: curl https://www.solen.ch/sitemap.xml | head -50
# Verify: curl https://www.solen.ch/robots.txt
git add -A && git commit -m "R27 phase 1: add sitemap.ts and robots.ts"
```

> ⚠️ **BE CAREFUL**:
> - `SUPABASE_SERVICE_ROLE_KEY` might not be available at build time — use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback
> - Sitemap must return valid XML — Next.js handles serialization, but verify with a curl
> - Don't include pages that require auth (dashboard, profile) in the sitemap

---

## 🤖 Phase 2: JSON-LD Structured Data

> **Goal:** Add Schema.org markup for Google Rich Results.

#### Files
- `[MODIFY]` `app/[locale]/salon/[slug]/page.tsx` — Add `LocalBusiness` + `AggregateRating` JSON-LD
- `[MODIFY]` `app/[locale]/coiffeur/page.tsx` — Add `ItemList` JSON-LD with salon listings
- `[MODIFY]` `app/[locale]/barbershop/page.tsx` — Same `ItemList` pattern
- `[MODIFY]` `app/[locale]/nails/page.tsx` — Same `ItemList` pattern
- `[MODIFY]` `app/[locale]/page.tsx` — Add `WebSite` + `SearchAction` JSON-LD

#### ✅ DO
```tsx
// Salon detail page — add BEFORE the return statement's closing tag
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: salon.name,
      image: salon.cover_photo,
      address: {
        "@type": "PostalAddress",
        streetAddress: salon.address,
        addressLocality: "Basel",
        addressCountry: "CH",
      },
      telephone: salon.phone || undefined,
      url: `https://www.solen.ch/de/salon/${salon.slug}`,
      aggregateRating: salon.avg_rating ? {
        "@type": "AggregateRating",
        ratingValue: salon.avg_rating,
        reviewCount: salon.review_count,
      } : undefined,
      priceRange: "$$",
    }),
  }}
/>
```

#### ❌ DON'T
```tsx
// DON'T put JSON-LD inside <head> — it should be in the <body> (Next.js handles this)
// DON'T include undefined values — they break JSON-LD validation
// DON'T hardcode rating values — always use real data from Supabase
aggregateRating: { ratingValue: 4.5, reviewCount: 100 }  // ← BAD: hardcoded
```

#### Verification
```bash
npm run build
# Test: paste any salon URL into https://search.google.com/test/rich-results
git add -A && git commit -m "R27 phase 2: JSON-LD structured data on salon, category, and home pages"
```

> ⚠️ **BE CAREFUL**:
> - Filter out `undefined` values before JSON.stringify — use conditional spread: `...(salon.phone && { telephone: salon.phone })`
> - Don't add JSON-LD to client components — it must be in server components (page.tsx) for SSR
> - Verify with Google's Rich Results Test tool after deployment

---

## 🤖 Phase 3: Canonical URLs

> **Goal:** Add `alternates.canonical` to all `generateMetadata` functions.

#### Files
Run this to find all files:
```bash
grep -rn "generateMetadata" app/ --include="*.tsx" -l
```

For each file, add to the returned metadata object:
```tsx
alternates: {
  canonical: `https://www.solen.ch/${locale}/${path}`,
  languages: {
    de: `https://www.solen.ch/de/${path}`,
    en: `https://www.solen.ch/en/${path}`,
    fr: `https://www.solen.ch/fr/${path}`,
    it: `https://www.solen.ch/it/${path}`,
  },
},
```

#### ✅ DO
```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "...",
    description: "...",
    alternates: {
      canonical: `https://www.solen.ch/${locale}/coiffeur`,
      languages: {
        de: "https://www.solen.ch/de/coiffeur",
        en: "https://www.solen.ch/en/coiffeur",
        fr: "https://www.solen.ch/fr/coiffeur",
        it: "https://www.solen.ch/it/coiffeur",
      },
    },
  };
}
```

#### ❌ DON'T
```tsx
// DON'T use relative URLs for canonical
canonical: "/de/coiffeur"  // ← BAD: must be absolute URL

// DON'T forget locale alternates — Google uses these for hreflang
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R27 phase 3: canonical URLs + hreflang alternates on all generateMetadata functions"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - Canonical URLs MUST be absolute (include `https://www.solen.ch`)
> - Don't change any other properties in `generateMetadata` — only ADD `alternates`
> - If a page has dynamic params (e.g., `/salon/[slug]`), use the actual slug in the canonical URL

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Create sitemap.ts + robots.ts | Nothing |
| Phase 2 | 🤖 | JSON-LD on 5 page types | Nothing |
| Phase 3 | 🤖 | Canonical URLs on ~18 pages | Nothing |
