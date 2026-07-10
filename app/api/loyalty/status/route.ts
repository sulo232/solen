export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getLoyaltyStatus } from "@/lib/loyalty/status";

// GET /api/loyalty/status — Solen Status (GO-modeled rank) for the signed-in user.
// Computed on-read from completed bookings; see lib/loyalty/status.ts.
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await getLoyaltyStatus(supabase, user.id);
  return NextResponse.json(status);
}
