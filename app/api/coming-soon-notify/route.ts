export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, comingSoonNotifySchema } from "@/lib/validations";

// POST /api/coming-soon-notify: Email capture for Coming Soon pages
// Does NOT require authentication: anyone can sign up for notifications
export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rl) return rl;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: validated, error: validationError } = validateBody(comingSoonNotifySchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = validated.email.trim().toLowerCase();
  const feature = (validated.feature ?? "default").slice(0, 64);

  try {
    // coming_soon_signups: supabase/migrations/20260904120000_coming_soon_and_newsletter_signups.sql
    const admin: SupabaseClient = createAdminSupabaseClient();
    const { error } = await admin
      .from("coming_soon_signups")
      .upsert({ email, feature }, { onConflict: "email,feature" });

    if (error) {
      console.error("[coming-soon-notify] Supabase error:", error.message);
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[coming-soon-notify] Unexpected error:", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
