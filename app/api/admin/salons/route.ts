export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

// GET /api/admin/salons?status=pending|active|frozen
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("salons")
    .select("id, name, slug, address, categories, phone, cover_photo_url, is_active, registration_completed, approved_at, rejection_reason, created_at, owner_id")
    .order("created_at", { ascending: false });

  if (status === "pending") {
    // Pending = submitted but not yet reviewed. Deliberately keyed off the APPROVAL columns only.
    // This used to also require registration_completed=true, which made the queue permanently
    // empty: nothing in the onboarding path writes that column (it defaults to false and is only
    // set by app/api/admin/test-salon/route.ts). Measured live 2026-08-09 before the fix:
    // 0 rows matched the old filter while 6 salons genuinely had is_active=false AND
    // approved_at IS NULL, so every real signup was invisible to /dashboard/approvals.
    // The salons row is inserted once, by POST /api/salons at the END of onboarding, so
    // "row exists AND never approved" IS "waiting for review" (no half-built drafts land here).
    query = query.eq("is_active", false).is("approved_at", null);
  } else if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "frozen") {
    query = query.eq("is_active", false).not("approved_at", "is", null);
  }

  const { data: salons, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // trust-10: possible-duplicate signal, computed at READ time (never stored, always
  // fresh, needs no new column/migration). Never blocks approval, only surfaces on the
  // approval screen; salon_groups (legitimate multi-location chains) is exactly why this
  // stays a soft warning, not a hard reject. Phone match is exact (already normalized at
  // write time); address match is trimmed + case-insensitive since free-text address
  // strings vary in casing/whitespace, not in wording.
  const phones = [...new Set((salons ?? []).map((s) => s.phone).filter((p): p is string => !!p))];
  const addresses = [...new Set((salons ?? []).map((s) => s.address).filter((a): a is string => !!a))];

  // Phone is an exact-string match, expressible in one .in() call. Address is free
  // text (casing/whitespace vary, wording doesn't), so an exact .in() would miss real
  // duplicates; fetch all salons with a non-null address once and compare normalized
  // strings in memory. At ~28 salons total this is one extra query, not an N+1: fine
  // at this scale, revisit if the salon count grows an order of magnitude (same
  // trigger convention as the rest of this codebase's scale caveats).
  const [phoneMatchesRes, allWithAddressRes] = await Promise.all([
    phones.length
      ? admin.from("salons").select("id, name, phone").in("phone", phones)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; phone: string | null }> }),
    addresses.length
      ? admin.from("salons").select("id, name, address").not("address", "is", null)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string; address: string | null }> }),
  ]);
  const phoneMatches = phoneMatchesRes.data ?? [];
  const allWithAddress = allWithAddressRes.data ?? [];
  const normalizedAddresses = new Map(addresses.map((a) => [a, a.trim().toLowerCase()]));

  // Enrich with owner emails + the duplicate signal
  const enriched = await Promise.all((salons ?? []).map(async (salon) => {
    const { data: ownerAuth } = await admin.auth.admin.getUserById(salon.owner_id);

    const dupByPhone = salon.phone
      ? phoneMatches.find((m) => m.id !== salon.id && m.phone === salon.phone)
      : undefined;
    const normalizedSelf = salon.address ? normalizedAddresses.get(salon.address) : undefined;
    const dupByAddress = normalizedSelf
      ? allWithAddress.find((m) => m.id !== salon.id && m.address?.trim().toLowerCase() === normalizedSelf)
      : undefined;
    const duplicate = dupByPhone ?? dupByAddress;

    return {
      ...salon,
      owner_email: ownerAuth?.user?.email ?? null,
      possible_duplicate_of: duplicate ? { id: duplicate.id, name: duplicate.name } : null,
    };
  }));

  return NextResponse.json({ salons: enriched });
}
