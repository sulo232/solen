export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, resendAccessLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, resendAccessSchema } from "@/lib/validations";
import { normalizeReferenceCode } from "@/lib/bookings/reference";
import { issueAccessToken } from "@/lib/bookings/guest-access";
import { getServerEnv, getPublicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";

/**
 * POST /api/bookings/resend-access   body: { code, email? | phone? }
 *
 * "Resend my access link" (master plan §10b.10). The brute-force / enumeration / email-
 * bombing surface, so it uses the STRICTEST dedicated limiter and is fully opaque: it
 * ALWAYS returns the identical 200 body regardless of whether the code exists, whether
 * the contact matches, or whether the booking is a guest booking. Only the matching-
 * guest case actually mints a new token + sends an email.
 *
 * Token rotation: a resend mints a NEW token (rotating any prior one); a stale link then
 * 404s on next use. SP-3, on closing a case, nulls access_token_hash to kill links.
 */

// The single opaque response — byte-identical for match / no-match / bad-code.
const OPAQUE_OK = {
  ok: true,
  message: "If that order number matches a guest booking, we've sent a new access link.",
} as const;
function opaqueOk() {
  return NextResponse.json(OPAQUE_OK, { status: 200 });
}

/** Constant-time, case-insensitive equality for the contact match. Hashing both sides to
 *  a fixed-length digest keeps the compare equal-length (timingSafeEqual-safe) and avoids
 *  leaking how much of the contact matched. Empty/absent stored value → never matches. */
function contactMatches(presented: string, stored: string | null): boolean {
  if (!stored) return false;
  const norm = (s: string) => s.trim().toLowerCase();
  const a = crypto.createHash("sha256").update(norm(presented), "utf8").digest();
  const b = crypto.createHash("sha256").update(norm(stored), "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // 1. Strictest dedicated limiter (3/h per IP), NOT generalLimiter.
  const rateLimited = await applyRateLimit(resendAccessLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  // 2. Validate body. A 400 here is pre-lookup and leaks nothing about a code.
  const body = await req.json().catch(() => ({}));
  const { data: validated, error } = validateBody(resendAccessSchema, body);
  if (error) return NextResponse.json({ error: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { code, email, phone } = validated;
  const norm = normalizeReferenceCode(code);

  // 3. Service-role fetch by reference_code. Behave identically whether or not a row
  //    exists or the contact matches (anti-enumeration).
  const admin = createAdminSupabaseClient();
  const { data: row } = await admin
    .from("bookings")
    .select("id, guest_email, guest_phone, user_id")
    .eq("reference_code", norm)
    .maybeSingle();

  // Only a GUEST booking (user_id IS NULL) whose stored contact matches the supplied one
  // gets a fresh token + email. A logged-in booking gets the same opaque 200 but no email
  // (a logged-in user manages via their account). No row → same opaque 200.
  const isGuestBooking = !!row && row.user_id == null;
  const matches =
    isGuestBooking &&
    (email ? contactMatches(email, row.guest_email) : contactMatches(phone as string, row.guest_phone));

  if (row && isGuestBooking && matches) {
    const { raw, hash, expiresAt } = issueAccessToken();
    const { error: updErr } = await admin
      .from("bookings")
      .update({ access_token_hash: hash, access_token_expires_at: expiresAt })
      .eq("id", row.id);

    if (updErr) {
      // Log + still return the opaque 200 (don't leak the failure to the caller).
      console.error("[resend-access] token rotation update failed:", updErr);
      return opaqueOk();
    }

    // Send via the EXISTING Resend hook pattern (same as the report route — no new mailer).
    // The link carries the raw token in a query param that the guest-lookup route
    // immediately exchanges for an httpOnly cookie. Token is never logged here.
    const resendApiKey = getServerEnv().RESEND_API_KEY;
    if (!resendApiKey) {
      console.warn("[resend-access] RESEND_API_KEY not set — skipping email (token still rotated)");
    } else if (email) {
      // Phone-only resend has no email channel yet (SMS is the owner's later piece);
      // the token is rotated regardless so a follow-up email resend works.
      let appUrl: string | null = null;
      try {
        const pub = getPublicEnv();
        appUrl = pub.NEXT_PUBLIC_APP_URL ?? pub.NEXT_PUBLIC_SITE_URL ?? null;
      } catch {
        appUrl = null;
      }
      const link = `${appUrl ?? ""}/booking/lookup?code=${encodeURIComponent(norm)}&t=${encodeURIComponent(raw)}`;
      try {
        await sendEmail({
          from: "support@solen.ch",
          to: email,
          subject: "Ihr Zugangslink zur Buchung",
          html: `<p>Hier ist Ihr neuer Zugangslink für Buchung ${norm}.</p>
                   <p><a href="${link}">Buchung öffnen</a></p>
                   <p>Dieser Link ist 30 Tage gültig. Teilen Sie ihn nicht.</p>`,
        });
      } catch (e) {
        // Log without the token. Still return the opaque 200.
        console.error("[resend-access] Resend email send failed for booking", row.id, e);
      }
    }
  }

  // 4. ALWAYS the same opaque 200, regardless of match / no-match / bad-code.
  return opaqueOk();
}
