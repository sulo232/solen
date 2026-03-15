import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";

const APP_URL = "https://solen.ch";
const LOCALES  = ["de", "en"] as const;

const STATIC_PAGES = [
  "",              // homepage
  "/barbershop",
  "/coiffeur",
  "/nails",
  "/spa",
  "/makeup",
  "/waxing",
  "/last-minute",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales
  for (const locale of LOCALES) {
    for (const path of STATIC_PAGES) {
      entries.push({
        url:             `${APP_URL}/${locale}${path}`,
        lastModified:    new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority:        path === "" ? 1.0 : 0.8,
      });
    }
  }

  // Dynamic salon pages
  try {
    const supabase = await createServerSupabaseClient();
    const { data: salons } = await supabase
      .from("salons")
      .select("slug, updated_at")
      .eq("is_active", true);

    for (const salon of salons ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url:             `${APP_URL}/${locale}/salon/${salon.slug}`,
          lastModified:    new Date(salon.updated_at),
          changeFrequency: "daily",
          priority:        0.9,
        });
      }
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch salons:", err);
  }

  return entries;
}
