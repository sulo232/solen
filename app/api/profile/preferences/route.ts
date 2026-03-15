import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/profile/preferences
 * Returns the current user's personalization preferences.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows — return empty defaults
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  return NextResponse.json(data ?? {
    user_id:                user.id,
    favorite_quartier_ids:  [],
    favorite_service_slugs: [],
    quartier_visit_counts:  {},
    last_booked_service:    null,
    booking_intervals:      {},
    dismissed_nudges:       {},
    view_preference:        "list",
  });
}
