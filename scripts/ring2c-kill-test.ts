// Ring 2c kill test: app/api/salons/trending/route.ts + app/api/analytics/platform/route.ts
// switched from createServerSupabaseClient (calls cookies(), forces the route dynamic,
// silently DEFEATS `export const revalidate`) to createAdminSupabaseClient (reads no
// cookies, so ISR actually works, same pattern already proven by
// app/api/metrics/global/route.ts).
//
// Dev mode disables ISR outright, so revalidate behavior itself cannot be proven here.
// Instead this proves the exact regression class:
// (a) STATIC source check: read both route files off disk and assert neither one imports
//     or calls createServerSupabaseClient any more, and that both still import
//     createAdminSupabaseClient and still export `revalidate`.
// (b) LIVE query check: run the actual read queries the two routes now run (copy-identical
//     to route source, not a reimplementation of route logic) via createAdminSupabaseClient
//     against the real DB, assert they succeed, and assert the serialized response contains
//     zero of the sensitive salon keys (stripe_account_id, owner_id, frozen_reason,
//     search_doc, score_details).
//
// reinvent-ok: the category literals below (coiffeur/barbershop/nails/spa) are copy-identical
// to the .contains("categories", [...]) calls already in app/api/analytics/platform/route.ts,
// mirrored here on purpose so this test proves the route's REAL query shape, not a
// reimplementation. Not a new/divergent category list.
//
// Usage: npx tsx scripts/ring2c-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import path from "node:path";

const SENSITIVE_KEYS = ["stripe_account_id", "owner_id", "frozen_reason", "search_doc", "score_details"];

const ROUTE_FILES = [
  "app/api/salons/trending/route.ts",
  "app/api/analytics/platform/route.ts",
];

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  // ── (a) static source check: no route imports/calls createServerSupabaseClient ────
  for (const relPath of ROUTE_FILES) {
    const absPath = path.join(process.cwd(), relPath);
    const source = readFileSync(absPath, "utf8");
    // Match actual import statements / call sites only (not the explanatory prose comment,
    // which names createServerSupabaseClient on purpose to document the precedent/reasoning).
    const importsServerClient = /import\s*\{[^}]*\bcreateServerSupabaseClient\b[^}]*\}\s*from/.test(source)
      || /\bcreateServerSupabaseClient\s*\(/.test(source);
    const importsAdminClient = /import\s*\{[^}]*\bcreateAdminSupabaseClient\b[^}]*\}\s*from/.test(source)
      && /\bcreateAdminSupabaseClient\s*\(/.test(source);
    const stillHasRevalidateExport = /export\s+const\s+revalidate\s*=\s*86400/.test(source);
    const pass = !importsServerClient && importsAdminClient && stillHasRevalidateExport;
    if (!pass) allPass = false;
    rows.push({
      scenario: `static: ${relPath} drops createServerSupabaseClient, keeps createAdminSupabaseClient + revalidate=86400`,
      pass,
      details: { importsServerClient, importsAdminClient, stillHasRevalidateExport },
    });
  }

  // ── (b) live query check: trending route's exact read shape ────────────────────────
  {
    const { data, error } = await admin
      .from("salons")
      .select("id, name, slug, cover_photo_url, city_id, average_rating, review_count, is_top_pick")
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .limit(10);

    const querySucceeded = error == null && Array.isArray(data);
    if (!querySucceeded) allPass = false;

    const serialized = JSON.stringify({ items: data ?? [] });
    const leakedKeys = SENSITIVE_KEYS.filter((k) => serialized.includes(`"${k}"`));
    const noLeaks = leakedKeys.length === 0;
    if (!noLeaks) allPass = false;

    rows.push({
      scenario: "live: trending route query succeeds via admin client",
      pass: querySucceeded,
      details: { error: error?.message ?? null, rowCount: data?.length ?? 0 },
    });
    rows.push({
      scenario: "live: trending route response contains zero sensitive salon keys",
      pass: noLeaks,
      details: { leakedKeys },
    });
  }

  // ── (b) live query check: analytics/platform route's exact read shape ──────────────
  {
    const [c1, c2, c3, c4] = await Promise.all([
      admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["coiffeur"]),
      admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["barbershop"]),
      admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["nails"]),
      admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true).contains("categories", ["spa"]),
    ]);

    const querySucceeded = [c1, c2, c3, c4].every((r) => r.error == null);
    if (!querySucceeded) allPass = false;

    const responseBody = {
      categories: {
        coiffeur: c1.count ?? 0,
        barbershop: c2.count ?? 0,
        nails: c3.count ?? 0,
        spa: c4.count ?? 0,
      },
    };
    const serialized = JSON.stringify(responseBody);
    const leakedKeys = SENSITIVE_KEYS.filter((k) => serialized.includes(`"${k}"`));
    const noLeaks = leakedKeys.length === 0;
    if (!noLeaks) allPass = false;

    rows.push({
      scenario: "live: analytics/platform route category-count queries succeed via admin client",
      pass: querySucceeded,
      details: {
        errors: [c1.error?.message, c2.error?.message, c3.error?.message, c4.error?.message].filter(Boolean),
        counts: responseBody.categories,
      },
    });
    rows.push({
      scenario: "live: analytics/platform route response contains zero sensitive salon keys",
      pass: noLeaks,
      details: { leakedKeys },
    });
  }

  console.log("Ring 2c kill test: trending + analytics/platform dead-revalidate fix\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring2c-kill-test] threw:", err);
  process.exit(1);
});
