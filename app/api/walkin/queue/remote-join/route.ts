export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinJoinSchema } from "@/lib/validations";
import { nanoid } from "nanoid";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

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

  const { data: salon } = await admin
    .from("salons").select("id, categories").eq("id", validated.salon_id).single();
  if (!salon?.categories?.includes("barbershop")) {
    return NextResponse.json({ error: "Not a barbershop" }, { status: 403 });
  }

  const { data: lastEntry } = await admin
    .from("barber_walkin_queue")
    .select("position")
    .eq("salon_id", validated.salon_id)
    .in("status", ["waiting", "in_chair"])
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = (lastEntry?.position ?? 0) + 1;
  const trackingToken = nanoid(12);

  const { data: activeStaff } = await admin
    .from("staff_members").select("id")
    .eq("salon_id", validated.salon_id).eq("is_active", true);

  const estimatedWait = estimateWaitMinutes(position - 1, 30, activeStaff?.length ?? 1);

  const { data: entry, error } = await admin
    .from("barber_walkin_queue")
    .insert({
      salon_id: validated.salon_id,
      customer_name: validated.customer_name,
      customer_phone: validated.customer_phone ?? null,
      service_id: validated.service_id ?? null,
      preferred_barber_id: validated.preferred_barber_id ?? null,
      position,
      estimated_wait_minutes: estimatedWait,
      tracking_token: trackingToken,
      join_method: "remote",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    entry,
    trackingToken,
    position,
    estimatedWait,
    trackingUrl: `/queue/${trackingToken}`,
  });
}
