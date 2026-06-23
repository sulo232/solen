import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { searchStockPhotos } from "@/lib/stock-photos";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminDiscoveryBulkImportSchema } from "@/lib/validations";

const QUERIES_BY_CATEGORY: Record<string, string[]> = {
  hair: ["curly hair women", "short hair men", "balayage", "fade haircut", "braids hairstyle", "french bob"],
  beard: ["beard styles men", "goatee", "full beard"],
  nails: ["nail art", "coffin nails", "french manicure", "gel nails design"],
};

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminDiscoveryBulkImportSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { category } = validated;
  const customQuery = validated.query?.trim();
  // With a free-text term, search THAT (across a few pages for volume) and import the batch into `category`.
  // Without one, fall back to the category's preset queries.
  const queries = customQuery ? [customQuery] : QUERIES_BY_CATEGORY[category];
  if (!queries || queries.length === 0) {
    return NextResponse.json(
      { error: `No preset for "${category}". Type a search term (e.g. "coffin nails", "volume lashes").` },
      { status: 400 },
    );
  }
  const pages = customQuery ? Math.min(validated.pages ?? 3, 5) : 1;
  const queryTags = customQuery ? customQuery.toLowerCase().split(/\s+/).filter(Boolean) : [];
  const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const admin = createAdminSupabaseClient();
  const batchId = crypto.randomUUID();
  const seen = new Set<string>();
  let totalImported = 0;

  for (const query of queries) {
    for (let page = 1; page <= pages; page++) {
      const result = await searchStockPhotos(query, category, "all", page);
      if (!result.photos?.length) break; // ran out of results for this term
      for (const photo of result.photos) {
        if (!photo.url || seen.has(photo.url)) continue; // de-dupe within this run
        seen.add(photo.url);
        // Tag with the search words + the stock photo's own keywords so the for-you point system has signal.
        const tags = Array.from(new Set([...queryTags, ...(photo.tags ?? [])])).filter(Boolean).slice(0, 12);
        const { error } = await admin.from("discovery_items").upsert({
          id: crypto.randomUUID(),
          image_url: photo.url,
          media_type: "photo",
          content_type: "inspo",
          category,
          ...(customQuery ? { style_name: titleCase(customQuery) } : {}),
          author_name: photo.author,
          alt_text: photo.alt_text,
          tags,
          status: "published",
          is_active: true,
          uploaded_by: user.id,
          source: photo.source ?? "stock",
          source_url: photo.url,
        }, { onConflict: "id" });
        if (!error) totalImported++;
      }
    }
  }

  await logAuditEvent(req, user.id, "discovery.import", "bulk", undefined, {
    category, imported: totalImported, batch_id: batchId,
  });

  return NextResponse.json({ imported: totalImported, batch_id: batchId });
}
