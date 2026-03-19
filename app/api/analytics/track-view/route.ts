export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { cookies } from "next/headers";

// POST /api/analytics/track-view
// Body: { salon_id: string, source: 'category_page' | 'search' | 'direct' | 'last_minute' }
// No auth required. Rate-limited to 1 view per salon per session via cookie.
export async function POST(request: NextRequest) {
  let body: { salon_id?: string; source?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { salon_id, source } = body;
  if (!salon_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

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
    console.error("[api/analytics/track-view]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Set session cookie to prevent duplicate counts (expires with session)
  const response = NextResponse.json({ ok: true });
  response.cookies.set(viewKey, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
