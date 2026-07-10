export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, walkInSchema } from "@/lib/validations";
import { createCashWalkinTicket } from "@/lib/barber/walkin-ticket";
import { getActiveSalon } from "@/lib/active-salon";

// POST /api/bookings/walk-in — staff drop a CASH / in-person walk-in straight into the live
// queue (barber_walkin_queue). No online payment, no SMS: cash walk-ins pay at the counter.
// The customer-facing QR/link flow (/api/walkin/pay-intent → /walk-in-pay) covers online pay.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkInSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Salon-ownership check: the staff/owner adding must own the salon.
  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "No salon found" }, { status: 403 });

  // Service must belong to this salon.
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", validated.service_id)
    .eq("salon_id", salon.id)
    .single();
  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  // Optional preferred stylist must belong to this salon.
  let preferredBarberId: string | null = null;
  if (validated.staff_member_id) {
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("id")
      .eq("id", validated.staff_member_id)
      .eq("salon_id", salon.id)
      .single();
    if (!staffMember) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    preferredBarberId = staffMember.id;
  }

  // Drop into the SAME live queue the paid path feeds — admin client, RLS-exempt, cash entry.
  const admin = createAdminSupabaseClient();
  try {
    const result = await createCashWalkinTicket(admin, {
      salonId: salon.id,
      serviceId: validated.service_id,
      customerName: validated.customer_name ?? null,
      customerPhone: validated.customer_phone ?? null,
      preferredBarberId,
    });
    return NextResponse.json(
      { ticket_number: result.ticket_number, queue_id: result.queue_id, position: result.position },
      { status: 201 }
    );
  } catch (e) {
    console.error("[bookings/walk-in] cash queue entry failed:", e);
    return NextResponse.json({ error: "Could not add walk-in to queue" }, { status: 500 });
  }
}
