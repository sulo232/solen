import { beforeEach, expect, test, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
const h = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>,
  calls: [] as any[],
  allowed: true,
  user: { id: "operator" } as any,
  cap: 1000,
  failure: false,
  failureTable: "",
  missingCount: false,
  gate: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => db("admin"),
  createServerSupabaseClient: async () => db("session"),
}));
vi.mock("@/lib/auth/request-user", () => ({
  resolveRequestUser: async () => ({ user: h.user, supabase: db("session") }),
}));
vi.mock("@/lib/auth/require", () => ({ requireSalonAccess: h.gate }));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  bookingConfirmation: vi.fn(),
  salonNewBooking: vi.fn(),
}));
vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: async () => null,
  bookingLimiter: {},
  bearerVerifyLimiter: {},
  generalLimiter: {},
  getClientIp: () => "fixture",
}));
vi.mock("@/lib/feature-flags", () => ({
  checkFeatureEnabled: async () => null,
  checkUserBanned: async () => null,
}));
vi.mock("@/lib/bookings/auto-assign", () => ({
  pickSlotForAnyStaff: vi.fn(),
  countStaffBookingsOnDay: vi.fn(),
}));
vi.mock("@/lib/referral/complete-referral", () => ({
  completeReferralForFirstBooking: vi.fn(),
}));
vi.mock("@/lib/points/attribution", () => ({
  attributeBookingToSearch: vi.fn(),
}));
vi.mock("@/lib/error-report", () => ({ reportError: vi.fn() }));
vi.mock("@/lib/salon-detail", () => ({
  isSalonHidden: vi.fn(),
  isViewerAdmin: vi.fn(),
}));
import { GET as slotsGET } from "@/app/api/slots/route";
import { GET as bookingsGET } from "@/app/api/bookings/route";
import { zurichCalendarRange, zurichWallClockToUtc } from "@/lib/time/zurich";
function db(kind: string) {
  return {
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from(table: string) {
      const call = {
        kind,
        table,
        columns: "",
        count: "",
        filters: [] as any[],
        order: [] as any[],
        range: [0, 999],
      };
      h.calls.push(call);
      const q: any = {
        select: (columns: string, options?: any) => {
          call.columns = columns;
          call.count = options?.count;
          return q;
        },
        order: (...args: any[]) => {
          call.order.push(args);
          return q;
        },
        range: (...args: number[]) => {
          call.range = args;
          return q;
        },
        limit: (limit: number) => {
          call.range = [0, limit - 1];
          return q;
        },
        then: (resolve: any, reject: any) => run().then(resolve, reject),
      };
      for (const operation of ["eq", "lt", "gt", "gte", "lte", "in"])
        q[operation] = (...args: any[]) => {
          call.filters.push([operation, ...args]);
          return q;
        };
      async function run() {
        if (!(table in h.rows)) throw new Error(`Unexpected ${table}`);
        let rows = h.rows[table].filter((row) =>
          call.filters.every(([op, key, value]) => {
            const actual = key.endsWith("_at")
              ? Date.parse(row[key])
              : row[key];
            const wanted = key.endsWith("_at") ? Date.parse(value) : value;
            return op === "eq"
              ? actual === wanted
              : op === "in"
                ? wanted.includes(actual)
                : op === "lt"
                  ? actual < wanted
                  : op === "gt"
                    ? actual > wanted
                    : op === "gte"
                      ? actual >= wanted
                      : actual <= wanted;
          }),
        );
        for (const [key, options] of [...call.order].reverse())
          rows.sort(
            (a, b) =>
              String(a[key]).localeCompare(String(b[key])) *
              (options?.ascending === false ? -1 : 1),
          );
        const count = rows.length;
        rows = rows.slice(
          call.range[0],
          Math.min(call.range[1] + 1, call.range[0] + h.cap),
        );
        const selected = call.columns
          .replace(/\([^)]*\)/g, "")
          .split(",")
          .map((part) => part.trim());
        rows = rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).filter(([key]) => selected.includes(key)),
          ),
        );
        return {
          data: h.failure || h.failureTable === table ? null : rows,
          error: h.failure || h.failureTable === table ? { message: "fixture failure" } : null,
          count: h.missingCount ? null : count,
        };
      }
      return q;
    },
  };
}
const row = (
  id: string,
  starts_at: string,
  ends_at: string,
  salon_id = "store",
) => ({
  id,
  salon_id,
  starts_at,
  ends_at,
  staff_member_id: "staff",
  service_id: "service",
  slot_id: `slot-${id}`,
  user_id: null,
  guest_name: "Fixture Guest",
  status: "confirmed",
  services: { name_de: "Schnitt", name_fr: "Coupe", name_it: "Taglio" },
  staff_members: { name: "Fixture Stylist" },
  booking_id: "private-booking",
  booked_by: "private-person",
});
const request = (route: string, query: string) =>
  new NextRequest(`http://fixture.invalid/api/${route}?${query}`);
beforeEach(() => {
  h.calls = [];
  h.allowed = true;
  h.user = { id: "operator" };
  h.cap = 1000;
  h.failure = false;
  h.failureTable = "";
  h.missingCount = false;
  h.rows = {
    bookings: [],
    availability_slots: [],
    public_profiles: [],
    off_peak_slots: [],
  };
  h.gate
    .mockReset()
    .mockImplementation(async (id: string, area: string) =>
      h.allowed && h.user && id === "store" && area === "calendar"
        ? { user: h.user, salon: { id }, supabase: db("session") }
        : NextResponse.json(
            { error: "Forbidden" },
            { status: h.user ? 403 : 401 },
          ),
    );
});

test.each([
  ["2026-03-29", "2026-03-28T23:00:00.000Z", "2026-03-29T22:00:00.000Z"],
  ["2026-10-25", "2026-10-24T22:00:00.000Z", "2026-10-25T23:00:00.000Z"],
])("Zurich %s day uses actual DST midnight bounds", (date, start, end) => {
  expect(zurichCalendarRange(date, date)).toEqual({ start, end });
});
test.each(["2026-02-30", "2026-13-01", "garbage"])(
  "invalid civil date %s cannot normalize into another day",
  (date) => expect(zurichCalendarRange(date, date)).toBeNull(),
);

test.each([
  ["slots", slotsGET, "availability_slots"],
  ["bookings", bookingsGET, "bookings"],
] as const)(
  "%s calendar reads include Zurich midnight and overlapping starts, exclude other Store and endpoint boundaries",
  async (route, get, table) => {
    h.rows[table] = [
      row("midnight", "2026-09-07T22:15:00Z", "2026-09-07T22:45:00Z"),
      row("overlap", "2026-09-07T21:45:00Z", "2026-09-07T22:15:00Z"),
      row("before", "2026-09-07T21:30:00Z", "2026-09-07T22:00:00Z"),
      row("after", "2026-09-08T22:00:00Z", "2026-09-08T22:30:00Z"),
      row("foreign", "2026-09-08T09:00:00Z", "2026-09-08T10:00:00Z", "other"),
    ];
    const response = await get(
      request(route, "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await response.json();
    expect(body[route].map((value: any) => value.id).sort()).toEqual([
      "midnight",
      "overlap",
    ]);
    expect(body.total).toBe(2);
    expect(h.gate).toHaveBeenCalled();
    expect(
      h.calls
        .filter((call) => call.table === table)
        .every((call) => call.kind === "admin" && call.count === "exact"),
    ).toBe(true);
    if (route === "slots")
      for (const value of body.slots) {
        expect(value.booking_id).toBeUndefined();
        expect(value.booked_by).toBeUndefined();
      }
    else
      expect(body.bookings[0]).toMatchObject({
        staff_member_id: "staff",
        service_id: "service",
        slot_id: expect.any(String),
        services: { name_fr: "Coupe", name_it: "Taglio" },
      });
  },
);

test.each([
  ["slots", slotsGET, "availability_slots"],
  ["bookings", bookingsGET, "bookings"],
] as const)(
  "%s counted offset supports complete populations beyond the server cap",
  async (route, get, table) => {
    h.cap = 37;
    h.rows[table] = Array.from({ length: 1106 }, (_, index) =>
      row(
        `id-${String(index).padStart(4, "0")}`,
        "2026-09-08T09:00:00Z",
        "2026-09-08T09:30:00Z",
      ),
    );
    const first = await (
      await get(
        request(
          route,
          "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08&limit=100",
        ),
      )
    ).json();
    const next = await (
      await get(
        request(
          route,
          "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08&limit=100&offset=37",
        ),
      )
    ).json();
    expect(first.total).toBe(1106);
    expect(first[route]).toHaveLength(37);
    expect(next[route][0].id).toBe("id-0037");
  },
);

test.each([
  ["slots", slotsGET],
  ["bookings", bookingsGET],
] as const)(
  "%s denies a missing or ungranted caller before any resource query",
  async (route, get) => {
    for (const user of [{ id: "operator" }, null]) {
      h.user = user;
      h.allowed = false;
      const response = await get(
        request(
          route,
          "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08",
        ),
      );
      expect(response.status).toBe(user ? 403 : 401);
      expect(h.calls).toHaveLength(0);
    }
  },
);

test.each([
  ["slots", slotsGET],
  ["bookings", bookingsGET],
] as const)(
  "%s refuses malformed, reversed, overlong or invalid-offset calendar reads",
  async (route, get) => {
    for (const query of [
      "from=2026-02-30&to=2026-03-02",
      "from=2026-09-09&to=2026-09-08",
      "from=2026-01-01&to=2026-03-01",
      "from=2026-09-08&to=2026-09-08&offset=-1",
      "from=2026-09-08&to=2026-09-08&offset=1.5",
      "from=2026-09-08&to=2026-09-08&offset=9007199254740991",
      "from=9999-12-31&to=9999-12-31",
    ]) {
      const response = await get(
        request(route, `calendar=1&salon_id=store&${query}`),
      );
      expect(response.status).toBe(400);
    }
    expect(h.calls).toHaveLength(0);
  },
);

test.each([
  ["slots", slotsGET],
  ["bookings", bookingsGET],
] as const)(
  "%s query error and absent count cannot be presented as an empty success",
  async (route, get) => {
    h.failure = true;
    expect(
      (
        await get(
          request(
            route,
            "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08",
          ),
        )
      ).status,
    ).toBe(500);
    h.failure = false;
    h.missingCount = true;
    expect(
      (
        await get(
          request(
            route,
            "calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08",
          ),
        )
      ).status,
    ).toBe(500);
  },
);

test("public single-day slots contract stays on session RLS and keeps items/slots aliases without calendar privileges", async () => {
  h.user = null;
  h.rows.availability_slots = [
    row("public", "2026-09-08T09:00:00Z", "2026-09-08T09:30:00Z"),
  ];
  const response = await slotsGET(
    request("slots", "salon_id=store&date=2026-09-08"),
  );
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.items).toEqual(body.slots);
  expect(body.total).toBe(1);
  expect(h.gate).not.toHaveBeenCalled();
  expect(h.calls.every((call) => call.kind === "session")).toBe(true);
});

test.each([
  ["2026-09-08", 9, 30, "2026-09-08T07:30:00.000Z"],
  ["2026-01-08", 9, 30, "2026-01-08T08:30:00.000Z"],
  ["2026-10-25", 2, 0, "2026-10-25T01:00:00.000Z"],
  ["2026-10-25", 1, 0, "2026-10-24T23:00:00.000Z"],
  ["2026-03-29", 1, 0, "2026-03-29T00:00:00.000Z"],
  ["2026-10-25", 0, 0, "2026-10-24T22:00:00.000Z"],
  ["2026-03-29", 0, 0, "2026-03-28T23:00:00.000Z"],
  ["2026-03-29", 3, 0, "2026-03-29T01:00:00.000Z"],
] as const)(
  "shared wall-clock conversion is process-timezone independent for %s %s:%s",
  (date, hour, minute, expected) => {
    const previous = process.env.TZ;
    try {
      for (const zone of ["Europe/Zurich", "UTC", "Pacific/Honolulu"]) {
        process.env.TZ = zone;
        expect(
          zurichWallClockToUtc(date, hour, minute).toISOString(),
          zone,
        ).toBe(expected);
      }
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  },
);

test.each(["2026-03-29", "2026-10-25"])(
  "every valid quarter-hour round-trips on transition date %s",
  (day) => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        const instant = zurichWallClockToUtc(day, hour, minute);
        const expected = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        if (day === "2026-03-29" && hour === 2) {
          expect(format.format(instant)).toBe(
            `01:${String(minute).padStart(2, "0")}`,
          );
        } else {
          expect(
            zurichCalendarRange(day, day)!.start <= instant.toISOString(),
          ).toBe(true);
          expect(format.format(instant)).toBe(expected);
        }
      }
    }
  },
);

test('calendar registered-customer enrichment failure refuses the whole read', async () => {
  h.rows.bookings = [{ ...row('registered', '2026-09-08T07:00:00Z', '2026-09-08T07:30:00Z'), user_id: 'customer', guest_name: null }];
  h.failureTable = 'public_profiles';
  const result = await bookingsGET(request('bookings', 'calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08'));
  expect(result.status).toBe(500);
  expect((await result.json()).bookings).toBeUndefined();
});
test.each(['registered', 'missing-profile', 'guest'])('calendar %s identity counterpart retains its valid result', async kind => {
  h.rows.bookings = [{ ...row('person', '2026-09-08T07:00:00Z', '2026-09-08T07:30:00Z'), user_id: kind === 'guest' ? null : 'customer', guest_name: kind === 'guest' ? 'Actual Guest' : null }];
  if (kind === 'registered') h.rows.public_profiles = [{ id: 'customer', display_name: 'Actual Customer' }];
  if (kind === 'guest') h.failureTable = 'public_profiles';
  const result = await bookingsGET(request('bookings', 'calendar=1&salon_id=store&from=2026-09-08&to=2026-09-08'));
  expect(result.status).toBe(200);
  const data = await result.json(); expect(data.total).toBe(1);
  expect(data.bookings[0].customer_name).toBe(kind === 'registered' ? 'Actual Customer' : kind === 'guest' ? 'Actual Guest' : 'Gast');
  if (kind === 'guest') expect(h.calls.some(call => call.table === 'public_profiles')).toBe(false);
});
test('non-calendar scoped bookings retain the existing enrichment-error fallback contract', async () => {
  h.rows.bookings = [{ ...row('person', '2026-09-08T07:00:00Z', '2026-09-08T07:30:00Z'), user_id: 'customer', guest_name: null }];
  h.failureTable = 'public_profiles';
  const result = await bookingsGET(request('bookings', 'salon_id=store'));
  expect(result.status).toBe(200); expect((await result.json()).bookings[0].customer_name).toBe('Gast');
});
