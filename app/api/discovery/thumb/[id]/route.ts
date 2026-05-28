import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

// V3-D160 (2026-05-26): TikTok thumbnail refresh proxy.
//
// Why this exists: `discovery_items.tiktok_thumbnail_url` is stored at
// insert time from TikTok's signed CDN (`p16-common-sign.tiktokcdn-us.com`).
// The signatures embedded in those URLs expire — older rows show broken
// thumbnails everywhere they're rendered (homepage Entdecken + the
// /discover detail pages). Same bug would hit production, not just dev.
//
// Flow per request:
//   1. Look up the item by id → get its stable `tiktok_url` (e.g.
//      "https://vm.tiktok.com/XXX/"), which does NOT expire.
//   2. Hit TikTok's public oEmbed endpoint to get a freshly-signed
//      `thumbnail_url`.
//   3. Fetch that image and pipe the bytes back to the caller, with
//      a 1h browser/edge cache so we don't double-call TikTok every
//      page view.
//
// Cache strategy is conservative — `s-maxage=3600` matches the typical
// TikTok signed-URL TTL window, `stale-while-revalidate=86400` lets the
// edge serve a slightly-stale image while we refresh in the background.
//
// Failure mode: any of (item not found / oEmbed down / image fetch fails)
// returns a 502 with no body. Callers using this URL as a CSS
// `background-image` should layer a gradient *under* it so the card stays
// visually intact when the proxy 502s — see `Entdecken.tsx` for the
// layered-background pattern.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OEMBED_BASE = "https://www.tiktok.com/oembed";
const CACHE_HEADER =
  "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400";

// V3-D165 (2026-05-26): in-memory caches survive across requests for the
// lifetime of the dev/server process. The browser Cache-Control header
// only helps the SECOND-or-later request from the same client; in dev
// mode Next.js disables HTTP caching, so EVERY pageload was paying the
// full ~500ms (oEmbed round trip + image fetch). With these caches the
// first request per ID is still slow (we have to hit TikTok), but every
// subsequent request inside the TTL — across ALL clients on this server
// — returns instantly. In prod, Netlify's edge cache handles repeat
// users; this just speeds up dev. Memory cost: 8 cards × ~270KB image =
// ~2MB, acceptable.
const TTL_MS = 60 * 60 * 1000; // 1h matches Cache-Control max-age
const oembedCache = new Map<string, { thumbnailUrl: string; expiresAt: number }>();
const imageCache = new Map<string, { bytes: ArrayBuffer; contentType: string; expiresAt: number }>();

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  if (!id) return new NextResponse("missing id", { status: 400 });

  const now = Date.now();

  // FAST PATH: image bytes already cached → skip DB + oEmbed + TikTok CDN.
  const cachedImage = imageCache.get(id);
  if (cachedImage && cachedImage.expiresAt > now) {
    return new NextResponse(cachedImage.bytes, {
      status: 200,
      headers: {
        "Content-Type": cachedImage.contentType,
        "Cache-Control": CACHE_HEADER,
        "X-Cache": "HIT",
      },
    });
  }

  // 1) Resolve item → tiktok_url
  const admin = createAdminSupabaseClient();
  const { data: item, error: dbErr } = await admin
    .from("discovery_items")
    .select("tiktok_url")
    .eq("id", id)
    .maybeSingle();
  if (dbErr) {
    console.error("[thumb proxy] DB lookup failed:", dbErr.message);
    return new NextResponse("db error", { status: 502 });
  }
  if (!item?.tiktok_url) {
    return new NextResponse("not found", { status: 404 });
  }

  // 2) Get fresh signed URL — cached oEmbed response if recent enough.
  let freshUrl: string | null = null;
  const cachedOembed = oembedCache.get(item.tiktok_url);
  if (cachedOembed && cachedOembed.expiresAt > now) {
    freshUrl = cachedOembed.thumbnailUrl;
  } else {
    try {
      const oembedRes = await fetch(
        `${OEMBED_BASE}?url=${encodeURIComponent(item.tiktok_url)}`,
        { cache: "no-store" },
      );
      if (!oembedRes.ok) {
        console.error("[thumb proxy] oembed status", oembedRes.status);
        return new NextResponse("oembed failed", { status: 502 });
      }
      const oembed = (await oembedRes.json()) as { thumbnail_url?: string };
      freshUrl = oembed.thumbnail_url ?? null;
      if (freshUrl) {
        oembedCache.set(item.tiktok_url, {
          thumbnailUrl: freshUrl,
          expiresAt: now + TTL_MS,
        });
      }
    } catch (err) {
      console.error("[thumb proxy] oembed exception:", err);
      return new NextResponse("oembed exception", { status: 502 });
    }
  }
  if (!freshUrl) {
    return new NextResponse("no thumbnail in oembed", { status: 502 });
  }

  // 3) Fetch the image, cache the bytes in memory, pipe back to client.
  try {
    const imgRes = await fetch(freshUrl);
    if (!imgRes.ok) {
      console.error("[thumb proxy] image fetch status", imgRes.status);
      return new NextResponse("image fetch failed", { status: 502 });
    }
    const bytes = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    imageCache.set(id, {
      bytes,
      contentType,
      expiresAt: now + TTL_MS,
    });
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": CACHE_HEADER,
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[thumb proxy] image fetch exception:", err);
    return new NextResponse("image exception", { status: 502 });
  }
}
