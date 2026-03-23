import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, discoveryAdminLimiter } from "@/lib/ratelimit";
import { validateBody, discoverySearchStockSchema } from "@/lib/validations";
import { searchStockPhotos } from "@/lib/stock-photos";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Admin check
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(discoveryAdminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data, error } = validateBody(discoverySearchStockSchema, body);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  const result = await searchStockPhotos(data.query, data.category, data.source, data.page);

  await logAuditEvent(req, user.id, "discovery.import", "stock_search", undefined, {
    query: data.query, category: data.category, results: result.total,
  });

  return NextResponse.json(result);
}
