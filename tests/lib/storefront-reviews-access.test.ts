import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSalonDetailWithAccess: vi.fn(),
  from: vi.fn(),
  userId: null as string | null,
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/salon-detail", () => ({
  loadSalonDetailWithAccess: mocks.loadSalonDetailWithAccess,
}));
vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: async () => ({
    from: mocks.from,
    auth: { getUser: async () => ({ data: { user: mocks.userId ? { id: mocks.userId } : null } }) },
  }),
  createAdminSupabaseClient: () => ({ from: mocks.from }),
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/components-legacy/salon/SalonReviews", () => ({ default: () => null }));

beforeEach(() => {
  vi.resetModules();
  mocks.loadSalonDetailWithAccess.mockReset();
  mocks.from.mockReset();
  mocks.userId = null;
  mocks.notFound.mockClear();
});

describe("reviews Store access owner", () => {
  it("uses the authorized public Store name in metadata", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue({
      salon: { name: "Store A" },
      isOwnerView: false,
      canModerate: false,
    });
    const { generateMetadata } = await import("@/app/[locale]/salon/[slug]/reviews/page");

    await expect(generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "store-a" }),
    })).resolves.toMatchObject({ title: "Bewertungen Store A" });
    expect(mocks.loadSalonDetailWithAccess).toHaveBeenCalledWith("store-a");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("uses the shared access result for metadata without a raw Store query", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue(null);
    const { generateMetadata } = await import("@/app/[locale]/salon/[slug]/reviews/page");

    await expect(generateMetadata({
      params: Promise.resolve({ locale: "en", slug: "hidden-store" }),
    })).resolves.toEqual({
      title: "Bewertungen",
      description: "Alle Bewertungen für diesen Salon",
    });
    expect(mocks.loadSalonDetailWithAccess).toHaveBeenCalledWith("hidden-store");
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("uses the shared Store detail access loader before any reviews query", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue(null);
    const { default: SalonReviewsPage } = await import("@/app/[locale]/salon/[slug]/reviews/page");

    await expect(SalonReviewsPage({
      params: Promise.resolve({ locale: "en", slug: "hidden-store" }),
    })).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.loadSalonDetailWithAccess).toHaveBeenCalledWith("hidden-store");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("removes private reply text from the reviews passed to the client component", async () => {
    mocks.loadSalonDetailWithAccess.mockResolvedValue({
      salon: { id: "store-id", name: "Store A", average_rating: 4.5, review_count: 2 },
      isOwnerView: false,
      canModerate: false,
    });
    const rows = [
      {
        id: "review-private",
        rating: 3,
        comment: "Public review",
        created_at: "2026-09-08",
        review_replies: { reply_text: "Private owner draft", is_public: false, created_at: "2026-09-08" },
      },
      {
        id: "review-public",
        rating: 5,
        comment: "Public review",
        created_at: "2026-09-08",
        review_replies: { reply_text: "Published reply", is_public: true, created_at: "2026-09-08" },
      },
    ];
    mocks.from.mockImplementation((table: string) => {
      const query: any = {
        select: () => query,
        eq: () => query,
        order: () => query,
        range: async () => ({ data: table === "reviews" ? rows : [], error: null }),
      };
      return query;
    });
    const { default: SalonReviewsPage } = await import("@/app/[locale]/salon/[slug]/reviews/page");

    const element: any = await SalonReviewsPage({
      params: Promise.resolve({ locale: "en", slug: "store-a" }),
    });
    const reviews = element.props.children.props.children.props.reviews;
    expect(JSON.stringify(reviews)).not.toContain("Private owner draft");
    expect(reviews).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "review-private", review_replies: null }),
      expect.objectContaining({
        id: "review-public",
        review_replies: expect.objectContaining({ reply_text: "Published reply", is_public: true }),
      }),
    ]));
  });
});
