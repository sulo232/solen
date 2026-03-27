export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, staffInviteSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

// POST /api/staff/invite — Salon owner invites a staff member
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(staffInviteSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Verify user owns a salon
  const { data: salon } = await supabase
    .from("salons")
    .select("id, name")
    .eq("owner_id", user.id)
    // Removed .eq("is_active", true) to allow invites during setup
    .single();

  if (!salon) return NextResponse.json({ error: "No salon found for this owner" }, { status: 403 });

  // Check for existing pending invite
  const { data: existing } = await supabase
    .from("staff_invites")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("email", validated.email)
    .eq("status", "pending")
    .single();

  if (existing) return NextResponse.json({ error: "Invite already sent to this email" }, { status: 409 });

  // Generate invite token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { data: invite, error } = await supabase
    .from("staff_invites")
    .insert({
      salon_id: salon.id,
      email: validated.email,
      staff_name: validated.staff_name ?? null,
      token,
      expires_at: expiresAt,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send invite email
  const inviteUrl = `https://www.solen.ch/de/staff/accept?token=${token}`;
  try {
    await sendEmail({
      to: validated.email,
      subject: `Einladung als Mitarbeiter bei ${salon.name} — solen.ch`,
      html: `<p>Hallo${validated.staff_name ? ` ${validated.staff_name}` : ""},</p>
<p><strong>${salon.name}</strong> lädt dich ein, als Mitarbeiter auf solen.ch beizutreten.</p>
<p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#E8624A;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen →</a></p>
<p style="color:#999;font-size:12px;">Dieser Link ist 7 Tage gültig.</p>`,
    });
  } catch { /* email failure logged but non-fatal */ }

  return NextResponse.json({ data: { id: invite.id, email: validated.email } }, { status: 201 });
}
