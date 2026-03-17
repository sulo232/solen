import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/analytics/track-view
// Body: { salon_id: string, source: 'category_page' | 'search' | 'direct' | 'last_minute' }
// Rate-limited via cookie: max 1 view per salon per session
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.salon_id) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { salon_id, source } = body;

  // Cookie-based dedup: skip if already tracked this salon in this session
  const cookieKey = `sv_${salon_id}`;
  if (request.cookies.get(cookieKey)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = await createServerSupabaseClient();

  // Optionally attach authenticated viewer
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("salon_page_views").insert({
    salon_id,
    viewer_id: user?.id ?? null,
    source: source ?? "direct",
  });

  if (error) {
    console.error("[api/analytics/track-view]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  // Set session cookie so we don't double-count (expires with browser session)
  response.cookies.set(cookieKey, "1", { path: "/", sameSite: "strict", httpOnly: true });
  return response;
}
