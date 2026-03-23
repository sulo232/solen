export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, quartierSubscribeSchema } from "@/lib/validations";

// POST /api/quartier/subscribe
// Public endpoint: subscribe to quartier notifications.
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  const { data: validated, error: validationError } = validateBody(quartierSubscribeSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const email = validated.email.trim().toLowerCase();
  const quartier = validated.quartier.trim();

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("quartier_subscriptions")
    .upsert({ email, quartier }, { onConflict: "email,quartier" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
