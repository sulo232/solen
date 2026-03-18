import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase";

const APP_URL = "https://solen.ch";
const LOCALES  = ["de", "en"] as const;

const STATIC_PAGES: { path: string; freq: "daily" | "weekly" | "hourly"; priority: number }[] = [
  { path: "",             freq: "daily",   priority: 1.0 },
  { path: "/last-minute", freq: "hourly",  priority: 0.9 },
  { path: "/barbershop",  freq: "weekly",  priority: 0.8 },
  { path: "/coiffeur",    freq: "weekly",  priority: 0.8 },
  { path: "/nails",       freq: "weekly",  priority: 0.8 },
  { path: "/spa",         freq: "weekly",  priority: 0.8 },
  { path: "/makeup",      freq: "weekly",  priority: 0.8 },
  { path: "/waxing",      freq: "weekly",  priority: 0.8 },
  { path: "/partner",     freq: "weekly",  priority: 0.7 },
  { path: "/impressum",   freq: "weekly",  priority: 0.3 },
  { path: "/agb",         freq: "weekly",  priority: 0.3 },
  { path: "/datenschutz", freq: "weekly",  priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages — both locales
  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url:             `${APP_URL}/${locale}${page.path}`,
        lastModified:    new Date(),
        changeFrequency: page.freq,
        priority:        page.priority,
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
    // Treatment category pages from service_categories
    const { data: categories } = await supabase
      .from("service_categories")
      .select("slug")
      .is("parent_id", null);

    for (const cat of categories ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url:             `${APP_URL}/${locale}/behandlungen/${cat.slug}`,
          lastModified:    new Date(),
          changeFrequency: "weekly",
          priority:        0.7,
        });
      }
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch salons:", err);
  }

  return entries;
}
