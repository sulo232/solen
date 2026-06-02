export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinJoinSchema } from "@/lib/validations";
import { joinWalkinQueue } from "@/lib/walkin/join";

// POST /api/walkin/queue/remote-join — Public: join queue remotely
export async function POST(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkinJoinSchema, {
    ...body,
    join_method: "remote",
  });
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  // Walk-in must be enabled + not paused (Phase 2 de-gate: was barbershop-only).
  const { data: salon } = await admin
    .from("salons").select("id, walkin_enabled, walkin_paused").eq("id", validated.salon_id).single();
  if (!(salon as any)?.walkin_enabled) {
    return NextResponse.json({ error: "Walk-in is not enabled for this salon" }, { status: 403 });
  }
  if ((salon as any).walkin_paused) {
    return NextResponse.json({ error: "This shop has paused new walk-ins right now" }, { status: 409 });
  }

  // Race-safe insert via the shared helper.
  const result = await joinWalkinQueue(admin, {
    salonId: validated.salon_id,
    customerName: validated.customer_name,
    customerPhone: validated.customer_phone ?? null,
    serviceId: validated.service_id ?? null,
    preferredBarberId: validated.preferred_barber_id ?? null,
    joinMethod: "remote",
  });
  if (!result) {
    return NextResponse.json({ error: "Could not join the queue, please try again" }, { status: 503 });
  }

  return NextResponse.json({
    entry: result.entry,
    trackingToken: result.trackingToken,
    position: result.position,
    estimatedWait: result.estimatedWait,
    trackingUrl: `/queue/${result.trackingToken}`,
  });
}
