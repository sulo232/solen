export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, salonApproved } from "@/lib/email";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";

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

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name, owner_id").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const { error } = await admin.from("salons").update({
    is_active: true,
    approved_at: new Date().toISOString(),
    approved_by: user.id,
    rejection_reason: null,
    // Approve doubles as the REINSTATE path: there is no unfreeze route, and from
    // 2026-07-27 freeze sets is_active=false and go-live refuses while frozen_at is set,
    // so without clearing these a frozen salon could never come back at all.
    frozen_at: null,
    frozen_reason: null,
    rejected_at: null,
  }).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAuditEvent(req, user.id, "salon.approve", "salon", id, { salon_name: salon.name });

  // Send approval email to salon owner. The salon is already approved (DB write above
  // committed) so a send failure here must not 500 the endpoint or mask the approval.
  const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);
  if (ownerAuth?.user?.email) {
    try {
      // A9-email-locale (2026-07-27): the owner's own profile.locale, was defaulting to "de".
      const { data: ownerProfile } = await admin.from("profiles").select("locale").eq("id", salon.owner_id).maybeSingle();
      const ownerLocale = (ownerProfile?.locale as "de" | "en" | "fr" | "it") ?? "de";
      await sendEmail(salonApproved(ownerAuth.user.email, { salon: salon.name }, ownerLocale));
    } catch (err) {
      console.error("[admin/salons/approve] approval email failed:", err, { salonId: id });
    }
  }

  return NextResponse.json({ ok: true });
}
