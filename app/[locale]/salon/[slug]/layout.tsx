import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";

interface SalonLayoutParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: SalonLayoutParams;
}): Promise<Metadata> {
  const { locale, slug } = await Promise.resolve(params);
  const supabase = await createServerSupabaseClient();

  const { data: salon } = await supabase
    .from("salons")
    .select("name, description, cover_photo_url, categories")
    .eq("slug", slug)
    .single();

  if (!salon) {
    return {
      title: "Salon — solen.ch",
    };
  }

  const category = Array.isArray(salon.categories) && salon.categories.length > 0
    ? salon.categories[0]
    : "Salon";
  const title = `${salon.name} — ${category} Basel buchen · solen.ch`;
  const description = salon.description
    ? salon.description.slice(0, 160)
    : `${salon.name} in Basel buchen. Kostenlose Stornierung bis 24h · solen.ch`;
  const url = `https://www.solen.ch/${locale}/salon/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title: salon.name,
      description,
      url,
      siteName: "solen.ch",
      ...(salon.cover_photo_url
        ? { images: [{ url: salon.cover_photo_url, width: 1200, height: 630, alt: salon.name }] }
        : {}),
      type: "website",
      locale: locale === "de" ? "de_CH" : locale === "fr" ? "fr_CH" : locale === "it" ? "it_CH" : "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: salon.name,
      description,
      ...(salon.cover_photo_url ? { images: [salon.cover_photo_url] } : {}),
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
