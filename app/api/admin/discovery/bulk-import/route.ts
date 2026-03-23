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
  makeup: ["makeup look", "smokey eye", "natural makeup", "bridal makeup"],
  waxing: ["waxing spa", "smooth skin care"],
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
  const queries = QUERIES_BY_CATEGORY[category];
  if (!queries) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const batchId = crypto.randomUUID();
  let totalImported = 0;

  for (const query of queries) {
    const result = await searchStockPhotos(query, category, "all", 1);

    for (const photo of result.photos) {
      const { error } = await admin.from("discovery_items").upsert({
        id: crypto.randomUUID(),
        image_url: photo.url,
        media_type: "photo",
        content_type: "inspo",
        category,
        author_name: photo.author,
        alt_text: photo.alt_text,
        tags: photo.tags,
        status: "published",
        is_active: true,
        uploaded_by: user.id,
        source_url: photo.url,
      }, { onConflict: "id" });

      if (!error) totalImported++;
    }
  }

  await logAuditEvent(req, user.id, "discovery.import", "bulk", undefined, {
    category, imported: totalImported, batch_id: batchId,
  });

  return NextResponse.json({ imported: totalImported, batch_id: batchId });
}
