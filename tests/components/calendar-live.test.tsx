import React from "react";
import { act, create } from "react-test-renderer";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import it from "@/messages/it.json";
const h = vi.hoisted(() => ({
  locale: "en",
  messages: {} as any,
  fetch: vi.fn(),
  slots: [] as any[],
  bookings: [] as any[],
  cap: 100,
  fail: "",
  drag: null as any,
}));
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<any>("next-intl");
  return {
    ...actual,
    useLocale: () => h.locale,
    useTranslations: (namespace: string) =>
      actual.createTranslator({
        locale: h.locale,
        messages: h.messages,
        namespace,
      }),
  };
});
vi.mock("@/components-legacy/dashboard/DashboardLayout", () => ({
  default: ({ children }: any) => <main>{children}</main>,
}));
vi.mock("motion/react", () => ({
  motion: new Proxy({}, { get: (_, name) => name }),
  useReducedMotion: () => true,
}));
vi.mock("@/components-legacy/dashboard/WalkInModal", () => ({
  default: (props: any) => <div data-walk-in={props.salonId} />,
}));
vi.mock("@/app/[locale]/_components/primitives/Modal", () => ({
  Modal: ({ children, isOpen }: any) =>
    isOpen ? <div role="dialog">{children}</div> : null,
  ModalHeader: ({ title, onClose, closeAriaLabel }: any) => <header><h2>{title}</h2><button onClick={onClose} aria-label={closeAriaLabel}>X</button></header>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@/lib/supabase-browser", () => ({
  createBrowserSupabaseClient: () => {
    const channel: any = { on: () => channel, subscribe: () => channel };
    return { channel: () => channel, removeChannel: () => Promise.resolve() };
  },
}));
vi.mock("@hello-pangea/dnd", async () => {
  const React = await import("react");
  const Context = React.createContext(false);
  return {
    DragDropContext: ({ children, onDragEnd }: any) => {
      h.drag = onDragEnd;
      return children;
    },
    Droppable: ({ children }: any) => (
      <Context.Provider value>
        {children(
          { innerRef: () => {}, droppableProps: {}, placeholder: null },
          {},
        )}
      </Context.Provider>
    ),
    Draggable: ({ children }: any) => {
      if (!React.useContext(Context))
        throw new Error("Draggable requires a Droppable owner");
      return children(
        { innerRef: () => {}, draggableProps: {}, dragHandleProps: {} },
        {},
      );
    },
  };
});
import CalendarPage from "@/app/[locale]/dashboard/calendar/page";
import { Modal as CalendarModal } from "@/app/[locale]/_components/primitives/Modal";
let tree: any;
const response = (data: unknown, status = 200) => ({
  ok: status < 400,
  status,
  json: async () => data,
});
const text = (node: any): string =>
  typeof node === "string" || typeof node === "number"
    ? String(node)
    : Array.isArray(node)
      ? node.map(text).join(" ")
      : node?.children != null
        ? text(node.children)
        : node?.props?.children != null
          ? text(node.props.children)
          : "";
const t = en.dashboard.calendarPage;
const service = {
  id: "service",
  name_de: "Schnitt",
  name_en: "Cut",
  name_fr: "Coupe",
  name_it: "Taglio",
};
const booking = (
  id: string,
  start = "2026-09-08T07:00:00Z",
  end = "2026-09-08T07:30:00Z",
  staff = "a",
) => ({
  id,
  starts_at: start,
  ends_at: end,
  staff_member_id: staff,
  service_id: "service",
  slot_id: `backing-${id}`,
  customer_name: `Client ${id}`,
  status: "confirmed",
  services: service,
  service_name: "Schnitt",
  staff_name: staff === "a" ? "Alex" : "Bea",
});
const slot = (id: string, member: string | null = null) => ({
  id,
  salon_id: "store",
  staff_member_id: member,
  service_id: "service",
  starts_at: "2026-09-08T09:00:00Z",
  ends_at: "2026-09-08T09:30:00Z",
  status: "available",
  price_override: null,
});
const desktop = () => tree.root.findByProps({ "data-calendar-desktop": true });
const mobile = () => tree.root.findByProps({ "data-calendar-mobile": true });
const button = (root: any, label: string) =>
  root
    .findAllByType("button")
    .find(
      (node: any) =>
        text(node.props.children).trim() === label ||
        node.props["aria-label"] === label,
    );
const click = async (node: any) => {
  await act(async () => node.props.onClick());
};
const mount = async () => {
  await act(async () => {
    tree = create(<CalendarPage />);
  });
};
const timelineIds = () =>
  desktop()
    .findAll(
      (node: any) =>
        typeof node.type === "string" &&
        (node.props["data-calendar-event"] ||
          node.props["data-calendar-time-span"]),
    )
    .map(
      (node: any) =>
        node.props["data-calendar-event"] ??
        node.props["data-calendar-time-span"],
    );
const events = (root: any) =>
  root
    .findAllByType("button")
    .filter((node: any) => node.props["data-calendar-event"]);
function fetchFixture(url: string, init?: RequestInit) {
  if (init?.method) return Promise.resolve(response({}));
  if (url === "/api/profile")
    return Promise.resolve(
      response(
        h.fail === "profile"
          ? { error: "Forbidden" }
          : { id: "operator", salon_id: "store" },
        h.fail === "profile" ? 403 : 200,
      ),
    );
  if (url.startsWith("/api/services"))
    return Promise.resolve(response({ services: [service] }));
  if (url.startsWith("/api/staff"))
    return Promise.resolve(
      response({
        staff: [
          { id: "a", name: "Alex" },
          { id: "b", name: "Bea" },
        ],
      }),
    );
  const query = new URL(url, "http://fixture.invalid");
  const key = query.pathname === "/api/slots" ? "slots" : "bookings";
  if (h.fail === key)
    return Promise.resolve(response({ error: "Failed read" }, 500));
  const rows = h[key];
  const offset = Number(query.searchParams.get("offset") ?? 0);
  return Promise.resolve(
    response({ [key]: rows.slice(offset, offset + h.cap), total: rows.length }),
  );
}
beforeEach(() => {
  h.locale = "en";
  h.messages = en;
  h.slots = [];
  h.bookings = [];
  h.cap = 100;
  h.fail = "";
  h.fetch.mockReset().mockImplementation(fetchFixture);
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-08T10:00:00Z"));
  vi.stubGlobal("fetch", h.fetch);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("default day has real staff columns, exact booking-slot deduplication and unassigned availability", async () => {
  h.bookings = [booking("one")];
  h.slots = [slot("backing-one", "a"), slot("unassigned")];
  await mount();
  expect(
    desktop().findByProps({ "data-calendar-timeline": "day" }),
  ).toBeTruthy();
  expect(
    desktop()
      .findAll((node: any) => node.props["data-calendar-column"])
      .map((node: any) => node.props["data-calendar-column"]),
  ).toEqual(["a", "b", "unassigned"]);
  expect(timelineIds()).toEqual(["booking:one", "slot:unassigned"]);
  expect(
    h.fetch.mock.calls.some(([url]) =>
      url.includes("calendar=1&from=2026-09-07&to=2026-09-13"),
    ),
  ).toBe(true);
});

test("overlaps use grouped selection; short adjacent durations remain proportional and separate on phone", async () => {
  h.bookings = [
    booking("one"),
    booking("two", "2026-09-08T07:15:00Z", "2026-09-08T07:45:00Z"),
    booking("three", "2026-09-08T07:30:00Z", "2026-09-08T07:45:00Z"),
  ];
  await mount();
  const group = desktop().findByProps({
    "data-calendar-group": "booking:one booking:two booking:three",
  });
  expect(group.props.style.height).toBeGreaterThanOrEqual(44);
  const spans = desktop().findAll(
    (node: any) => node.props["data-calendar-time-span"],
  );
  expect(spans.map((node: any) => node.props.style.height)).toEqual([
    44, 44, 22,
  ]);
  await click(group);
  expect(events(tree.root.findByProps({ role: "dialog" }))).toHaveLength(3);
  const rows = events(mobile());
  expect(rows).toHaveLength(3);
  for (const row of rows) {
    expect(row.props.className).toContain("min-h-11");
    expect(row.props.style?.position).toBeUndefined();
  }
  expect(rows[2].props["aria-label"]).toContain("09:30 - 09:45");
  await click(rows[2]);
  expect(
    text(tree.root.findByProps({ role: "dialog" }).props.children),
  ).toContain("Client three");
  expect(tree.root.findByType("a").props.href).toBe("/en/dashboard/bookings");
  expect(h.fetch.mock.calls.some(([, init]) => init?.method)).toBe(false);
});

test("off-hours and a Zurich-midnight booking remain visible with their actual local times", async () => {
  h.bookings = [
    booking("night", "2026-09-07T22:15:00Z", "2026-09-07T22:30:00Z"),
    booking("late", "2026-09-08T20:00:00Z", "2026-09-08T20:30:00Z"),
  ];
  await mount();
  expect(timelineIds()).toHaveLength(2);
  expect(events(mobile()).map((node: any) => node.props["aria-label"])).toEqual(
    expect.arrayContaining([
      expect.stringContaining("00:15 - 00:30"),
      expect.stringContaining("22:00 - 22:30"),
    ]),
  );
});

test.each([
  ["fr", fr, "Coupe"],
  ["it", it, "Taglio"],
])(
  "%s names survive into booking, available slot and detail",
  async (locale, messages, label) => {
    h.locale = locale as string;
    h.messages = messages;
    h.bookings = [booking("one")];
    h.slots = [slot("free")];
    await mount();
    expect(
      events(mobile()).every((node: any) =>
        node.props["aria-label"].includes(label),
      ),
    ).toBe(true);
    await click(events(mobile())[0]);
    expect(text(tree.toJSON())).toContain(label);
  },
);

test("staff filter and week navigation move the actual person and interval; Today restores current day", async () => {
  h.bookings = [booking("alex"), booking("bea", undefined, undefined, "b")];
  await mount();
  await act(async () =>
    desktop()
      .findByType("select")
      .props.onChange({ target: { value: "a" } }),
  );
  await click(button(desktop(), t.viewWeek));
  expect(timelineIds()).toEqual(["booking:alex"]);
  await click(button(desktop(), t.next));
  expect(
    h.fetch.mock.calls.some(([url]) =>
      url.includes("from=2026-09-14&to=2026-09-20"),
    ),
  ).toBe(true);
  expect(events(desktop())).toHaveLength(0);
  await click(button(desktop(), t.today));
  await click(button(desktop(), t.viewDay));
  expect(timelineIds()).toEqual(["booking:alex"]);
});

test("month navigation clamps to the next month and picking a day loads its week", async () => {
  vi.setSystemTime(new Date("2026-01-31T10:00:00Z"));
  await mount();
  await click(button(desktop(), t.viewMonth));
  await click(button(desktop(), t.next));
  expect(text(desktop().props.children)).toContain("February 2026");
  await click(desktop().findByProps({ "data-calendar-date": "2026-03-01" }));
  expect(
    h.fetch.mock.calls.some(([url]) =>
      url.includes("from=2026-02-23&to=2026-03-01"),
    ),
  ).toBe(true);
  expect(
    desktop().findByProps({ "data-calendar-timeline": "day" }),
  ).toBeTruthy();
});

test("phone day/week/month controls retain their own mode and week arrows advance seven days", async () => {
  await mount();
  await click(button(mobile(), t.viewWeek));
  await click(button(mobile(), t.next));
  expect(
    h.fetch.mock.calls.some(([url]) =>
      url.includes("from=2026-09-14&to=2026-09-20"),
    ),
  ).toBe(true);
  await click(button(mobile(), t.viewMonth));
  expect(
    mobile().findByProps({ "data-calendar-month": "mobile" }),
  ).toBeTruthy();
  expect(button(desktop(), t.viewDay).props["aria-pressed"]).toBe(true);
  await click(mobile().findByProps({ "data-calendar-date": "2026-09-08" }));
  expect(button(mobile(), t.viewDay).props["aria-pressed"]).toBe(true);
});

test("counted pages advance by returned rows under a lower server cap", async () => {
  h.cap = 2;
  h.bookings = Array.from({ length: 5 }, (_, i) => booking(String(i)));
  await mount();
  expect(events(mobile())).toHaveLength(5);
  expect(
    h.fetch.mock.calls
      .filter(([url]) => url.startsWith("/api/bookings"))
      .map(([url]) =>
        new URL(url, "http://fixture.invalid").searchParams.get("offset"),
      ),
  ).toEqual(["0", "2", "4"]);
});

test.each(["profile", "slots", "bookings"])(
  "%s failure is visible; Retry reaches a valid empty calendar",
  async (failure) => {
    h.fail = failure;
    await mount();
    expect(desktop().findByProps({ role: "alert" })).toBeTruthy();
    expect(events(desktop())).toHaveLength(0);
    h.fail = "";
    await click(button(desktop(), t.retry));
    expect(desktop().findAllByProps({ role: "alert" })).toHaveLength(0);
    expect(
      desktop().findByProps({ "data-calendar-timeline": "day" }),
    ).toBeTruthy();
    expect(text(mobile().props.children)).toContain(t.noSlotsThisDay);
  },
);

test("selected day/staff flows into Add and a calendar cell; slot actions keep their persisted identity", async () => {
  h.slots = [slot("free", "a")];
  await mount();
  await act(async () =>
    desktop()
      .findByType("select")
      .props.onChange({ target: { value: "a" } }),
  );
  await click(button(desktop(), t.next));
  await click(button(desktop(), t.add));
  const selects = tree.root
    .findAllByType("select")
    .filter((node: any) => !node.props["aria-label"]);
  expect(selects[1].props.value).toBe("a");
  await act(async () =>
    selects[0].props.onChange({ target: { value: "service" } }),
  );
  await click(button(tree.root, t.create));
  const write = h.fetch.mock.calls.find(([, init]) => init?.method === "POST");
  expect(JSON.parse(write![1].body)).toMatchObject({
    date: "2026-09-09",
    start_time: "09:00",
    service_id: "service",
    staff_member_id: "a",
  });
});

test("available-slot drag preserves actual duration and converts the picked Zurich time", async () => {
  h.slots = [{ ...slot("free", "a"), ends_at: "2026-09-08T10:00:00Z" }];
  await mount();
  expect(events(desktop())).toHaveLength(1);
  await act(async () =>
    h.drag({
      draggableId: "slot:free:a",
      destination: { droppableId: "2026-09-09|2026-09-09T08:00:00.000Z|b" },
    }),
  );
  const write = h.fetch.mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(write![0]).toBe("/api/slots/free");
  expect(JSON.parse(write![1].body)).toEqual({
    starts_at: "2026-09-09T08:00:00.000Z",
    ends_at: "2026-09-09T09:00:00.000Z",
    staff_member_id: "b",
  });
});

test.each(["empty", "duplicate", "count"])(
  "a later %s page refuses partial calendar data",
  async (kind) => {
    h.cap = 1;
    h.bookings = [booking("one"), booking("two")];
    h.fetch.mockImplementation((url: string, init?: RequestInit) => {
      if (url.startsWith("/api/bookings") && url.includes("offset=1"))
        return Promise.resolve(
          response({
            bookings: kind === "empty" ? [] : [booking("one")],
            total: kind === "count" ? 3 : 2,
          }),
        );
      return fetchFixture(url, init);
    });
    await mount();
    expect(desktop().findByProps({ role: "alert" })).toBeTruthy();
    expect(events(mobile())).toHaveLength(0);
  },
);

test("obsolete interval success cannot replace a newer selected week", async () => {
  let finish!: (value: ReturnType<typeof response>) => void;
  const previous = new Promise<ReturnType<typeof response>>((resolve) => {
    finish = resolve;
  });
  h.fetch.mockImplementation((url: string, init?: RequestInit) =>
    url.startsWith("/api/bookings") && url.includes("from=2026-09-07")
      ? previous
      : fetchFixture(url, init),
  );
  await mount();
  await click(button(desktop(), t.viewWeek));
  await click(button(desktop(), t.next));
  expect(desktop().findAllByProps({ role: "alert" })).toHaveLength(0);
  await act(async () =>
    finish(response({ bookings: [booking("obsolete")], total: 1 })),
  );
  expect(events(desktop())).toHaveLength(0);
  expect(text(desktop().props.children)).toContain("14 September");
});

test("canceled booking does not hide its available backing slot; unknown assigned staff still has a column", async () => {
  h.bookings = [
    { ...booking("cancelled"), status: "cancelled" },
    booking("unknown", undefined, undefined, "former-staff"),
  ];
  h.slots = [slot("backing-cancelled", "a")];
  await mount();
  expect(timelineIds().sort()).toEqual([
    "booking:unknown",
    "slot:backing-cancelled",
  ]);
  expect(
    desktop().findByProps({ "data-calendar-column": "former-staff" }),
  ).toBeTruthy();
});

test("a rejected slot create remains visible and offers retry instead of reporting creation", async () => {
  await mount();
  await click(button(desktop(), t.add));
  const select = tree.root
    .findAllByType("select")
    .find((node: any) => !node.props["aria-label"]);
  await act(async () =>
    select.props.onChange({ target: { value: "service" } }),
  );
  h.fetch.mockImplementation((url: string, init?: RequestInit) =>
    init?.method === "POST"
      ? Promise.resolve(response({ error: "Forbidden" }, 403))
      : fetchFixture(url, init),
  );
  await click(button(tree.root, t.create));
  expect(tree.root.findAllByProps({ role: "alert" })).toHaveLength(1);
  h.fetch.mockImplementation(fetchFixture);
  await click(button(tree.root, t.retry));
  expect(tree.root.findAllByProps({ role: "alert" })).toHaveLength(0);
  expect(
    tree.root
      .findAllByType("h3")
      .some((node: any) => text(node.props.children) === t.createSlotTitle),
  ).toBe(false);
  expect(
    h.fetch.mock.calls.filter(([, init]) => init?.method === "POST"),
  ).toHaveLength(1);
});

test.each([5, 0.5])(
  "supported short %s-minute adjacent bookings keep a bounded axis and separate modal/phone targets",
  async (minutes) => {
    const begin = Date.parse("2026-09-08T07:00:00Z");
    h.bookings = Array.from({ length: 12 }, (_, index) =>
      booking(
        `short-${index}`,
        new Date(begin + index * minutes * 60000).toISOString(),
        new Date(begin + (index + 1) * minutes * 60000).toISOString(),
      ),
    );
    await mount();
    const timeline = desktop().findByProps({ "data-calendar-timeline": "day" });
    const canvas = timeline.findAll(
      (node: any) =>
        typeof node.type === "string" && node.props.style?.height === 1056,
    );
    expect(canvas).toHaveLength(1);
    const spans = desktop().findAll(
      (node: any) => node.props["data-calendar-time-span"],
    );
    expect(spans).toHaveLength(12);
    for (const span of spans)
      expect(span.props.style.height).toBeCloseTo((minutes * 88) / 60);
    const group = desktop()
      .findAllByType("button")
      .find((node: any) => node.props["data-calendar-group"]);
    expect(group.props.style.height).toBeGreaterThanOrEqual(44);
    expect(group.props.className).toContain("focus-visible:outline");
    await click(group);
    const rows = events(tree.root.findByProps({ role: "dialog" }));
    expect(rows).toHaveLength(12);
    expect(
      rows.every(
        (node: any) =>
          node.props.className.includes("min-h-11") &&
          node.props.className.includes("focus-visible:outline"),
      ),
    ).toBe(true);
    expect(events(mobile())).toHaveLength(12);
    await click(rows[11]);
    expect(
      text(tree.root.findByProps({ role: "dialog" }).props.children),
    ).toContain("Client short-11");
  },
);

test("zero-length data fails visibly instead of inventing an appointment duration", async () => {
  h.bookings = [
    booking("invalid", "2026-09-08T07:00:00Z", "2026-09-08T07:00:00Z"),
  ];
  await mount();
  expect(desktop().findByProps({ role: "alert" })).toBeTruthy();
});

test("a grouped unassigned slot still opens its persisted detail and reassignment action", async () => {
  h.slots = [
    {
      ...slot("tiny"),
      starts_at: "2026-09-08T07:00:00Z",
      ends_at: "2026-09-08T07:05:00Z",
    },
  ];
  await mount();
  await click(desktop().findByProps({ "data-calendar-group": "slot:tiny" }));
  await click(events(tree.root.findByProps({ role: "dialog" }))[0]);
  await click(button(tree.root, t.reschedule));
  const select = tree.root
    .findAllByType("select")
    .find(
      (node: any) =>
        node.props["aria-label"] === t.staffLabel && node.props.value === "",
    );
  await act(async () => select.props.onChange({ target: { value: "b" } }));
  await click(button(tree.root, t.reschedule));
  const write = h.fetch.mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(write![0]).toBe("/api/slots/tiny");
  expect(JSON.parse(write![1].body)).toMatchObject({
    starts_at: "2026-09-08T07:00:00.000Z",
    ends_at: "2026-09-08T07:05:00.000Z",
    staff_member_id: "b",
  });
});

test("the repeated Zurich hour keeps both appointment identities, elapsed positions and distinct offset labels", async () => {
  vi.setSystemTime(new Date("2026-10-25T08:00:00Z"));
  h.bookings = [
    booking("first-fold", "2026-10-25T00:15:00Z", "2026-10-25T00:45:00Z"),
    booking("second-fold", "2026-10-25T01:15:00Z", "2026-10-25T01:45:00Z"),
  ];
  await mount();
  expect(timelineIds()).toEqual(["booking:first-fold", "booking:second-fold"]);
  const rows = events(mobile());
  expect(rows[0].props["aria-label"]).toContain("GMT+2");
  expect(rows[1].props["aria-label"]).toContain("GMT+1");
  expect(events(desktop()).map((row: any) => row.props.style.height)).toEqual([
    44, 44,
  ]);
  const creates = desktop()
    .findAllByType("button")
    .filter((row: any) =>
      row.props["aria-label"]?.startsWith(t.createSlotTitle),
    );
  expect(
    creates.map((row: any) => [row.props.disabled, row.props["aria-label"]]),
  ).toContainEqual([true, "Create slot Alex 02:00 GMT+2"]);
  expect(
    creates.some(
      (row: any) =>
        !row.props.disabled && row.props["aria-label"].includes("GMT+1"),
    ),
  ).toBe(true);
  await click(button(desktop(), t.viewWeek));
  expect(timelineIds()).toEqual(["booking:first-fold", "booking:second-fold"]);
});

test("spring clock jump displays the actual twenty-minute span and wall-clock labels", async () => {
  vi.setSystemTime(new Date("2026-03-29T08:00:00Z"));
  h.bookings = [
    booking("spring", "2026-03-29T00:50:00Z", "2026-03-29T01:10:00Z"),
  ];
  await mount();
  const span = desktop().findByProps({
    "data-calendar-time-span": "booking:spring",
  });
  expect(span.props.style.height).toBeCloseTo((20 * 88) / 60);
  expect(events(mobile())[0].props["aria-label"]).toContain("01:50 - 03:10");
});

test("rejected drag reports a save error and Retry reads without repeating the mutation", async () => {
  h.slots = [{ ...slot("free", "a"), ends_at: "2026-09-08T10:00:00Z" }];
  await mount();
  h.fetch.mockImplementation((url: string, init?: RequestInit) =>
    init?.method === "PATCH"
      ? Promise.resolve(response({ error: "Forbidden" }, 403))
      : fetchFixture(url, init),
  );
  await act(async () =>
    h.drag({
      draggableId: "slot:free:a",
      destination: { droppableId: "2026-09-09|2026-09-09T08:00:00.000Z|b" },
    }),
  );
  expect(
    text(desktop().findByProps({ role: "alert" }).props.children),
  ).toContain(en.common.errorSaving);
  await click(button(desktop(), t.retry));
  expect(desktop().findAllByProps({ role: "alert" })).toHaveLength(0);
  expect(
    h.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH"),
  ).toHaveLength(1);
  expect(timelineIds()).toEqual(["slot:free"]);
});

test("reassigning a first-fold short slot preserves its exact instant and input time", async () => {
  vi.setSystemTime(new Date("2026-10-25T08:00:00Z"));
  h.slots = [
    {
      ...slot("first-fold"),
      starts_at: "2026-10-25T00:15:00Z",
      ends_at: "2026-10-25T00:20:00Z",
    },
  ];
  await mount();
  await click(
    desktop().findByProps({ "data-calendar-group": "slot:first-fold" }),
  );
  await click(events(tree.root.findByProps({ role: "dialog" }))[0]);
  await click(button(tree.root, t.reschedule));
  expect(tree.root.findByProps({ type: "time" }).props.value).toBe("02:15");
  const select = tree.root
    .findAllByType("select")
    .find(
      (node: any) =>
        node.props["aria-label"] === t.staffLabel && node.props.value === "",
    );
  await act(async () => select.props.onChange({ target: { value: "b" } }));
  await click(button(tree.root, t.reschedule));
  const write = h.fetch.mock.calls.find(([, init]) => init?.method === "PATCH");
  expect(JSON.parse(write![1].body)).toMatchObject({
    starts_at: "2026-10-25T00:15:00.000Z",
    ends_at: "2026-10-25T00:20:00.000Z",
    staff_member_id: "b",
  });
});

test.each([
  [
    "2026-03-29",
    "2026-03-28T23:00:00Z",
    "2026-03-29T00:00:00.000Z",
    "2026-03-29T02:00:00Z",
  ],
  [
    "2026-10-25",
    "2026-10-24T22:00:00Z",
    "2026-10-24T23:00:00.000Z",
    "2026-10-25T03:00:00Z",
  ],
])(
  "valid transition-day 01:00 create and reschedule stay connected on %s",
  async (day, midnight, expected, original) => {
    vi.setSystemTime(new Date(`${day}T08:00:00Z`));
    h.bookings = [
      booking(
        "midnight",
        midnight,
        new Date(Date.parse(midnight) + 30 * 60000).toISOString(),
      ),
    ];
    h.slots = [
      {
        ...slot("move", "a"),
        starts_at: original,
        ends_at: new Date(Date.parse(original) + 30 * 60000).toISOString(),
      },
    ];
    await mount();
    const createAtOne = button(desktop(), `${t.createSlotTitle} Alex 01:00`);
    expect(createAtOne.props.disabled).toBe(false);
    await click(createAtOne);
    expect(text(tree.toJSON())).toContain(`${day} at 01:00`);
    const select = tree.root
      .findAllByType("select")
      .find((node: any) => !node.props["aria-label"]);
    await act(async () =>
      select.props.onChange({ target: { value: "service" } }),
    );
    await click(button(tree.root, t.create));
    const createWrite = h.fetch.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(JSON.parse(createWrite![1].body)).toMatchObject({
      date: day,
      start_time: "01:00",
      staff_member_id: "a",
    });
    await click(desktop().findByProps({ "data-calendar-event": "slot:move" }));
    await click(button(tree.root, t.reschedule));
    await act(async () =>
      tree.root
        .findByProps({ type: "time" })
        .props.onChange({ target: { value: "01:00" } }),
    );
    await click(button(tree.root, t.reschedule));
    const moveWrite = h.fetch.mock.calls.find(
      ([, init]) => init?.method === "PATCH",
    );
    expect(JSON.parse(moveWrite![1].body)).toMatchObject({
      starts_at: expected,
      ends_at: new Date(Date.parse(expected) + 30 * 60000).toISOString(),
    });
  },
);

test("rescheduling into the missing spring hour stays visibly refused without a write", async () => {
  vi.setSystemTime(new Date("2026-03-29T08:00:00Z"));
  h.slots = [
    {
      ...slot("spring", "a"),
      starts_at: "2026-03-29T02:00:00Z",
      ends_at: "2026-03-29T02:30:00Z",
    },
  ];
  await mount();
  await click(desktop().findByProps({ "data-calendar-event": "slot:spring" }));
  await click(button(tree.root, t.reschedule));
  await act(async () =>
    tree.root
      .findByProps({ type: "time" })
      .props.onChange({ target: { value: "02:30" } }),
  );
  await click(button(tree.root, t.reschedule));
  expect(
    h.fetch.mock.calls.filter(([, init]) => init?.method === "PATCH"),
  ).toHaveLength(0);
  expect(
    text(desktop().findByProps({ role: "alert" }).props.children),
  ).toContain(en.common.errorSaving);
});

test.each(['en', 'fr', 'it'])('group and booking close callbacks use the active %s label and clear their actual state', async locale => {
  h.locale = locale; h.messages = locale === 'fr' ? fr : locale === 'it' ? it : en;
  h.bookings = [booking('close', '2026-09-08T07:00:00Z', '2026-09-08T07:05:00Z')];
  await mount();
  await click(desktop().findByProps({ 'data-calendar-group': 'booking:close' }));
  const label = h.messages.dashboard.calendarPage.cancel;
  await click(button(tree.root.findByProps({ role: 'dialog' }), label));
  expect(tree.root.findAllByProps({ role: 'dialog' })).toHaveLength(0);
  await click(desktop().findByProps({ 'data-calendar-group': 'booking:close' }));
  await click(events(tree.root.findByProps({ role: 'dialog' }))[0]);
  await click(button(tree.root.findByProps({ role: 'dialog' }), label));
  expect(tree.root.findAllByProps({ role: 'dialog' })).toHaveLength(0);
});

test.each(['create', 'plan', 'detail'])('the %s action is wired to the registered modal dismissal contract', async kind => {
  h.slots = [slot('detail', 'a')]; await mount();
  await click(kind === 'create' ? button(desktop(), t.add) : kind === 'plan' ? button(desktop(), t.plan) : desktop().findByProps({ 'data-calendar-event': 'slot:detail' }));
  const owner = tree.root.findByType(CalendarModal);
  expect(owner.props.isOpen).toBe(true);
  expect(owner.props['aria-label']).toBe(kind === 'create' ? t.createSlotTitle : kind === 'plan' ? t.createWeekScheduleTitle : t.detailsTitle);
  await act(async () => owner.props.onOpenChange(false));
  expect(tree.root.findAllByProps({ role: 'dialog' })).toHaveLength(0);
  expect(h.fetch.mock.calls.some(([, init]) => init?.method)).toBe(false);
});
