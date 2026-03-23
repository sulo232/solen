export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, walkinUpdateSchema } from "@/lib/validations";

// PATCH /api/walkin/queue/[id] — Salon owner/staff: update queue entry status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(walkinUpdateSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { id } = await params;
  const admin = createAdminSupabaseClient();

  // Get the queue entry
  const { data: entry } = await admin
    .from("barber_walkin_queue").select("*").eq("id", id).single();
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify salon ownership or staff
  const { data: salon } = await admin
    .from("salons").select("owner_id").eq("id", entry.salon_id).single();
  const { data: staffMember } = await admin
    .from("staff_members").select("id").eq("salon_id", entry.salon_id)
    .eq("id", user.id).maybeSingle();
  if (salon?.owner_id !== user.id && !staffMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Build update object
  const update: Record<string, any> = { status: validated.status };
  if (validated.assigned_barber_id) update.assigned_barber_id = validated.assigned_barber_id;

  if (validated.status === "in_chair") {
    update.called_at = new Date().toISOString();
    update.started_at = new Date().toISOString();
  } else if (validated.status === "completed" || validated.status === "no_show" || validated.status === "cancelled") {
    update.completed_at = new Date().toISOString();
  }

  const { data: updated, error } = await admin
    .from("barber_walkin_queue").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate positions for remaining waiting entries
  if (["completed", "no_show", "cancelled"].includes(validated.status)) {
    const { data: remaining } = await admin
      .from("barber_walkin_queue")
      .select("id")
      .eq("salon_id", entry.salon_id)
      .eq("status", "waiting")
      .order("position", { ascending: true });

    if (remaining) {
      for (let i = 0; i < remaining.length; i++) {
        await admin
          .from("barber_walkin_queue")
          .update({ position: i + 1 })
          .eq("id", remaining[i].id);
      }
    }
  }

  return NextResponse.json({ entry: updated });
}

// DELETE /api/walkin/queue/[id]?token=... — Public: client cancels own entry by tracking token
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

  const admin = createAdminSupabaseClient();

  const { data: entry } = await admin
    .from("barber_walkin_queue").select("id, tracking_token, status")
    .eq("id", id).single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.tracking_token !== token) return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  if (entry.status !== "waiting") return NextResponse.json({ error: "Cannot cancel — already in progress" }, { status: 400 });

  const { error } = await admin
    .from("barber_walkin_queue")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
