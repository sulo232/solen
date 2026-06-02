import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Guest PII anonymization (revDSG / GDPR right-to-erasure).
 *
 * WHY THIS EXISTS — the gap it closes:
 *   The BEFORE DELETE trigger on `public.profiles`
 *   (migration 20260602083300_financial_retention_on_delete.sql) anonymizes a
 *   *registered* user's bookings / booking_disputes / case_events on deletion.
 *   But a GUEST has NO profiles row — they checked out with only
 *   guest_name / guest_email / guest_phone on the booking. So the trigger
 *   NEVER fires for them and their PII would live forever. This is the
 *   account-less mirror of that trigger, run at request time.
 *
 * PHILOSOPHY — ANONYMIZE, NOT DELETE (same as the registered trigger):
 *   We strip identity (null/redact guest_name / guest_email / guest_phone and
 *   any free-text note that can carry PII) while PRESERVING the financial
 *   figures + Stripe references. Swiss CO Art. 958f mandates 10-year retention
 *   of accounting records; revDSG Art. 6 / GDPR Art. 17(3)(b) carve erasure
 *   out when a legal retention duty applies. So: drop the person, keep the money.
 *
 * SCOPE — every row across the platform that carries this guest's email:
 *   1. bookings           (guest_name / guest_email / guest_phone)
 *   2. booking_disputes   (guest_name / guest_email / guest_phone + free text)
 *   3. case_events.note   (free-text notes on the guest's disputes)
 *
 * CALLER CONTRACT: pass a SERVICE-ROLE (admin) client. This bypasses RLS on
 * purpose — a guest has no session, and we must reach rows across salons.
 * The caller is responsible for proving the requester owns the email
 * (reference_code + guest_email match) BEFORE calling this.
 */

export type GuestAnonymizeResult = {
  /** Number of booking rows whose guest PII was stripped. */
  bookings: number;
  /** Number of booking_disputes rows whose guest PII + free text was stripped. */
  disputes: number;
  /** Number of case_events rows whose free-text note was scrubbed. */
  caseEvents: number;
  /** Tables actually touched (non-empty), for the data_deletion_log audit row. */
  tablesCleared: string[];
};

/**
 * Strip a guest's PII from every booking / dispute / case_event that carries
 * their email, keeping all financial figures. Idempotent: re-running on an
 * already-anonymized guest is a no-op (the email is gone, so nothing matches).
 *
 * @param admin  service-role Supabase client (RLS-bypassing)
 * @param email  the guest's email (caller MUST have verified ownership first)
 */
export async function anonymizeGuestPII(
  admin: SupabaseClient,
  email: string,
): Promise<GuestAnonymizeResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const tablesCleared: string[] = [];

  // 1. BOOKINGS — find this guest's bookings first (need the ids to reach their
  //    disputes' case_events), then strip the PII. Money columns (paid_amount,
  //    refunded_amount, payment_intent_id, fee_charged_amount, …) are LEFT
  //    UNTOUCHED. We do NOT set anonymized_at here: that tombstone means "owner
  //    deleted, user_id nulled" (the registered-trigger semantics). A guest
  //    booking has user_id = NULL already and stays a valid guest row only if it
  //    keeps a non-null guest_name/guest_phone (owner-or-guest CHECK). So we
  //    write a neutral redaction sentinel into the NOT-NULL-required guest fields
  //    rather than nulling them, mirroring the trigger's bookings branch.
  const { data: guestBookings, error: findErr } = await admin
    .from("bookings")
    .select("id")
    .ilike("guest_email", normalizedEmail);
  if (findErr) throw findErr;

  const bookingIds = (guestBookings ?? []).map((b: { id: string }) => b.id);

  let bookingsCleared = 0;
  if (bookingIds.length > 0) {
    const { error: bErr, count } = await admin
      .from("bookings")
      .update(
        {
          guest_name: "Deleted guest",
          guest_email: null,
          guest_phone: "[redacted]",
        },
        { count: "exact" },
      )
      .in("id", bookingIds);
    if (bErr) throw bErr;
    bookingsCleared = count ?? bookingIds.length;
    if (bookingsCleared > 0) tablesCleared.push("bookings");
  }

  // 2. BOOKING_DISPUTES — match by guest_email directly (a dispute carries its
  //    own guest_* snapshot) so we catch disputes even if the booking row's email
  //    was already cleared in a prior partial run. Null the PII + free-text
  //    customer_response / description; keep the case shell + amounts + Stripe
  //    refund id (the audit trail of a money movement is itself retained).
  const { data: guestDisputes, error: dFindErr } = await admin
    .from("booking_disputes")
    .select("id")
    .ilike("guest_email", normalizedEmail);
  if (dFindErr) throw dFindErr;

  const disputeIds = (guestDisputes ?? []).map((d: { id: string }) => d.id);

  let disputesCleared = 0;
  if (disputeIds.length > 0) {
    const { error: dErr, count } = await admin
      .from("booking_disputes")
      .update(
        {
          guest_name: null,
          guest_email: null,
          guest_phone: null,
          customer_response: null,
          description: null,
        },
        { count: "exact" },
      )
      .in("id", disputeIds);
    if (dErr) throw dErr;
    disputesCleared = count ?? disputeIds.length;
    if (disputesCleared > 0) tablesCleared.push("booking_disputes");
  }

  // 3. CASE_EVENTS — the only PII a case_event can carry is the free-text `note`.
  //    case_events link to disputes via dispute_id, so scrub the notes on every
  //    case_event belonging to this guest's disputes. Status/amount skeleton is
  //    kept for the audit timeline.
  let caseEventsCleared = 0;
  if (disputeIds.length > 0) {
    const { error: ceErr, count } = await admin
      .from("case_events")
      .update({ note: null }, { count: "exact" })
      .in("dispute_id", disputeIds)
      .not("note", "is", null);
    if (ceErr) throw ceErr;
    caseEventsCleared = count ?? 0;
    if (caseEventsCleared > 0) tablesCleared.push("case_events");
  }

  return {
    bookings: bookingsCleared,
    disputes: disputesCleared,
    caseEvents: caseEventsCleared,
    tablesCleared,
  };
}
