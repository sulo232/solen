import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  cursor: 0,
  states: [] as unknown[],
  services: [] as { id: string }[],
  resetForm: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("react", () => ({
  useEffect: (effect: () => void | (() => void)) => {
    effect();
  },
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => {
    const index = harness.cursor++;
    if (!(index in harness.states)) {
      harness.states[index] = typeof initial === "function"
        ? (initial as () => unknown)()
        : initial;
    }
    const setState = (next: unknown) => {
      harness.states[index] = typeof next === "function"
        ? (next as (current: unknown) => unknown)(harness.states[index])
        : next;
    };
    return [harness.states[index], setState];
  },
}));

vi.mock("react-dom", () => ({
  createPortal: (node: unknown) => node,
}));

vi.mock("motion/react", () => ({
  AnimatePresence: "div",
  motion: { div: "div" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: harness.replace }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("@/lib/booking-context", () => ({
  useBooking: () => ({
    formData: { services: harness.services },
    resetForm: harness.resetForm,
  }),
}));

import BookingExitButton from "@/components-legacy/booking/BookingExitButton";

function renderExitButton() {
  harness.cursor = 0;
  return (BookingExitButton as (props: { slug: string }) => unknown)({ slug: "store-one" });
}

function buttons(node: unknown): Array<{ props: { children?: unknown; onClick?: () => void } }> {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(buttons);
  if (typeof node !== "object") return [];
  const element = node as { type?: unknown; props?: { children?: unknown; onClick?: () => void } };
  const found = element.type === "button" ? [element as { props: { children?: unknown; onClick?: () => void } }] : [];
  return found.concat(buttons(element.props?.children));
}

beforeEach(() => {
  harness.cursor = 0;
  harness.states = [];
  harness.services = [];
  harness.resetForm.mockReset();
  harness.replace.mockReset();
  vi.stubGlobal("window", {
    history: { pushState: vi.fn() },
    location: { href: "https://solen.ch/de/salon/store-one/booking" },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.stubGlobal("document", { body: {} });
});

describe("booking exit draft clearing", () => {
  it("clears a stored draft before an empty selection exits", () => {
    const tree = renderExitButton();
    buttons(tree)[0].props.onClick?.();

    expect(harness.resetForm).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith("/de/salon/store-one");
  });

  it("keeps progress until the user confirms, then clears before exit", () => {
    harness.services = [{ id: "service-1" }];
    let tree = renderExitButton();
    buttons(tree)[0].props.onClick?.();
    expect(harness.resetForm).not.toHaveBeenCalled();
    expect(harness.replace).not.toHaveBeenCalled();

    tree = renderExitButton();
    const confirmExit = buttons(tree).find((button) => button.props.children === "booking.leave.exit");
    expect(confirmExit).toBeDefined();
    confirmExit?.props.onClick?.();

    expect(harness.resetForm).toHaveBeenCalledTimes(1);
    expect(harness.replace).toHaveBeenCalledWith("/de/salon/store-one");
  });
});
