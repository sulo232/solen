import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/salons/verify?token=<jwt>
 * Salon owner clicks the verification link from the email.
 * Validates the token, resets verification warnings, updates last_verified_at.
 */
export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Missing token", code: "BAD_REQUEST" }, { status: 400 });
  }

  const supabase = await createAdminSupabaseClient();

  // The token is a signed JWT containing { salon_id, exp }
  // Verify via Supabase auth.getUser with the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ message: "Invalid or expired token", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const salonId = user.user_metadata?.salon_id as string | undefined;

  if (!salonId) {
    return NextResponse.json({ message: "Invalid token payload", code: "BAD_REQUEST" }, { status: 400 });
  }

  const { error } = await supabase
    .from("salons")
    .update({
      last_verified_at: new Date().toISOString(),
      verification_warnings: 0,
    })
    .eq("id", salonId);

  if (error) {
    return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://solen.ch";
  return NextResponse.redirect(`${appUrl}/de/dashboard?verified=1`);
}
