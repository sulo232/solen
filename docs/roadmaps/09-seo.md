# Roadmap 09 — SEO & Structured Data

> **Scope**: Meta tags, JSON-LD structured data, hreflang, sitemap, robots.txt, canonical URLs
> **DB Status**: `lib/seo.ts` already exists with partial structured data (`openingHoursSpec`). Next.js metadata API available. i18n (`next-intl`) is set up with `de` and `en` locales.
> **Effort**: 🟢 Small (~15 audit points)

---

## Phase 1: Per-Page Meta Tags

### 1.1 Homepage meta tags

**WHY**: The homepage `<title>` and `<meta description>` are literally the first thing people see in Google search results. If the title is generic ("Solen") or the description is empty, Google either auto-generates something ugly or the listing looks unprofessional compared to Fresha's polished search snippets. A well-crafted title with the keyword "Finde & buche" + "Salons in der Schweiz" tells both Google and users exactly what Solen does. The description should be a compelling pitch under 160 characters that includes key terms and a call to action.

**BENCHMARK**:
- **Fresha**: Title = "Fresha — Online Terminvergabe für Beauty & Wellness". Description = "Finde und buche die besten Beauty-Profis in deiner Nähe. Coiffeur, Nails, Spa & mehr — kostenlose Online-Buchung."
- **Airbnb**: Title = "Airbnb: Ferienwohnungen, Unterkünfte, Erlebnisse & mehr". Description includes key benefits and trust signals.

**HOW**:
- **File**: `app/[locale]/page.tsx` (via Next.js `generateMetadata()` export)
- **Title**: `"Solen — Finde & buche die besten Salons in der Schweiz"`
  - Why this format: Brand name first (brand recall), em-dash separator (clean), action verb + benefit (search optimization)
- **Description**: `"Entdecke Top-Salons für Coiffeur, Nails, Spa & mehr in Basel, Zürich und Bern. Online buchen, sofort bestätigt. ★ Bewertungen & Preise vergleichen."`
  - Why: Includes target keywords (Coiffeur, Nails, Spa, Basel, Zürich, Bern), mentions key feature (online booking), and uses the ★ character which stands out in search results
- **OG Image**: Generate a branded 1200×630 image with Solen's logo + tagline + salon imagery. This appears when sharing on social media, Slack, WhatsApp, etc.
  - Add via `openGraph: { images: [{ url: '/og-homepage.png', width: 1200, height: 630 }] }`
- **Twitter Card**: `twitter: { card: 'summary_large_image' }` — shows large preview in tweets/messages

**IMPACT**: Better click-through rate from Google (well-crafted title/description = 30-50% more clicks vs. auto-generated). Social shares look professional with a branded OG image.

---

### 1.2 Salon detail page meta tags

**WHY**: Each salon page is a unique landing page that should rank for "[Salon Name] Basel" and "[Salon Name] booking" searches. Dynamic meta tags generated from salon data ensure every page has a unique, SEO-optimized title and description. Without this, Google sees duplicate or empty meta tags and may not index the pages properly.

**BENCHMARK**:
- **Fresha**: `"[Salon Name] - [Category] in [City] | Preise & Bewertungen | Fresha"` — includes salon name, category, city, and social proof.
- **Airbnb**: `"[Listing Name] - [Type] in [City] - Airbnb"` — similar structure.

**HOW**:
- **File**: `app/[locale]/salon/[slug]/page.tsx` (via `generateMetadata()`)
- **Title template**: `"[Salon Name] — [Category] in [City] | Solen"`
  - Example: `"Joliz Zentrum — Nagelstudio in Basel | Solen"`
- **Description template**: `"Buche jetzt bei [Salon Name] in [Address]. ★ [Rating] ([Count] Bewertungen). Services: [Top 3 services]. Online buchen, sofort bestätigt."`
  - Example: `"Buche jetzt bei Joliz Zentrum in Kleinbasel, Basel. ★ 4.9 (123 Bewertungen). Services: Gel Nägel, Maniküre, Pediküre. Online buchen, sofort bestätigt."`
- **OG Image**: Salon's `cover_photo_url` — this means when someone shares a salon link on WhatsApp/Instagram, they see the salon's actual photo
  - `openGraph: { images: [{ url: salon.cover_photo_url }] }`
- **Dynamic generation**: All data comes from Supabase query that already runs on page load

**IMPACT**: Each salon page ranks independently in Google. Users sharing salon links see rich previews. Salon owners see their brand represented properly.

---

### 1.3 Category page meta tags

**WHY**: Category pages like `/coiffeur` are critical for ranking on "best [category] in [city]" searches — one of the highest-intent search patterns in beauty. Meta tags need to include category, city, and compelling value proposition.

**HOW**:
- **Title**: `"Beste [Category plural] in [City] — Online buchen | Solen"`
  - Example: `"Beste Coiffeure in Basel — Online buchen | Solen"`
- **Description**: `"[Count] [Category]-Salons in [City]. Vergleiche Preise ab CHF [min], lies ★ Bewertungen und buche online. Sofort bestätigt."`
  - Example: `"42 Coiffeur-Salons in Basel. Vergleiche Preise ab CHF 35, lies ★ Bewertungen und buche online. Sofort bestätigt."`
- **Why include price and count**: Numbers in meta descriptions catch the eye in search results and signal completeness/value

**IMPACT**: Category pages rank for high-intent commercial searches. Each category×city combination targets different keywords.

---

## Phase 2: JSON-LD Structured Data

### 2.1 LocalBusiness schema for salon pages

**WHY**: JSON-LD structured data tells Google exactly what a page represents — a beauty salon business with a name, address, coordinates, opening hours, ratings, and price range. Google uses this to generate rich snippets (star ratings next to the search result, "Open now" badge, map pin with business info). Rich snippets dramatically increase click-through rate — Google says listings with rich results get 20-30% more clicks.

**BENCHMARK**:
- **Fresha**: Full `BeautySalon` schema on every salon page with `AggregateRating`, `openingHours`, `address`, `geo`
- **Airbnb**: `LodgingBusiness` schema with detailed property data

**HOW**:
- **File**: `lib/seo.ts` (extend existing — already has `openingHoursSpec` function)
- **Add function** `generateSalonJsonLd(salon: Salon)`:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Joliz Zentrum",
    "image": "https://..../cover.jpg",
    "url": "https://solen.ch/de/salon/joliz-zentrum",
    "telephone": "+41 61 xxx xx xx",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Feldbergstrasse 42",
      "addressLocality": "Basel",
      "postalCode": "4057",
      "addressCountry": "CH"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 47.5596,
      "longitude": 7.5886
    },
    "openingHoursSpecification": [...],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": 4.9,
      "ratingCount": 123,
      "bestRating": 5,
      "worstRating": 1
    },
    "priceRange": "CHF 35–200"
  }
  ```
- **Inject**: In salon page's `<head>` via `<script type="application/ld+json">` (Next.js metadata `other` field or direct `<Script>`)
- **Validation**: Use Google's Rich Results Test (https://search.google.com/test/rich-results) to verify

**IMPACT**: Google shows star ratings, price range, and "Open now" badge next to Solen's search results. This is one of the highest-ROI SEO tasks possible.

---

### 2.2 BreadcrumbList schema

**WHY**: BreadcrumbList tells Google the page hierarchy (Home → Category → City → Salon). Google displays this as a breadcrumb trail in search results instead of the raw URL, which looks much cleaner and provides context. A `Breadcrumb` component already exists in the layout — we just need to add the corresponding JSON-LD.

**HOW**:
- **Add to every page**:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Solen", "item": "https://solen.ch" },
      { "@type": "ListItem", "position": 2, "name": "Coiffeur", "item": "https://solen.ch/de/coiffeur" },
      { "@type": "ListItem", "position": 3, "name": "Basel", "item": "https://solen.ch/de/basel/coiffeur" },
      { "@type": "ListItem", "position": 4, "name": "Joliz Zentrum" }
    ]
  }
  ```
- **Dynamic**: Build from current route segments

**IMPACT**: Cleaner search result appearance. Google understands site structure better, potentially improving crawl efficiency.

---

### 2.3 FAQPage schema for category landing pages

**WHY**: When Google sees `FAQPage` structured data, it can display FAQ rich results — expandable question/answer pairs directly in search results. This makes Solen's search listing HUGE compared to competitors, taking up 3-5× more vertical space. More space = more clicks. This is one of the most effective rich result types.

**HOW**:
- **Add 5 FAQs per category page** (hardcoded, SEO-optimized, in German):
  - Coiffeur: "Was kostet ein Haarschnitt in Basel?" / "Wie finde ich den besten Coiffeur in meiner Nähe?" / "Kann ich online einen Coiffeur-Termin buchen?" / "Was ist der Unterschied zwischen Coiffeur und Barbershop?" / "Wie lange dauert ein Balayage-Termin?"
  - Nails: "Was kosten Gel-Nägel in Basel?" / "Wie oft sollte man Gel-Nägel erneuern?" / etc.
  - Each answer: 2-3 sentences, naturally incorporating keywords
- **Schema**:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Was kostet ein Haarschnitt in Basel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ein Haarschnitt in Basel kostet durchschnittlich CHF 45-65 bei einem Coiffeur. Auf Solen findest du Preise ab CHF 35."
        }
      }
    ]
  }
  ```

**IMPACT**: Dominates search results visually. Answers common user questions directly in Google, building trust before users even click.

---

## Phase 3: Technical SEO

### 3.1 Sitemap

**WHY**: A sitemap is a machine-readable list of all URLs on the site. Google uses it to discover and index pages efficiently. Without a sitemap, Google relies on crawling links — which means deep pages (like individual salon pages) might take weeks or months to be discovered. With a sitemap, new pages can be indexed within hours.

**HOW**:
- **File**: `app/sitemap.ts` (Next.js convention — auto-generates `/sitemap.xml`)
- **Implementation**:
  ```typescript
  export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages = ['', '/coiffeur', '/nails', '/barbershop', '/spa', '/makeup', '/waxing']
      .map(path => ({ url: `https://solen.ch/de${path}`, changeFrequency: 'weekly', priority: 0.8 }));
    
    // Dynamic salon pages
    const salons = await supabase.from('salons').select('slug, updated_at').eq('is_active', true);
    const salonPages = salons.data.map(s => ({
      url: `https://solen.ch/de/salon/${s.slug}`,
      lastModified: s.updated_at,
      changeFrequency: 'daily',
      priority: 0.6
    }));
    
    // City × category combinations
    const cityCategories = ['basel', 'zurich', 'bern'].flatMap(city =>
      ['coiffeur', 'nails', 'barbershop', 'spa', 'makeup', 'waxing'].map(cat => ({
        url: `https://solen.ch/de/${city}/${cat}`,
        changeFrequency: 'weekly',
        priority: 0.7
      }))
    );
    
    return [...staticPages, ...salonPages, ...cityCategories];
  }
  ```
- **Submit**: Submit sitemap URL to Google Search Console

**IMPACT**: All pages indexed quickly. Essential for SEO foundation.

---

### 3.2 robots.txt

**WHY**: `robots.txt` tells search engines which parts of the site to crawl and which to ignore. Without it, Google might waste crawl budget on API routes, dashboard pages, or admin panels — none of which should be indexed. It's also where you point to the sitemap.

**HOW**:
- **File**: `app/robots.ts` (Next.js convention)
  ```typescript
  export default function robots(): MetadataRoute.Robots {
    return {
      rules: {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/auth/', '/onboarding/']
      },
      sitemap: 'https://solen.ch/sitemap.xml'
    };
  }
  ```

**IMPACT**: Efficient crawl budget usage. Prevents private pages from leaking into search results.

---

### 3.3 Hreflang tags

**WHY**: Solen has German (`/de/`) and English (`/en/`) versions of every page. Hreflang tags tell Google that `/de/salon/joliz-zentrum` and `/en/salon/joliz-zentrum` are the SAME page in different languages. Without this, Google might:
1. See them as duplicate content (SEO penalty)
2. Show the German version to English-speaking users in Google results

**HOW**:
- **File**: `app/[locale]/layout.tsx` (via `generateMetadata`)
- For every page, add:
  ```tsx
  alternates: {
    languages: {
      'de': `https://solen.ch/de${pathname}`,
      'en': `https://solen.ch/en${pathname}`
    }
  }
  ```
- This generates: `<link rel="alternate" hreflang="de" href="https://solen.ch/de/salon/joliz" />` and `<link rel="alternate" hreflang="en" href="https://solen.ch/en/salon/joliz" />`
- Also add `x-default` hreflang pointing to the German version (since Basel's primary language is German)

**IMPACT**: Correct internationalized search results. German users see German pages, English users see English pages. No duplicate content penalties.

---

### 3.4 Canonical URLs

**WHY**: Canonical URLs tell Google "this is the ONE true URL for this content." Without them, Google might see the same content at multiple URLs (with/without trailing slash, with/without query params, http vs https) and split SEO value across all variations. A canonical URL consolidates ranking power.

**HOW**:
- **File**: All page-level metadata
- Add `canonical` to `generateMetadata`:
  ```tsx
  alternates: {
    canonical: `https://solen.ch/de/salon/${slug}` // always the clean, canonical URL
  }
  ```
- Strip query params from canonical (filters like `?sort=rating` should NOT have separate canonicals — all filter combos point to the base URL)

**IMPACT**: Consolidates SEO ranking power. Prevents "split authority" across URL variations.
