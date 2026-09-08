import { beforeEach, describe, expect, it, vi } from "vitest";

type Store = {
  id: string;
  owner_id: string;
  slug: string;
  is_active: boolean;
  listed_on_marketplace: boolean | null;
  is_test: boolean;
};

const state = vi.hoisted(() => ({
  viewerId: null as string | null,
  stores: [] as Store[],
  profiles: [] as { id: string; role: string }[],
  reviews: [] as any[],
  calls: [] as { client: "session" | "admin"; table: string; filters: [string, unknown][] }[],
}));

function client(kind: "session" | "admin") {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: state.viewerId ? { id: state.viewerId } : null },
        error: null,
      })),
    },
    from(table: string) {
      const filters: [string, unknown][] = [];
      const query: any = {
        select: () => query,
        eq: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        in: (key: string, value: unknown) => { filters.push([key, value]); return query; },
        order: () => query,
        limit: () => query,
        single: () => run(true),
        maybeSingle: () => run(true),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          run(false).then(resolve, reject),
      };
      async function run(single: boolean) {
        state.calls.push({ client: kind, table, filters: [...filters] });
        let rows: any[] = [];
        if (table === "salons") {
          rows = state.stores.filter((store) =>
            kind === "admin" || store.is_active || store.owner_id === state.viewerId,
          );
        } else if (table === "profiles") {
          rows = state.profiles;
        } else if (table === "reviews") {
          rows = state.reviews;
        }
        rows = rows.filter((row) => filters.every(([key, value]) =>
          Array.isArray(value) ? value.includes(row[key]) : row[key] === value,
        ));
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
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => state.viewerId ? [{ name: "sb-fixture", value: "session" }] : [],
  }),
}));
vi.mock("next-intl/server", () => ({ getTranslations: async () => () => "" }));
vi.mock("@/app/[locale]/_components/salon/_shared", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/app/[locale]/_components/salon/_shared")>(),
  computeOpenStatus: () => ({ isOpen: false, label: "" }),
  nowInTimezone: () => new Date("2026-09-08T12:00:00Z"),
  publicReply: (reply: any) => {
    const candidate = Array.isArray(reply) ? reply[0] : reply;
    return candidate?.is_public ? candidate : null;
  },
}));

import { loadSalonDetailWithAccess } from "@/lib/salon-detail";

const hiddenStore: Store = {
  id: "store-id",
  owner_id: "owner",
  slug: "hidden-store",
  is_active: false,
  listed_on_marketplace: false,
  is_test: false,
};

beforeEach(() => {
  state.viewerId = null;
  state.stores = [{ ...hiddenStore }];
  state.profiles = [
    { id: "admin", role: "admin" },
    { id: "other", role: "customer" },
  ];
  state.reviews = [];
  state.calls = [];
});

describe("shared Store detail access", () => {
  it("denies an anonymous hidden Store without a privileged read", async () => {
    expect(await loadSalonDetailWithAccess("hidden-store")).toBeNull();
    expect(state.calls.filter((call) => call.client === "admin" && call.table === "salons")).toEqual([]);
  });

  it("denies an active unlisted Store that anonymous RLS can still read", async () => {
    state.stores = [{ ...hiddenStore, is_active: true }];
    expect(await loadSalonDetailWithAccess("hidden-store")).toBeNull();
    expect(state.calls.some((call) => call.client === "session" && call.table === "salons")).toBe(true);
    expect(state.calls.filter((call) => call.client === "admin" && call.table === "salons")).toEqual([]);
  });

  it("keeps an inactive Store visible to its verified owner", async () => {
    state.viewerId = "owner";
    const result = await loadSalonDetailWithAccess("hidden-store");
    expect(result).toMatchObject({ isOwnerView: true, canModerate: true });
    expect(result?.salon.id).toBe("store-id");
  });

  it("verifies admin before a server-only fallback read and marks hidden output private", async () => {
    state.viewerId = "admin";
    const result = await loadSalonDetailWithAccess("hidden-store");
    expect(result).toMatchObject({ isOwnerView: true, canModerate: false });
    expect(result?.salon.id).toBe("store-id");
    const privilegedProfile = state.calls.findIndex((call) => call.client === "admin" && call.table === "profiles");
    const privilegedStore = state.calls.findIndex((call) => call.client === "admin" && call.table === "salons");
    expect(privilegedProfile).toBeGreaterThan(-1);
    expect(privilegedStore).toBeGreaterThan(privilegedProfile);
  });

  it("denies a hidden Store to another authenticated viewer", async () => {
    state.viewerId = "other";
    expect(await loadSalonDetailWithAccess("hidden-store")).toBeNull();
  });

  it("returns null for a nonexistent Store after the admin fallback", async () => {
    state.viewerId = "admin";
    state.stores = [];
    expect(await loadSalonDetailWithAccess("missing-store")).toBeNull();
    expect(state.calls.some((call) => call.client === "admin" && call.table === "salons")).toBe(true);
  });

  it("strips a private review reply before the salon enters client props", async () => {
    state.stores = [{ ...hiddenStore, is_active: true, listed_on_marketplace: true }];
    state.reviews = [
      {
        id: "review-private",
        salon_id: "store-id",
        is_hidden: false,
        rating: 3,
        comment: "Public review",
        review_replies: { reply_text: "Private owner draft", is_public: false, created_at: "2026-09-08" },
      },
      {
        id: "review-public",
        salon_id: "store-id",
        is_hidden: false,
        rating: 5,
        comment: "Public review",
        review_replies: { reply_text: "Published reply", is_public: true, created_at: "2026-09-08" },
      },
    ];

    const result = await loadSalonDetailWithAccess("hidden-store");
    expect(JSON.stringify(result?.salon)).not.toContain("Private owner draft");
    expect((result?.salon as any).reviews).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "review-private", review_replies: null }),
      expect.objectContaining({
        id: "review-public",
        review_replies: expect.objectContaining({ reply_text: "Published reply", is_public: true }),
      }),
    ]));
  });
});
