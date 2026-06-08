export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import {
  applyRateLimit,
  generalLimiter,
  guestLookupLimiter,
  getClientIp,
} from "@/lib/ratelimit";
import { normalizeReferenceCode } from "@/lib/bookings/reference";
import { anonymizeGuestPII } from "@/lib/gdpr/anonymize-guest";

/**
 * POST /api/profile/request-deletion
 *
 * Two erasure paths under revDSG / GDPR right-to-be-forgotten:
 *
 *  A. REGISTERED USER (default — caller has a session):
 *     Sets profiles.deletion_requested_at = now() (and suspends the account).
 *     The cron (app/api/cron/process-deletions/route.ts) scans that column and,
 *     30 days later, hard-deletes the auth user — which cascades to profiles and
 *     fires the BEFORE DELETE trigger (20260602083300) that anonymizes the
 *     financial rows. We do NOT anonymize here; we only ARM the cron.
 *
 *  B. GUEST (no session — body carries { reference_code, email }):
 *     A guest has no profiles row, so the trigger never fires for them and the
 *     cron has nothing to scan. We therefore anonymize their PII IMMEDIATELY at
 *     request time, after proving ownership via reference_code + matching
 *     guest_email. Money figures are kept (anonymize-not-delete).
 *
 * Anti-enumeration (guest path): the limiter is the tight guestLookupLimiter and
 * we return a uniform 200 whether or not the (code, email) pair matched — never
 * reveal whether a booking exists for a given reference/email.
 */

export async function POST(req: NextRequest) {
  // Parse body up front (may be empty for the registered-user path).
  let body: { reference_code?: unknown; email?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const referenceCode = typeof body.reference_code === "string" ? body.reference_code : null;
  const email = typeof body.email === "string" ? body.email : null;

  // ── Path A: registered user (session present) ──────────────────────────────
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const admin = createAdminSupabaseClient();

    // Block deletion if the user owns salons with active bookings — mirrors the
    // existing guard in app/api/profile/delete/route.ts so a salon owner can't
    // orphan live bookings.
    const { data: ownedSalons } = await admin
      .from("salons")
      .select("id")
      .eq("owner_id", user.id);

    if (ownedSalons && ownedSalons.length > 0) {
      const salonIds = ownedSalons.map((s: { id: string }) => s.id);
      const { count } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("salon_id", salonIds)
        .in("status", ["confirmed", "pending"]);

      if (count && count > 0) {
        return NextResponse.json(
          {
            message:
              "Cannot delete account while your salon has active bookings. Please cancel or complete them first.",
            code: "ACTIVE_BOOKINGS",
          },
          { status: 400 },
        );
      }
    }

    // Arm the cron: stamp deletion_requested_at + suspend the account.
    const { error: updateError } = await admin
      .from("profiles")
      .update({
        deletion_requested_at: new Date().toISOString(),
        account_status: "suspended",
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[api/profile/request-deletion] failed to set deletion_requested_at:", updateError);
      return NextResponse.json(
        { message: "Failed to request account deletion. Please contact support.", code: "UPDATE_FAILED" },
        { status: 500 },
      );
    }

    await logAuditEvent(req, user.id, "account.delete_requested", "user", user.id, {
      email: user.email,
    });

    return NextResponse.json({
      message: "Account deletion requested. Your account will be permanently anonymized in 30 days.",
    });
  }

  // ── Path B: guest erasure (no session) ──────────────────────────────────────
  // Tight, IP-keyed limiter — this is the enumeration surface.
  const guestRateLimited = await applyRateLimit(guestLookupLimiter, { ip: getClientIp(req) });
  if (guestRateLimited) return guestRateLimited;

  // Uniform response so a missing/non-matching pair is indistinguishable from a
  // successful erasure (no enumeration of which references/emails exist).
  const UNIFORM_OK = NextResponse.json({
    message:
      "If a booking matches those details, its personal data has been erased. Financial records are retained as required by law.",
  });

  if (!referenceCode || !email) {
    // Neither a session nor a usable guest payload → uniform OK (don't 401/400,
    // which would leak that no session existed vs. that the payload was bad).
    return UNIFORM_OK;
  }

  const admin = createAdminSupabaseClient();
  const normalizedRef = normalizeReferenceCode(referenceCode);
  const normalizedEmail = email.trim().toLowerCase();

  // Prove ownership: the (reference_code, guest_email) pair must match one booking.
  const { data: matchedBooking } = await admin
    .from("bookings")
    .select("id")
    .eq("reference_code", normalizedRef)
    .ilike("guest_email", normalizedEmail)
    .maybeSingle();

  if (!matchedBooking) {
    // No match → uniform OK (anti-enumeration). Nothing erased.
    return UNIFORM_OK;
  }

  try {
    const result = await anonymizeGuestPII(admin, normalizedEmail);

    // Accountability trail (revDSG Art. 25 / GDPR Art. 5(2)): one log row per
    // erasure. requested_at + completed_at are the same instant for guests
    // (erasure is immediate, not deferred 30 days like the registered path).
    const now = new Date().toISOString();
    const { error: logErr } = await admin.from("data_deletion_log").insert({
      user_email: normalizedEmail,
      requested_at: now,
      completed_at: now,
      tables_cleared: result.tablesCleared,
    });
    if (logErr) {
      console.error("[api/profile/request-deletion] guest deletion_log insert failed:", logErr);
    }
  } catch (err) {
    console.error("[api/profile/request-deletion] guest anonymization failed:", err);
    // Still return uniform OK — surfacing a 500 here would leak that a match
    // existed. The error is logged for ops follow-up.
  }

  return UNIFORM_OK;
}
