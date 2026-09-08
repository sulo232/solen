import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AuthInvalidJwtError,
  AuthRetryableFetchError,
  AuthSessionMissingError,
} from "@supabase/supabase-js";

interface StoreRow {
  id: string;
  slug: string;
  owner_id: string;
  is_active: boolean;
  listed_on_marketplace: boolean | null;
  is_test: boolean;
}

const state = vi.hoisted(() => ({
  viewerId: null as string | null,
  authFails: false,
  authError: null as Error | null,
  cityRows: [{ slug: "basel" }] as { slug: string }[],
  cityError: false,
  storeRows: [] as StoreRow[],
  storeError: false,
  staffRows: [] as { id: string; salon_id: string; is_active: boolean }[],
  staffError: false,
  profiles: {} as Record<string, { role: string }>,
  profileError: false,
  calls: [] as { table: string; filters: Record<string, unknown> }[],
}));

function from(table: string) {
  const filters: Record<string, unknown> = {};
  const query: Record<string, unknown> = {};
  query.select = () => query;
  query.eq = (key: string, value: unknown) => {
    filters[key] = value;
    return query;
  };
  query.maybeSingle = async () => {
    state.calls.push({ table, filters: { ...filters } });
    if (table === "salons") {
      if (state.storeError) return { data: null, error: { message: "store lookup failed" } };
      const candidate = state.storeRows.find((row) => row.slug === filters.slug) ?? null;
      const visible = candidate && (candidate.is_active || candidate.owner_id === state.viewerId)
        ? candidate
        : null;
      return { data: visible, error: null };
    }
    if (table === "profiles") {
      if (state.profileError) return { data: null, error: { message: "profile lookup failed" } };
      return { data: state.profiles[String(filters.id)] ?? null, error: null };
    }
    if (table === "staff_members") {
      // Match the load-bearing PostgreSQL UUID constraint, not arbitrary fixture names.
      if (typeof filters.id === "string" && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.id)) {
        return { data: null, error: { code: "22P02", message: "invalid input syntax for type uuid" } };
      }
      if (state.staffError) return { data: null, error: { message: "staff lookup failed" } };
      const candidate = state.staffRows.find((row) =>
        row.id === filters.id &&
        row.salon_id === filters.salon_id &&
        row.is_active === filters.is_active
      ) ?? null;
      return { data: candidate, error: null };
    }
    return { data: null, error: null };
  };
  query.then = (
    resolve: (value: unknown) => unknown,
    reject: (reason: unknown) => unknown,
  ) => {
    state.calls.push({ table, filters: { ...filters } });
    if (table === "cities") {
      return Promise.resolve(state.cityError
        ? { data: null, error: { message: "city lookup failed" } }
        : { data: state.cityRows, error: null }).then(resolve, reject);
    }
    return Promise.resolve({ data: [], error: null }).then(resolve, reject);
  };
  return query;
}

const db = {
  from,
  auth: {
    getUser: vi.fn(async () => {
      if (state.authFails) throw new Error("auth failed");
      return {
        data: { user: state.viewerId ? { id: state.viewerId } : null },
        error: state.authError,
      };
    }),
  },
};

vi.mock("@supabase/ssr", () => ({ createServerClient: () => db }));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://mock.invalid",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-key",
  }),
}));

function request(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost${path}`, {
    headers: { "accept-language": "en" },
    ...init,
  });
}

function expectRewrite404(response: Response) {
  expect(response.headers.get("x-middleware-rewrite")).toBe(
    "http://localhost/en/__404/__404/__404/__404",
  );
}

function expectPass(response: Response) {
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.headers.get("x-middleware-rewrite")).toBeNull();
}

async function run(path: string) {
  const { middleware } = await import("@/middleware");
  return middleware(request(path));
}

beforeEach(() => {
  vi.resetModules();
  state.viewerId = null;
  state.authFails = false;
  state.authError = null;
  state.cityRows = [{ slug: "basel" }];
  state.cityError = false;
  state.storeRows = [];
  state.storeError = false;
  state.staffRows = [];
  state.staffError = false;
  state.profiles = {};
  state.profileError = false;
  state.calls = [];
  db.auth.getUser.mockClear();
});

describe("city and API hard 404 routing", () => {
  it("rewrites an unknown city alone and an invalid category", async () => {
    state.cityRows = [];
    expectRewrite404(await run("/en/route-probe-absent-20260908"));

    vi.resetModules();
    state.cityRows = [{ slug: "basel" }];
    expectRewrite404(await run("/en/basel/not-a-category"));
  });

  it("does not manufacture city absence on a cold database error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    state.cityError = true;
    expectPass(await run("/en/basel"));
  });

  it("keeps the known Store on its canonical path and rejects the direct vanity path", async () => {
    state.cityRows = [];
    state.storeRows = [{
      id: "margot-id",
      slug: "haarsalon-margot",
      owner_id: "owner",
      is_active: true,
      listed_on_marketplace: true,
      is_test: false,
    }];

    expectRewrite404(await run("/en/haarsalon-margot"));
    expectPass(await run("/en/salon/haarsalon-margot"));
  });

  it("uses an exact API boundary and passes API resolution to App Router", async () => {
    expectPass(await run("/api/route-probe-absent-20260908"));
    expectPass(await run("/api/health"));
    expect((await run("/apix")).headers.get("location")).toBe("http://localhost/en/apix");
  });

  it("passes API preflight to route resolution while retaining CORS headers", async () => {
    const { middleware } = await import("@/middleware");
    const response = await middleware(request("/api/route-probe-absent-20260908", {
      method: "OPTIONS",
      headers: {
        "accept-language": "en",
        origin: "https://solen.ch",
      },
    }));

    expectPass(response);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://solen.ch");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    expect(response.headers.get("Access-Control-Max-Age")).toBe("86400");
  });

  it("keeps dotted API paths inside the API CORS boundary", async () => {
    const { middleware } = await import("@/middleware");
    const response = await middleware(request("/api/files/missing.json", {
      method: "OPTIONS",
      headers: {
        "accept-language": "en",
        origin: "https://solen.ch",
        "access-control-request-method": "PUT",
      },
    }));

    expectPass(response);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://solen.ch");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("PUT");
  });
});

describe("Storefront access routing", () => {
  const activeStore: StoreRow = {
    id: "store-id",
    slug: "store",
    owner_id: "owner",
    is_active: true,
    listed_on_marketplace: true,
    is_test: false,
  };

  it.each([
    "/en/salon/store",
    "/en/salon/store/reviews",
    "/en/salon/store/team",
    "/en/salon/store/staff/00000000-0000-4000-8000-000000000001",
    "/en/salon/store/booking",
  ])("preserves the active public Store route %s", async (path) => {
    state.storeRows = [activeStore];
    if (path.includes("/staff/")) {
      state.staffRows = [{ id: "00000000-0000-4000-8000-000000000001", salon_id: "store-id", is_active: true }];
    }
    expectPass(await run(path));
  });

  it.each([
    "/en/salon/store",
    "/en/salon/store/reviews",
    "/en/salon/store/team",
    "/en/salon/store/staff/00000000-0000-4000-8000-000000000001",
  ])("blocks an inactive Store route %s for public viewers", async (path) => {
    state.storeRows = [{ ...activeStore, is_active: false }];
    expectRewrite404(await run(path));
  });

  it.each([
    { ...activeStore, listed_on_marketplace: false },
    { ...activeStore, is_test: true },
  ])("blocks other hidden Store states for public viewers", async (hiddenStore) => {
    state.storeRows = [hiddenStore];
    expectRewrite404(await run("/en/salon/store/reviews"));
  });

  it.each([
    [null, "owner"],
    ["owner", null],
  ] as const)("does not share route visibility between sequential viewers %s then %s", async (first, second) => {
    state.storeRows = [{ ...activeStore, is_active: false }];
    state.viewerId = first;
    const firstResponse = await run("/en/salon/store");
    if (first === "owner") expectPass(firstResponse);
    else expectRewrite404(firstResponse);

    state.viewerId = second;
    const secondResponse = await run("/en/salon/store");
    if (second === "owner") expectPass(secondResponse);
    else expectRewrite404(secondResponse);
    expect(state.calls.filter((call) => call.table === "salons")).toHaveLength(2);
  });

  it.each([
    ["owner", "/en/salon/store"],
    ["owner", "/en/salon/store/reviews"],
    ["owner", "/en/salon/store/team"],
    ["owner", "/en/salon/store/staff/00000000-0000-4000-8000-000000000001"],
    ["admin", "/en/salon/store"],
    ["admin", "/en/salon/store/reviews"],
    ["admin", "/en/salon/store/team"],
    ["admin", "/en/salon/store/staff/00000000-0000-4000-8000-000000000001"],
  ])("preserves hidden Store access for %s on %s", async (viewer, path) => {
    state.storeRows = [{ ...activeStore, is_active: false }];
    state.viewerId = viewer;
    if (viewer === "admin") state.profiles.admin = { role: "admin" };
    if (viewer === "owner" && path.includes("/staff/")) {
      state.staffRows = [{ id: "00000000-0000-4000-8000-000000000001", salon_id: "store-id", is_active: true }];
    }
    expectPass(await run(path));
  });

  it("does not manufacture Store absence when Store, auth, or profile lookup is uncertain", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    state.storeError = true;
    expectPass(await run("/en/salon/store"));

    vi.resetModules();
    state.storeError = false;
    state.authFails = true;
    expectPass(await run("/en/salon/store"));

    vi.resetModules();
    state.authFails = false;
    state.viewerId = "viewer";
    state.profileError = true;
    expectPass(await run("/en/salon/store"));
  });

  it("treats the installed missing-session error as a verified anonymous viewer", async () => {
    state.authError = new AuthSessionMissingError();
    state.storeRows = [{ ...activeStore, is_active: false }];
    expectRewrite404(await run("/en/salon/store"));

    vi.resetModules();
    state.storeRows = [];
    expectRewrite404(await run("/en/salon/missing-store"));
  });

  it.each([
    new AuthInvalidJwtError("invalid cookie token"),
    new AuthRetryableFetchError("auth unavailable", 503),
  ])("passes through genuine auth uncertainty: $name", async (authError) => {
    state.authError = authError;
    expectPass(await run("/en/salon/missing-store"));
  });

  it("hard-404s a foreign staff id after owner Store access is established", async () => {
    state.viewerId = "owner";
    state.storeRows = [{ ...activeStore, is_active: false }];
    state.staffRows = [{ id: "00000000-0000-4000-8000-000000000003", salon_id: "other-store", is_active: true }];

    expectRewrite404(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000003"));
    expect(state.calls).toContainEqual({
      table: "staff_members",
      filters: { id: "00000000-0000-4000-8000-000000000003", salon_id: "store-id", is_active: true },
    });
  });

  it("passes matching public staff and defers a staff lookup error", async () => {
    state.storeRows = [activeStore];
    state.staffRows = [{ id: "00000000-0000-4000-8000-000000000002", salon_id: "store-id", is_active: true }];
    expectPass(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000002"));

    vi.resetModules();
    state.staffError = true;
    expectPass(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000002"));
  });

  it.each(["not-a-uuid", "123", "00000000-0000-4000-8000-00000000000g"])("hard-404s malformed staff id %s without a staff query", async (staffId) => {
    state.storeRows = [activeStore];
    expectRewrite404(await run(`/en/salon/store/staff/${staffId}`));
    expect(state.calls.some((call) => call.table === "staff_members")).toBe(false);
  });

  it.each(["deleted", "inactive"])("hard-404s a valid UUID for %s staff", async (status) => {
    state.storeRows = [activeStore];
    state.staffRows = status === "inactive" ? [{ id: "00000000-0000-4000-8000-000000000002", salon_id: "store-id", is_active: false }] : [];
    expectRewrite404(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000002"));
    expect(state.calls).toContainEqual({ table: "staff_members", filters: { id: "00000000-0000-4000-8000-000000000002", salon_id: "store-id", is_active: true } });
  });

  it("preserves auth uncertainty for a well-formed staff child", async () => {
    state.authError = new AuthRetryableFetchError("auth unavailable", 503);
    expectPass(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000002"));
    expect(state.calls.some((call) => call.table === "staff_members")).toBe(false);
  });

  it("preserves an RLS-hidden admin staff route for the server access owner", async () => {
    state.viewerId = "admin";
    state.profiles.admin = { role: "admin" };
    state.storeRows = [{ ...activeStore, is_active: false }];

    expectPass(await run("/en/salon/store/staff/00000000-0000-4000-8000-000000000002"));
    expect(state.calls.some((call) => call.table === "staff_members")).toBe(false);
  });
});

describe("non-enumerating booking route checks", () => {
  it.each(["report", "refund", "upcharge"])("rewrites malformed %s booking IDs", async (subpage) => {
    expectRewrite404(await run(`/en/bookings/not-a-uuid/${subpage}`));
  });

  it("passes a valid guest UUID without querying bookings", async () => {
    expectPass(await run("/en/bookings/123e4567-e89b-12d3-a456-426614174000/refund"));
    expect(state.calls.some((call) => call.table === "bookings")).toBe(false);
  });

  it("preserves the actual walk-in join route", async () => {
    expectPass(await run("/en/walk-in-join"));
  });
});
