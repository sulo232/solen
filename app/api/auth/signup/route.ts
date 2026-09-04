export const dynamic = "force-dynamic";
// runtime = "edge" removed 2026-09-04: see app/api/auth/login/route.ts for the reason
// (Netlify edge functions don't receive the trusted x-nf-client-connection-ip header,
// per docs.netlify.com/build/edge-functions/api/, and this route uses none of the
// edge-only APIs, so Node is the correct runtime for a route that rate-limits by IP).
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
  message: "Sie müssen mindestens 16 Jahre alt sein.",
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

  // Refuse a password that already appears in a public breach list. Only a hash prefix leaves this
  // server, never the password, so the service being asked cannot learn what was typed.
  //
  // Landed 2026-08-14 from the July backend work, which was written and never merged. Deliberately
  // ONLY this half: that branch also loosened the password rules from eight characters with a
  // capital and a digit to twelve characters with no other rule, and rewrote the age line from Sie
  // to du. Both are changes a customer would feel, and the second breaks the formal-voice rule, so
  // neither is smuggled in behind a security fix.
  if (await isPasswordBreached(password)) {
    return NextResponse.json(
      {
        // `code` is taken from that same branch and is worth having on its own: without it this
        // route can only hand the client a German sentence, so a French or Italian visitor was
        // shown German at the one moment they are being told to pick a different password. The
        // four translations already exist (authRegister.errorPasswordBreached in every locale
        // file); nothing was reading them. `message` stays as the fallback for any caller that
        // only looks at that field, and keeps the formal voice.
        code: "password_breached",
        message: "Dieses Passwort wurde bei einem Datenleck veröffentlicht. Bitte wählen Sie ein anderes.",
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
