import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { after } from "next/server";
import type { Metadata, Viewport } from "next";
import type { DiscoveryItem } from "@/lib/types";
import DetailPage, { type SalonLite } from "@/components-legacy/discovery/DetailPage";
import { analyzeDiscoveryImage, analyzeDiscoveryTikTok } from "@/lib/ai-vision";
import { discoveryAiLimiter, checkRateLimit, getAiDailyLimiter, getClientIp, getAiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY } from "@/lib/ratelimit";
import { getServerEnv } from "@/lib/env";
import { DISCOVERY_TO_MARKETPLACE_CATEGORY } from "@/lib/discovery-categories";

// The look-detail page is a full-bleed DARK hero. Override the global light theme-color (#F4F4F6) with a dark one so
// the phone's status-bar area blends into the video instead of showing as a white strip above it (owner-reported).
export const viewport: Viewport = {
  themeColor: "#0A0A0A",
};

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
  // Already analyzed , key off the DESCRIPTION, not style_name. Stock looks ship with a style_name but no
  // description/specs, so the old `style_name` guard skipped them forever (the "no Gemini explanation" bug).
  if (item.description_en) return item;

  const imageUrl = item.image_url || item.tiktok_thumbnail_url;
  if (!imageUrl || !getServerEnv().GEMINI_API_KEY) return item;

  // ABUSE GUARD: this fires a paid, multi-second Gemini call from a PUBLIC page view. Cap it per-IP so a scraper
  // can't fan out across unanalyzed items and run up the bill. Over the cap → render the item as-is (no analysis),
  // never error. (Admin import paths have their own auth + rate limits.) getClientIp trusts Netlify's
  // x-nf-client-connection-ip / x-real-ip first, so this key can't be defeated by rotating x-forwarded-for.
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  if (!(await checkRateLimit(discoveryAiLimiter, `ai:${ip}`))) {
    console.warn("[discover/[id]] on-demand AI rate-limited, serving item as-is for ip:", ip);
    return item;
  }

  // A per-IP throttle alone doesn't bound TOTAL spend (many IPs, or a slow drip, still cost money).
  // Same DB-backed daily ceiling every other Gemini/fal generation route pairs with its per-minute
  // limiter (e.g. app/api/recommendations/route.ts), keyed the same way it keys anonymous callers: IP.
  const aiDailyLimiter = await getAiDailyLimiter();
  if (!(await checkRateLimit(aiDailyLimiter, ip))) {
    console.warn("[discover/[id]] on-demand AI daily cap reached, serving item as-is");
    return item;
  }

  // GLOBAL house-wide budget, checked with the CONSTANT key AI_GLOBAL_BUDGET_KEY (not the IP
  // above), so it sums usage across every visitor instead of bucketing per-IP like the check
  // above. Same "never error, just skip the analysis" contract as the per-IP guard.
  const aiGlobalDailyLimiter = await getAiGlobalDailyLimiter();
  if (!(await checkRateLimit(aiGlobalDailyLimiter, AI_GLOBAL_BUDGET_KEY))) {
    console.warn("[discover/[id]] GLOBAL AI daily budget reached (house-wide, not per-visitor), serving item as-is");
    return item;
  }

  try {
    const isTikTok = !!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok";
    const aiResult = isTikTok
      ? await analyzeDiscoveryTikTok(imageUrl, item.alt_text ?? "", item.tiktok_url ?? undefined, item.category)
      : await analyzeDiscoveryImage(imageUrl, item.category);

    if (!aiResult) return item;

    // Save to DB (fire-and-forget — don't block page render)
    const admin = createAdminSupabaseClient();
    const freshThumb = (aiResult as any)._freshThumbnailUrl;
    // products_needed is now an object (texture-adaptive), use products_flat for DB (same pattern as
    // app/api/admin/discovery/backfill/route.ts, app/api/admin/discovery/import-tiktok/route.ts,
    // app/api/cron/discovery-ai-backfill/route.ts).
    const productsFlat = aiResult.products_flat
      ?? (Array.isArray(aiResult.products_needed) ? aiResult.products_needed : []);
    const updates = {
      content_type: isTikTok ? "tiktok" as const : item.content_type,
      category: aiResult.category ?? item.category,
      gender: aiResult.gender ?? item.gender,
      texture: aiResult.texture ?? item.texture,
      style_name: aiResult.style_name,
      tags: aiResult.tags?.length > 0 ? aiResult.tags : item.tags,
      maintenance: aiResult.maintenance_level ?? item.maintenance,
      face_shapes: aiResult.face_shapes?.length > 0 ? aiResult.face_shapes : item.face_shapes,
      products_needed: productsFlat,
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

    // Awaited (not fire-and-forget) , this now runs inside `after()`, so we must let the write finish before the
    // background task ends, otherwise the description never persists.
    await admin.from("discovery_items").update(updates).eq("id", item.id);

    // Return enriched item (used if a future caller wants it inline; the after() path persists via the update above).
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
      canonical: `https://solen.ch/${locale}/inspo/${id}`,
      languages: {
        de: `https://solen.ch/de/inspo/${id}`,
        en: `https://solen.ch/en/inspo/${id}`,
        fr: `https://solen.ch/fr/inspo/${id}`,
        it: `https://solen.ch/it/inspo/${id}`,
      },
    },
  };
}

export default async function DiscoverDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  let item = await getItem(id);
  if (!item) notFound();

  // On-demand AI runs AFTER the response is sent (next/server `after`) so the page renders INSTANTLY instead of
  // blocking ~10s on a Gemini call , this was the cause of "everything loads so slow" (you've imported a pile of
  // fresh TikToks that got analyzed synchronously on open). The look's image/name/tags show immediately; the
  // description fills for the next visit, and the cron sweeps any stragglers.
  if (!item.description_en) {
    after(() => ensureAIData(item).catch((e) => console.error("[discover/[id]] background analyze failed:", e)));
  }

  // Check auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  // Increment view count (fire-and-forget). increment_discovery_view RPC never existed (phantom, caught by
  // strict typing), so this was a silent no-op at runtime. view_count is bumped by the trg_view_count trigger
  // via a discovery_interactions insert with action="view", written with the admin client since RLS only
  // grants INSERT to the row's own user (same fix as app/api/discovery/interactions/route.ts).
  createAdminSupabaseClient()
    .from("discovery_interactions")
    .insert({ item_id: id, user_id: user?.id ?? null, action: "view" })
    .then(({ error }) => { if (error) console.error("[discover/[id]] view interaction insert failed:", error); });

  // "Book this look" — the soft, honest salon list (owner call: real look→salon matching deferred). Salons that
  // offer a service in this look's category, ranked by rating; price is the cheapest such service ("ab CHF X").
  // IMPORTANT: discovery uses its own taxonomy but the services table uses the marketplace
  // taxonomy. Map across via the shared DISCOVERY_TO_MARKETPLACE_CATEGORY, else the join
  // silently returns 0 salons (the bug the audit flagged in the old salons-for-style stub).
  // reinvent-ok: imports the canonical map, does not redeclare it.
  const categoryRoute = DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] ?? "coiffeur";
  const serviceCategory = categoryRoute; // route slug == services.category in this marketplace
  let salons: SalonLite[] = [];
  let salonTotal = 0;
  try {
    const { data: salonRows } = await supabase
      .from("salons")
      .select("id, name, slug, average_rating, review_count, services!inner(id, name_de, name_en, name_fr, name_it, price, category, is_active)")
      .eq("is_active", true)
      .eq("services.is_active", true)
      .eq("services.category", serviceCategory)
      .order("average_rating", { ascending: false })
      .limit(60);
    const rows = salonRows ?? [];
    salonTotal = rows.length;
    // Style-word tokens (>3 chars) from the look's name, to try to land booking on the matching service.
    const styleWords = (item.style_name ?? "").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    salons = rows.slice(0, 3).map((s: Record<string, unknown>) => {
      type Svc = { id: string; name_de: string | null; name_en: string | null; name_fr: string | null; name_it: string | null; price: number | null };
      const services = ((s.services as Svc[]) ?? []).filter((x) => typeof x.price === "number" && x.price > 0);
      // Pre-select the service whose name matches the look's style; else the cheapest in-category service, so
      // "Book this look" lands on a real service instead of an empty picker (owner: "is it connecting it back").
      const matched = services.find((x) => {
        const n = `${x.name_de ?? ""} ${x.name_en ?? ""}`.toLowerCase();
        return styleWords.some((w) => n.includes(w));
      });
      const chosen = matched ?? services.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      // Only one in-category service → priceFrom IS the payable total for that exact service, not a floor.
      // "ab CHF X" is misleading here (PBV wants the payable number findable); render it bare, no "from" word.
      // name_fr/name_it exist as live columns (migration 20260727190000) but weren't backfilled on older
      // rows, so this falls through de → en → null rather than assuming fr/it is populated (no fabrication).
      const priceExact = services.length === 1;
      const localeKey = locale as "de" | "en" | "fr" | "it";
      const byLocale: Record<string, string | null | undefined> = {
        de: chosen?.name_de, en: chosen?.name_en, fr: chosen?.name_fr, it: chosen?.name_it,
      };
      const exactServiceName = priceExact ? (byLocale[localeKey] || chosen?.name_de || chosen?.name_en || null) : null;
      return {
        id: s.id as string,
        name: s.name as string,
        slug: s.slug as string,
        rating: (s.average_rating as number | null) ?? null,
        reviewCount: (s.review_count as number | null) ?? null,
        priceFrom: services.length ? Math.min(...services.map((x) => x.price as number)) : null,
        priceExact,
        exactServiceName,
        serviceId: chosen?.id ?? null,
      };
    });
  } catch (err) {
    console.error("[discover/[id]] book-this-look salons failed:", err);
  }

  return (
    <main className="min-h-screen bg-white pb-12">
      <DetailPage
        item={item}
        locale={locale}
        isAuthenticated={isAuthenticated}
        salons={salons}
        salonTotal={salonTotal}
        categoryRoute={categoryRoute}
      />
    </main>
  );
}
