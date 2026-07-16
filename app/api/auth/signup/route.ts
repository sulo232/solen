export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, authLimiter, getClientIp } from "@/lib/ratelimit";
import { z } from "zod";
import { trackServerEvent, identifyServerUser } from "@/lib/posthog-server";
import { isPasswordBreached } from "@/lib/auth/breached-password";

const calcAge = (dateStr: string) => {
  const b = new Date(dateStr);
  const ageDifMs = Date.now() - b.getTime();
  const ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

const signupSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  // NIST SP 800-63-4 (July 2025): no composition rules (they push users toward
  // "Password1!"-shaped passwords that are in every cracking dictionary).
  // Length is what resists cracking. Breach-list check happens after parsing,
  // below, since it needs a network call the schema itself can't make.
  password: z.string().min(12, "Mindestens 12 Zeichen"),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD").optional(),
  salon_name: z.string().min(2, "Name muss mindestens 2 Zeichen haben").optional(),
}).refine(data => data.birthday || data.salon_name, {
  message: "Entweder Geburtsdatum oder Salon-Name erforderlich",
}).refine(data => {
  if (data.birthday) return calcAge(data.birthday) >= 16;
  return true;
}, {
  message: "Du musst mindestens 16 Jahre alt sein.",
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

  const { email, password, birthday, salon_name } = parsed.data;

  // NIST SP 800-63-4: reject passwords found in known breach corpora. Runs
  // AFTER the length check (cheap check first) and fails open on any HIBP
  // failure, see lib/auth/breached-password.ts.
  if (await isPasswordBreached(password)) {
    // `code` lets the client show a locale-aware message distinct from the
    // "too short" case (messages/*.json authRegister.errorPasswordBreached);
    // `message` is the hardcoded-German fallback every other error in this
    // route already returns, for any caller that only reads `message`.
    return NextResponse.json(
      {
        code: "password_breached",
        message: "Dieses Passwort wurde in einem Datenleck gefunden. Bitte wähle ein anderes.",
      },
      { status: 400 },
    );
  }

  const supabase = await createServerSupabaseClient();
  const origin = new URL(request.url).origin;

  const isSalon = !!salon_name;
  const redirectPath = isSalon ? `/de/onboarding/salon` : `/de`;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { birthday, salon_name },
      emailRedirectTo: `${origin}/api/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
    },
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (data.user && (!data.user.identities || data.user.identities.length > 0)) {
    await identifyServerUser(data.user.id, { email });
    await trackServerEvent(data.user.id, "customer_signup", { method: "email" });
  }

  // SECURITY: Supabase returns user with identities=[] if the email already has a
  // confirmed account. Do NOT surface that distinction to the client (it lets an
  // attacker enumerate registered emails). Always return the same generic 200 response,
  // whether the email is new or already registered.
  return NextResponse.json({ message: "Verification code sent", email });
}
