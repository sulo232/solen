import type { Metadata } from "next";
import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase";
import { buildAlternates, generateBreadcrumbSchema } from "@/lib/seo";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: { coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Nagelstudio", spa: "Spa" },
  en: { coiffeur: "Hair Salon", barbershop: "Barbershop", nails: "Nail Studio", spa: "Spa" },
  fr: { coiffeur: "Coiffeur", barbershop: "Barbershop", nails: "Salon d'ongles", spa: "Spa" },
  it: { coiffeur: "Parrucchiere", barbershop: "Barbiere", nails: "Studio unghie", spa: "Spa" },
};

/**
 * Single cached salon read shared by generateMetadata + the layout body.
 * React cache() dedupes the call within one request render, so the salon row
 * is fetched ONCE on the server per PDP load instead of twice (the metadata
 * select + the breadcrumb select were two independent round-trips). The union
 * of columns both callers need is selected so neither has to re-query.
 */
const getSalonMeta = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("salons")
    .select("name, address, cover_photo_url, categories, average_rating, review_count")
    .eq("slug", slug)
    .single();
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
    return { title: "Salon — solen.ch" };
  }

  const firstCat = Array.isArray(salon.categories) && salon.categories.length > 0
    ? salon.categories[0]
    : "salon";
  const catLabel = CATEGORY_LABELS[loc]?.[firstCat] ?? CATEGORY_LABELS.de[firstCat] ?? "Salon";
  const city = "Basel";

  // Title: "[Salon Name] — [Category] in [City] | Solen"
  const title = `${salon.name} — ${catLabel} in ${city} | Solen`;

  // Description: "Buche jetzt bei [Name] in [Address]. ★ [Rating] ([Count] Bewertungen). Online buchen, sofort bestätigt."
  let description = "";
  if (loc === "de") {
    description = `Buche jetzt bei ${salon.name} in ${salon.address ?? city}.`;
    if (salon.review_count > 0) description += ` ★ ${salon.average_rating.toFixed(1)} (${salon.review_count} Bewertungen).`;
    description += ` Online buchen, sofort bestätigt.`;
  } else if (loc === "fr") {
    description = `Réserve maintenant chez ${salon.name} à ${salon.address ?? city}.`;
    if (salon.review_count > 0) description += ` ★ ${salon.average_rating.toFixed(1)} (${salon.review_count} avis).`;
    description += ` Réservation en ligne, confirmation immédiate.`;
  } else if (loc === "it") {
    description = `Prenota ora da ${salon.name} a ${salon.address ?? city}.`;
    if (salon.review_count > 0) description += ` ★ ${salon.average_rating.toFixed(1)} (${salon.review_count} recensioni).`;
    description += ` Prenota online, conferma immediata.`;
  } else {
    description = `Book now at ${salon.name} in ${salon.address ?? city}.`;
    if (salon.review_count > 0) description += ` ★ ${salon.average_rating.toFixed(1)} (${salon.review_count} reviews).`;
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {children}
    </>
  );
}
