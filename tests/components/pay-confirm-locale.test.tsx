import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const h = vi.hoisted(() => ({
  locale: "en",
  fetch: vi.fn(),
  replace: vi.fn(),
  resetForm: vi.fn(),
  guest: { name: "Guest Name", phone: "+41791234567", email: "guest@example.com" },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: h.replace }) }));
vi.mock("next-intl", () => ({
  useLocale: () => h.locale,
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));
vi.mock("next/image", () => ({ default: "img" }));
vi.mock("motion/react", () => ({ motion: { div: "div" } }));
vi.mock("@/app/[locale]/_components/primitives/Toast", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/app/[locale]/_components/primitives", () => ({ Avatar: () => null, useEnterMotion: () => ({}) }));
vi.mock("@/components-legacy/booking/BookingPaymentForm", () => ({ default: () => null }));
vi.mock("@/components-legacy/booking/GuestBookingForm", async () => {
  const ReactModule = await import("react");
  return {
    default: ReactModule.forwardRef(function GuestFixture(_props, ref) {
      ReactModule.useImperativeHandle(ref, () => ({ validate: () => h.guest }));
      return ReactModule.createElement("div", { "data-testid": "guest-form" });
    }),
  };
});
vi.mock("@/lib/booking-context", () => ({
  useBooking: () => ({
    formData: {
      services: [{ id: "22222222-2222-4222-8222-222222222222", name_de: "Schnitt", name_en: "Cut", price: 45, duration_minutes: 30 }],
      selectedStaffId: "any",
      selectedDate: new Date(2026, 8, 10),
      selectedTime: "10:00",
      totalPrice: 45,
      promoCode: "",
      giftCardCode: "",
      customerNote: "",
      bundleId: null,
    },
    goToStep: vi.fn(),
    resetForm: h.resetForm,
  }),
}));

import PayConfirmStep from "@/components-legacy/booking/PayConfirmStep";

let tree: ReactTestRenderer | undefined;
const salon = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Fixture Store",
  payment_mode: "at_salon",
  accepts_online_payment: false,
  cancellation_window_hours: 24,
};

beforeEach(() => {
  h.fetch.mockReset();
  h.replace.mockReset();
  h.resetForm.mockReset();
  h.fetch.mockResolvedValue(new Response(JSON.stringify({
    data: { id: "33333333-3333-4333-8333-333333333333" },
    access_token: "guest-token",
    reference_code: "ABC123",
  }), { status: 201, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", h.fetch);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});

afterEach(async () => {
  if (tree) await act(async () => tree?.unmount());
  tree = undefined;
  vi.unstubAllGlobals();
});

test.each(["de", "en", "fr", "it"])("mounted guest confirmation sends the active %s locale with real guest fields", async (locale) => {
  h.locale = locale;
  await act(async () => {
    tree = create(React.createElement(PayConfirmStep, {
      salon: salon as any,
      staff: null,
      isLoggedIn: false,
      salonHasRedeemableVoucher: false,
    }));
  });
  const buttons = tree!.root.findAllByType("button");
  await act(async () => buttons.at(-1)!.props.onClick());

  expect(h.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = h.fetch.mock.calls[0];
  expect(url).toBe("/api/bookings");
  expect(JSON.parse(options.body)).toMatchObject({
    locale,
    guest_name: h.guest.name,
    guest_phone: h.guest.phone,
    guest_email: h.guest.email,
  });
  expect(h.replace).toHaveBeenCalledWith(`/${locale}/confirmation?booking_id=33333333-3333-4333-8333-333333333333&access_token=guest-token&ref=ABC123`);
});
