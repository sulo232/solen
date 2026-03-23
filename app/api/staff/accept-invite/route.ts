export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { validateBody, staffAcceptInviteSchema } from "@/lib/validations";

// POST /api/staff/accept-invite — Accept staff invite via token
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(staffAcceptInviteSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { token } = validated;

  // If user is not logged in, redirect to signup with token
  if (!user) {
    return NextResponse.json({
      error: "not_authenticated",
      redirect: `/de/auth/login?invite_token=${token}&redirect=/de/staff/accept?token=${token}`,
    }, { status: 401 });
  }

  // Find the invite
  const { data: invite } = await supabase
    .from("staff_invites")
    .select("*")
    .eq("token", token)
    .eq("status", "pending")
    .single();

  if (!invite) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }

  // Check expiry
  if (new Date(invite.expires_at) < new Date()) {
    await supabase.from("staff_invites").update({ status: "expired" }).eq("id", invite.id);
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  // Check if email matches (optional — we allow any authenticated user to accept)
  // But warn if mismatch
  const emailMismatch = user.email !== invite.email;

  // Find or create staff_member record for this user at this salon
  const { data: existingStaff } = await supabase
    .from("staff_members")
    .select("id")
    .eq("salon_id", invite.salon_id)
    .eq("user_id", user.id)
    .single();

  let staffMemberId: string;

  if (existingStaff) {
    staffMemberId = existingStaff.id;
  } else {
    // Check if there's an unlinked staff member with matching name
    const { data: namedStaff } = invite.staff_name
      ? await supabase
          .from("staff_members")
          .select("id")
          .eq("salon_id", invite.salon_id)
          .eq("name", invite.staff_name)
          .is("user_id", null)
          .single()
      : { data: null };

    if (namedStaff) {
      // Link existing staff member to this user
      await supabase
        .from("staff_members")
        .update({ user_id: user.id })
        .eq("id", namedStaff.id);
      staffMemberId = namedStaff.id;
    } else {
      // Create new staff member
      const { data: newStaff, error: createErr } = await supabase
        .from("staff_members")
        .insert({
          salon_id: invite.salon_id,
          name: invite.staff_name ?? user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "Staff",
          user_id: user.id,
          is_active: true,
        })
        .select("id")
        .single();

      if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 });
      staffMemberId = newStaff.id;
    }
  }

  // Update profile with staff_salon_id
  await supabase
    .from("profiles")
    .update({ staff_salon_id: invite.salon_id })
    .eq("id", user.id);

  // Mark invite as accepted
  await supabase
    .from("staff_invites")
    .update({ status: "accepted", accepted_by: user.id })
    .eq("id", invite.id);

  return NextResponse.json({
    data: {
      staff_member_id: staffMemberId,
      salon_id: invite.salon_id,
      email_mismatch: emailMismatch,
    },
  });
}
