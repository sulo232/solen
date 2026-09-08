import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  runHealthProbes: vi.fn(),
  applyRateLimit: vi.fn(),
  helpArticle: { id: "article-1", slug: "getting-started", locale: "en" },
}));

function helpQuery() {
  const query: Record<string, unknown> = {};
  query.select = () => query;
  query.eq = () => query;
  query.single = async () => ({ data: mocks.helpArticle, error: null });
  return query;
}

vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({}),
  createServerSupabaseClient: async () => ({ from: () => helpQuery() }),
}));
vi.mock("@/lib/health", () => ({ runHealthProbes: mocks.runHealthProbes }));
vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: mocks.applyRateLimit,
  generalLimiter: {},
  getClientIp: () => "127.0.0.1",
}));

import * as fallback from "@/app/api/[[...path]]/route";
import * as health from "@/app/api/health/route";
import * as helpArticle from "@/app/api/help/[slug]/route";

beforeEach(() => {
  mocks.runHealthProbes.mockReset();
  mocks.runHealthProbes.mockResolvedValue({ ok: true, checks: {} });
  mocks.applyRateLimit.mockReset();
  mocks.applyRateLimit.mockResolvedValue(null);
});

describe("native API fallback route", () => {
  it.each([
    ["POST", fallback.POST],
    ["PUT", fallback.PUT],
    ["PATCH", fallback.PATCH],
    ["DELETE", fallback.DELETE],
    ["OPTIONS", fallback.OPTIONS],
  ])("returns JSON 404 for unknown %s requests", async (_method, handler) => {
    const response = handler();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found", code: "NOT_FOUND" });
  });

  it("rate limits unknown GET requests by client IP before returning 404", async () => {
    const request = new NextRequest("http://localhost/api/missing");
    const response = await fallback.GET(request);
    expect(response.status).toBe(404);
    expect(mocks.applyRateLimit).toHaveBeenCalledWith(expect.anything(), { ip: "127.0.0.1" });

    mocks.applyRateLimit.mockResolvedValueOnce(
      Response.json({ error: "Too many requests" }, { status: 429 }),
    );
    expect((await fallback.GET(request)).status).toBe(429);
  });

  it("returns an empty 404 body for unknown HEAD requests", async () => {
    const response = await fallback.HEAD();
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("");
  });

  it("covers root, unknown top-level, and unknown nested path parameters", async () => {
    for (const path of [undefined, ["route-probe-absent-20260908"], ["health", "nonexistent"]]) {
      const response = await fallback.GET(
        new NextRequest("http://localhost/api"),
        { params: Promise.resolve({ path }) },
      );
      expect(response.status).toBe(404);
    }
  });

  it("keeps the existing static health handler and its method contract", async () => {
    const response = await health.GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, checks: {} });
    expect("POST" in health).toBe(false);

    const { autoImplementMethods } = await import(
      "next/dist/server/route-modules/app-route/helpers/auto-implement-methods"
    );
    const methods = autoImplementMethods(health);
    expect((await methods.OPTIONS()).status).toBe(204);
    expect((await methods.POST()).status).toBe(405);
  });

  it("keeps an existing dynamic help route handler", async () => {
    const response = await helpArticle.GET(
      new NextRequest("http://localhost/api/help/getting-started?locale=en"),
      { params: Promise.resolve({ slug: "getting-started" }) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ article: mocks.helpArticle });
  });
});
