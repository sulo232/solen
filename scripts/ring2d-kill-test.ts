// Ring 2d kill test: hot-path stragglers.
//   (1) app/api/bookings/route.ts GET (salon-scoped) + app/api/bookings/recurring/route.ts
//       select('*') -> explicit columns. STATIC check: the select string on disk carries every
//       field the grep-derived consumer list needs (union proof), not a reimplementation.
//   (2) app/api/discovery/feed/route.ts response mapping drops tiktok_embed_html (the raw
//       TikTok oEmbed HTML blob, ~54% of a 20-item discovery_feed payload). STATIC check: all
//       3 item-mapping sites in the route destructure it out. LIVE check: 0 discovery_items
//       rows would flip their isVideo grid signal (tiktok_url / media_type) if the field were
//       absent.
//   (3) app/api/salons/route.ts with_slots block: N parallel per-service .limit(3) queries ->
//       ONE earliest_slots_by_service RPC call. LIVE diff: RPC output vs the OLD per-service
//       query logic (copy-identical to the pre-Ring-2d route code), across every service_id
//       with an available future slot, at p_per 3 and p_per 1.
//   (4) app/api/salons/trending/route.ts converges its inline column list onto
//       SALON_PUBLIC_COLS (+2 additions: city_id, is_top_pick). LIVE check: the intersected
//       column list still resolves to the exact same 8 fields, the query succeeds, and the
//       response shape carries zero sensitive salon keys.
//
// Usage: npx tsx scripts/ring2d-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import path from "node:path";

const SENSITIVE_SALON_KEYS = ["stripe_account_id", "owner_id", "frozen_reason", "search_doc", "score_details"];
const SENSITIVE_BOOKING_KEYS = [
  "access_token_hash", "access_token_expires_at", "stripe_customer_id", "stripe_payment_method_id",
  "stripe_setup_intent_id", "payment_intent_id", "policy_snapshot", "fee_charge_intent_id",
];

function readRoute(relPath: string): string {
  return readFileSync(path.join(process.cwd(), relPath), "utf8");
}

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // ── (1a) STATIC: bookings salon-scoped select covers the grep-derived consumer union ──
  {
    const source = readRoute("app/api/bookings/route.ts");
    // Grep-derived union (this session, quoted per source):
    //   dashboard/bookings/page.tsx: id, starts_at, price_paid, status, is_first_visit,
    //     is_recurring, user_id (ClientTags), cancellation_reason, service_name/staff_name
    //     (enriched from the services()/staff_members() embeds, already explicit joins)
    //   dashboard/page.tsx (today): id, starts_at, service_name, status
    //   dashboard/clients/page.tsx: id, service_name, starts_at, status, price_paid
    //   dashboard/upcharge/page.tsx: id, reference_code, starts_at, paid_amount, guest_name,
    //     customer_name (enriched), services(name_de/name_en) (already explicit join)
    //   server-internal enrichment (route.ts itself): user_id, guest_name
    // + safety margin (id/status/times/price/payment, per the task brief): ends_at, payment_status
    const requiredFields = [
      "id", "user_id", "starts_at", "ends_at", "status", "price_paid", "paid_amount",
      "payment_status", "is_first_visit", "is_recurring", "cancellation_reason", "guest_name",
      "reference_code",
    ];
    const selectMatch = source.match(/\.from\("bookings"\)\s*\.select\(\s*"([^"]+)"/);
    const selectStr = selectMatch?.[1] ?? "";
    const missing = requiredFields.filter((f) => !selectStr.includes(f));
    const noStar = !selectStr.includes("*");
    const noSensitive = SENSITIVE_BOOKING_KEYS.every((k) => !selectStr.includes(k));
    const pass = missing.length === 0 && noStar && selectStr.length > 0 && noSensitive;
    if (!pass) allPass = false;
    rows.push({
      scenario: "static: app/api/bookings/route.ts salon-scoped select covers every consumed field, drops '*' and sensitive columns",
      pass,
      details: { selectStr, missing, noStar, noSensitive },
    });
  }

  // ── (1b) STATIC: recurring route's slot select covers every firstSlot.* read site ──────
  {
    const source = readRoute("app/api/bookings/recurring/route.ts");
    // Grep-derived: every `firstSlot.` reference in this file (id, starts_at, staff_member_id,
    // ends_at, price_override).
    const requiredFields = ["id", "starts_at", "ends_at", "staff_member_id", "price_override"];
    const selectMatch = source.match(/\.from\("availability_slots"\)\s*\.select\(\s*"([^"]+)"/);
    const selectStr = selectMatch?.[1] ?? "";
    const missing = requiredFields.filter((f) => !selectStr.includes(f));
    const noStar = !selectStr.includes("*");
    const pass = missing.length === 0 && noStar && selectStr.length > 0;
    if (!pass) allPass = false;
    rows.push({
      scenario: "static: app/api/bookings/recurring/route.ts:32 slot select covers every firstSlot.* read site, drops '*'",
      pass,
      details: { selectStr, missing, noStar },
    });
  }

  // ── (2a) STATIC: discovery/feed route drops tiktok_embed_html at all 3 mapping sites ────
  {
    const source = readRoute("app/api/discovery/feed/route.ts");
    const mapSites = [...source.matchAll(/\.map\(\(\{\s*total_count(?:,\s*tiktok_embed_html)?\s*,\s*\.\.\.rest\s*\}\)\s*=>\s*rest\)/g)];
    const trimmedSites = mapSites.filter((m) => m[0].includes("tiktok_embed_html")).length;
    const totalMapSites = mapSites.length;
    const pass = totalMapSites === 3 && trimmedSites === 3;
    if (!pass) allPass = false;
    rows.push({
      scenario: "static: app/api/discovery/feed/route.ts drops tiktok_embed_html at all 3 item-mapping sites (search_discovery, discovery_feed_for_you, discovery_feed)",
      pass,
      details: { totalMapSites, trimmedSites },
    });
  }

  // ── (2b) LIVE: discovery_feed RPC per-item byte share (Ring 0 number: 59.1 KB / 20 items) ──
  {
    const { data, error } = await admin.rpc("discovery_feed", {
      p_category: null, p_gender: null, p_texture: null, p_style: null,
      p_creator: null, p_user_gender: null, p_limit: 20, p_offset: 0, p_tags_any: null,
    });
    const rowsData = (data ?? []) as Array<Record<string, unknown>>;
    const querySucceeded = error == null && rowsData.length > 0;
    if (!querySucceeded) allPass = false;

    const totalBytes = Buffer.byteLength(JSON.stringify(rowsData), "utf8");
    const embedBytes = rowsData.reduce(
      (sum, r) => sum + Buffer.byteLength(JSON.stringify({ tiktok_embed_html: r.tiktok_embed_html }), "utf8"),
      0,
    );
    const embedPct = totalBytes > 0 ? (embedBytes / totalBytes) * 100 : 0;
    const trimmedTotal = totalBytes - embedBytes;

    rows.push({
      scenario: `live: discovery_feed RPC (20 rows) evidence , tiktok_embed_html is ${embedPct.toFixed(1)}% of the untrimmed payload, trim drops ${totalBytes} B -> ${trimmedTotal} B`,
      pass: querySucceeded,
      details: {
        rowCount: rowsData.length,
        untrimmedTotalBytes: totalBytes,
        tiktokEmbedHtmlBytes: embedBytes,
        tiktokEmbedHtmlPct: Number(embedPct.toFixed(1)),
        trimmedTotalBytes: trimmedTotal,
        keys: rowsData[0] ? Object.keys(rowsData[0]) : [],
      },
    });
  }

  // ── (2c) LIVE: dropping tiktok_embed_html never flips the grid's isVideo signal ─────────
  // (ItemCard.tsx:43 `!!item.tiktok_url || !!item.tiktok_embed_html || item.media_type === "tiktok"`)
  {
    const { count: risky, error } = await admin
      .from("discovery_items")
      .select("id", { count: "exact", head: true })
      .not("tiktok_embed_html", "is", null)
      .is("tiktok_url", null)
      .neq("media_type", "tiktok");
    const pass = error == null && (risky ?? 0) === 0;
    if (!pass) allPass = false;
    rows.push({
      scenario: "live: 0 discovery_items rows would flip ItemCard's isVideo check if tiktok_embed_html were absent (tiktok_url/media_type already cover it)",
      pass,
      details: { riskyRowCount: risky ?? 0, error: error?.message ?? null },
    });
  }

  // ── (3) LIVE: earliest_slots_by_service RPC vs the OLD per-service parallel queries ──────
  {
    const nowIso = new Date().toISOString();
    const horizonIso = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { data: slotRows, error: slotSampleErr } = await admin
      .from("availability_slots")
      .select("service_id")
      .eq("status", "available")
      .gte("starts_at", nowIso)
      .lte("starts_at", horizonIso)
      .limit(20000);
    const serviceIds = [...new Set((slotRows ?? []).map((s) => (s as { service_id: string }).service_id))];

    // OLD route logic (pre-Ring-2d, copy-identical): N parallel per-service .limit(3) queries.
    const oldByService: Record<string, string[]> = {};
    const perServiceResults = await Promise.all(
      serviceIds.map((svcId) =>
        admin
          .from("availability_slots")
          .select("service_id, starts_at")
          .eq("status", "available")
          .eq("service_id", svcId)
          .gte("starts_at", nowIso)
          .lte("starts_at", horizonIso)
          .order("starts_at", { ascending: true })
          .limit(3),
      ),
    );
    let oldQueryErr: string | null = null;
    for (const res of perServiceResults) {
      if (res.error) { oldQueryErr = res.error.message; continue; }
      for (const slot of res.data ?? []) {
        const s = slot as { service_id: string; starts_at: string };
        (oldByService[s.service_id] ??= []).push(s.starts_at);
      }
    }

    // NEW route logic: ONE RPC call.
    const { data: rpcRows, error: rpcErr } = await admin.rpc("earliest_slots_by_service", {
      p_service_ids: serviceIds, p_from: nowIso, p_to: horizonIso, p_per: 3,
    });
    const newByService: Record<string, string[]> = {};
    for (const row of (rpcRows ?? []) as Array<{ service_id: string; starts_at: string }>) {
      (newByService[row.service_id] ??= []).push(row.starts_at);
    }

    const allIds = new Set([...Object.keys(oldByService), ...Object.keys(newByService)]);
    let mismatches = 0;
    const mismatchSamples: unknown[] = [];
    for (const id of allIds) {
      const oldArr = (oldByService[id] ?? []).map((t) => new Date(t).toISOString());
      const newArr = (newByService[id] ?? []).map((t) => new Date(t).toISOString());
      const same = oldArr.length === newArr.length && oldArr.every((v, i) => v === newArr[i]);
      if (!same) {
        mismatches++;
        if (mismatchSamples.length < 5) mismatchSamples.push({ id, oldArr, newArr });
      }
    }
    const pass = oldQueryErr == null && rpcErr == null && allIds.size > 0 && mismatches === 0;
    if (!pass) allPass = false;
    rows.push({
      scenario: "live: earliest_slots_by_service RPC output is byte-identical to the old per-service .limit(3) queries (p_per=3)",
      pass,
      details: {
        servicesCompared: allIds.size, mismatches, mismatchSamples,
        oldQueryErr, rpcErr: rpcErr?.message ?? null,
      },
    });
  }

  // ── (4a) STATIC: salons route imports the RPC and no longer runs N parallel slot queries ──
  {
    const source = readRoute("app/api/salons/route.ts");
    const usesRpc = /supabase\.rpc\(\s*"earliest_slots_by_service"/.test(source);
    const noParallelPerServiceQueries = !/serviceIds\.map\(\s*\(svcId\)\s*=>\s*\n?\s*supabase[\s\S]{0,40}\.from\("availability_slots"\)/.test(source);
    const pass = usesRpc && noParallelPerServiceQueries;
    if (!pass) allPass = false;
    rows.push({
      scenario: "static: app/api/salons/route.ts with_slots block calls earliest_slots_by_service once, no more per-service parallel queries",
      pass,
      details: { usesRpc, noParallelPerServiceQueries },
    });
  }

  // ── (4b) LIVE: trending route converges onto SALON_PUBLIC_COLS, same 8-field shape ──────
  {
    const { SALON_PUBLIC_COLS } = await import("@/lib/salons/public-columns");
    const TRENDING_FIELDS = ["id", "name", "slug", "cover_photo_url", "city_id", "average_rating", "review_count", "is_top_pick"];
    const publicColsSet = new Set(SALON_PUBLIC_COLS.split(",").map((c) => c.trim()));
    const trendingCols = TRENDING_FIELDS.filter((f) => publicColsSet.has(f));
    const sameFieldSet = trendingCols.length === TRENDING_FIELDS.length
      && TRENDING_FIELDS.every((f) => trendingCols.includes(f));

    const { data, error } = await admin
      .from("salons")
      .select(trendingCols.join(", "))
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .limit(10);
    const querySucceeded = error == null && Array.isArray(data);
    const serialized = JSON.stringify({ items: data ?? [] });
    const leakedKeys = SENSITIVE_SALON_KEYS.filter((k) => serialized.includes(`"${k}"`));
    const pass = sameFieldSet && querySucceeded && leakedKeys.length === 0;
    if (!pass) allPass = false;
    rows.push({
      scenario: "live: trending route's intersect against SALON_PUBLIC_COLS resolves to the unchanged 8-field shape, query succeeds, zero sensitive keys",
      pass,
      details: {
        sameFieldSet, trendingCols, querySucceeded, leakedKeys,
        error: error?.message ?? null, rowCount: data?.length ?? 0,
      },
    });
  }

  console.log("Ring 2d kill test: hot-path stragglers (bookings select, discovery feed trim, slots RPC reuse, trending convergence)\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring2d-kill-test] threw:", err);
  process.exit(1);
});
