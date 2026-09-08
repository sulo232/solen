import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ upload: vi.fn(), insert: vi.fn(), audit: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "admin" } } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: "admin" } }) }) }) }) }), createAdminSupabaseClient: () => ({ storage: { from: () => ({ upload: state.upload, getPublicUrl: () => ({ data: { publicUrl: "https://images.example.test/new.webp" } }) }) }, from: () => ({ insert: state.insert }) }) }));
vi.mock("@/lib/feature-flags", () => ({ checkFeatureEnabled: async () => null, checkUserBanned: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: async () => null, discoveryAdminLimiter: {} }));
vi.mock("@/lib/audit", () => ({ logAuditEvent: state.audit }));
vi.mock("sharp", () => ({ default: () => ({ webp: () => ({ toBuffer: async () => Buffer.from("fixture") }) }) }));
import { POST } from "@/app/api/admin/discovery/upload/route";
function request(category?: string | File, header = true) {
  const form = new FormData(); form.set("file", new File(["fixture"], "fixture.png", { type: "image/png" }));
  if (category !== undefined) form.set("category", category);
  return new NextRequest("http://localhost/api/admin/discovery/upload", { method: "POST", body: form, headers: header ? { "x-solen-upload": "1" } : {} });
}
beforeEach(() => { vi.clearAllMocks(); state.upload.mockResolvedValue({ error: null }); state.insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: "new" }, error: null }) }) }); });
describe("upload category validation on actual multipart handler", () => {
  it.each(["invalid", "all", "", new File(["hair"], "category.txt")])("rejects %s before any storage", async (category) => {
    expect((await POST(request(category))).status).toBe(400); expect(state.upload).not.toHaveBeenCalled(); expect(state.insert).not.toHaveBeenCalled();
  });
  it.each([["beard", "beard"], ["lashes", "lashes"], ["brows", "brows"], [undefined, "hair"]])("accepts %s and audits the stored category", async (input, expected) => {
    expect((await POST(request(input))).status).toBe(200); expect(state.upload).toHaveBeenCalledOnce(); expect(state.insert).toHaveBeenCalledWith(expect.objectContaining({ category: expected })); expect(state.audit).toHaveBeenCalledWith(expect.anything(), "admin", "discovery.publish", "upload", "new", { category: expected });
  });
  it("retains upload-header CSRF refusal", async () => { expect((await POST(request("beard", false))).status).toBe(403); expect(state.upload).not.toHaveBeenCalled(); });
});
