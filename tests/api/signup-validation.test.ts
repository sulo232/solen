import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const harness = vi.hoisted(() => ({
  signUp: vi.fn(),
  breached: false,
}));

vi.mock("@/lib/ratelimit", () => ({
  authLimiter: {},
  getClientIp: () => "203.0.113.12",
  applyRateLimit: async () => null,
}));

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: async () => ({
    auth: { signUp: harness.signUp },
  }),
}));

vi.mock("@/lib/auth/breached-password", () => ({
  isPasswordBreached: async () => harness.breached,
}));

vi.mock("@/lib/posthog-server", () => ({
  identifyServerUser: vi.fn(),
  trackServerEvent: vi.fn(),
}));

import { POST } from "@/app/api/auth/signup/route";

const validCustomer = {
  email: "person@example.ch",
  password: "Correct-Horse-9",
  birthday: "1990-01-01",
};

function request(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T12:00:00Z"));
  harness.breached = false;
  harness.signUp.mockReset();
  harness.signUp.mockResolvedValue({
    data: { user: { id: "user-id", identities: [{}] } },
    error: null,
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("authoritative signup date validation", () => {
  it("rejects an 11-character password before signup", async () => {
    const response = await POST(
      request({ ...validCustomer, password: "ShortPass9!" }),
    );
    expect(response.status).toBe(400);
    expect(harness.signUp).not.toHaveBeenCalled();
  });

  it.each(["2100-01-01", "1990-02-30"])(
    "rejects %s before signup",
    async (birthday) => {
      const response = await POST(request({ ...validCustomer, birthday }));
      expect(response.status).toBe(400);
      expect(harness.signUp).not.toHaveBeenCalled();
    },
  );

  it("accepts the exact sixteenth birthday and rejects one day younger", async () => {
    const exactBoundary = await POST(
      request({ ...validCustomer, birthday: "2010-09-08" }),
    );
    expect(exactBoundary.status).toBe(200);
    expect(harness.signUp).toHaveBeenCalledTimes(1);

    harness.signUp.mockClear();
    const oneDayYounger = await POST(
      request({ ...validCustomer, birthday: "2010-09-09" }),
    );
    expect(oneDayYounger.status).toBe(400);
    expect(harness.signUp).not.toHaveBeenCalled();
  });

  it("allows the business branch to use salon_name without a birthday", async () => {
    const response = await POST(
      request({
        email: "owner@example.ch",
        password: "Correct-Horse-9",
        salon_name: "Studio Eleven",
        locale: "fr",
      }),
    );

    expect(response.status).toBe(200);
    expect(harness.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          data: { birthday: undefined, salon_name: "Studio Eleven" },
          emailRedirectTo:
            "http://localhost/api/auth/callback?redirect=%2Ffr%2Fonboarding%2Fsalon",
        }),
      }),
    );
  });

  it("keeps the legacy German callback destination when locale is absent", async () => {
    const response = await POST(request(validCustomer));
    expect(response.status).toBe(200);
    expect(harness.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: "http://localhost/api/auth/callback?redirect=%2Fde",
        }),
      }),
    );
  });
});
