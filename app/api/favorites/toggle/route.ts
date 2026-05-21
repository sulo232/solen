export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/favorites/toggle
 *
 * Used by:
 *   - HeartButton component — persists heart-save state for a logged-in user.
 *   - /profile/favorites page — reads from the SAME `favorites` table.
 *
 * Body: { salon_id: string }
 *
 * Returns:
 *   200 { saved: true | false }   — toggled successfully
 *   401 { message: "...", code: "UNAUTHENTICATED" }
 *   400 { message: "...", code: "BAD_REQUEST" }
 *   500 { message: "...", code: "DB_ERROR" }
 *
 * Schema: `public.favorites (user_id, salon_id, created_at)` per migration
 * 035_favorites.sql. UNIQUE(user_id, salon_id). Pre-2026-05-16 this route
 * wrote to a non-existent `salon_favorites` table (silent 500s); every other
 * favorites consumer reads/writes `favorites` — fixed to match.
 *
 * SECURITY: getSession() per Rule 25 — never getUser() in API routes.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json({ message: "Anmeldung erforderlich", code: "UNAUTHENTICATED" }, { status: 401 });
  }

  let body: { salon_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body", code: "BAD_REQUEST" }, { status: 400 });
  }

  const salonId = body.salon_id?.trim();
  if (!salonId) {
    return NextResponse.json({ message: "Missing salon_id", code: "BAD_REQUEST" }, { status: 400 });
  }

  // Check if favorite already exists
  const { data: existing, error: lookupError } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("salon_id", salonId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ message: lookupError.message, code: "DB_ERROR" }, { status: 500 });
  }

  if (existing) {
    // Was favorited — remove it
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("salon_id", salonId);

    if (error) {
      return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
    }
    return NextResponse.json({ saved: false });
  }

  // Wasn't favorited — add it
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, salon_id: salonId });

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
