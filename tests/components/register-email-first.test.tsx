import React from "react";
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import itMessages from "@/messages/it.json";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const harness = vi.hoisted(() => ({
  locale: "en",
  messages: {} as Record<string, any>,
  search: "",
  historyState: null as Record<string, unknown> | null,
  popstate: undefined as
    ((event: { state: Record<string, unknown> | null }) => void) | undefined,
  navigate: vi.fn(),
  replace: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => harness.locale,
    useTranslations: (namespace: string) =>
      actual.createTranslator({
        locale: harness.locale,
        messages: harness.messages,
        namespace,
      }),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: harness.navigate }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: { div: "div" },
}));

vi.mock("@/app/[locale]/_components/primitives/Toast", () => ({
  toast: { error: harness.toastError },
}));

vi.mock("@/lib/supabase-browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
  }),
}));

import RegisterPage from "@/app/[locale]/auth/register/page";

const mountedRenderers: ReactTestRenderer[] = [];

function renderedText(node: ReactTestInstance): string {
  return node.children
    .map((child) => (typeof child === "string" ? child : renderedText(child)))
    .join("");
}

function button(renderer: ReactTestRenderer, label: string): ReactTestInstance {
  const match = renderer.root
    .findAllByType("button")
    .find((candidate) => renderedText(candidate) === label);
  if (!match) throw new Error(`Missing button: ${label}`);
  return match;
}

function input(renderer: ReactTestRenderer, type: string): ReactTestInstance {
  const match = renderer.root
    .findAllByType("input")
    .find((candidate) => candidate.props.type === type);
  if (!match) throw new Error(`Missing ${type} input`);
  return match;
}

async function mount(search = ""): Promise<ReactTestRenderer> {
  harness.search = search;
  let renderer: ReactTestRenderer | undefined;
  await act(async () => {
    renderer = create(<RegisterPage />);
    await Promise.resolve();
    await Promise.resolve();
  });
  mountedRenderers.push(renderer as ReactTestRenderer);
  return renderer as ReactTestRenderer;
}

async function change(node: ReactTestInstance, value: string) {
  await act(async () => node.props.onChange({ target: { value } }));
}

async function advanceWithEmail(
  renderer: ReactTestRenderer,
  email = "person@example.ch",
) {
  await change(input(renderer, "email"), email);
  await act(async () =>
    renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
  );
}

async function fillCustomerDetails(
  renderer: ReactTestRenderer,
  password = "Correct-Horse-9",
  birthday = "1990-01-01",
) {
  await change(input(renderer, "password"), password);
  await change(input(renderer, "date"), birthday);
}

beforeEach(() => {
  harness.locale = "en";
  harness.messages = en;
  harness.search = "";
  harness.historyState = null;
  harness.popstate = undefined;
  vi.clearAllMocks();
  vi.stubGlobal("window", {
    location: {
      get search() {
        return harness.search;
      },
      href: "http://localhost/en/auth/register",
      replace: harness.replace,
    },
    history: {
      get state() {
        return harness.historyState;
      },
      pushState(state: Record<string, unknown> | null) {
        harness.historyState = state;
      },
    },
    addEventListener(type: string, listener: typeof harness.popstate) {
      if (type === "popstate") harness.popstate = listener;
    },
    removeEventListener(type: string, listener: typeof harness.popstate) {
      if (type === "popstate" && harness.popstate === listener)
        harness.popstate = undefined;
    },
  });
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(async () => {
  await act(async () => {
    mountedRenderers.splice(0).forEach((renderer) => renderer.unmount());
  });
  vi.unstubAllGlobals();
});

describe("email-first registration", () => {
  it.each([
    ["de", de],
    ["en", en],
    ["fr", fr],
    ["it", itMessages],
  ])(
    "renders the actual %s email and details steps with localized destinations",
    async (locale, messages) => {
      harness.locale = locale;
      harness.messages = messages;
      const renderer = await mount();

      expect(renderedText(renderer.root)).toContain(
        messages.authRegister.welcomeTitle,
      );
      expect(renderedText(renderer.root)).toContain(
        messages.authRegister.emailStepLead,
      );
      expect(
        renderer.root.findByProps({ href: `/${locale}/auth/login` }),
      ).toBeTruthy();
      expect(
        renderer.root.findByProps({ href: `/${locale}/terms` }),
      ).toBeTruthy();
      expect(
        renderer.root.findByProps({ href: `/${locale}/privacy` }),
      ).toBeTruthy();
      expect(
        renderer.root.findAllByType("input").map((node) => node.props.type),
      ).toEqual(["email"]);

      await advanceWithEmail(renderer);

      expect(renderedText(renderer.root)).toContain(
        messages.authRegister.detailsSubtitle,
      );
      expect(renderedText(renderer.root)).toContain(
        messages.authRegister.createAccount,
      );
      const password = input(renderer, "password");
      const birthday = input(renderer, "date");
      expect(password.props["aria-label"]).toBe(
        messages.authRegister.passwordLabel,
      );
      expect(password.props.className).toContain("!h-12");
      expect(birthday.props.id).toBe("register-birthday");
      expect(birthday.props.className).toContain("!h-12");
      expect(
        renderer.root.findByProps({ htmlFor: "register-birthday" }),
      ).toBeTruthy();
      const reveal = renderer.root.findByProps({
        "aria-label": messages.auth.show_password,
      });
      expect(reveal.props.className).toContain("h-11 w-11");
      expect(reveal.props.className).toContain("shrink-0");
      expect(reveal.parent?.props.className).toContain("h-11 w-11 shrink-0");
      await act(async () => reveal.props.onClick());
      expect(
        renderer.root.findByProps({
          "aria-label": messages.auth.hide_password,
        }),
      ).toBeTruthy();
      expect(input(renderer, "text").props.autoComplete).toBe("new-password");
      expect(
        button(renderer, messages.authRegister.createAccount).props.className,
      ).toContain("text-[14px]");
      expect(
        button(renderer, messages.authRegister.businessAction).props.className,
      ).toContain("min-h-11");
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("rejects an invalid email locally, then returns from details with the valid email preserved", async () => {
    const renderer = await mount();
    await advanceWithEmail(renderer, "invalid-email");

    expect(renderedText(renderer.root)).toContain(en.authRegister.errorEmail);
    expect(
      renderer.root.findAllByType("input").map((node) => node.props.type),
    ).toEqual(["email"]);
    expect(fetch).not.toHaveBeenCalled();

    await change(input(renderer, "email"), "kept@example.ch");
    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );
    expect(fetch).not.toHaveBeenCalled();

    await act(async () => harness.popstate?.({ state: null }));
    expect(input(renderer, "email").props.value).toBe("kept@example.ch");
  });

  it("keeps weak-password and underage or future-date failures inline without a request", async () => {
    const renderer = await mount();
    await advanceWithEmail(renderer);
    await fillCustomerDetails(renderer, "ShortPass9!", "2100-01-01");
    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );

    expect(renderedText(renderer.root)).toContain(
      en.authRegister.errorPasswordMin,
    );
    expect(renderedText(renderer.root)).toContain(en.authRegister.errorMinAge);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("submits the customer details once, surfaces a server error, and permits a retry", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Registration unavailable" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    const renderer = await mount();
    await advanceWithEmail(renderer);
    await fillCustomerDetails(renderer);

    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );
    expect(harness.toastError).toHaveBeenCalledWith("Registration unavailable");
    expect(renderedText(renderer.root)).not.toContain(
      en.authRegister.successTitle,
    );

    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      email: "person@example.ch",
      password: "Correct-Horse-9",
      birthday: "1990-01-01",
      locale: "en",
    });
    expect(renderedText(renderer.root)).toContain(en.authRegister.successTitle);

    await act(async () =>
      button(renderer, en.authRegister.continue).props.onClick(),
    );
    expect(harness.navigate).toHaveBeenCalledWith("/en");
  });

  it("drops a duplicate submit while the signup request is in flight", async () => {
    let finishRequest: ((response: Response) => void) | undefined;
    const request = new Promise<Response>((resolve) => {
      finishRequest = resolve;
    });
    const fetchMock = vi.mocked(fetch).mockReturnValue(request);
    const renderer = await mount();
    await advanceWithEmail(renderer);
    await fillCustomerDetails(renderer);

    const submit = renderer.root.findByType("form").props.onSubmit;
    let first: Promise<void> | undefined;
    let second: Promise<void> | undefined;
    await act(async () => {
      first = submit({ preventDefault() {} });
      second = submit({ preventDefault() {} });
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(button(renderer, en.authRegister.createAccount).props.disabled).toBe(
      true,
    );

    await act(async () => {
      finishRequest?.({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
      await first;
      await second;
    });
    expect(renderedText(renderer.root)).toContain(en.authRegister.successTitle);
  });

  it("localizes account-exists and breached-password errors, then retries after a thrown network error", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ message: "hidden account state" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: "password_breached",
          message: "German fallback",
        }),
      } as Response)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);
    const renderer = await mount();
    await advanceWithEmail(renderer);
    await fillCustomerDetails(renderer);
    const submit = () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} });

    await act(async () => submit());
    expect(harness.toastError).toHaveBeenLastCalledWith(
      en.authRegister.errorAccountExists,
    );
    await act(async () => submit());
    expect(harness.toastError).toHaveBeenLastCalledWith(
      en.authRegister.errorPasswordBreached,
    );
    await act(async () => submit());
    expect(harness.toastError).toHaveBeenLastCalledWith(en.common.networkError);
    await act(async () => submit());

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(renderedText(renderer.root)).toContain(en.authRegister.successTitle);
  });

  it("switches from the customer footer to a business payload and onboarding destination", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
    const renderer = await mount();
    await advanceWithEmail(renderer, "owner@example.ch");

    await act(async () =>
      button(renderer, en.authRegister.businessAction).props.onClick(),
    );
    expect(renderedText(renderer.root)).toContain(
      en.authRegister.businessDetailsSubtitle,
    );

    await act(async () => harness.popstate?.({ state: null }));
    expect(input(renderer, "email").props.value).toBe("owner@example.ch");
    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );
    expect(renderedText(renderer.root)).toContain(
      en.authRegister.businessDetailsSubtitle,
    );

    const salonName = renderer.root.findByProps({
      autoComplete: "organization",
    });
    expect(salonName.props.id).toBe("register-salon-name");
    expect(
      renderer.root.findByProps({ htmlFor: "register-salon-name" }),
    ).toBeTruthy();
    await change(salonName, "Studio Eleven");
    await change(input(renderer, "password"), "Correct-Horse-9");
    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({
      email: "owner@example.ch",
      password: "Correct-Horse-9",
      salon_name: "Studio Eleven",
      locale: "en",
    });
    await act(async () =>
      button(renderer, en.authRegister.continue).props.onClick(),
    );
    expect(harness.navigate).toHaveBeenCalledWith("/en/onboarding/salon");
  });

  it("preserves intent=salon through the email-first step", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);
    const renderer = await mount("?intent=salon");

    expect(
      renderer.root.findAllByType("input").map((node) => node.props.type),
    ).toEqual(["email"]);
    await advanceWithEmail(renderer, "intent@example.ch");
    expect(renderedText(renderer.root)).toContain(
      en.authRegister.businessDetailsSubtitle,
    );
    await change(
      renderer.root.findByProps({ autoComplete: "organization" }),
      "Intent Studio",
    );
    await change(input(renderer, "password"), "Correct-Horse-9");
    await act(async () =>
      renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }),
    );

    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string),
    ).toMatchObject({
      email: "intent@example.ch",
      salon_name: "Intent Studio",
    });
  });
});
