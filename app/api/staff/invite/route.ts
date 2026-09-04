export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, staffInviteSchema } from "@/lib/validations";
import { sendEmail, staffInviteEmail, type EmailLocale } from "@/lib/email";
import { getActiveSalon } from "@/lib/active-salon";
import crypto from "crypto";

// GET /api/staff/invite — List pending invites for the owner's active salon
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id");
  if (!salon) return NextResponse.json({ error: "No salon found for this owner" }, { status: 403 });

  const { data, error } = await supabase
    .from("staff_invites")
    .select("id, email, name:staff_name, status, created_at")
    .eq("salon_id", salon.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[StaffInvite] Failed to list pending invites:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data ?? [] });
}

// POST /api/staff/invite — Salon owner invites a staff member
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(staffInviteSchema, body);
  if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

  // Verify user owns a salon
  const salon = await getActiveSalon<{ id: string; name: string }>(supabase, user.id, "id, name");

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
      access_role: validated.access_role ?? null,
      permissions: validated.permissions ?? {},
      token,
      expires_at: expiresAt,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Send invite email.
  // A9-email-locale (2026-07-27): an invited staff member has no profile yet, so the salon
  // owner's own profile.locale (the salon's working language) resolves the invite + the
  // link's locale prefix, replacing a hardcoded German subject/body + /de/ link. The
  // token-in-query-string transport itself is pre-existing and unchanged (out of scope here).
  const { data: ownerProfile } = await supabase.from("profiles").select("locale").eq("id", user.id).maybeSingle();
  const inviteLocale = (ownerProfile?.locale as EmailLocale) ?? "de";
  const inviteUrl = `https://www.solen.ch/${inviteLocale}/staff-invite?token=${token}`;
  try {
    await sendEmail(staffInviteEmail(
      validated.email,
      { salonName: salon.name, staffName: validated.staff_name, inviteUrl },
      inviteLocale
    ));
  } catch (err) { console.error("[staff/invite] invite email failed:", err); }

  return NextResponse.json({ data: { id: invite.id, email: validated.email } }, { status: 201 });
}
