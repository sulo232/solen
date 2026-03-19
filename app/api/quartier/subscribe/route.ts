export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// POST /api/quartier/subscribe
// Public endpoint: subscribe to quartier notifications.
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.quartier) {
    return NextResponse.json({ error: "email and quartier required" }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  const quartier = String(body.quartier).trim();

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const validQuartiers = ["grossbasel", "kleinbasel", "gundeli", "st_johann", "iselin", "bruderholz", "breite"];
  if (!validQuartiers.includes(quartier)) {
    return NextResponse.json({ error: "Invalid quartier" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("quartier_subscriptions")
    .upsert({ email, quartier }, { onConflict: "email,quartier" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
