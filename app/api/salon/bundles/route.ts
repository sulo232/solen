export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// exists-check: net-new vs app/api/salon/retail/route.ts because `npm run exists bundles`
// found NO bundles API endpoint (only the service_bundles table + /dev mockup). This
// mirrors the retail GET public-read shape ({ bundles: [...] }) for the new PDP section.
//
// B-2 (2026-07-03): owner-authed CREATE/UPDATE/DELETE added alongside the existing public
// GET, mirroring the auth pattern in app/api/salon/retail/route.ts (session user ->
// checkUserBanned -> rate limit -> getActiveSalon for the caller's own salon_id, admin
// client for the write so RLS is not the only gate, the >=2-items DB trigger is the
// backstop). service_ids ownership + the >=2-items gate are enforced server-side BEFORE
// activation so a bad request 400s with a clean code instead of a raw Postgres trigger error.
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, serviceBundleSchema } from "@/lib/validations";
import { getActiveSalon } from "@/lib/active-salon";
import { computeBundlePriceChf } from "@/lib/pricing/bundle";
import type { Database } from "@/lib/database.types";

// save_service_bundle's generated Args type marks p_bundle_id/p_custom_price/p_percent_off as
// required non-null (string/number), but the actual Postgres function declares them nullable with
// DEFAULT NULL (the generator doesn't reflect nullable RPC arg defaults); the RPC genuinely needs
// null for "create" / the inactive pricing mode, so callers assert against the real, wider shape.
type SaveServiceBundleArgs = Omit<
  Database["public"]["Functions"]["save_service_bundle"]["Args"],
  "p_bundle_id" | "p_custom_price" | "p_percent_off"
> & {
  p_bundle_id: string | null;
  p_custom_price: number | null;
  p_percent_off: number | null;
};

// Shared bundle-assembly: given any Supabase client (anon/session client -> RLS gates
// visibility to active+marketplace-visible; admin client -> the caller must already be
// authorized to see everything, see the ?mine=true branch below) and a salon_id, loads
// the bundles + items + services and returns them in the { bundles: [...] } shape both
// the public GET and the owner ?mine=true branch share. Price is computed AT READ from
// the live services.price (CHF decimal), never denormalized (A5 FIX-2 shared util).
async function assembleBundles(
  client: SupabaseClient,
  salonId: string,
  opts: { activeOnly: boolean },
): Promise<{ bundles?: unknown[]; error?: string }> {
  let bundleQuery = client
    .from("service_bundles")
    .select("id, name, pricing_mode, custom_price, percent_off, sort_order, is_active")
    .eq("salon_id", salonId)
    .order("sort_order", { ascending: true });
  if (opts.activeOnly) bundleQuery = bundleQuery.eq("is_active", true);

  const { data: bundles, error: bundlesError } = await bundleQuery;
  if (bundlesError) {
    console.error("[api/salon/bundles] bundles query failed:", bundlesError.message);
    return { error: bundlesError.message };
  }
  if (!bundles?.length) return { bundles: [] };

  // Items for these bundles (child RLS joins through the visible parent bundle for the
  // anon client; the admin client bypasses RLS entirely and is already scoped by salonId).
  const bundleIds = bundles.map((b) => b.id);
  const { data: items, error: itemsError } = await client
    .from("service_bundle_items")
    .select("bundle_id, service_id, sort_order")
    .in("bundle_id", bundleIds)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error("[api/salon/bundles] items query failed:", itemsError.message);
    return { error: itemsError.message };
  }

  // Live service rows for name + duration + price (CHF decimal).
  const serviceIds = [...new Set((items ?? []).map((i) => i.service_id))];
  const { data: services, error: servicesError } = serviceIds.length
    ? await client
        .from("services")
        .select("id, name_de, name_en, price, duration_minutes")
        .in("id", serviceIds)
    : { data: [], error: null };

  if (servicesError) {
    console.error("[api/salon/bundles] services query failed:", servicesError.message);
    return { error: servicesError.message };
  }

  const svcById = new Map((services ?? []).map((s) => [s.id, s]));

  // Assemble each bundle with its ordered services + the computed prices.
  const assembled = bundles
    .map((b) => {
      const bundleServices = (items ?? [])
        .filter((i) => i.bundle_id === b.id)
        .map((i) => svcById.get(i.service_id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .map((s) => ({
          id: s.id,
          name_de: s.name_de,
          name_en: s.name_en,
          price: Number(s.price),
          duration_minutes: s.duration_minutes,
        }));

      // The >=2-items RPC guard gates activation, but defend at read too: a bundle
      // that resolved to <2 live services is never a bookable 0/1-item. The owner
      // ?mine=true list still needs to SEE such a bundle (it's manageable/editable
      // even mid-edit), so only drop it from the PUBLIC (activeOnly) read.
      if (bundleServices.length < 2 && opts.activeOnly) return null;

      const sumPrice = bundleServices.reduce((acc, s) => acc + s.price, 0);
      const bundlePrice = computeBundlePriceChf(b.pricing_mode, sumPrice, {
        customPrice: b.custom_price,
        percentOff: b.percent_off,
      });

      return {
        id: b.id,
        name: b.name,
        pricing_mode: b.pricing_mode,
        percent_off: b.percent_off,
        is_active: b.is_active,
        services: bundleServices,
        sum_price: sumPrice,
        bundle_price: bundlePrice,
      };
    })
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  return { bundles: assembled };
}

// GET /api/salon/bundles?salon_id=xxx , Public: list ACTIVE service bundles for a salon.
// GET /api/salon/bundles?salon_id=xxx&mine=true , Owner-authed: list ALL bundles for the
// caller's OWN salon regardless of is_active (draft/inactive bundles included), so the
// dashboard list never loses a bundle the owner just saved with Active off (B-2 council
// FIX-3). The ?mine=true branch REQUIRES auth and salon ownership; an unauthenticated or
// non-owner caller silently falls back to the public active-only read (never leaks extra
// rows to anyone but the salon's own owner).
//
// A5 Phase B-3. The public path uses the anon/session server client so the Postgres RLS
// on service_bundles + service_bundle_items does the visibility gating (active bundle AND
// marketplace-visible salon, see migration 20260703090001_service_bundles_a5.sql). We do
// NOT use the admin client there: the RLS marketplace-visibility predicate is the security
// boundary a hidden or test salon relies on, and the admin client would bypass it.
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const salonId = url.searchParams.get("salon_id");
  const wantsMine = url.searchParams.get("mine") === "true";
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();

  if (wantsMine) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminSupabaseClient();
      const salon = await getActiveSalon<{ id: string }>(admin, user.id, "id", "catalog");
      // Owner branch only serves the caller's OWN active salon , a mismatched
      // salon_id (someone else's) silently falls through to the public read below.
      if (salon && salon.id === salonId) {
        const result = await assembleBundles(admin, salonId, { activeOnly: false });
        if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
        return NextResponse.json({ bundles: result.bundles });
      }
    }
  }

  const result = await assembleBundles(supabase, salonId, { activeOnly: true });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ bundles: result.bundles });
}

// -- shared owner-auth resolution (session, ban check, rate limit, active salon) --
async function resolveOwnerSalon(userId: string) {
  const admin = createAdminSupabaseClient();
  const salon = await getActiveSalon<{ id: string }>(admin, userId, "id", "catalog");
  return { admin, salon };
}

// Validates the pricing_mode / value pairing the DB CHECK constraints also enforce, so a
// bad combo 400s with a clean machine code instead of a raw Postgres constraint error.
function pricingModeError(
  mode: "sum" | "custom" | "percent",
  customPrice: number | undefined,
  percentOff: number | undefined,
): NextResponse | null {
  if (mode === "custom" && (customPrice === undefined || customPrice === null)) {
    return NextResponse.json(
      { message: "custom_price is required for pricing_mode custom", code: "BUNDLE_PRICING_MISMATCH" },
      { status: 400 },
    );
  }
  if (mode === "percent" && (percentOff === undefined || percentOff === null)) {
    return NextResponse.json(
      { message: "percent_off (1-99) is required for pricing_mode percent", code: "BUNDLE_PRICING_MISMATCH" },
      { status: 400 },
    );
  }
  return null;
}

// B-2 council FIX-1 (2026-07-03): maps the RAISEd machine code from
// public.save_service_bundle (see supabase/migrations/20260703120000_save_service_bundle_rpc_a5.sql)
// to the route's existing { message, code } 400/404 convention. The RPC does the whole
// create/update (ownership + >=2 services owned+active + pricing pairing + item swap +
// activate) in ONE transaction, so a failed insert can never orphan a live bundle with 0
// items , the non-atomic insert/delete/update sequence this replaced could.
const BUNDLE_RPC_ERROR_STATUS: Record<string, number> = {
  BUNDLE_MIN_ITEMS: 400,
  BUNDLE_SERVICE_INVALID: 400,
  BUNDLE_PRICING_MISMATCH: 400,
  BUNDLE_NOT_FOUND: 404,
};

function bundleRpcErrorResponse(message: string | undefined): NextResponse {
  const code = message && BUNDLE_RPC_ERROR_STATUS[message] ? message : null;
  if (code) {
    return NextResponse.json({ message: code, code }, { status: BUNDLE_RPC_ERROR_STATUS[code] });
  }
  console.error("[api/salon/bundles] save_service_bundle rpc failed:", message);
  return NextResponse.json({ error: message ?? "save failed" }, { status: 500 });
}

// POST /api/salon/bundles - Owner-authed: create a bundle + its items via the atomic
// save_service_bundle RPC (p_bundle_id null = create). The RPC owns the whole
// create-inactive -> insert items -> activate sequence in ONE transaction.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: valError } = validateBody(serviceBundleSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const pricingErr = pricingModeError(validated.pricing_mode, validated.custom_price, validated.percent_off);
  if (pricingErr) return pricingErr;

  const { admin, salon } = await resolveOwnerSalon(user.id);
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const createArgs: SaveServiceBundleArgs = {
    p_salon_id: salon.id,
    p_bundle_id: null,
    p_name: validated.name,
    p_pricing_mode: validated.pricing_mode,
    p_custom_price: validated.pricing_mode === "custom" ? validated.custom_price ?? null : null,
    p_percent_off: validated.pricing_mode === "percent" ? validated.percent_off ?? null : null,
    p_is_active: validated.is_active === true,
    p_service_ids: [...new Set(validated.service_ids)],
  };
  const { data: bundleId, error: rpcError } = await admin.rpc(
    "save_service_bundle",
    createArgs as Database["public"]["Functions"]["save_service_bundle"]["Args"],
  );

  if (rpcError || !bundleId) return bundleRpcErrorResponse(rpcError?.message);

  const { data: bundle, error: fetchError } = await admin
    .from("service_bundles")
    .select()
    .eq("id", bundleId)
    .single();
  if (fetchError || !bundle) {
    console.error("[api/salon/bundles] post-create fetch failed:", fetchError?.message);
    return NextResponse.json({ error: fetchError?.message ?? "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ bundle }, { status: 201 });
}

// PATCH /api/salon/bundles - Owner-authed: update name/services/mode/value/active via
// the atomic save_service_bundle RPC (p_bundle_id set = update). The RPC verifies the
// bundle belongs to p_salon_id itself (BUNDLE_NOT_FOUND otherwise) and replaces the
// item set in the SAME transaction as the row update, so a swap can never leave the
// bundle mid-swap (the prior deactivate -> delete-items -> insert-items -> update
// sequence could orphan it on a failure between steps).
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const bundleId = body.id as string | undefined;
  if (!bundleId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: validated, error: valError } = validateBody(serviceBundleSchema, body);
  if (valError) return NextResponse.json({ message: valError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const pricingErr = pricingModeError(validated.pricing_mode, validated.custom_price, validated.percent_off);
  if (pricingErr) return pricingErr;

  const { admin, salon } = await resolveOwnerSalon(user.id);
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updateArgs: SaveServiceBundleArgs = {
    p_salon_id: salon.id,
    p_bundle_id: bundleId,
    p_name: validated.name,
    p_pricing_mode: validated.pricing_mode,
    p_custom_price: validated.pricing_mode === "custom" ? validated.custom_price ?? null : null,
    p_percent_off: validated.pricing_mode === "percent" ? validated.percent_off ?? null : null,
    p_is_active: validated.is_active === true,
    p_service_ids: [...new Set(validated.service_ids)],
  };
  const { data: savedId, error: rpcError } = await admin.rpc(
    "save_service_bundle",
    updateArgs as Database["public"]["Functions"]["save_service_bundle"]["Args"],
  );

  if (rpcError || !savedId) return bundleRpcErrorResponse(rpcError?.message);

  const { data: updated, error: fetchError } = await admin
    .from("service_bundles")
    .select()
    .eq("id", savedId)
    .single();
  if (fetchError || !updated) {
    console.error("[api/salon/bundles] post-update fetch failed:", fetchError?.message);
    return NextResponse.json({ error: fetchError?.message ?? "fetch failed" }, { status: 500 });
  }

  return NextResponse.json({ bundle: updated });
}

// DELETE /api/salon/bundles?id=xxx - Owner-authed: remove a bundle (items cascade via FK).
//
// B-2 council FIX-2 (2026-07-03): added checkUserBanned + applyRateLimit in the same
// position as POST/PATCH (right after resolving the session user, before the admin
// write) , this verb was previously missing both.
export async function DELETE(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const bundleId = new URL(req.url).searchParams.get("id");
  if (!bundleId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { admin, salon } = await resolveOwnerSalon(user.id);
  if (!salon) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: existing } = await admin
    .from("service_bundles")
    .select("id, salon_id")
    .eq("id", bundleId)
    .maybeSingle();
  if (!existing || existing.salon_id !== salon.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await admin.from("service_bundles").delete().eq("id", bundleId);
  if (error) {
    console.error("[api/salon/bundles] delete failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
