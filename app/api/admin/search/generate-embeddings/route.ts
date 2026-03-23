export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Gemini SDK crashes on Edge

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter, getClientIp } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { generateEmbedding, buildServiceEmbeddingText } from "@/lib/search/embeddings";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Admin role check
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Rate limit
  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  // Fetch all active services
  const { data: services, error: svcError } = await admin
    .from("services")
    .select("id, name_de, name_en, category, price, salon_id")
    .eq("is_active", true);

  if (svcError) {
    return NextResponse.json({ error: svcError.message }, { status: 500 });
  }

  let processed = 0;
  let errors = 0;
  const BATCH_SIZE = 10;

  // Process in batches
  for (let i = 0; i < (services ?? []).length; i += BATCH_SIZE) {
    const batch = (services ?? []).slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (service) => {
        const text = buildServiceEmbeddingText(service);
        const embedding = await generateEmbedding(text);

        const { error } = await admin
          .from("search_embeddings")
          .upsert(
            {
              entity_type: "service",
              entity_id: service.id,
              category: service.category,
              text_content: text,
              embedding: JSON.stringify(embedding),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "entity_type,entity_id" }
          );

        if (error) throw error;
      })
    );

    results.forEach((r) => {
      if (r.status === "fulfilled") processed++;
      else errors++;
    });

    // Cooldown between batches to avoid Gemini rate limits
    if (i + BATCH_SIZE < (services ?? []).length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return NextResponse.json({ processed, errors, total: (services ?? []).length });
}
