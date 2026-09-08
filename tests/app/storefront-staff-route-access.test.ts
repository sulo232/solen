import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSalonDetailWithAccess: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

vi.mock("@/lib/salon-detail", () => ({
  loadSalonDetailWithAccess: mocks.loadSalonDetailWithAccess,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/components-legacy/staff/StaffProfilePage", () => ({
  default: () => null,
}));

import StaffProfileRoute from "@/app/[locale]/salon/[slug]/staff/[staffId]/page";

beforeEach(() => {
  mocks.loadSalonDetailWithAccess.mockReset();
  mocks.notFound.mockClear();
});

describe("staff profile route access", () => {
  it("uses the shared Store access loader and rejects a foreign staff id", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue({
      salon: { staff: [{ id: "staff-a" }] },
      isOwnerView: false,
      canModerate: false,
    });

    await expect(StaffProfileRoute({
      params: Promise.resolve({ locale: "en", slug: "store-a", staffId: "staff-b" }),
    })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.loadSalonDetailWithAccess).toHaveBeenCalledWith("store-a");
  });

  it("passes the verified Store slug to the client for the matching staff id", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue({
      salon: { staff: [{ id: "staff-a" }] },
      isOwnerView: true,
      canModerate: true,
    });

    const element = await StaffProfileRoute({
      params: Promise.resolve({ locale: "en", slug: "store-a", staffId: "staff-a" }),
    });
    expect(element.props).toMatchObject({ staffId: "staff-a", salonSlug: "store-a" });
  });
});
