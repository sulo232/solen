import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  // Google OAuth — KEEP AS-IS
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

  // Email + Password login (replaces magic link)
  if (body.email && body.password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ session: data.session });
  }

  // Password reset
  if (body.email && body.resetPassword) {
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${origin}/de/auth/reset-password`,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: "Reset link sent" });
  }

  return NextResponse.json({ message: "email and password required" }, { status: 400 });
}
