export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { calculateVisitCycle } from "@/lib/barber/visit-cycle-algorithm";
import { sendSMS } from "@/lib/sms";

// Cron: Daily smart visit-cycle reminders for barbershop clients
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  let remindersCreated = 0;
  let smsSent = 0;

  // Get all active barbershops
  const { data: salons } = await admin
    .from("salons")
    .select("id, name")
    .eq("is_active", true)
    .contains("categories", ["barbershop"]);

  for (const salon of salons ?? []) {
    // Get unique customers with 3+ cuts
    const { data: customers } = await admin
      .from("barber_cut_history")
      .select("customer_id")
      .eq("salon_id", salon.id)
      .not("customer_id", "is", null);

    // Deduplicate customer IDs
    const uniqueCustomerIds = [...new Set((customers ?? []).map((c) => c.customer_id))];

    for (const customerId of uniqueCustomerIds) {
      if (!customerId) continue;

      // Get visit dates (most recent first)
      const { data: cuts } = await admin
        .from("barber_cut_history")
        .select("created_at")
        .eq("salon_id", salon.id)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!cuts || cuts.length < 3) continue;

      const visitDates = cuts.map((c) => new Date(c.created_at));
      const cycle = calculateVisitCycle(visitDates);

      if (cycle.confidence === "insufficient") continue;
      // Remind 2 days before due or when overdue
      if (cycle.daysOverdue < -2) continue;

      // Skip if client already has a future booking at this salon
      const { count: futureBookings } = await admin
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", salon.id)
        .eq("user_id", customerId)
        .in("status", ["confirmed", "pending"])
        .gt("starts_at", new Date().toISOString());

      if ((futureBookings ?? 0) > 0) continue;

      // Skip if reminder already exists for this cycle
      const { data: existingNote } = await admin
        .from("client_notes")
        .select("id")
        .eq("salon_id", salon.id)
        .eq("customer_id", customerId)
        .eq("note_type", "system")
        .ilike("note", "%cut_reminder%")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingNote) continue;

      // Get customer name
      const { data: profile } = await admin
        .from("profiles").select("display_name").eq("id", customerId).single();

      // Create reminder note
      const noteData = {
        type: "cut_reminder",
        avgCycleDays: cycle.avgCycleDays,
        daysOverdue: cycle.daysOverdue,
        confidence: cycle.confidence,
        customerName: profile?.display_name ?? "Kunde",
        customerId,
        salonName: salon.name,
      };

      await admin.from("client_notes").insert({
        salon_id: salon.id,
        customer_id: customerId,
        note: JSON.stringify(noteData),
        note_type: "system",
        created_by: null,
      });

      remindersCreated++;

      // Send SMS if customer has a phone number
      const { data: authUser } = await admin.auth.admin.getUserById(customerId);
      const phone = authUser?.user?.phone;
      if (phone) {
        const weeks = cycle.avgCycleDays ? Math.round(cycle.avgCycleDays / 7) : 3;
        const ok = await sendSMS(
          phone,
          `Hey ${profile?.display_name ?? ""}, dein letzter Besuch bei ${salon.name} war vor ${weeks} Wochen. Buch deinen nächsten Termin: https://www.solen.ch/de/barbershop`
        );
        if (ok) smsSent++;
      }
    }
  }

  return NextResponse.json({ remindersCreated, smsSent });
}
