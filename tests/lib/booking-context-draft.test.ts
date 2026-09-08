import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BOOKING_DRAFT_TTL_MS,
  clearBookingDraft,
  draftStorageKey,
  persistBookingDraft,
  readFreshDraft,
  restoredDraftPatch,
  type StoredBookingDraft,
} from "@/lib/booking-context";
import type { BookingFormData, SelectedService } from "@/lib/booking-state";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const service = (id: string, price: number, duration = 30): SelectedService => ({
  id,
  name_de: `Dienstleistung ${id}`,
  name_en: `Service ${id}`,
  price,
  duration_minutes: duration,
});

function formData(overrides: Partial<BookingFormData> = {}): BookingFormData {
  return {
    services: [],
    selectedStaffId: "any",
    selectedDate: null,
    selectedTime: null,
    totalDuration: 0,
    totalPrice: 0,
    addonIds: [],
    promoCode: "",
    giftCardCode: "",
    referralCode: "",
    paymentMethod: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("booking draft persistence", () => {
  it("survives while fresh and persists only the bounded non-payment selection", () => {
    const storage = new MemoryStorage();
    const now = Date.UTC(2026, 8, 8, 8, 0, 0);
    const selected = {
      ...service("service-1", 90),
      card_token: "must-not-persist",
    } as SelectedService;

    persistBookingDraft("salon-1", formData({
      services: [selected],
      selectedStaffId: "staff-1",
      selectedDate: new Date("2026-09-10T00:00:00.000Z"),
      selectedTime: "10:30",
      totalDuration: 30,
      totalPrice: 90,
      addonIds: ["addon-1"],
      promoCode: "PROMO",
      giftCardCode: "GIFT",
      referralCode: "REFER",
      paymentMethod: "online",
      stripePaymentIntentId: "pi_secret",
      customerNote: "Bitte leise föhnen",
    }), storage, now);

    const raw = storage.getItem(draftStorageKey("salon-1"));
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(Object.keys(stored).sort()).toEqual([
      "salonId",
      "savedAt",
      "selectedDate",
      "selectedStaffId",
      "services",
      "v",
    ]);
    expect(Object.keys(stored.services[0]).sort()).toEqual([
      "duration_minutes",
      "id",
      "name_de",
      "name_en",
      "price",
    ]);
    expect(raw).not.toContain("10:30");
    expect(raw).not.toContain("PROMO");
    expect(raw).not.toContain("GIFT");
    expect(raw).not.toContain("REFER");
    expect(raw).not.toContain("online");
    expect(raw).not.toContain("pi_secret");
    expect(raw).not.toContain("card_token");
    expect(raw).not.toContain("Bitte leise föhnen");

    expect(readFreshDraft("salon-1", storage, now + BOOKING_DRAFT_TTL_MS - 1)).toMatchObject({
      salonId: "salon-1",
      selectedStaffId: "staff-1",
      services: [{ id: "service-1", price: 90 }],
    });
  });

  it("removes expired, future-dated, and malformed drafts when read", () => {
    const storage = new MemoryStorage();
    const key = draftStorageKey("salon-1");
    const now = Date.UTC(2026, 8, 8, 8, 0, 0);
    const draft: StoredBookingDraft = {
      v: 2,
      salonId: "salon-1",
      savedAt: now - BOOKING_DRAFT_TTL_MS - 1,
      services: [service("service-1", 90)],
      selectedStaffId: "staff-1",
      selectedDate: null,
    };

    storage.setItem(key, JSON.stringify(draft));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: now + 1 }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, "not-json");
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: now, selectedDate: "2026-02-30T00:00:00.000Z" }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: now, selectedDate: "2026-09-10T00:00:00Z" }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: now, services: [service("bad-price", -1)] }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: now, services: [service("bad-duration", 10, 0)] }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    storage.setItem(key, JSON.stringify({ ...draft, savedAt: Number.POSITIVE_INFINITY }));
    expect(readFreshDraft("salon-1", storage, now)).toBeNull();
    expect(storage.getItem(key)).toBeNull();

    const malformedDrafts = [
      { ...draft, savedAt: now, v: 1 },
      { ...draft, savedAt: now, salonId: "other-salon" },
      { ...draft, savedAt: String(now) },
      { ...draft, savedAt: 0 },
      { ...draft, savedAt: now, services: "service-1" },
      { ...draft, savedAt: now, services: [service("", 90)] },
      { ...draft, savedAt: now, services: [{ ...service("missing-name", 90), name_en: null }] },
      { ...draft, savedAt: now, services: [service("fractional-duration", 90, 30.5)] },
      { ...draft, savedAt: now, services: [service("duplicate", 90), service("duplicate", 90)] },
      { ...draft, savedAt: now, selectedStaffId: "" },
      { ...draft, savedAt: now, selectedDate: "not-a-date" },
    ];
    for (const malformed of malformedDrafts) {
      storage.setItem(key, JSON.stringify(malformed));
      expect(readFreshDraft("salon-1", storage, now)).toBeNull();
      expect(storage.getItem(key)).toBeNull();
    }

    const distinctServices = {
      ...draft,
      savedAt: now,
      services: [service("service-1", 90), service("service-2", 45)],
    };
    storage.setItem(key, JSON.stringify(distinctServices));
    expect(readFreshDraft("salon-1", storage, now)?.services).toEqual(distinctServices.services);
  });

  it("continues without persistence when session storage access is denied", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("window", {});
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new DOMException("blocked", "SecurityError");
      },
    });

    expect(() => persistBookingDraft("salon-1", formData({ services: [service("service-1", 90)] }))).not.toThrow();
    expect(() => readFreshDraft("salon-1")).not.toThrow();
    expect(readFreshDraft("salon-1")).toBeNull();
    expect(() => clearBookingDraft("salon-1")).not.toThrow();
  });

  it("rebuilds services from the current Store list and drops stale staff", () => {
    const draft: StoredBookingDraft = {
      v: 2,
      salonId: "salon-1",
      savedAt: Date.now(),
      services: [service("kept", 80, 30), service("deleted", 50, 20)],
      selectedStaffId: "inactive-or-other-store",
      selectedDate: "2026-09-10T00:00:00.000Z",
    };

    const patch = restoredDraftPatch({
      draft,
      knownServices: [service("kept", 110, 45)],
      knownStaffIds: ["active-staff"],
      hasInitialServices: false,
      hasInitialStaff: false,
      hasInitialDate: false,
    });

    expect(patch.services).toEqual([service("kept", 110, 45)]);
    expect(patch.totalPrice).toBe(110);
    expect(patch.totalDuration).toBe(45);
    expect(patch.selectedStaffId).toBe("any");
    expect(patch.selectedDate).toEqual(new Date("2026-09-10T00:00:00.000Z"));

    expect(restoredDraftPatch({
      draft,
      knownServices: [],
      knownStaffIds: [],
      hasInitialServices: false,
      hasInitialStaff: false,
      hasInitialDate: false,
    }).services).toEqual([]);
  });

  it("keeps live URL selections authoritative and clears on explicit reset", () => {
    const storage = new MemoryStorage();
    const draft: StoredBookingDraft = {
      v: 2,
      salonId: "salon-1",
      savedAt: Date.now(),
      services: [service("stored", 80)],
      selectedStaffId: "stored-staff",
      selectedDate: "2026-09-10T00:00:00.000Z",
    };
    const patch = restoredDraftPatch({
      draft,
      knownServices: [service("stored", 80)],
      knownStaffIds: ["stored-staff"],
      hasInitialServices: true,
      hasInitialStaff: true,
      hasInitialDate: true,
    });
    expect(patch).toEqual({});

    storage.setItem(draftStorageKey("salon-1"), JSON.stringify(draft));
    clearBookingDraft("salon-1", storage);
    expect(storage.getItem(draftStorageKey("salon-1"))).toBeNull();
  });
});
