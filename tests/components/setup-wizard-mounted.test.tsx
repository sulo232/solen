import React, { forwardRef, useEffect, useImperativeHandle } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mountedRenderers: ReactTestRenderer[] = [];

function track(renderer: ReactTestRenderer): ReactTestRenderer {
  mountedRenderers.push(renderer);
  return renderer;
}

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: { div: "div" },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "de",
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock("@/components-legacy/ui/ImageUploader", () => ({
  default: () => <div data-testid="image-uploader" />,
}));

import SetupWizard, {
  type SetupWizardRenderProps,
  type Step,
  type StepHandle,
} from "@/components-legacy/onboarding/SetupWizard";
import GoLiveStep from "@/components-legacy/onboarding/steps/GoLiveStep";
import OpeningHoursStep from "@/components-legacy/onboarding/steps/OpeningHoursStep";
import SalonProfileStep from "@/components-legacy/onboarding/steps/SalonProfileStep";
import ServicesStep from "@/components-legacy/onboarding/steps/ServicesStep";
import TeamStep from "@/components-legacy/onboarding/steps/TeamStep";

function renderedText(node: ReactTestInstance): string {
  return node.children.map((child) => typeof child === "string" ? child : renderedText(child)).join("");
}

function button(renderer: ReactTestRenderer, label: string): ReactTestInstance {
  const match = renderer.root.findAllByType("button").find((candidate) => renderedText(candidate).includes(label));
  if (!match) throw new Error(`Missing button ${label}`);
  return match;
}

function mountedStep(
  label: string,
  save: () => Promise<boolean>,
  lifecycle: string[],
) {
  return forwardRef<StepHandle>(function MountedStep(_props, ref) {
    useImperativeHandle(ref, () => ({ save }));
    useEffect(() => {
      lifecycle.push(`mount:${label}`);
      return () => {
        lifecycle.push(`unmount:${label}`);
      };
    }, []);
    return <div>{label}</div>;
  });
}

const twoSteps: Step[] = [
  { key: "profile", complete: false },
  { key: "hours", complete: false },
];

async function mountWizard(children: React.ReactNode[], onComplete = vi.fn()) {
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = track(create(
      <SetupWizard
        salonId="salon-1"
        initialSteps={twoSteps}
        locale="de"
        onComplete={onComplete}
      >
        {children}
      </SetupWizard>,
    ));
  });
  return renderer as ReactTestRenderer;
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

afterEach(async () => {
  await act(async () => {
    mountedRenderers.splice(0).forEach((renderer) => renderer.unmount());
  });
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("mounted setup wizard", () => {
  it("waits, exposes in-control feedback, ignores a repeated click, then mounts only the next step", async () => {
    const lifecycle: string[] = [];
    let finishSave: ((saved: boolean) => void) | undefined;
    const save = vi.fn(() => new Promise<boolean>((resolve) => {
      finishSave = resolve;
    }));
    const First = mountedStep("first-step", save, lifecycle);
    const Second = mountedStep("second-step", async () => true, lifecycle);
    const renderer = await mountWizard([<First key="first" />, <Second key="second" />]);

    const next = button(renderer, "onboarding.setup.next");
    let firstClick: Promise<void> | undefined;
    await act(async () => {
      firstClick = next.props.onClick();
      next.props.onClick();
      await Promise.resolve();
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(button(renderer, "onboarding.setup.next").props.disabled).toBe(true);
    expect(button(renderer, "onboarding.setup.next").props["aria-busy"]).toBe(true);
    expect(renderer.root.findAllByProps({ role: "status" })).toHaveLength(1);
    expect(renderedText(renderer.root)).toContain("first-step");
    expect(renderedText(renderer.root)).not.toContain("second-step");

    await act(async () => {
      finishSave?.(true);
      await firstClick;
    });

    expect(renderedText(renderer.root)).not.toContain("first-step");
    expect(renderedText(renderer.root)).toContain("second-step");
    expect(lifecycle).toEqual(["mount:first-step", "unmount:first-step", "mount:second-step"]);
  });

  it("stays mounted after false and rejected saves, then advances once after success", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const lifecycle: string[] = [];
    const save = vi.fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error("save failed"))
      .mockResolvedValueOnce(true);
    const First = mountedStep("first-step", save, lifecycle);
    const Second = mountedStep("second-step", async () => true, lifecycle);
    const renderer = await mountWizard([<First key="first" />, <Second key="second" />]);

    await act(async () => button(renderer, "onboarding.setup.next").props.onClick());
    expect(renderedText(renderer.root)).toContain("first-step");

    await act(async () => button(renderer, "onboarding.setup.next").props.onClick());
    expect(renderedText(renderer.root)).toContain("first-step");

    await act(async () => button(renderer, "onboarding.setup.next").props.onClick());
    expect(renderedText(renderer.root)).toContain("second-step");
    expect(save).toHaveBeenCalledTimes(3);
    expect(lifecycle).toEqual(["mount:first-step", "unmount:first-step", "mount:second-step"]);
  });
});

describe("mounted setup children with in-flight actions", () => {
  it.each([
    ["failure", false],
    ["success", true],
  ])("awaits the current Services Add POST and handles %s before advancing", async (_case, succeeds) => {
    if (!succeeds) vi.spyOn(console, "error").mockImplementation(() => undefined);
    let finishPost: ((response: unknown) => void) | undefined;
    const post = new Promise((resolve) => {
      finishPost = resolve;
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/salons/mine") {
        return Promise.resolve({ ok: true, json: async () => ({ salon: { id: "salon-1", categories: ["hair"] } }) });
      }
      if (url === "/api/services?salon_id=salon-1") {
        return Promise.resolve({ ok: true, json: async () => ({ services: [] }) });
      }
      if (url === "/api/services/suggest?categories=hair") {
        return Promise.resolve({ ok: true, json: async () => ({ suggestions: [] }) });
      }
      if (url === "/api/services" && init?.method === "POST") return post;
      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSaved = vi.fn();
    const lifecycle: string[] = [];
    const Second = mountedStep("second-step", async () => true, lifecycle);
    const renderer = await mountWizard([
      <ServicesStep key="services" onSaved={onSaved} />,
      <Second key="second" />,
    ]);
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      button(renderer, "onboarding.services.add").props.onClick();
    });
    const nameInput = renderer.root.findAllByType("input").find((input) => input.props.type !== "number");
    if (!nameInput) throw new Error("Missing service name input");
    await act(async () => {
      nameInput.props.onChange({ target: { value: "Cut" } });
    });

    let addPromise: Promise<boolean> | undefined;
    await act(async () => {
      addPromise = button(renderer, "onboarding.services.add").props.onClick();
      await Promise.resolve();
    });
    let nextPromise: Promise<void> | undefined;
    await act(async () => {
      nextPromise = button(renderer, "onboarding.setup.next").props.onClick();
      await Promise.resolve();
    });

    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/services" && init?.method === "POST")).toHaveLength(1);
    expect(button(renderer, "onboarding.setup.next").props.disabled).toBe(true);
    expect(button(renderer, "onboarding.setup.next").props["aria-busy"]).toBe(true);
    expect(renderedText(renderer.root)).not.toContain("second-step");

    await act(async () => {
      finishPost?.({
        ok: succeeds,
        status: succeeds ? 200 : 503,
        json: async () => succeeds ? { service: { id: "service-1" } } : {},
      });
      await addPromise;
      await nextPromise;
    });

    expect(onSaved).toHaveBeenCalledTimes(succeeds ? 1 : 0);
    expect(renderedText(renderer.root).includes("second-step")).toBe(succeeds);
    expect(renderer.root.findAllByProps({ role: "alert" })).toHaveLength(succeeds ? 0 : 1);
  });

  it.each([
    ["failure", false],
    ["success", true],
  ])("awaits the current Team invite POST and handles %s before advancing", async (_case, succeeds) => {
    let finishPost: ((response: unknown) => void) | undefined;
    const post = new Promise((resolve) => {
      finishPost = resolve;
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (url === "/api/staff/invite" && init?.method === "POST") return post;
      throw new Error(`Unexpected fetch ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSaved = vi.fn();
    const lifecycle: string[] = [];
    const Second = mountedStep("second-step", async () => true, lifecycle);
    const renderer = await mountWizard([
      <TeamStep key="team" onSaved={onSaved} />,
      <Second key="second" />,
    ]);

    const emailInput = renderer.root.findByProps({ type: "email" });
    await act(async () => {
      emailInput.props.onChange({ target: { value: "team@example.ch" } });
    });

    let invitePromise: Promise<boolean> | undefined;
    await act(async () => {
      invitePromise = button(renderer, "onboarding.team.sendInvite").props.onClick();
      await Promise.resolve();
    });
    let nextPromise: Promise<void> | undefined;
    await act(async () => {
      nextPromise = button(renderer, "onboarding.setup.next").props.onClick();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button(renderer, "onboarding.setup.next").props.disabled).toBe(true);
    expect(button(renderer, "onboarding.setup.next").props["aria-busy"]).toBe(true);
    expect(renderedText(renderer.root)).not.toContain("second-step");

    await act(async () => {
      finishPost?.({
        ok: succeeds,
        status: succeeds ? 200 : 503,
        json: async () => succeeds ? {} : { error: "Invite failed" },
      });
      await invitePromise;
      await nextPromise;
    });

    expect(onSaved).toHaveBeenCalledTimes(succeeds ? 1 : 0);
    expect(renderedText(renderer.root).includes("second-step")).toBe(succeeds);
    expect(renderer.root.findAllByProps({ role: "alert" })).toHaveLength(succeeds ? 0 : 1);
  });
});

describe("mounted setup step handlers", () => {
  it("does not PATCH opening-hour defaults before the current Store data loads", async () => {
    let finishLoad: ((response: unknown) => void) | undefined;
    const load = new Promise((resolve) => {
      finishLoad = resolve;
    });
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (!init) return load;
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    const firstOnSaved = vi.fn();
    const latestOnSaved = vi.fn();
    const stepRef = React.createRef<StepHandle>();
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = track(create(<OpeningHoursStep ref={stepRef} salonId="salon-1" onSaved={firstOnSaved} />));
    });
    await act(async () => {
      await expect(stepRef.current?.save()).resolves.toBe(false);
    });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    expect(renderer?.root.findAllByProps({ role: "alert" })).toHaveLength(1);

    await act(async () => {
      finishLoad?.({
        ok: true,
        status: 200,
        json: async () => ({ opening_hours: { mon: { open: "10:00", close: "17:00" } } }),
      });
      await load;
      await Promise.resolve();
      await Promise.resolve();
    });
    await act(async () => {
      renderer?.update(<OpeningHoursStep ref={stepRef} salonId="salon-1" onSaved={latestOnSaved} />);
    });
    await act(async () => {
      await expect(stepRef.current?.save()).resolves.toBe(true);
    });

    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(1);
    const patch = fetchMock.mock.calls.find(([, init]) => init?.method === "PATCH")?.[1];
    expect(JSON.parse(String(patch?.body)).opening_hours).toEqual({ mon: { open: "10:00", close: "17:00" } });
    expect(firstOnSaved).not.toHaveBeenCalled();
    expect(latestOnSaved).toHaveBeenCalledTimes(1);
  });

  it("keeps an opening-hours load failure visible and never PATCHes defaults", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const stepRef = React.createRef<StepHandle>();
    let renderer: ReactTestRenderer | undefined;
    await act(async () => {
      renderer = track(create(<OpeningHoursStep ref={stepRef} salonId="salon-1" onSaved={vi.fn()} />));
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await expect(stepRef.current?.save()).resolves.toBe(false);
    });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH")).toHaveLength(0);
    expect(renderer?.root.findAllByProps({ role: "alert" })).toHaveLength(1);
  });

  it("shows the existing error treatment for silent profile and service validation failures", async () => {
    const fetchMock = vi.fn((...args: [string, RequestInit?]) => {
      const [url] = args;
      return Promise.resolve({
        ok: true,
        json: async () => url === "/api/salons/mine" ? { salon: null } : {},
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const profileRef = React.createRef<StepHandle>();
    const servicesRef = React.createRef<StepHandle>();
    let profile: ReactTestRenderer | undefined;
    let services: ReactTestRenderer | undefined;
    await act(async () => {
      profile = track(create(<SalonProfileStep ref={profileRef} salonId="salon-1" onSaved={vi.fn()} />));
      services = track(create(<ServicesStep ref={servicesRef} onSaved={vi.fn()} />));
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await expect(profileRef.current?.save()).resolves.toBe(false);
      await expect(servicesRef.current?.save()).resolves.toBe(false);
    });
    expect(profile?.root.findAllByProps({ role: "alert" })).toHaveLength(1);
    expect(services?.root.findAllByProps({ role: "alert" })).toHaveLength(1);
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "PATCH" || init?.method === "POST")).toHaveLength(0);
  });
});

function goLiveChild(onComplete: () => void) {
  return function RenderGoLive({ steps, goTo, stepRef }: SetupWizardRenderProps) {
    return <GoLiveStep ref={stepRef} onGoLive={onComplete} steps={steps} goTo={goTo} />;
  };
}

async function mountGoLiveWizard(fetchMock: ReturnType<typeof vi.fn>, onComplete: () => void) {
  vi.stubGlobal("fetch", fetchMock);
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = track(create(
      <SetupWizard
        salonId="salon-1"
        initialSteps={[{ key: "go_live", complete: false }]}
        locale="de"
        onComplete={onComplete}
      >
        {[goLiveChild(onComplete)]}
      </SetupWizard>,
    ));
    await Promise.resolve();
    await Promise.resolve();
  });
  return renderer as ReactTestRenderer;
}

describe("mounted final activation", () => {
  it.each([
    ["onboarding.setup.goLive"],
    ["onboarding.goLive.activate"],
  ])("routes %s through one readiness-checked, guarded activation", async (controlLabel) => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          has_stripe: true,
          has_cover_photo: true,
          has_services: true,
          approval_state: "approved",
          rejection_reason: null,
          can_go_live: true,
        }),
      })
      .mockResolvedValue({ ok: true, json: async () => ({}) });
    const renderer = await mountGoLiveWizard(fetchMock, onComplete);

    const control = button(renderer, controlLabel);
    let firstClick: Promise<void> | undefined;
    await act(async () => {
      firstClick = control.props.onClick();
      control.props.onClick();
      await Promise.resolve();
    });
    expect(fetchMock.mock.calls.filter(([url, init]) => url === "/api/salon/go-live" && init?.method === "POST")).toHaveLength(1);
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
      await firstClick;
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["onboarding.setup.goLive", "onboarding.goLive.activate"],
    ["onboarding.goLive.activate", "onboarding.setup.goLive"],
  ])("shares one in-flight guard between %s and %s", async (firstLabel, secondLabel) => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    let finishPost: ((response: unknown) => void) | undefined;
    const post = new Promise((resolve) => {
      finishPost = resolve;
    });
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === "POST") return post;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          has_stripe: true,
          has_cover_photo: true,
          has_services: true,
          approval_state: "approved",
          rejection_reason: null,
          can_go_live: true,
        }),
      });
    });
    const renderer = await mountGoLiveWizard(fetchMock, onComplete);

    let firstClick: Promise<void> | undefined;
    await act(async () => {
      firstClick = button(renderer, firstLabel).props.onClick();
      button(renderer, secondLabel).props.onClick();
      await Promise.resolve();
    });
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(1);

    await act(async () => {
      finishPost?.({ ok: true, json: async () => ({}) });
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(2000);
      await firstClick;
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not POST or complete while readiness denies activation", async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        has_stripe: true,
        has_cover_photo: true,
        has_services: true,
        approval_state: "pending",
        rejection_reason: null,
        can_go_live: false,
      }),
    });
    const renderer = await mountGoLiveWizard(fetchMock, onComplete);

    await act(async () => button(renderer, "onboarding.setup.goLive").props.onClick());
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
    expect(onComplete).not.toHaveBeenCalled();
    expect(renderedText(renderer.root)).toContain("onboarding.goLive.awaitingBody");
  });

  it("keeps the final step and existing error treatment when activation fails", async () => {
    const onComplete = vi.fn();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          has_stripe: true,
          has_cover_photo: true,
          has_services: true,
          approval_state: "approved",
          rejection_reason: null,
          can_go_live: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ code: "AWAITING_APPROVAL" }),
      });
    const renderer = await mountGoLiveWizard(fetchMock, onComplete);

    await act(async () => button(renderer, "onboarding.setup.goLive").props.onClick());
    expect(onComplete).not.toHaveBeenCalled();
    expect(renderedText(renderer.root)).toContain("onboarding.goLive.awaitingBody");
  });
});
