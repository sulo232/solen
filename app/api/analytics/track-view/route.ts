export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { validateBody, trackViewSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// POST /api/analytics/track-view
// Body: { salon_id: string, source: 'category_page' | 'search' | 'direct' | 'last_minute' }
// No auth required. Rate-limited to 1 view per salon per session via cookie.
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { data: validated, error: validationError } = validateBody(trackViewSchema, body);
  if (validationError) return NextResponse.json({ ok: false }, { status: 400 });
  const { salon_id, source } = validated;

  // Rate-limit: 1 view per salon per session via cookie
  const cookieStore = await cookies();
  const viewKey = `pv_${salon_id}`;
  if (cookieStore.get(viewKey)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("salon_page_views").insert({
    salon_id,
    source: source ?? "direct",
  });

  if (error) {
    // V3-D345 (2026-05-28): analytics is fire-and-forget telemetry — it must NEVER
    // 500 a salon page load. Previously a missing `salon_page_views` table
    // (PGRST205) returned 500 on every PDP view, spamming the console. Degrade
    // gracefully: log + return 200 ok:false so the client's tracking call is a
    // silent no-op. To actually RECORD views, create the table (see migration note).
    console.error("[api/analytics/track-view] view not recorded:", error.message);
    return NextResponse.json({ ok: false, recorded: false }, { status: 200 });
  }

  // Set session cookie to prevent duplicate counts (expires with session)
  const response = NextResponse.json({ ok: true });
  response.cookies.set(viewKey, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
