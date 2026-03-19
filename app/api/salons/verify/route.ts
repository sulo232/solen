export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/de?verify=missing_token`);
  }

  // Validate the JWT token — it contains salon_id in the payload
  try {
    const admin = createAdminSupabaseClient();

    // The token is a signed JWT created during the verification email
    // Decode and verify using Supabase JWT secret (via verify endpoint)
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.redirect(`${origin}/de?verify=invalid_token`);
    }

    // The salon_id is stored in user app_metadata or we look up by owner
    const salonId = user.app_metadata?.salon_id ?? searchParams.get("salon_id");
    if (!salonId) {
      return NextResponse.redirect(`${origin}/de?verify=missing_salon`);
    }

    const { error: updateError } = await admin
      .from("salons")
      .update({ last_verified_at: new Date().toISOString(), verification_warnings: 0 })
      .eq("id", salonId);

    if (updateError) throw updateError;

    return NextResponse.redirect(`${origin}/de/dashboard?verify=success`);
  } catch {
    return NextResponse.redirect(`${origin}/de?verify=error`);
  }
}
