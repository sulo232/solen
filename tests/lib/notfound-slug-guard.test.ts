import { describe, expect, it } from "vitest";
import {
  isPublicSalonRouteRow,
  shouldBlockSalonRoute,
  shouldBlockUnknownCity,
  type SalonRouteRow,
} from "@/lib/notfound-slug-guard";

const publicStore: SalonRouteRow = {
  owner_id: "owner",
  is_active: true,
  listed_on_marketplace: true,
  is_test: false,
};

function block(overrides: Partial<Parameters<typeof shouldBlockSalonRoute>[0]> = {}) {
  return shouldBlockSalonRoute({
    row: publicStore,
    salonLookupFailed: false,
    viewerId: null,
    viewerLookupFailed: false,
    isAdmin: false,
    ...overrides,
  });
}

describe("unknown city decisions", () => {
  it("blocks authoritative absence but passes a cold lookup error", () => {
    expect(shouldBlockUnknownCity(new Set(), "basel")).toBe(true);
    expect(shouldBlockUnknownCity(new Set(["zurich"]), "basel")).toBe(true);
    expect(shouldBlockUnknownCity(new Set(["basel"]), "basel")).toBe(false);
    expect(shouldBlockUnknownCity(null, "basel")).toBe(false);
  });
});

describe("Store route access decisions", () => {
  it("recognizes only active, marketplace-visible, non-test rows as public", () => {
    expect(isPublicSalonRouteRow(publicStore)).toBe(true);
    expect(isPublicSalonRouteRow({ ...publicStore, is_active: false })).toBe(false);
    expect(isPublicSalonRouteRow({ ...publicStore, listed_on_marketplace: false })).toBe(false);
    expect(isPublicSalonRouteRow({ ...publicStore, is_test: true })).toBe(false);
    expect(isPublicSalonRouteRow({ ...publicStore, listed_on_marketplace: null })).toBe(true);
  });

  it("blocks absent and hidden Stores for a known public viewer", () => {
    expect(block({ row: null })).toBe(true);
    expect(block({ row: { ...publicStore, is_active: false } })).toBe(true);
    expect(block({ row: { ...publicStore, listed_on_marketplace: false } })).toBe(true);
    expect(block({ row: { ...publicStore, is_test: true } })).toBe(true);
  });

  it("admits the owner and defers admin and uncertain lookups", () => {
    const hidden = { ...publicStore, is_active: false };
    expect(block({ row: hidden, viewerId: "owner" })).toBe(false);
    expect(block({ row: null, viewerId: "admin", isAdmin: true })).toBe(false);
    expect(block({ row: null, salonLookupFailed: true })).toBe(false);
    expect(block({ row: null, viewerLookupFailed: true })).toBe(false);
  });
});
