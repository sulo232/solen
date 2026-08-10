// tests/api/contracts/favorites-toggle.test.ts
//
// api-contracts-04: the first slice of route-level contract tests (a starter,
// not a demand to backfill all 357 routes at once, per the finding's own
// scale-appropriate guidance). Drives the REAL route handler
// (app/api/favorites/toggle/route.ts POST) with a NextRequest and asserts the
// exact status code + top-level body-key set for each documented branch in
// the route's own JSDoc contract comment. This is a DRIFT LOCK on the
// documented current shape ({message,code} / {saved:boolean}), not proof the
// route already uses the api-contracts-01/02 canonical envelope, migrating an
// existing route's response shape is the "no mass migration" case those
// findings explicitly defer, and would also require updating the live
// HeartButton client parser in lock-step. A future migration of this route
// still needs this test updated to the new shape, that is the point: the
// test fails loudly the day the shape drifts, intentionally or not.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: async () => ({ auth: { getUser: getUserMock } }),
}));

const applyRateLimitMock = vi.fn(() => Promise.resolve(null));
vi.mock("@/lib/ratelimit", () => ({
  generalLimiter: {},
  applyRateLimit: (...args: unknown[]) => applyRateLimitMock(...args),
}));

import { POST } from "@/app/api/favorites/toggle/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/favorites/toggle", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  getUserMock.mockReset();
  applyRateLimitMock.mockReset().mockResolvedValue(null);
});

describe("POST /api/favorites/toggle contract", () => {
  it("401 UNAUTHENTICATED: exact {message,code} shape, no other top-level keys", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await POST(req({ salon_id: "s-1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(Object.keys(body).sort()).toEqual(["code", "message"]);
    expect(body.code).toBe("UNAUTHENTICATED");
    expect(typeof body.message).toBe("string");
  });

  it("400 BAD_REQUEST on missing salon_id: exact {message,code} shape", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });

    const res = await POST(req({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(Object.keys(body).sort()).toEqual(["code", "message"]);
    expect(body.code).toBe("BAD_REQUEST");
  });
});
