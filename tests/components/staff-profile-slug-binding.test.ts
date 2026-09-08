import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => effect(),
    useRef: <T,>(value: T) => ({ current: value }),
    useState: <T,>(value: T) => [value, vi.fn()] as const,
  };
});
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("lucide-react", () => ({
  Share: () => null,
  Star: () => null,
  X: () => null,
  Instagram: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  Check: () => null,
}));
vi.mock("@/app/[locale]/_components/primitives", () => ({
  Avatar: () => null,
  RatingStars: () => null,
  SeeAllButton: () => null,
}));
vi.mock("@/app/[locale]/_components/primitives/BackButton", () => ({ BackButton: () => null }));
vi.mock("@/app/[locale]/_components/salon/_shared", () => ({ formatReviewDate: () => "" }));
vi.mock("@/components-legacy/staff/StaffReviewsSheet", () => ({ default: () => null }));
vi.mock("@/components-legacy/ui/Spinner", () => ({ default: () => null }));

import StaffProfilePage from "@/components-legacy/staff/StaffProfilePage";

beforeEach(() => {
  mocks.fetch.mockReset();
  mocks.fetch.mockResolvedValue({ ok: false, status: 404 });
  vi.stubGlobal("fetch", mocks.fetch);
});

it("binds the staff profile request to the route Store slug", () => {
  StaffProfilePage({ staffId: "staff-a", salonSlug: "store-a" });

  expect(mocks.fetch).toHaveBeenCalledWith(
    "/api/staff/staff-a/profile?salon_slug=store-a",
  );
});
