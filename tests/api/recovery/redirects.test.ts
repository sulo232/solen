import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ route: "", lookup: vi.fn(), fetch: vi.fn(), upload: vi.fn(), sequence: 0, tiktok: false, analyzeTikTok: vi.fn() }));
vi.mock("node:dns/promises", () => ({ default: { lookup: state.lookup } }));
vi.mock("@/lib/supabase", () => {
  const client = { auth: { getUser: async () => ({ data: { user: { id: "admin" } } }) }, storage: { from: () => ({ download: async () => ({ data: null }), upload: state.upload, getPublicUrl: () => ({ data: { publicUrl: "https://stored.example.test/image" } }) }) }, from(table: string) {
    const item = { id: "11111111-1111-4111-8111-111111111111", image_url: "https://public.example.test/image", media_type: state.tiktok ? "tiktok" : "photo", category: "hair" };
    const q: any = { then: (resolve: any) => Promise.resolve({ data: table === "profiles" ? { role: "admin" } : state.route === "thumb" ? { tiktok_url: `https://www.tiktok.com/video/${state.sequence}` } : [item], error: null }).then(resolve) };
    for (const op of ["select", "eq", "in", "is", "order", "limit", "update", "insert", "single", "maybeSingle"]) q[op] = () => q;
    return q;
  } }; return { createServerSupabaseClient: async () => client, createAdminSupabaseClient: () => client };
});
vi.mock("@/lib/feature-flags", () => ({ checkFeatureEnabled: async () => null, checkUserBanned: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: async () => null, adminLimiter: {}, discoveryAdminLimiter: {}, generalLimiter: {}, getClientIp: () => "fixture", getAiDailyLimiter: async () => ({}), getAiGlobalDailyLimiter: async () => ({}), AI_GLOBAL_BUDGET_KEY: "fixture", AI_GLOBAL_BUDGET_EXCEEDED_BODY: {} }));
vi.mock("@/lib/ai-vision", () => ({ analyzeDiscoveryImage: async () => null, analyzeDiscoveryTikTok: state.analyzeTikTok, translateDiscoveryI18n: async () => null }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ GEMINI_API_KEY: "fixture", FAL_KEY: "fixture" }) }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: async () => {} }));
vi.mock("@/lib/nail/ai-prompts", () => ({ buildNailPrompt: () => "fixture" }));
vi.mock("@/lib/nail/ai-budget", () => ({ checkBudget: async () => null, recordGeneration: async () => {}, getBudgetStatus: async () => ({ spent: 0, budget: 10, percentUsed: 0 }) }));
vi.mock("sharp", () => ({ default: () => ({ webp: () => ({ toBuffer: async () => Buffer.from("image") }) }) }));
import { fetchSafeImage, UnsafeFetchUrlError } from "@/lib/security/ssrf-guard";
import { POST as backfill } from "@/app/api/admin/discovery/backfill/route";
import { PUT as staging } from "@/app/api/admin/discovery/staging/route";
import { POST as nail } from "@/app/api/admin/nail/generate/route";
import { GET as thumb } from "@/app/api/discovery/thumb/[id]/route";
const initial = "https://public.example.test/image";
const redirected = "https://second.example.test/image";
beforeEach(() => { vi.clearAllMocks(); state.sequence++; state.tiktok = false; state.analyzeTikTok.mockResolvedValue(null); state.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]); state.upload.mockResolvedValue({ error: null }); vi.stubGlobal("fetch", state.fetch); });
afterEach(() => vi.unstubAllGlobals());
function imageResponse() { return new Response("image bytes", { headers: { "content-type": "image/jpeg" } }); }
function mockFetch(location?: string) {
  state.fetch.mockImplementation(async (url: string) => {
    if (url.startsWith("https://fal.run/")) return Response.json({ images: [{ url: initial }] });
    if (url.startsWith("https://www.tiktok.com/oembed")) return Response.json({ thumbnail_url: initial });
    if (url === initial && location) return new Response(null, { status: 302, headers: { location } });
    return imageResponse();
  });
}
async function call(route: string) {
  state.route = route;
  const body = route === "staging" ? { action: "approve", ids: ["11111111-1111-4111-8111-111111111111"] } : {};
  const req = new NextRequest(`http://localhost/api/${route}`, { method: "POST", body: JSON.stringify(body) });
  if (route === "backfill") return backfill(req);
  if (route === "staging") return staging(req);
  if (route === "nail") return nail(req);
  return thumb(req, { params: Promise.resolve({ id: `fixture-${state.sequence}` }) });
}
describe.each(["backfill", "staging", "nail", "thumb"])("%s actual image-fetch caller", (route) => {
  it.each([undefined, redirected])("fetches public image and allowed redirect %s with manual policy and same deadline", async (location) => {
    mockFetch(location); const res = await call(route); expect(res.status).toBe(route === "nail" ? 201 : 200);
    const calls = state.fetch.mock.calls.filter(([url]) => url === initial || url === redirected);
    expect(calls.map(([url]) => url)).toEqual(location ? [initial, redirected] : [initial]);
    expect(calls.every(([, options]) => options.redirect === "manual" && options.signal instanceof AbortSignal)).toBe(true);
    if (location) expect(calls[0][1].signal).toBe(calls[1][1].signal);
  });
  it("refuses private redirect before any request or storage upload to it", async () => {
    mockFetch("http://127.0.0.1/secret"); const res = await call(route);
    expect(state.fetch.mock.calls.some(([url]) => url.includes("127.0.0.1"))).toBe(false);
    expect(state.fetch.mock.calls.some(([url]) => url === initial)).toBe(true);
    expect(state.upload).not.toHaveBeenCalled();
    if (route === "thumb") expect(res.status).toBe(502);
    if (route === "backfill") expect((await res.json()).errors).toBe(1);
  });
});
describe("shared guard redirect limits and fail-closed behavior", () => {
  it("rejects the first private URL without fetching", async () => { await expect(fetchSafeImage("http://10.0.0.1/image")).rejects.toBeInstanceOf(UnsafeFetchUrlError); expect(state.fetch).not.toHaveBeenCalled(); });
  it("rejects DNS failure without fetching", async () => { state.lookup.mockRejectedValue(new Error("DNS failure")); await expect(fetchSafeImage(initial)).rejects.toBeInstanceOf(UnsafeFetchUrlError); expect(state.fetch).not.toHaveBeenCalled(); });
  it("rejects redirect DNS resolving private before requesting it", async () => { state.lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]).mockResolvedValue([{ address: "169.254.169.254", family: 4 }]); mockFetch(redirected); await expect(fetchSafeImage(initial)).rejects.toBeInstanceOf(UnsafeFetchUrlError); expect(state.fetch).toHaveBeenCalledTimes(1); });
  it("bounds redirects and cancels every discarded body", async () => { const cancellations: any[] = []; state.fetch.mockImplementation(async () => { const res = new Response("redirect", { status: 302, headers: { location: "/again" } }); cancellations.push(vi.spyOn(res.body!, "cancel")); return res; }); await expect(fetchSafeImage(initial)).rejects.toBeInstanceOf(UnsafeFetchUrlError); expect(state.fetch).toHaveBeenCalledTimes(6); expect(cancellations.every((cancel) => cancel.mock.calls.length === 1)).toBe(true); });
  it("resolves relative locations", async () => { mockFetch("/new"); await fetchSafeImage(initial); expect(state.fetch.mock.calls.map(([url]) => url)).toEqual([initial, "https://public.example.test/new"]); });
  it("does not fetch on an already aborted deadline", async () => { const controller = new AbortController(); controller.abort(); await expect(fetchSafeImage(initial, { signal: controller.signal })).rejects.toThrow(); expect(state.fetch).not.toHaveBeenCalled(); });
});

describe("backfill same-origin TikTok proxy exception", () => {
  it("allows the existing local proxy with redirect:error and reaches TikTok analysis", async () => {
    state.tiktok = true;
    state.fetch.mockResolvedValue(imageResponse());
    const res = await call("backfill");
    expect(res.status).toBe(200);
    const proxy = "http://localhost/api/discovery/thumb/11111111-1111-4111-8111-111111111111";
    expect(state.fetch).toHaveBeenCalledExactlyOnceWith(proxy, { signal: expect.any(AbortSignal), redirect: "error" });
    expect(state.lookup).not.toHaveBeenCalled();
    expect(state.analyzeTikTok).toHaveBeenCalledWith(proxy, "", undefined);
  });
  it("surfaces fetch redirect refusal without a second request or downstream analysis", async () => {
    state.tiktok = true;
    state.fetch.mockImplementation(async (_url: string, options: RequestInit) => {
      // Fetch's documented redirect:error boundary rejects a redirect response.
      expect(options.redirect).toBe("error");
      throw new TypeError("fetch failed: unexpected redirect");
    });
    const res = await call("backfill");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.errors).toBe(1);
    expect(body.processed).toBe(0);
    expect(body.results[0].status).toContain("image_fetch_error:");
    expect(state.fetch).toHaveBeenCalledOnce();
    expect(state.analyzeTikTok).not.toHaveBeenCalled();
    expect(state.upload).not.toHaveBeenCalled();
  });
});
