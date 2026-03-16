// Edge Function: recurring-booking-processor
// Scheduled: daily at 00:01 UTC
// Creates bookings for upcoming recurring rules

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "solen.ch <noreply@solen.ch>", to, subject, html }),
  });
}

function advanceDate(date: Date, frequency: string, customDays?: number): Date {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  else if (frequency === "biweekly") next.setDate(next.getDate() + 14);
  else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  else if (frequency === "custom") next.setDate(next.getDate() + (customDays ?? 7));
  return next;
}

// Scheduled: 1 minute past midnight UTC every day
Deno.cron("recurring-booking-processor", "1 0 * * *", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: rules } = await supabase
    .from("recurring_booking_rules")
    .select("*, salons(name), services(name_de, price)")
    .eq("is_active", true)
    .lte("next_booking_date", sevenDaysFromNow);

  if (!rules || rules.length === 0) return;

  for (const rule of rules) {
    const { data: customerAuth } = await supabase.auth.admin.getUserById(rule.user_id);
    const customerEmail = customerAuth?.user?.email;
    const salonName = (rule.salons as { name: string } | null)?.name ?? "Salon";
    const serviceName = (rule.services as { name_de: string } | null)?.name_de ?? "Service";
    const servicePrice = (rule.services as { price: number } | null)?.price ?? 0;

    // Find a matching available slot near the preferred day/time
    const targetDate = new Date(rule.next_booking_date + "T00:00:00Z");
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    let slotQuery = supabase
      .from("availability_slots")
      .select("*")
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

    const { data: slots } = await slotQuery;
    const slot = slots?.[0];

    if (slot) {
      // Get user profile for is_first_visit
      const { data: profile } = await supabase.from("profiles").select("is_first_visit_default").eq("id", rule.user_id).single();

      // Create booking
      const { data: booking } = await supabase
        .from("bookings")
        .insert({
          user_id: rule.user_id,
          salon_id: rule.salon_id,
          service_id: rule.service_id,
          staff_member_id: rule.staff_member_id ?? slot.staff_member_id,
          slot_id: slot.id,
          starts_at: slot.starts_at,
          ends_at: slot.ends_at,
          price_paid: slot.price_override ?? servicePrice,
          status: "confirmed",
          is_first_visit: profile?.is_first_visit_default ?? false,
          is_recurring: true,
          recurring_group_id: rule.id,
        })
        .select()
        .single();

      if (booking) {
        // Mark slot as booked
        await supabase.from("availability_slots")
          .update({ status: "booked", booked_by: rule.user_id, booking_id: booking.id })
          .eq("id", slot.id);

        // Advance next_booking_date
        const nextDate = advanceDate(targetDate, rule.frequency, rule.custom_interval_days ?? undefined);
        await supabase.from("recurring_booking_rules")
          .update({ next_booking_date: nextDate.toISOString().split("T")[0] })
          .eq("id", rule.id);

        // Send confirmation email
        if (customerEmail) {
          const dateStr = new Date(slot.starts_at).toLocaleDateString("de-CH");
          const timeStr = new Date(slot.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
          await sendEmail(customerEmail,
            `Buchungsbestätigung: ${serviceName} bei ${salonName}`,
            `<p>Ihre Serienbuchung für <strong>${serviceName}</strong> bei <strong>${salonName}</strong> am ${dateStr} um ${timeStr} Uhr ist bestätigt.</p>`
          );
        }
      }
    } else {
      // No slot found — notify customer
      if (customerEmail) {
        const dateStr = rule.next_booking_date;
        await sendEmail(customerEmail,
          `Serienbuchung nicht möglich: ${serviceName} am ${dateStr}`,
          `<p>Wir konnten Ihre Serienbuchung für <strong>${serviceName}</strong> bei <strong>${salonName}</strong> am ${dateStr} nicht automatisch erstellen. Der Zeitslot ist nicht verfügbar. Bitte buchen Sie manuell auf <a href="https://solen.ch">solen.ch</a>.</p>`
        );
      }

      // Still advance next_booking_date to avoid getting stuck
      const targetDate2 = new Date(rule.next_booking_date + "T00:00:00Z");
      const nextDate = advanceDate(targetDate2, rule.frequency, rule.custom_interval_days ?? undefined);
      await supabase.from("recurring_booking_rules")
        .update({ next_booking_date: nextDate.toISOString().split("T")[0] })
        .eq("id", rule.id);
    }
  }
});

Deno.serve(() => new Response(JSON.stringify({ ok: true, message: "Recurring booking processor active" }), {
  headers: { "Content-Type": "application/json" },
}));
