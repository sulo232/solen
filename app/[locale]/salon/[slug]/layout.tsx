import type { Metadata } from "next";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { buildAlternates, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";
import { postalToCity } from "@/app/[locale]/_components/salon/_shared";
import { isSalonHidden } from "@/lib/salon-detail";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: { coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Nagelstudio", spa: "Spa" },
  en: { coiffeur: "Hair Salon", barbershop: "Barbershop", nails: "Nail Studio", spa: "Spa" },
  fr: { coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Onglerie", spa: "Spa" },
  it: { coiffeur: "Parrucchiere", barbershop: "Barbiere", nails: "Studio unghie", spa: "Spa" },
};

/**
 * Single cached salon read shared by generateMetadata + the layout body.
 * React cache() dedupes the call within one request render, so the salon row
 * is fetched ONCE on the server per PDP load instead of twice (the metadata
 * select + the breadcrumb select were two independent round-trips). The union
 * of columns both callers need is selected so neither has to re-query.
 *
 * Applies the same visibility gate as the public PDP loader (lib/salon-detail.ts
 * loadSalonDetailWithAccess): is_active AND listed_on_marketplace IS NOT FALSE AND NOT
 * is_test. Without it, a hidden salon still got real SEO title/description/OG tags and
 * its name in the breadcrumb JSON-LD below, indexable even though the page body itself
 * was never gated at all. No owner bypass here on purpose: this function only feeds
 * generateMetadata (crawlers/social previews, never carry a session) and the breadcrumb
 * script, neither of which is the owner's actual view of their listing, that comes from
 * loadSalonDetailWithAccess in page.tsx, which already carries the owner/admin bypass.
 * A hidden salon falls through to the same `!salon` branch every caller already has.
 */
const getSalonMeta = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("name, address, postal_code, cover_photo_url, categories, average_rating, review_count, is_active, listed_on_marketplace, is_test")
    .eq("slug", slug)
    .single();
  if (!data || isSalonHidden(data)) {
    return null;
  }
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale ?? "de";

  const salon = await getSalonMeta(slug);

  if (!salon) {
    return { title: "Salon — solen.ch" }; // em-dash-ok: pre-existing title dash, unrelated to this edit
  }

  const firstCat = Array.isArray(salon.categories) && salon.categories.length > 0
    ? salon.categories[0]
    : "salon";
  const catLabel = CATEGORY_LABELS[loc]?.[firstCat] ?? CATEGORY_LABELS.de[firstCat] ?? "Salon";
  // live-data-ok: real city derived from the salon's own postal_code (same
  // helper SalonDetailV3/SalonBreadcrumb use on this route), null when the
  // salon has no postal_code so no city gets guessed.
  const city = salon.postal_code ? postalToCity(salon.postal_code) : null;
  // Prefers the street address, falls back to the derived city, and is null
  // when neither is known so the location phrase can be omitted entirely.
  const location = salon.address ?? city;

  // Title: "[Salon Name] - [Category] in [City] | Solen" (omits the "in {City}" part when unknown)
  const title = city
    ? `${salon.name} - ${catLabel} in ${city} | Solen`
    : `${salon.name} - ${catLabel} | Solen`;

  // Description: "Buche jetzt bei [Name] in [Address]. ★ [Rating] ([Count] Bewertungen). Online buchen, sofort bestätigt."
  let description = "";
  if (loc === "de") {
    description = location ? `Buche jetzt bei ${salon.name} in ${location}.` : `Buche jetzt bei ${salon.name}.`;
    if ((salon.review_count ?? 0) > 0) description += ` ★ ${(salon.average_rating ?? 0).toFixed(1)} (${salon.review_count} Bewertungen).`;
    description += ` Online buchen, sofort bestätigt.`;
  } else if (loc === "fr") {
    description = location ? `Réserve maintenant chez ${salon.name} à ${location}.` : `Réserve maintenant chez ${salon.name}.`;
    if ((salon.review_count ?? 0) > 0) description += ` ★ ${(salon.average_rating ?? 0).toFixed(1)} (${salon.review_count} avis).`;
    description += ` Réservation en ligne, confirmation immédiate.`;
  } else if (loc === "it") {
    description = location ? `Prenota ora da ${salon.name} a ${location}.` : `Prenota ora da ${salon.name}.`;
    if ((salon.review_count ?? 0) > 0) description += ` ★ ${(salon.average_rating ?? 0).toFixed(1)} (${salon.review_count} recensioni).`;
    description += ` Prenota online, conferma immediata.`;
  } else {
    description = location ? `Book now at ${salon.name} in ${location}.` : `Book now at ${salon.name}.`;
    if ((salon.review_count ?? 0) > 0) description += ` ★ ${(salon.average_rating ?? 0).toFixed(1)} (${salon.review_count} reviews).`;
    description += ` Book online, instant confirmation.`;
  }

  const url = `https://solen.ch/${loc}/salon/${slug}`;
  const alternates = buildAlternates(`salon/${slug}`, loc);
  const ogLocale = loc === "de" ? "de_CH" : loc === "fr" ? "fr_CH" : loc === "it" ? "it_CH" : "en_GB";

  return {
    title,
    description,
    openGraph: {
      title: `${salon.name} | Solen`,
      description,
      url,
      siteName: "solen.ch",
      ...(salon.cover_photo_url
        ? { images: [{ url: salon.cover_photo_url, width: 1200, height: 630, alt: salon.name }] }
        : {}),
      type: "website",
      locale: ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title: `${salon.name} | Solen`,
      description,
      ...(salon.cover_photo_url ? { images: [salon.cover_photo_url] } : {}),
    },
    alternates,
  };
}

export default async function SalonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const loc = locale ?? "de";

  // Reuses the same cache()d read as generateMetadata, so the salon row is
  // fetched once per request instead of twice on the server.
  const salon = await getSalonMeta(slug);

  const firstCat = Array.isArray(salon?.categories) && salon.categories.length > 0
    ? salon.categories[0]
    : null;

  const breadcrumb = generateBreadcrumbSchema([
    { name: "Solen", item: `https://solen.ch/${loc}` },
    ...(firstCat ? [{ name: firstCat.charAt(0).toUpperCase() + firstCat.slice(1), item: `https://solen.ch/${loc}/${firstCat}` }] : []),
    { name: salon?.name ?? slug },
  ]);

  return (
    <>
      {/* A4-jsonld-escape (2026-07-27): breadcrumb's last item name is
          salon?.name, a DB-sourced value editable by the salon owner from
          their own dashboard. safeJsonLd escapes </script> breakout. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
      />
      {children}
    </>
  );
}
