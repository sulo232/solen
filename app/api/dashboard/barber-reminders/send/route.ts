export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, barberReminderSendSchema } from "@/lib/validations";
import { getServerEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email";
import { requireSalonAccess } from "@/lib/auth/require";

// POST /api/dashboard/barber-reminders/send: send a reminder to a client
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(barberReminderSendSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { client_id, salon_id } = validated;

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (marketing) instead of the old owner-only query
  // filter. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salon_id, "marketing");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  // Access is already verified above; this just fetches the `name` field the
  // gate doesn't carry, for the email below.
  const { data: salon } = await admin
    .from("salons").select("id, name").eq("id", salon_id).single();
  if (!salon) return NextResponse.json({ error: "Not your salon" }, { status: 403 });

  // Verify client_id has actually been a customer of THIS salon, otherwise any
  // registered user's UUID could be spammed with a reminder email + used to probe
  // whether a given UUID is a real account.
  const { data: hasBooked } = await admin
    .from("bookings")
    .select("id")
    .eq("salon_id", salon_id)
    .eq("user_id", client_id)
    .limit(1)
    .maybeSingle();
  if (!hasBooked) return NextResponse.json({ error: "Client not found for this salon" }, { status: 404 });

  // Get client email
  const { data: authUser } = await admin.auth.admin.getUserById(client_id);
  const email = authUser?.user?.email;
  if (!email) return NextResponse.json({ error: "Client email not found" }, { status: 404 });

  const { data: profile } = await admin
    .from("public_profiles")
    .select("display_name")
    .eq("id", client_id)
    .single();

  const resendApiKey = getServerEnv().RESEND_API_KEY;
  if (!resendApiKey) return NextResponse.json({ error: "Email not configured" }, { status: 500 });

  try {
    await sendEmail({
      from: "Solen <noreply@solen.ch>",
      to: email,
      subject: `Zeit für einen neuen Schnitt bei ${salon.name}!`,
      html: `
          <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="font-family: Syne, sans-serif; color: #1A1209;">Hey ${profile?.display_name ?? ""}!</h2>
            <p style="color: #666;">Es ist wieder Zeit für einen frischen Schnitt bei <strong>${salon.name}</strong>.</p>
            <a href="https://www.solen.ch/de/barbershop"
              style="display: inline-block; background: #C05038; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              Jetzt Termin buchen
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 24px;">Ihr Solen Team</p>
          </div>
        `,
      // The per-call 8s abort that used to sit here is gone because sendEmail carries its own
      // 5s timeout for every send, so the bound survives and is no longer per-caller.
    });
  } catch (err) {
    console.error("[barber-reminders/send] Failed:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }

  // Log that reminder was sent
  await admin.from("client_notes").insert({
    salon_id: salon.id,
    customer_id: client_id,
    note: "Erinnerung manuell gesendet",
    note_type: "system",
    created_by: user.id,
  });

  return NextResponse.json({ sent: true });
}
