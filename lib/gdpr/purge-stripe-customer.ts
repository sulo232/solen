import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

/**
 * GDPR/nFADP erasure completeness, Stripe half (privacy-compliance-06).
 *
 * WHY THIS EXISTS: anonymize-not-delete only satisfies "right to erasure" if
 * it reaches every place the PII was copied to. profiles.stripe_customer_id
 * points at a live Stripe Customer object (name, email, payment methods)
 * that is a separate copy of this user's PII, outside Solen's own database
 * entirely. Nothing in the erasure trigger or the deletion cron ever touched
 * it before this: `_docs/BACKEND.md` section 13's own Gotchas paragraph
 * named this as a known, undischarged gap.
 *
 * Stripe is itself a controller for its own records (payment/tax law
 * requires it to keep transaction records regardless of what Solen asks),
 * so this deletes the CUSTOMER object (name/email/payment-method PII).
 * Stripe retains the underlying Charge/PaymentIntent records under its own
 * retention obligation; deleting the Customer object is what actually
 * removes the PII Stripe holds on Solen's behalf, per Stripe's own account
 * deletion API contract.
 *
 * CALL ORDER: run this BEFORE admin.auth.admin.deleteUser(id), same
 * convention as purgeClientPhotoStorage / purgeReviewPhotoStorage, so a
 * failure here is visible while profiles.stripe_customer_id is still
 * readable (deleteUser() does not itself clear that column, but keeping the
 * ordering consistent avoids a second pattern to remember).
 *
 * Fails soft: a Stripe API error must never block or roll back the
 * Supabase-side erasure. Failures are returned for the caller to alert on,
 * same shape as purgeClientPhotoStorage / deletePostHogPerson.
 */
export type PurgeStripeCustomerResult = {
  /** Users who had a stripe_customer_id on file. */
  customersFound: number;
  /** Stripe customers actually deleted (0 if customersFound is 0, not an error). */
  deleted: number;
  /** Non-fatal: a failed lookup/deletion is reported here, never thrown. */
  errors: string[];
};

export async function purgeStripeCustomers(
  admin: SupabaseClient,
  userIds: string[],
): Promise<PurgeStripeCustomerResult> {
  const errors: string[] = [];
  if (userIds.length === 0) return { customersFound: 0, deleted: 0, errors };

  const { data: rows, error: fetchErr } = await admin
    .from("profiles")
    .select("id, stripe_customer_id")
    .in("id", userIds)
    .not("stripe_customer_id", "is", null);

  if (fetchErr) {
    errors.push(`profiles.stripe_customer_id lookup: ${fetchErr.message}`);
    return { customersFound: 0, deleted: 0, errors };
  }

  const customers = (rows ?? []).filter(
    (r): r is { id: string; stripe_customer_id: string } => !!r.stripe_customer_id,
  );
  if (customers.length === 0) return { customersFound: 0, deleted: 0, errors };

  let stripe;
  try {
    stripe = getStripe();
  } catch (e) {
    errors.push(`Stripe client init: ${e instanceof Error ? e.message : String(e)}`);
    return { customersFound: customers.length, deleted: 0, errors };
  }

  let deleted = 0;
  const results = await Promise.all(
    customers.map(async (c) => {
      try {
        await stripe.customers.del(c.stripe_customer_id);
        return { ok: true as const };
      } catch (e) {
        return { ok: false as const, error: e instanceof Error ? e.message : String(e), customerId: c.stripe_customer_id };
      }
    }),
  );
  for (const r of results) {
    if (r.ok) {
      deleted++;
    } else {
      // Stripe returns a 404-shaped error if the customer was already deleted
      // (e.g. a retried cron run); that is not a real failure, don't alert on it.
      if (!/no such customer/i.test(r.error)) {
        errors.push(`stripe.customers.del(${r.customerId}): ${r.error}`);
      } else {
        deleted++;
      }
    }
  }

  return { customersFound: customers.length, deleted, errors };
}
