import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  accessibleStore: null as null | { salon: { id: string }; isOwnerView: boolean; canModerate: boolean },
  staff: [] as any[],
  rateLimited: false,
  calls: [] as { client: "session" | "admin"; table: string; filters: [string, unknown][]; columns: string }[],
}));

const STAFF_ID = "11111111-1111-4111-8111-111111111111";

function client(kind: "session" | "admin") {
  return {
    from(table: string) {
      const filters: [string, unknown][] = [];
      let columns = "";
      const query: any = {
        select: (value: string) => { columns = value; return query; },
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        order: () => query,
        limit: () => query,
        single: () => run(true),
        maybeSingle: () => run(true),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          run(false).then(resolve, reject),
      };
      async function run(single: boolean) {
        state.calls.push({ client: kind, table, filters: [...filters], columns });
        let rows = table === "staff_members" ? state.staff : [];
        rows = rows.filter((row) => filters.every(([key, value]) => row[key] === value));
        return { data: single ? rows[0] ?? null : rows, error: null };
      }
      return query;
    },
  };
}

const session = client("session");
const admin = client("admin");

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: async () => session,
  createAdminSupabaseClient: () => admin,
}));
vi.mock("@/lib/salon-detail", () => ({
  isSalonHidden: () => false,
  loadSalonDetailWithAccess: vi.fn(async () => state.accessibleStore),
}));
vi.mock("@/lib/ratelimit", () => ({
  generalLimiter: {},
  getClientIp: () => "203.0.113.10",
  applyRateLimit: vi.fn(async () => state.rateLimited
    ? new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    : null),
}));

import { GET } from "@/app/api/staff/[id]/profile/route";

function request(slug?: string) {
  return new NextRequest(`http://localhost/api/staff/${STAFF_ID}/profile${slug ? `?salon_slug=${slug}` : ""}`);
}

const params = { params: Promise.resolve({ id: STAFF_ID }) };

beforeEach(() => {
  state.accessibleStore = {
    salon: { id: "store-a" },
    isOwnerView: false,
    canModerate: false,
  };
  state.rateLimited = false;
  state.staff = [{
    id: STAFF_ID,
    salon_id: "store-a",
    is_active: true,
    name: "Ada",
    salons: { name: "Store A", slug: "store-a", categories: [] },
  }];
  state.calls = [];
});

describe("staff profile Store binding", () => {
  it("rejects a malformed staff UUID before any Store or database lookup", async () => {
    const response = await GET(request(), { params: Promise.resolve({ id: "staff-a" }) });
    expect(response.status).toBe(404);
    expect(state.calls).toHaveLength(0);
  });

  it("returns the public IP limiter response before any Store or database lookup", async () => {
    state.rateLimited = true;
    const response = await GET(request("store-a"), params);
    expect(response.status).toBe(429);
    expect(state.calls).toHaveLength(0);
  });

  it("denies before the privileged staff read when the Store is inaccessible", async () => {
    state.accessibleStore = null;
    expect((await GET(request("hidden-store"), params)).status).toBe(404);
    expect(state.calls.some((call) => call.table === "staff_members")).toBe(false);
  });

  it("binds the requested staff member to the authorized Store", async () => {
    const response = await GET(request("store-a"), params);
    expect(response.status).toBe(200);
    expect(state.calls.find((call) => call.table === "staff_members")?.filters).toEqual(
      expect.arrayContaining([["id", STAFF_ID], ["salon_id", "store-a"], ["is_active", true]]),
    );
    expect(state.calls.find((call) => call.table === "staff_members")?.client).toBe("session");
  });

  it("marks a hidden owner or admin response private after shared access succeeds", async () => {
    state.accessibleStore = {
      salon: { id: "store-a" },
      isOwnerView: true,
      canModerate: false,
    };
    const response = await GET(request("store-a"), params);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(state.calls.find((call) => call.table === "staff_members")?.client).toBe("admin");
  });

  it("rejects a staff member from another Store", async () => {
    state.staff[0].salon_id = "store-b";
    expect((await GET(request("store-a"), params)).status).toBe(404);
  });
});
