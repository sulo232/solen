import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

interface QueryDescriptor {
  table: string;
  select: string;
  filters: Record<string, unknown>;
}

interface QueryResult {
  data: unknown;
  error: { message: string } | null;
}

const state = vi.hoisted(() => ({
  viewerId: "owner" as string | null,
  started: [] as QueryDescriptor[],
  runQuery: null as unknown as (query: QueryDescriptor) => Promise<QueryResult>,
  requireAccess: vi.fn(),
  postHog: vi.fn(),
  advice: vi.fn(),
}));

function from(table: string) {
  const descriptor: QueryDescriptor = { table, select: "", filters: {} };
  const query: Record<string, unknown> = {};
  query.select = (columns: string) => {
    descriptor.select = columns;
    return query;
  };
  for (const method of ["eq", "gte", "lte", "lt"] as const) {
    query[method] = (column: string, value: unknown) => {
      descriptor.filters[`${method}:${column}`] = value;
      return query;
    };
  }
  query.in = (column: string, value: unknown[]) => {
    descriptor.filters[`in:${column}`] = value;
    return query;
  };
  query.single = () => query;
  query.maybeSingle = () => query;
  query.then = (
    resolve: (value: QueryResult) => unknown,
    reject: (reason: unknown) => unknown,
  ) => {
    const snapshot = {
      table: descriptor.table,
      select: descriptor.select,
      filters: { ...descriptor.filters },
    };
    state.started.push(snapshot);
    return state.runQuery(snapshot).then(resolve, reject);
  };
  return query;
}

const admin = { from };
const session = {
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: state.viewerId ? { id: state.viewerId } : null },
    })),
  },
};

vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => admin,
  createServerSupabaseClient: async () => session,
}));
vi.mock("@/lib/auth/require", () => ({
  requireSalonAccess: state.requireAccess,
}));
vi.mock("@/lib/posthog-api", () => ({
  fetchPostHogProfileViews: state.postHog,
}));
vi.mock("@/lib/dashboard-advice", () => ({
  ADVICE_WINDOW_WEEKS: 8,
  computeDashboardAdvice: state.advice,
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function queryKey(query: QueryDescriptor): string {
  return `${query.table}:${query.select}`;
}

async function flushStarts() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  state.viewerId = "owner";
  state.started = [];
  state.requireAccess.mockReset();
  state.requireAccess.mockResolvedValue({ via: "owner", salonId: "salon-1" });
  state.postHog.mockReset();
  state.postHog.mockResolvedValue(0);
  state.advice.mockReset();
  state.advice.mockReturnValue({ kind: "quiet" });
  session.auth.getUser.mockClear();
  state.runQuery = async () => ({ data: [], error: null });
});

describe("salon analytics independent reads", () => {
  it("starts every independent current/prior/advice read before any one resolves", async () => {
    const pendingByKey = new Map<string, ReturnType<typeof deferred<QueryResult>>>();
    const keys = [
      "salons:opening_hours",
      "salon_analytics:*",
      "bookings:id, user_id, service_id, starts_at, ends_at, price_paid, status, is_first_visit, acquisition_source, created_at",
      "reviews:rating",
      "bookings:status, price_paid, user_id, is_first_visit",
      "bookings:starts_at, status",
    ];
    for (const key of keys) pendingByKey.set(key, deferred<QueryResult>());
    state.runQuery = (query) => {
      const pending = pendingByKey.get(queryKey(query));
      if (!pending) throw new Error(`Unexpected query ${queryKey(query)}`);
      return pending.promise;
    };
    const postHog = deferred<number>();
    state.postHog.mockReturnValue(postHog.promise);

    const { GET } = await import("@/app/api/analytics/salon/[id]/route");
    const responsePromise = GET(
      new NextRequest("http://localhost/api/analytics/salon/salon-1?period=month&advice=1"),
      { params: Promise.resolve({ id: "salon-1" }) },
    );
    await flushStarts();

    expect(new Set(state.started.map(queryKey))).toEqual(new Set(keys));
    expect(state.postHog).toHaveBeenCalledWith("salon-1", 30);

    pendingByKey.get("salons:opening_hours")?.resolve({ data: { opening_hours: null }, error: null });
    pendingByKey.get("salon_analytics:*")?.resolve({ data: null, error: null });
    pendingByKey.get("bookings:id, user_id, service_id, starts_at, ends_at, price_paid, status, is_first_visit, acquisition_source, created_at")?.resolve({ data: [], error: null });
    pendingByKey.get("reviews:rating")?.resolve({ data: [], error: null });
    pendingByKey.get("bookings:status, price_paid, user_id, is_first_visit")?.resolve({ data: [], error: null });
    pendingByKey.get("bookings:starts_at, status")?.resolve({ data: [], error: null });
    postHog.resolve(0);

    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      salon_id: "salon-1",
      period: "month",
      total_bookings: 0,
      total_revenue: 0,
      advice: { kind: "quiet" },
    });
  });

  it("keeps an advice dependency error visible in logs and omits advice", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    state.runQuery = async (query) => {
      if (query.select === "opening_hours") return { data: { opening_hours: null }, error: null };
      if (query.select === "starts_at, status") {
        return { data: null, error: { message: "advice unavailable" } };
      }
      return { data: query.table === "salon_analytics" ? null : [], error: null };
    };

    const { GET } = await import("@/app/api/analytics/salon/[id]/route");
    const response = await GET(
      new NextRequest("http://localhost/api/analytics/salon/salon-1?advice=1"),
      { params: Promise.resolve({ id: "salon-1" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).not.toHaveProperty("advice");
    expect(console.error).toHaveBeenCalledWith(
      "[AnalyticsSalon] advice lookback query failed:",
      { message: "advice unavailable" },
    );
  });
});

describe("staff comparison dependency phases", () => {
  it("runs access lookups together, then bookings and reviews together for the selected Store", async () => {
    const salonAccess = deferred<QueryResult>();
    const profileAccess = deferred<QueryResult>();
    const bookings = deferred<QueryResult>();
    const reviews = deferred<QueryResult>();
    state.runQuery = async (query) => {
      if (query.table === "salons") return salonAccess.promise;
      if (query.table === "profiles") return profileAccess.promise;
      if (query.table === "staff_members") {
        return {
          data: [
            { id: "staff-a", name: "A", avatar_url: null },
            { id: "staff-b", name: "B", avatar_url: null },
          ],
          error: null,
        };
      }
      if (query.table === "bookings") return bookings.promise;
      if (query.table === "reviews") return reviews.promise;
      throw new Error(`Unexpected query ${queryKey(query)}`);
    };

    const { GET } = await import("@/app/api/analytics/staff-comparison/route");
    const responsePromise = GET(new NextRequest(
      "http://localhost/api/analytics/staff-comparison?salon_id=salon-1&period=month",
    ));
    await flushStarts();
    expect(state.started.map((query) => query.table)).toEqual(["salons", "profiles"]);

    salonAccess.resolve({ data: { owner_id: "owner" }, error: null });
    profileAccess.resolve({ data: { role: "customer" }, error: null });
    await vi.waitFor(() => expect(state.started).toHaveLength(5));
    expect(state.started.map((query) => query.table)).toEqual([
      "salons", "profiles", "staff_members", "bookings", "reviews",
    ]);
    for (const query of state.started.filter((entry) => entry.table !== "profiles")) {
      expect(query.filters["eq:salon_id"] ?? query.filters["eq:id"]).toBe("salon-1");
    }

    bookings.resolve({
      data: [
        { id: "a-1", staff_member_id: "staff-a", user_id: "client-1", price_paid: 50, status: "completed" },
        { id: "b-1", staff_member_id: "staff-b", user_id: "client-2", price_paid: 100, status: "completed" },
      ],
      error: null,
    });
    reviews.resolve({
      data: [
        { staff_member_id: "staff-a", rating: 4 },
        { staff_member_id: "staff-b", rating: 5 },
      ],
      error: null,
    });

    const response = await responsePromise;
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      period: "month",
      staff: [
        expect.objectContaining({ id: "staff-b", total_revenue: 100, avg_rating: 5 }),
        expect.objectContaining({ id: "staff-a", total_revenue: 50, avg_rating: 4 }),
      ],
    });
  });

  it("preserves the empty response when the active-staff dependency fails", async () => {
    state.runQuery = async (query) => {
      if (query.table === "salons") return { data: { owner_id: "owner" }, error: null };
      if (query.table === "profiles") return { data: { role: "customer" }, error: null };
      if (query.table === "staff_members") {
        return { data: null, error: { message: "staff unavailable" } };
      }
      throw new Error(`Unexpected query ${queryKey(query)}`);
    };

    const { GET } = await import("@/app/api/analytics/staff-comparison/route");
    const response = await GET(new NextRequest(
      "http://localhost/api/analytics/staff-comparison?salon_id=salon-1&period=quarter",
    ));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ staff: [] });
    expect(state.started.some((query) => query.table === "bookings" || query.table === "reviews")).toBe(false);
  });
});
