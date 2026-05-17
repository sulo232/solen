import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { DiscoveryItem } from "@/lib/types";
import DetailPage from "@/components-legacy/discovery/DetailPage";
import { analyzeDiscoveryImage, analyzeDiscoveryTikTok } from "@/lib/ai-vision";
import { getServerEnv } from "@/lib/env";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function getItem(id: string): Promise<DiscoveryItem | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("discovery_items")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .single();
  return data as DiscoveryItem | null;
}

/** On-demand AI analysis — runs serverside when item has no AI data yet */
async function ensureAIData(item: DiscoveryItem): Promise<DiscoveryItem> {
  // Already analyzed
  if (item.style_name || item.description_en) return item;

  const imageUrl = item.image_url || item.tiktok_thumbnail_url;
  if (!imageUrl || !getServerEnv().GEMINI_API_KEY) return item;

  try {
    const isTikTok = !!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok";
    const aiResult = isTikTok
      ? await analyzeDiscoveryTikTok(imageUrl, item.alt_text ?? "", item.tiktok_url ?? undefined)
      : await analyzeDiscoveryImage(imageUrl);

    if (!aiResult) return item;

    // Save to DB (fire-and-forget — don't block page render)
    const admin = createAdminSupabaseClient();
    const freshThumb = (aiResult as any)._freshThumbnailUrl;
    const updates = {
      content_type: isTikTok ? "tiktok" as const : item.content_type,
      category: aiResult.category ?? item.category,
      gender: aiResult.gender ?? item.gender,
      texture: aiResult.texture ?? item.texture,
      style_name: aiResult.style_name,
      tags: aiResult.tags?.length > 0 ? aiResult.tags : item.tags,
      maintenance: aiResult.maintenance_level ?? item.maintenance,
      face_shapes: aiResult.face_shapes?.length > 0 ? aiResult.face_shapes : item.face_shapes,
      products_needed: aiResult.products_needed ?? [],
      hair_type_match: aiResult.hair_type_match ?? [],
      description_en: aiResult.description_en,
      description_de: aiResult.description_de,
      description_fr: aiResult.description_fr,
      description_it: aiResult.description_it,
      salon_script_de: aiResult.salon_script_de,
      cut_guide: aiResult.cut_guide,
      price_min: aiResult.price_min ?? item.price_min,
      price_max: aiResult.price_max ?? item.price_max,
      ...(freshThumb ? { tiktok_thumbnail_url: freshThumb } : {}),
    };

    admin.from("discovery_items").update(updates).eq("id", item.id).then(() => {});

    // Return enriched item for immediate display
    return { ...item, ...updates } as DiscoveryItem;
  } catch (err) {
    console.error("[discover/[id]] On-demand AI failed:", err);
    return item;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Not found" };

  const descKey = `description_${locale}` as keyof DiscoveryItem;
  const description = (item[descKey] as string | null) ?? item.description ?? "";
  const image = item.image_url ?? item.tiktok_thumbnail_url ?? undefined;

  return {
    title: `${item.style_name ?? "Discover"} | solen.ch`,
    description: description.slice(0, 160),
    openGraph: {
      title: item.style_name ?? "Discover",
      description: description.slice(0, 160),
      images: image ? [{ url: image }] : undefined,
    },
    alternates: {
      canonical: `https://solen.ch/${locale}/discover/${id}`,
      languages: {
        de: `https://solen.ch/de/discover/${id}`,
        en: `https://solen.ch/en/discover/${id}`,
        fr: `https://solen.ch/fr/discover/${id}`,
        it: `https://solen.ch/it/discover/${id}`,
      },
    },
  };
}

export default async function DiscoverDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  let item = await getItem(id);
  if (!item) notFound();

  // On-demand AI analysis — fills in descriptions, prices, etc. on first view
  item = await ensureAIData(item);

  // Increment view count (fire-and-forget)
  const supabase = await createServerSupabaseClient();
  supabase.rpc("increment_discovery_view", { p_item_id: id }).then(() => {});

  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session?.user;

  return (
    <main className="min-h-screen bg-white px-4 pt-6 pb-20">
      <DetailPage item={item} locale={locale} isAuthenticated={isAuthenticated} />
    </main>
  );
}
