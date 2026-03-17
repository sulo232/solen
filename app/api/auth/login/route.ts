import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  // Google OAuth
  if (body.provider === "google") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ url: data.url });
  }

  // Email magic link
  if (body.email) {
    const { error } = await supabase.auth.signInWithOtp({
      email: body.email,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback`,
      },
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: "Magic link sent" });
  }

  return NextResponse.json({ message: "email or provider required" }, { status: 400 });
}
