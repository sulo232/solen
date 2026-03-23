export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

// GET /api/admin/salons?status=pending|active|frozen
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("salons")
    .select("id, name, slug, address, categories, phone, cover_photo_url, is_active, registration_completed, approved_at, rejection_reason, created_at, owner_id")
    .order("created_at", { ascending: false });

  if (status === "pending") {
    query = query.eq("registration_completed", true).eq("is_active", false).is("approved_at", null);
  } else if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "frozen") {
    query = query.eq("is_active", false).not("approved_at", "is", null);
  }

  const { data: salons, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with owner emails
  const enriched = await Promise.all((salons ?? []).map(async (salon) => {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);
    return { ...salon, owner_email: ownerAuth?.user?.email ?? null };
  }));

  return NextResponse.json({ salons: enriched });
}
