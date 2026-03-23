import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase";

// Force dynamic — sitemap data changes frequently
export const dynamic = "force-dynamic";

const APP_URL = "https://solen.ch";
const LOCALES  = ["de", "en", "fr", "it"] as const;

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
  { path: "/discover",    freq: "daily",   priority: 0.8 },
  { path: "/terms/discovery", freq: "weekly", priority: 0.2 },
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
    const supabase = createAdminSupabaseClient();
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
    // Discovery items
    const { data: discoveryItems } = await supabase
      .from("discovery_items")
      .select("id, updated_at")
      .eq("status", "published")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500);

    for (const item of discoveryItems ?? []) {
      for (const locale of LOCALES) {
        entries.push({
          url:             `${APP_URL}/${locale}/discover/${item.id}`,
          lastModified:    new Date(item.updated_at),
          changeFrequency: "weekly",
          priority:        0.6,
        });
      }
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch salons:", err);
  }

  return entries;
}
