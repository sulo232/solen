import { beforeEach, afterEach, expect, it, vi } from "vitest";
import React, { useState, useEffect, useMemo } from "react";
import * as icons from "lucide-react";
import * as permissions from "@/lib/staff-permissions";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { transpileModule, ModuleKind, JsxEmit } from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

// Mount the actual dashboard shell with mocked browser hooks and child boundaries.
// Verifies its rendered links after profile hydration, not styling or browser layout.
const state = vi.hoisted(() => ({ values: [] as any[], cursor: 0, runEffects: true, profile: {} as any, redirects: [] as string[] }));
vi.mock("react", async importOriginal => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual,
    useState: (initial: any) => {
      const index = state.cursor++;
      if (!(index in state.values)) state.values[index] = initial;
      return [state.values[index], (value: any) => { state.values[index] = typeof value === "function" ? value(state.values[index]) : value; }];
    },
    useEffect: (effect: () => unknown) => { if (state.runEffects) effect(); },
    useMemo: (compute: () => unknown) => compute(),
  };
});
beforeEach(() => {
  state.values = []; state.cursor = 0; state.runEffects = true; state.redirects = [];
  vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal("React", React);
  vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => state.profile })));
});
afterEach(() => vi.unstubAllGlobals());
async function renderProfile(profile: any, mobileOpen = false) {
  state.profile = profile;
  // The repo's node-only Vitest config preserves JSX. Transpile this exact source
  // locally for the render probe without changing the shared build/test config.
  const source = readFileSync(resolve("components-legacy/dashboard/DashboardLayout.tsx"), "utf8");
  const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.React, esModuleInterop: true } }).outputText;
  const modules: Record<string, unknown> = {
    react: { ...React, useState, useEffect, useMemo },
    "lucide-react": icons,
    "@/lib/staff-permissions": permissions,
    "next/link": { default: ({ children, href, ...props }: any) => React.createElement("a", { ...props, href }, children), __esModule: true },
    "next/navigation": { usePathname: () => "/en/dashboard", useRouter: () => ({ push: (path: string) => state.redirects.push(path) }) },
    "next-intl": { useLocale: () => "en", useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}` },
    "next/image": { default: () => null, __esModule: true },
    "motion/react": { AnimatePresence: ({ children }: any) => children, motion: { div: "div", aside: "aside" } },
    "@/app/[locale]/_components/primitives": { Skeleton: () => null },
    "@/lib/dashboard/category-nav": { getCategoryNavGroups: () => [] },
  };
  for (const component of ["CommandPalette", "NotificationCenter", "SalonSwitcher"]) modules[`@/components-legacy/dashboard/${component}`] = { default: () => null, __esModule: true };
  const target = { exports: {} as any };
  new Function("require", "module", "exports", compiled)((id: string) => {
    if (!(id in modules)) throw new Error(`Unmocked shell boundary: ${id}`);
    return modules[id];
  }, target, target.exports);
  const DashboardLayout = target.exports.default;
  renderToStaticMarkup(React.createElement(DashboardLayout, { children: "Existing dashboard" }));
  await new Promise(resolve => setImmediate(resolve));
  state.cursor = 0; state.runEffects = false;
  if (mobileOpen) state.values[2] = true;
  return renderToStaticMarkup(React.createElement(DashboardLayout, { children: "Existing dashboard" }));
}
it("renders only permitted destinations for modern staff and no owner-only Products link", async () => {
  const html = await renderProfile({ id: "staff", role: "customer", salon_id: "a", staff_permissions: { calendar: true, finance: true, catalog: true } });
  expect(state.redirects).toEqual([]);
  expect(html).toContain('href="/en/dashboard/calendar"');
  expect(html).toContain('href="/en/dashboard/earnings"');
  expect(html).toContain('href="/en/dashboard/services"');
  expect(html).not.toContain('href="/en/dashboard/products"');
  expect(html).not.toContain('href="/en/dashboard/staff"');
  expect(html).not.toContain('href="/en/dashboard/help-editor"');
});
it("retains owner links even when the profile role is stale", async () => {
  const html = await renderProfile({ id: "owner", role: "customer", salon_id: "a", staff_permissions: null });
  expect(state.redirects).toEqual([]);
  expect(html).toContain('href="/en/dashboard/products"');
  expect(html).toContain('href="/en/dashboard/earnings"');
  expect(html).toContain('href="/en/dashboard/staff"');
});
it("keeps the existing Help Editor destination admin-only", async () => {
  const html = await renderProfile({ id: "admin", role: "admin", staff_permissions: null });
  expect(html).toContain('href="/en/dashboard/help-editor"');
  expect(html).toContain('href="/en/dashboard/products"');
});
it.each([false, true])("legacy staff has exactly calendar/settings navigation on desktop and mobile (open=%s)", async mobileOpen => {
  const html = await renderProfile({ id: "legacy", role: "customer", staff_salon_id: "a", staff_permissions: null }, mobileOpen);
  const navBodies = [...html.matchAll(/<nav[^>]*>([\s\S]*?)<\/nav>/g)].map(match => match[1]);
  expect(navBodies).toHaveLength(mobileOpen ? 2 : 1);
  for (const nav of navBodies) {
    const destinations = [...nav.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
    expect(destinations).toEqual(["/en/dashboard/calendar", "/en/dashboard/settings"]);
    for (const forbidden of ["products", "earnings", "services", "staff", "marketing", "analytics", "help-editor", "refunds", "upcharge", "bookings"]) expect(nav).not.toContain(`href="/en/dashboard/${forbidden}"`);
  }
});
it("new desktop destinations retain visible 40px treatment and declare the shared transparent hit extension", async () => {
  const html = await renderProfile({ id: "admin", role: "admin", staff_permissions: null });
  const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
  for (const destination of ["products", "earnings", "help-editor"]) {
    const anchor = anchors.find(tag => tag.includes(`href="/en/dashboard/${destination}"`));
    expect(anchor).toContain("w-10 h-10");
    expect(anchor).toContain("after:absolute after:-inset-0.5");
    expect(anchor).toContain("after:content-");
  }
});
