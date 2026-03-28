export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET — list zone packages for a salon
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();

  // Try to fetch from waxing_zone_packages table — gracefully handle if table doesn't exist yet
  const { data, error } = await supabase
    .from("waxing_zone_packages")
    .select("id, name, zones, discount_percent, created_at")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: true });

  // Table may not exist yet — return empty array gracefully
  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ packages: [] }); // table doesn't exist yet
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: data ?? [] });
}

// POST — create a zone package
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: session.user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { salon_id, name, zones, discount_percent } = body;

  if (!salon_id || !name || !Array.isArray(zones) || zones.length === 0) {
    return NextResponse.json({ error: "salon_id, name, and zones required" }, { status: 400 });
  }

  // Verify salon ownership
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("owner_id", session.user.id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found or not owned" }, { status: 403 });

  const { data: pkg, error } = await supabase
    .from("waxing_zone_packages")
    .insert({
      salon_id,
      name: String(name).slice(0, 100),
      zones,
      discount_percent: Math.max(1, Math.min(50, Number(discount_percent) || 10)),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "42P01") {
      return NextResponse.json({ error: "Zone packages table not yet created. Run migration first." }, { status: 503 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: pkg }, { status: 201 });
}

// DELETE — remove a zone package
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: session.user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { id } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase
    .from("waxing_zone_packages")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
