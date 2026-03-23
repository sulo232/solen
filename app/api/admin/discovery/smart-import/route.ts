import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchStockPhotos } from "@/lib/stock-photos";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, adminDiscoverySmartImportSchema } from "@/lib/validations";

/**
 * POST /api/admin/discovery/smart-import
 * Gemini-powered search: describe what content you want,
 * Gemini generates optimized search queries,
 * searches Unsplash/Pexels/Pixabay, returns preview results.
 *
 * Body: { description: string, category?: string, limit?: number }
 * Response: { queries: string[], results: StockPhoto[] }
 *
 * Second step: POST with { action: "import", photo_ids: string[] }
 * to actually import selected photos.
 */
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  // Auth check — admin only
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { action } = body;

  // ═══ Action: Import selected photos ═══
  if (action === "import") {
    return handleImport(body, user.id);
  }

  // ═══ Action: Smart search (default) ═══
  const { data: validated, error: validationError } = validateBody(adminDiscoverySmartImportSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { description, category, limit = 20 } = validated;

  // 1. Use Gemini to generate search queries
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const queryPrompt = `You are a photo search expert. The user wants to find ${category ?? "hairstyle"} photos.

User's description: "${description}"

Generate 5-8 specific, diverse search queries optimized for stock photo APIs (Unsplash, Pexels).
Each query should be 2-4 words, in English, specific to the visual style described.
Include variations: different angles, lighting, demographics.

Return ONLY a JSON array of strings, no explanation.
Example: ["textured french crop men", "skin fade side view", "choppy layers brunette"]`;

  let queries: string[] = [];
  try {
    const result = await model.generateContent(queryPrompt);
    const text = result.response.text().replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    queries = JSON.parse(text);
    if (!Array.isArray(queries)) queries = [];
  } catch (err) {
    console.error("[smart-import] Gemini query generation failed:", err);
    // Fallback: use description as-is
    queries = [description];
  }

  // 2. Search stock photos with generated queries
  const allPhotos: any[] = [];
  const seen = new Set<string>();

  for (const query of queries.slice(0, 6)) {
    const result = await searchStockPhotos(query, category ?? "hair", "all", 1);
    for (const photo of result.photos) {
      if (!seen.has(photo.id)) {
        seen.add(photo.id);
        allPhotos.push(photo);
      }
    }
    if (allPhotos.length >= limit) break;
  }

  return NextResponse.json({
    queries,
    results: allPhotos.slice(0, limit),
    total: allPhotos.length,
  });
}

/** Import selected stock photos into discovery_items */
async function handleImport(
  body: { photos: Array<{ id: string; url: string; thumbnail: string; author: string; author_url: string; source: string; alt_text: string; tags: string[] }>; category?: string },
  userId: string
) {
  const { photos, category = "hair" } = body;
  if (!photos?.length) return NextResponse.json({ error: "No photos to import" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  let imported = 0;

  for (const photo of photos.slice(0, 30)) {
    const { error } = await admin.from("discovery_items").upsert({
      id: crypto.randomUUID(),
      image_url: photo.url,
      media_type: "photo",
      content_type: "inspo",
      category,
      author_name: photo.author,
      alt_text: photo.alt_text,
      tags: photo.tags ?? [],
      status: "published",
      is_active: true,
      uploaded_by: userId,
      source_url: photo.url,
    }, { onConflict: "id" });

    if (!error) imported++;
  }

  return NextResponse.json({ imported, total: photos.length });
}
