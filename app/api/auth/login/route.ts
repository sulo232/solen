export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});

const resetSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  resetPassword: z.literal(true),
});

const oauthSchema = z.object({
  provider: z.literal("google"),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  // Extract locale from referer or fallback to "de"
  const referer = request.headers.get("referer") ?? "";
  const localeMatch = referer.match(/\/(de|en|fr|it)(?:\/|$)/);
  const locale = localeMatch?.[1] ?? "de";

  // Google OAuth
  const oauthParsed = oauthSchema.safeParse(body);
  if (oauthParsed.success) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback`,
      },
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ url: data.url });
  }

  // Password reset
  const resetParsed = resetSchema.safeParse(body);
  if (resetParsed.success) {
    const { error } = await supabase.auth.resetPasswordForEmail(resetParsed.data.email, {
      redirectTo: `${origin}/${locale}/auth/reset-password`,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: "Reset link sent" });
  }

  // Email + Password login
  const loginParsed = loginSchema.safeParse(body);
  if (loginParsed.success) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginParsed.data.email,
      password: loginParsed.data.password,
    });
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ session: data.session });
  }

  return NextResponse.json({ message: "email and password required" }, { status: 400 });
}
