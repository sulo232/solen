// lib/bookings/recurring-generate.ts
//
// Shared generation logic for `recurring_booking_rules`, ported from the retired Supabase
// Edge Function `recurring-booking-processor`. Last live source read end to end at git sha
// bd67f9e43, path supabase/functions/recurring-booking-processor/index.ts (added 386361a45,
// deleted in the dead-code sweep 71d1c2522). That function ran daily, found active rules
// whose `next_booking_date` fell within the next 7 days, tried to auto-book a matching
// available slot, advanced `next_booking_date` by the rule's frequency either way, and
// emailed the customer (confirmation on success, a "couldn't book" notice on failure).
//
// `app/api/bookings/recurring/route.ts` (a separate slice, left untouched) owns RULE
// CREATION: it creates the rule and books the FIRST occurrence at signup time. This file
// owns ONGOING generation for existing rules and is called only from
// app/api/cron/recurring-bookings/route.ts.
//
// Every column read/written here (recurring_booking_rules.*, availability_slots.*,
// bookings.is_recurring/recurring_group_id/price_paid/is_first_visit, profiles.email/
// locale/is_first_visit_default, services.name_*/price) is confirmed present in the live
// column snapshot, _inventory/_db-columns.json.
//
// One deliberate improvement over the retired function: slot claiming goes through
// `claimSlot` (lib/bookings/claim-slot.ts), the shared compare-and-set helper every other
// booking-write path (create, reschedule, express-rebook) already uses and whose own doc
// comment names "recurring" as an intended caller. The retired function's slot flip was an
// unguarded `.update()` with no precondition, the same double-booking race `claimSlot` was
// written to close everywhere else; reusing it here closes it for this path too instead of
// reintroducing it. Owner email lookup uses `profiles.email/locale` (the batched pattern
// every other cron in this repo, e.g. app/api/cron/salon-onboarding/route.ts, already uses)
// instead of the retired function's `auth.admin.getUserById`, which does the same job.

import { claimSlot } from "@/lib/bookings/claim-slot";
import { sendEmail, recurringConfirmation, recurringFailed } from "@/lib/email";
import type { EmailLocale } from "@/lib/email";
import type { createAdminSupabaseClient } from "@/lib/supabase";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

function advanceDate(date: Date, frequency: string, customDays?: number | null): Date {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "biweekly") next.setDate(next.getDate() + 14);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else if (frequency === "custom") next.setDate(next.getDate() + (customDays ?? 7));
  return next;
}

export interface RecurringGenerateResult {
  processed: number;
  booked: number;
  failed: number;
  errors: string[];
}

export async function generateRecurringBookings(admin: AdminClient): Promise<RecurringGenerateResult> {
  const result: RecurringGenerateResult = { processed: 0, booked: 0, failed: 0, errors: [] };

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: rules, error: rulesError } = await admin
    .from("recurring_booking_rules")
    .select("id, user_id, salon_id, service_id, staff_member_id, frequency, custom_interval_days, next_booking_date")
    .eq("is_active", true)
    .lte("next_booking_date", sevenDaysFromNow);

  if (rulesError) {
    console.error("[recurring-generate] fetch rules failed:", rulesError.message);
    result.errors.push(`fetch rules: ${rulesError.message}`);
    return result;
  }
  if (!rules || rules.length === 0) return result;

  const salonIds = Array.from(new Set(rules.map((r) => r.salon_id)));
  const serviceIds = Array.from(new Set(rules.map((r) => r.service_id)));
  const userIds = Array.from(new Set(rules.map((r) => r.user_id)));

  const [{ data: salons }, { data: services }, { data: profiles }] = await Promise.all([
    admin.from("salons").select("id, name").in("id", salonIds),
    admin.from("services").select("id, name_de, name_en, name_fr, name_it, price").in("id", serviceIds),
    admin.from("profiles").select("id, email, locale, is_first_visit_default").in("id", userIds),
  ]);

  const salonById = new Map((salons ?? []).map((s) => [s.id, s]));
  const serviceById = new Map((services ?? []).map((s) => [s.id, s]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  for (const rule of rules) {
    result.processed++;
    const salon = salonById.get(rule.salon_id);
    const service = serviceById.get(rule.service_id);
    const profile = profileById.get(rule.user_id);
    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const serviceNames = service as unknown as Record<string, string> | undefined;
    const serviceName = serviceNames?.[`name_${locale}`] ?? serviceNames?.name_de ?? "Service";
    const salonName = salon?.name ?? "Salon";

    const targetDate = new Date(rule.next_booking_date + "T00:00:00Z");
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    let slotQuery = admin
      .from("availability_slots")
      .select("id, starts_at, ends_at, staff_member_id, price_override")
      .eq("salon_id", rule.salon_id)
      .eq("service_id", rule.service_id)
      .eq("status", "available")
      .gte("starts_at", dayStart.toISOString())
      .lte("starts_at", dayEnd.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1);
    if (rule.staff_member_id) {
      slotQuery = slotQuery.eq("staff_member_id", rule.staff_member_id);
    }

    const { data: slots, error: slotError } = await slotQuery;
    if (slotError) {
      console.error(`[recurring-generate] rule ${rule.id}: slot query failed:`, slotError.message);
      result.errors.push(`rule ${rule.id}: slot query failed: ${slotError.message}`);
      continue;
    }
    const slot = slots?.[0];
    let booked = false;

    if (slot) {
      // Create the booking first, then CAS-claim the slot (same order as every other
      // booking-write path, e.g. app/api/bookings/route.ts), rolling the booking back if the
      // claim loses the race.
      const { data: booking, error: bookingError } = await admin
        .from("bookings")
        .insert({
          user_id: rule.user_id,
          salon_id: rule.salon_id,
          service_id: rule.service_id,
          staff_member_id: rule.staff_member_id ?? slot.staff_member_id,
          slot_id: slot.id,
          starts_at: slot.starts_at,
          ends_at: slot.ends_at,
          price_paid: slot.price_override ?? service?.price ?? 0,
          status: "confirmed",
          is_first_visit: profile?.is_first_visit_default ?? false,
          is_recurring: true,
          recurring_group_id: rule.id,
        })
        .select("id")
        .single();

      if (bookingError || !booking) {
        result.failed++;
        console.error(`[recurring-generate] rule ${rule.id}: booking insert failed:`, bookingError?.message);
        result.errors.push(`rule ${rule.id}: booking insert failed: ${bookingError?.message ?? "unknown"}`);
      } else {
        const { claimed, error: claimError } = await claimSlot(admin, slot.id, {
          booked_by: rule.user_id,
          booking_id: booking.id,
        });
        if (!claimed) {
          // Lost the race for the slot between our read and the claim (or a genuine
          // conflict). Roll back the just-inserted booking so nothing is left unheld,
          // matching the rollback-on-lost-claim idiom used in app/api/bookings/route.ts.
          // Logged unconditionally (not just when claimError is set), matching the
          // unconditional console.error in app/api/bookings/route.ts:655 for the
          // identical "0 rows matched, no error object" lost-race shape.
          console.error(`[recurring-generate] rule ${rule.id}: slot claim failed:`, claimError?.message ?? "lost race (0 rows matched, no error)");
          await admin.from("bookings").delete().eq("id", booking.id);
          result.failed++;
          result.errors.push(`rule ${rule.id}: lost race claiming slot ${slot.id}`);
        } else {
          booked = true;
          result.booked++;

          const nextDate = advanceDate(targetDate, rule.frequency, rule.custom_interval_days);
          await admin.from("recurring_booking_rules")
            .update({ next_booking_date: nextDate.toISOString().split("T")[0] })
            .eq("id", rule.id);

          if (profile?.email) {
            try {
              await sendEmail(recurringConfirmation(
                profile.email,
                { frequency: rule.frequency, service: serviceName, salon: salonName },
                locale,
              ));
            } catch (err) {
              console.error(`[recurring-generate] rule ${rule.id}: confirmation email failed:`, err);
              result.errors.push(`rule ${rule.id}: confirmation email failed`);
            }
          }
        }
      }
    }

    if (!booked && !slot) {
      // No slot found at all (the retired function's other branch): notify the customer and
      // still advance next_booking_date so the series doesn't get stuck retrying a date with
      // no capacity forever, exactly as the retired function did.
      if (profile?.email) {
        try {
          await sendEmail(recurringFailed(
            profile.email,
            { service: serviceName, salon: salonName, date: rule.next_booking_date },
            locale,
          ));
        } catch (err) {
          console.error(`[recurring-generate] rule ${rule.id}: failure email failed:`, err);
          result.errors.push(`rule ${rule.id}: failure email failed`);
        }
      }

      const nextDate = advanceDate(targetDate, rule.frequency, rule.custom_interval_days);
      await admin.from("recurring_booking_rules")
        .update({ next_booking_date: nextDate.toISOString().split("T")[0] })
        .eq("id", rule.id);
    }
  }

  return result;
}
