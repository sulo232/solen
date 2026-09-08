import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";
import { requireSalonAccess } from "@/lib/auth/require";
import { validateBody, staffCreateSchema } from "@/lib/validations";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salon_id");
    if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

    // P9-2: requireSalonAccess composes the owner check with the staff
    // area-permission check (team = invite teammates + change their access)
    // instead of the old owner-or-admin compare. The owner path is
    // unchanged: same owner_id === user.id comparison, just made inside the
    // shared gate.
    const accessResult = await requireSalonAccess(salonId, "team");
    if (accessResult instanceof NextResponse) return accessResult;

    // Resource reads go through the admin client, scoped by the gated salonId:
    // staff_manage_owner (staff_members) and bookings_select_own (bookings) are
    // both owner-only RLS, so a "team"-granted staff caller (via: "staff") would
    // see empty results through the session-scoped client despite passing the
    // gate above.
    const admin = createAdminSupabaseClient();

    const { data, error } = await admin
      .from("staff_members")
      .select("id, name, avatar_url, specialties, languages, is_active, commission_rate, permissions, access_role")
      .eq("salon_id", salonId)
      .order("name");

    if (error) throw error;

    // Count each staff member's upcoming (non-cancelled) bookings so the
    // dashboard can warn before deleting someone with future appointments.
    const staffMembers = data ?? [];
    let futureCounts: Record<string, number> = {};
    if (staffMembers.length > 0) {
      const { data: upcoming, error: bookingsError } = await admin
        .from("bookings")
        .select("staff_member_id")
        .eq("salon_id", salonId)
        .gt("starts_at", new Date().toISOString())
        .not("status", "in", "(cancelled,no_show)");
      if (bookingsError) {
        console.error("[GET /api/staff] failed to count future bookings:", bookingsError);
      } else {
        futureCounts = (upcoming ?? []).reduce<Record<string, number>>((acc, b) => {
          if (b.staff_member_id) acc[b.staff_member_id] = (acc[b.staff_member_id] ?? 0) + 1;
          return acc;
        }, {});
      }
    }

    const staff = staffMembers.map((s) => ({ ...s, future_bookings: futureCounts[s.id] ?? 0 }));
    return NextResponse.json({ staff });
  } catch (err) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json({ error: "Internal Server Error", staff: [] }, { status: 500 });
  }
}

// POST /api/staff , Owner directly adds a staff member (no invitation).
// The StaffModal sends name, avatar_url, specialties, is_active, commission_rate,
// languages, instagram_url, years_experience, permissions, access_role.
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    const salon = await getActiveSalon<{ id: string }>(supabase, user.id, "id", "team");
    if (!salon) return NextResponse.json({ error: "No salon found for this owner" }, { status: 403 });

    const body = await request.json();
    const { data: validated, error: valError } = validateBody(staffCreateSchema, body);
    if (valError) return NextResponse.json({ error: valError.message }, { status: 400 });

    // Resource write goes through the admin client: staff_manage_owner RLS on
    // staff_members is owner-only, so a "team"-granted staff caller resolved
    // through getActiveSalon's staff fallback would 500 through the session
    // client. salon.id above is trusted (resolved server-side, never from body).
    const admin = createAdminSupabaseClient();
    const { data: staff, error } = await admin
      .from("staff_members")
      .insert({
        // salon_id always comes from getActiveSalon, never from the request body: the client
        // does send one, but trusting it would let any owner insert staff into another salon.
        salon_id: salon.id,
        name: validated.name,
        avatar_url: validated.avatar_url ?? null,
        specialties: validated.specialties ?? null,
        is_active: typeof validated.is_active === "boolean" ? validated.is_active : true,
        commission_rate: validated.commission_rate ?? null,
        languages: validated.languages ?? null,
        instagram_url: validated.instagram_url ?? null,
        years_experience: validated.years_experience ?? null,
        permissions: validated.permissions ?? null,
        access_role: validated.access_role ?? null,
      })
      .select("id, name, avatar_url, specialties, languages, is_active, commission_rate, instagram_url, years_experience, permissions, access_role")
      .single();

    if (error) {
      console.error("[POST /api/staff] insert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ staff });
  } catch (err) {
    console.error("POST /api/staff error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
