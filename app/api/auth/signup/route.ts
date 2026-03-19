export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
});

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(authLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Validation error";
    return NextResponse.json({ message: firstError }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  // Supabase returns user with identities=[] if user already exists but is unconfirmed
  // If identities array is empty, user already exists
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return NextResponse.json(
      { message: "Ein Konto mit dieser E-Mail existiert bereits. Bitte melde dich an." },
      { status: 409 }
    );
  }

  return NextResponse.json({ message: "Verification code sent", email });
}
