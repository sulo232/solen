export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireAuth, requireSalonAccess } from "@/lib/auth/require";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, staffUpdateSchema } from "@/lib/validations";
import type { Database } from "@/lib/database.types";

// PATCH /api/staff/[id]: update a staff member. This is the route that
// WRITES staff_members.permissions/access_role (the team screen's per-staff
// toggles), so the gate runs BEFORE any update, and via requireSalonAccess's
// "team" area (invite teammates + change their access) rather than the old
// owner-or-admin compare.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  // Verify the staff member exists and get salon_id + user_id (the latter to
  // detect a staff member editing their own row below).
  const { data: staff } = await admin.from("staff_members").select("id, salon_id, user_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  const access = await requireSalonAccess(staff.salon_id, "team", auth);
  if (access instanceof NextResponse) return access;
  const { user } = access;

  // A staff member must not be able to edit their own permissions row
  // through the team area unless the owner or admin: an active staff row
  // granted "team" reaches this gate ("via: staff"), but editing their OWN
  // row here would let them grant themselves more access than the owner set.
  if (access.via === "staff" && staff.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot edit your own access. Ask the salon owner.", code: "CANNOT_EDIT_OWN_ACCESS" },
      { status: 403 }
    );
  }

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json().catch(() => ({}));
  const { data: body, error: validationError } = validateBody(staffUpdateSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: 400 });
  }

  // Build update object from allowed fields. Phantom-column fix: staff_members has no
  // "bio_de"/"bio_en" columns, only a single non-localized "bio" (confirmed against the live
  // schema and lib/database.types.ts); no caller of this route currently sends either key, so
  // they are dropped from the allowlist rather than guessed at a mapping.
  const allowedFields = [
    "name", "avatar_url", "specialties", "is_active", "commission_rate",
    "languages", "instagram_url", "years_experience", "permissions", "access_role",
  ] as const;
  const update: Database["public"]["Tables"]["staff_members"]["Update"] = {};
  for (const key of allowedFields) {
    // body is now a validated staffUpdateSchema shape (was an untyped `any` before this
    // fix); the dynamic key assignment across the allowlist union is still safe since
    // every key here is one zod already checked the type of.
    if (key in body) (update as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { data: updated, error } = await admin.from("staff_members").update(update)
    .eq("id", id).eq("salon_id", staff.salon_id).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated?.length) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // Deactivating a staff member must close their already-generated future slots too, not
  // just stop new ones: the nightly generator already skips is_active:false staff
  // (app/api/cron/generate-slots/route.ts:34,78), so the gap was only the slots it had
  // already written before this PATCH. Reuses the exact status:'blocked' mechanism the
  // nightly capacity limiter and the walk-in chair block already use (generate-slots/
  // route.ts:292, walkin/queue/[id]/route.ts:156). block_reason is closed to
  // manual|capacity|vacation|system by a CHECK constraint (20260710114732_...sql:12);
  // 'system' is the value this codebase already uses for "we did this, not the owner, and
  // nothing reverts it automatically" (walkin/queue/[id]/route.ts:106-108), which is exactly
  // this case. 'vacation' is deliberately not used here: a future real vacation feature would
  // naturally add a revert-on-return handler keyed on that value, and that handler would then
  // wrongly reopen a deactivated stylist's slots too. Only currently bookable ('available')
  // rows are touched, so a slot that already carries a booking (status 'booked') is left
  // alone. Re-activating does not reopen these rows: the owner (or the generator, going
  // forward) re-establishes availability explicitly.
  //
  // cas-ok: this is a BULK status flip over a time window (every future slot for this
  // staff member), not a single-row claim, so there is no one row to re-assert with
  // .select().maybeSingle() (same shape as the walk-in chair block,
  // app/api/walkin/queue/[id]/route.ts:110). The `.eq("status","available")` precondition
  // still means a slot a customer claims in the same instant is simply skipped rather than
  // corrupted: claimSlot()'s own CAS (lib/bookings/claim-slot.ts) is the real race guard for
  // that booking, and losing this race just leaves one slot bookable a few seconds longer,
  // which is the state that existed before this fix at all.
  if ("is_active" in update && update.is_active === false) {
    const { error: closeError } = await admin
      .from("availability_slots")
      .update({ status: "blocked", block_reason: "system" })
      .eq("staff_member_id", id)
      .eq("salon_id", staff.salon_id)
      .eq("status", "available")
      .gte("starts_at", new Date().toISOString());
    if (closeError) {
      console.error("[staff PATCH] failed to close future slots for deactivated staff", id, closeError);
      return NextResponse.json({ error: "Staff deactivated, but closing availability failed", code: "SLOT_CLOSE_FAILED" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/staff/[id]: delete a staff member
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const admin = createAdminSupabaseClient();

  const { data: staff } = await admin.from("staff_members").select("id, salon_id, user_id").eq("id", id).single();
  if (!staff) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (team) instead of the old owner-or-admin compare,
  // gated after this row lookup with its derived salon_id.
  const access = await requireSalonAccess(staff.salon_id, "team", auth);
  if (access instanceof NextResponse) return access;
  const { user } = access;

  // Same self-guard as PATCH above: a staff member must not be able to delete
  // their own row through the team area, which would let them remove the very
  // access check that limits them.
  if (access.via === "staff" && staff.user_id === user.id) {
    return NextResponse.json(
      { error: "You cannot edit your own access. Ask the salon owner.", code: "CANNOT_EDIT_OWN_ACCESS" },
      { status: 403 }
    );
  }

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // Same close as PATCH is_active:false above, run BEFORE the hard delete: this staff row's
  // FK on availability_slots.staff_member_id is ON DELETE SET NULL
  // (supabase/migrations/20260530160000_calendar_crm_and_sales.sql:35), so a delete with no
  // slot close first would leave this person's future 'available' slots bookable with the
  // staff attribution simply erased, the same customer-facing bug this whole fix exists for.
  // block_reason 'system' matches the PATCH branch above (see its comment for why not
  // 'vacation'). cas-ok: same bulk-window reasoning as the PATCH branch above.
  const { error: closeError } = await admin
    .from("availability_slots")
    .update({ status: "blocked", block_reason: "system" })
    .eq("staff_member_id", id)
    .eq("salon_id", staff.salon_id)
    .eq("status", "available")
    .gte("starts_at", new Date().toISOString());
  if (closeError) {
    // The delete must NOT run on this path: ON DELETE SET NULL would then strip the staff
    // id from slots that are still 'available', which is exactly the bug this fix exists to
    // prevent. Fail the request instead, same shape as the staff_members update failure above.
    console.error("[staff DELETE] failed to close future slots before deleting staff", id, closeError);
    return NextResponse.json({ error: closeError.message }, { status: 500 });
  }

  const { data: deleted, error } = await admin.from("staff_members").delete()
    .eq("id", id).eq("salon_id", staff.salon_id).select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted?.length) return NextResponse.json({ error: "Staff not found" }, { status: 404 });

  // NO storage cleanup here on purpose (round-1 review finding, CHAIN B): staff_members
  // avatar_url and cover_photo_url are free-text z.string().url() fields with no dedicated
  // upload route writing them anywhere in this codebase, and measured on live data 0 of 70
  // staff rows carry a url pointing at our own storage at all. Round 1 added a
  // removeObjectForUrl() call here keyed only on bucket ("avatars"), not on an owner prefix,
  // which meant PATCH /api/staff/[id] (an unrestricted url field) plus this DELETE was a
  // working cross-user storage-delete primitive: set a staff member's avatar_url to a
  // stolen avatar url, delete the staff row, the victim's real avatar gets removed. Cleaning
  // up files that no code creates is not worth that. If a real staff-photo uploader ever
  // ships, add the cleanup back scoped to ITS bucket and prefix, not this one.
  return NextResponse.json({ ok: true });
}
