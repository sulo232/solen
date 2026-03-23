export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { trackServerEvent, identifyServerUser } from "@/lib/posthog-server";

const calcAge = (dateStr: string) => {
  const b = new Date(dateStr);
  const ageDifMs = Date.now() - b.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const signupSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").refine((val) => calcAge(val) >= 16, {
    message: "Du musst mindestens 16 Jahre alt sein.",
  }),
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

  const { email, password, birthday } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { birthday },
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (data.user && (!data.user.identities || data.user.identities.length > 0)) {
    identifyServerUser(data.user.id, { email });
    trackServerEvent(data.user.id, "customer_signup", { method: "email" });
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
