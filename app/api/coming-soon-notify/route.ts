export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// POST /api/coming-soon-notify: Email capture for Coming Soon pages
// Does NOT require authentication: anyone can sign up for notifications
export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rl) return rl;

  let body: { email?: string; feature?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const feature = (body.feature ?? "default").slice(0, 64);

  if (!email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    // coming_soon_signups is a phantom table: it does not exist in lib/database.types.ts, in any
    // migration, or in the live DB (npm run exists coming_soon_signups: 0 matches). This upsert has
    // therefore always been a silent no-op that just falls into the catch-and-swallow below (no
    // equivalent table exists to redirect to, so behavior is kept byte-identical here; flagged in the
    // coder report as a genuine pre-existing bug for a product/DB decision).
    const admin: SupabaseClient = createAdminSupabaseClient();
    const { error } = await admin
      .from("coming_soon_signups")
      .upsert({ email, feature }, { onConflict: "email,feature" });

    if (error) {
      // Table may not exist yet — fail silently so the UX still works
      console.error("[coming-soon-notify] Supabase error:", error.message);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[coming-soon-notify] Unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
