export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { ACTIVE_SALON_COOKIE } from "@/lib/active-salon";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";

// POST /api/salons/active { salon_id } — set the owner's active salon.
// Ownership-checked; persists the choice in the `solen_active_salon` cookie that
// getActiveSalonId() reads. Used by the dashboard salon switcher.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const { salon_id } = await req.json().catch(() => ({}));
  if (!salon_id || typeof salon_id !== "string") {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  // Never let a user pin a salon they don't own.
  const { data: owned } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salon_id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!owned) return NextResponse.json({ error: "Not your salon" }, { status: 403 });

  const res = NextResponse.json({ ok: true, salon_id });
  res.cookies.set(ACTIVE_SALON_COOKIE, salon_id, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
