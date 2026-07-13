/**
 * Mockup-scope: whole-page
 * panel-ok: this is the INDEX of links to the 5 whole-page routes below, not itself a
 * page-preview mockup (same convention as the pre-existing app/[locale]/dev/decisions/
 * hub, which lists the v1 routes this index replaces).
 * Exists-check: `npm run exists mocks-entscheidungen` -> 0 hits (net-new route).
 * `npm run exists dev-flows` style hub pattern already exists
 * (app/[locale]/dev/flows/page.tsx, app/[locale]/dev/decisions/page.tsx = plain
 * hairline-separated card-list conventions for /dev/* index pages); reused here rather
 * than inventing new index chrome. Net-new: the 10 links (2 variants x 5 decisions)
 * to the new whole-page mock-* routes.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const DECISIONS = [
  {
    name: "Back button: circle size",
    href: "mock-backbutton",
    variants: [
      { v: "40", label: "Variant A: 40px" },
      { v: "44", label: "Variant B: 44px" },
    ],
  },
  {
    name: "Disabled state: opacity",
    href: "mock-disabled",
    variants: [
      { v: "40", label: "Variant A: opacity-40" },
      { v: "50", label: "Variant B: opacity-50" },
    ],
  },
  {
    name: "Notification badge: color",
    href: "mock-badge",
    variants: [
      { v: "rot", label: "Variant A: Red" },
      { v: "ink", label: "Variant B: Ink" },
    ],
  },
  {
    name: "Result card: photo radius",
    href: "mock-radius",
    variants: [
      { v: "18", label: "Variant A: 18px" },
      { v: "22", label: "Variant B: 22px" },
    ],
  },
  {
    name: "PDP section card: shadow",
    href: "mock-shadow",
    variants: [
      { v: "aktuell", label: "Variant A: shadow-whisper" },
      { v: "gesetz", label: "Variant B: hover elevation-2" },
    ],
  },
];

export default function MocksEntscheidungenIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[560px] bg-white">
      <div className="border-b border-s-border px-4 pb-4 pt-6">
        <h1 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
          Decision mockups
        </h1>
        <p className="mt-1 text-[13px] leading-[1.4] text-s-ink-2">
          5 decisions, 2 variants each. Every link opens the whole real page with that
          variant applied.
        </p>
      </div>
      <div>
        {DECISIONS.map((d) => (
          <div key={d.href} className="border-b border-s-border px-4 py-4 last:border-b-0">
            <p className="text-[14px] font-semibold text-s-ink">{d.name}</p>
            <div className="mt-2 space-y-1.5">
              {d.variants.map((variant) => (
                <Link
                  key={variant.v}
                  href={`${d.href}?v=${variant.v}`}
                  className="flex items-center justify-between gap-3 rounded-input border border-s-border bg-white px-3 py-2.5 transition-colors hover:bg-s-bg-sunken"
                >
                  <span className="truncate text-[13px] font-medium text-s-ink">{variant.label}</span>
                  <ChevronRight size={16} className="shrink-0 text-s-ink" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
