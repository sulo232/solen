export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, staffInviteSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { getActiveSalon } from "@/lib/active-salon";
import crypto from "crypto";

// Escapes values interpolated into the invite email HTML (staff_name / salon name are
// caller-controlled or owner-set, sent from the trusted noreply@solen.ch address to any
// address the caller supplies).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// GET /api/staff/invite — List pending invites for the owner's active salon
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
      html: `<p>Hallo${validated.staff_name ? ` ${escapeHtml(validated.staff_name)}` : ""},</p>
<p><strong>${escapeHtml(salon.name)}</strong> lädt dich ein, als Mitarbeiter auf solen.ch beizutreten.</p>
<p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#C05038;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Einladung annehmen →</a></p>
<p style="color:#999;font-size:12px;">Dieser Link ist 7 Tage gültig.</p>`,
    });
  } catch { /* email failure logged but non-fatal */ }

  return NextResponse.json({ data: { id: invite.id, email: validated.email } }, { status: 201 });
}
