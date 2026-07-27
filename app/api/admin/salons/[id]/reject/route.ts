export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, salonRejected } from "@/lib/email";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminSalonRejectSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminSalonRejectSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { reason } = validated;

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name, owner_id").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const { error } = await admin.from("salons").update({
    is_active: false,
    rejection_reason: reason,
    // salons.rejected_at existed with no writer, so a rejection carried a reason but no
    // timestamp and "when was this rejected" was unanswerable. Paired with approved_at.
    rejected_at: new Date().toISOString(),
    // Clear the admin-approval marker so a deactivated salon must be RE-approved before
    // its owner can self-activate again via POST /api/salon/go-live (which gates on
    // approved_at). Without this, a once-approved salon keeps a stale approved_at and can
    // silently re-activate itself after an admin deactivation.
    approved_at: null,
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(req, user.id, "salon.reject", "salon", id, { salon_name: salon.name, reason });

  // Send rejection notification to salon owner
  const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);
  if (ownerAuth?.user?.email) {
    const { sendNotification } = await import("@/lib/notifications");
    // Localised to the OWNER's own language, not hardcoded German (council hardcode lens,
    // 2026-07-27). This is the message telling someone their business was rejected, which is
    // the worst possible one to deliver in a language they may not read. The sibling approve
    // route already reads profiles.locale for its email; this route now does the same, and
    // passes it to emailParams too, which it previously left unset (so the email defaulted).
    const { data: ownerProfile } = await admin
      .from("profiles").select("locale").eq("id", salon.owner_id).maybeSingle();
    const ownerLocale = (ownerProfile?.locale as "de" | "en" | "fr" | "it") ?? "de";
    const { getTranslations } = await import("next-intl/server");
    const t = await getTranslations({ locale: ownerLocale, namespace: "api.salonRejected" });
    await sendNotification({
      userId: salon.owner_id,
      type: "salon_rejected",
      title: t("title"),
      body: t("body", { salon: salon.name, reason }),
      data: { salon_id: id },
      emailParams: {
        to: ownerAuth.user.email,
        locale: ownerLocale,
        vars: { salon: salon.name, reason }
      }
    });
  }

  return NextResponse.json({ ok: true });
}
