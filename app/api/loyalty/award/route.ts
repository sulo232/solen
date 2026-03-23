export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { validateBody, loyaltyAwardSchema } from "@/lib/validations";

/**
 * POST /api/loyalty/award — Award a loyalty stamp after booking completion.
 * Called internally (e.g., from webhook or cron) with admin-level access.
 * Body: { booking_id: string, salon_id: string, customer_id: string }
 *
 * Also sends "Almost there" email when customer is 1 stamp away from reward.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret or internal call
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(loyaltyAwardSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { salon_id, customer_id } = validated;

  const supabase = createAdminSupabaseClient();

  // Find active loyalty card for this salon
  const { data: card } = await supabase
    .from("loyalty_cards")
    .select("id, stamps_needed, reward_text, salons(name)")
    .eq("salon_id", salon_id)
    .eq("is_active", true)
    .single();

  if (!card) {
    return NextResponse.json({ skipped: true, reason: "no_loyalty_card" });
  }

  // Count existing stamps
  const { count } = await supabase
    .from("loyalty_stamps")
    .select("id", { count: "exact", head: true })
    .eq("loyalty_card_id", card.id)
    .eq("customer_id", customer_id);

  const currentStamps = count ?? 0;

  // Don't exceed stamps_needed
  if (currentStamps >= card.stamps_needed) {
    return NextResponse.json({ skipped: true, reason: "card_complete" });
  }

  // Award stamp
  await supabase.from("loyalty_stamps").insert({
    loyalty_card_id: card.id,
    customer_id,
  });

  const newTotal = currentStamps + 1;

  // Check if customer is now at stamps_needed - 1 → send "almost there" email
  if (newTotal === card.stamps_needed - 1) {
    await sendAlmostThereEmail(supabase, customer_id, card, salon_id);
  }

  return NextResponse.json({ awarded: true, stamps: newTotal, total: card.stamps_needed });
}

async function sendAlmostThereEmail(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  customerId: string,
  card: { stamps_needed: number; reward_text: string; salons: any },
  salonId: string,
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return;

  // Check notification preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("rebooking_enabled")
    .eq("user_id", customerId)
    .single();

  if (prefs && prefs.rebooking_enabled === false) return;

  // Get customer email
  const { data: authUser } = await supabase.auth.admin.getUserById(customerId);
  const email = authUser?.user?.email;
  if (!email) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", customerId)
    .single();

  const salonName = card.salons?.name ?? "deinem Salon";
  const displayName = profile?.display_name ?? "";

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Solen <noreply@solen.ch>",
        to: email,
        subject: `⭐ Noch 1 Besuch bis zu deiner Belohnung bei ${salonName}!`,
        html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="font-family: Syne, sans-serif; color: #1A1209;">Fast geschafft!</h2>
            <p style="color: #666;">Hallo ${displayName},</p>
            <p style="color: #666;">Du hast <strong>${card.stamps_needed - 1} von ${card.stamps_needed}</strong> Stempel bei <strong>${salonName}</strong> gesammelt.</p>
            <p style="color: #666;">Noch <strong>1 Besuch</strong> und du bekommst: <em>${card.reward_text}</em></p>
            <a href="https://www.solen.ch/de/coiffeur"
              style="display: inline-block; background: #E8624A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Jetzt Termin buchen
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">— Dein Solen Team</p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[loyalty/award] Failed to send almost-there email:", err);
  }
}
