// Verify: app/api/dashboard/batch/route.ts's "revenue_month" case now calls the
// DB RPC public.booking_revenue_sum(p_salon_id, p_since) instead of fetching every
// completed booking row and summing in JS, and the coerced { total } result is
// identical to what the old JS-sum logic would have produced.
//
// Auth note (empirically confirmed, not assumed - see lib/supabase.ts and the same
// caveat already documented in scripts/api-smoke.ts / scripts/ring5d-kill-test.ts):
// createServerSupabaseClient() calls next/headers `cookies()`, which throws "called
// outside a request scope" when a route handler is imported and invoked directly from
// a plain tsx script (confirmed by probing it here before writing this file). The
// batch route reads the session exclusively from that cookie store, not from the
// NextRequest object, so no header/cookie set on a synthetic NextRequest can produce
// an authenticated call to POST() in-process - only a real HTTP request to a running
// Next.js server can. That auth wrapper is unchanged sibling logic (untouched by this
// edit), so this script instead: (1) proves the route still 401s with no session
// (the module still loads and the unchanged auth gate still runs first), and (2)
// exercises the EXACT new RPC call (same name, same args, same monthStart formula)
// against the live DB for the test salon and diffs its coerced total against the old
// JS-sum equivalent, which is the actual behavior this change swaps out.
//
// Usage: npx tsx scripts/dashboard-batch-revenue-rpc-verify.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { NextRequest } from "next/server";

const TEST_SALON_ID = "97c04291-fe61-4018-8f75-3ac03c9e27e3";

type Row = { scenario: string; pass: boolean; details: Record<string, unknown> };
const rows: Row[] = [];
let allPass = true;

function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
  rows.push({ scenario, pass, details });
  if (!pass) allPass = false;
}

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const admin = createAdminSupabaseClient();

  // ─── 1. sanity: the route still 401s with no session (auth gate untouched) ────────
  {
    const { POST } = await import("@/app/api/dashboard/batch/route");
    const req = new NextRequest("http://localhost:3000/api/dashboard/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salonId: TEST_SALON_ID, requests: ["revenue_month"] }),
    });
    const res = await POST(req);
    const body = await res.json();
    check(
      "POST /api/dashboard/batch (no session): still 401 Unauthorized (auth gate untouched by this edit)",
      res.status === 401 && body.error === "Unauthorized",
      { status: res.status, body },
    );
  }

  // Mirrors app/api/dashboard/batch/route.ts's monthStart formula exactly.
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // ─── 2. RPC total vs old JS-sum total, month-to-date window (the real request shape) ──
  {
    const { data: rpcData, error: rpcError } = await admin.rpc("booking_revenue_sum", {
      p_salon_id: TEST_SALON_ID,
      p_since: monthStart,
    });
    check("admin.rpc('booking_revenue_sum', ...) month-to-date: no error", !rpcError, {
      error: rpcError?.message ?? null,
    });
    const rpcTotal = rpcData == null ? 0 : Number(rpcData);

    const { data: rows_, error: jsError } = await admin
      .from("bookings")
      .select("price_paid")
      .eq("salon_id", TEST_SALON_ID)
      .eq("status", "completed")
      .gte("starts_at", monthStart);
    check("old JS-sum query month-to-date: no error", !jsError, { error: jsError?.message ?? null });
    const jsTotal = (rows_ ?? []).reduce((sum, b: any) => sum + (b.price_paid ?? 0), 0);

    check(
      "RPC total === old JS-sum total (month-to-date window)",
      rpcTotal === jsTotal && Number.isFinite(rpcTotal),
      { rpcTotal, jsTotal, rowCount: rows_?.length ?? 0 },
    );
  }

  // ─── 3. same comparison over an all-time window, to guarantee a nonzero, multi-row
  //         summation is actually exercised (month-to-date may legitimately be 0). ──────
  {
    const epoch = new Date(0).toISOString();
    const { data: rpcData, error: rpcError } = await admin.rpc("booking_revenue_sum", {
      p_salon_id: TEST_SALON_ID,
      p_since: epoch,
    });
    check("admin.rpc('booking_revenue_sum', ...) all-time: no error", !rpcError, {
      error: rpcError?.message ?? null,
    });
    const rpcTotal = rpcData == null ? 0 : Number(rpcData);

    const { data: rows_, error: jsError } = await admin
      .from("bookings")
      .select("price_paid")
      .eq("salon_id", TEST_SALON_ID)
      .eq("status", "completed")
      .gte("starts_at", epoch);
    check("old JS-sum query all-time: no error", !jsError, { error: jsError?.message ?? null });
    const jsTotal = (rows_ ?? []).reduce((sum, b: any) => sum + (b.price_paid ?? 0), 0);

    check(
      "RPC total === old JS-sum total (all-time window, nonzero rows expected)",
      rpcTotal === jsTotal && (rows_?.length ?? 0) > 0,
      { rpcTotal, jsTotal, rowCount: rows_?.length ?? 0 },
    );

    check(
      "response shape stays { total: <number> } (typeof check on the coerced value)",
      typeof rpcTotal === "number" && !Number.isNaN(rpcTotal),
      { rpcTotal, typeofRpcTotal: typeof rpcTotal },
    );
  }

  console.log("Dashboard batch revenue_month RPC swap verify\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[dashboard-batch-revenue-rpc-verify] threw:", err);
  process.exit(1);
});
