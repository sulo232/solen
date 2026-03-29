export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ items: [], total: 0 });

  const rateLimitResponse = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimitResponse) return rateLimitResponse;

  const { data, error } = await supabase
    .from("favorites")
    .select("salon_id")
    .eq("user_id", user.id);
  
  if (error || !data || data.length === 0) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const ids = data.map(f => f.salon_id);

  const { data: salons, error: sErr } = await supabase
    .from("salons")
    .select("*, services(price)")
    .in("id", ids)
    .eq("is_active", true);

  if (sErr) return NextResponse.json({ items: [], total: 0 });

  const items = (salons ?? []).map((salon: any) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      const { services: _s, ...rest } = salon;
      return { ...rest, avg_price };
  });

  return NextResponse.json({ items, total: items.length });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimitResponse = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(req.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("salon_id", salonId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
