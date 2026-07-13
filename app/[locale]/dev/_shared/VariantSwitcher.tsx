"use client";

// Mockup-scope: whole-page
// panel-ok: shared floating control used BY the 5 whole-page mock-* routes, not itself
// a page preview (no _components/components-legacy import needed for a nav pill).
// Exists-check: `npm run exists VariantSwitcher` -> 0 hits. `npm run exists DecisionChip`
// -> the v1 A/B chip (app/[locale]/dev/_shared/DecisionChip.tsx, kept on disk, unused by
// v2). Net-new: this is the ONE shared floating variant switcher the owner asked for
// (2026-07-13 rewrite), replacing the per-route A/B chip pair with a single fixed pill
// that swaps `?v=` on the SAME whole-page route.

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * VariantSwitcher, the one shared floating control for all 5 whole-page decision
 * mockups (mock-backbutton, mock-disabled, mock-badge, mock-radius, mock-shadow).
 * Fixed bottom-center pill, German option labels, links swap `?v=` on the CURRENT
 * path (server component re-renders with the new variant). Selected state follows
 * the LOCKED design-contract "selected/active" row (CLAUDE.md): calm gray
 * `bg-s-bg-sunken` fill + `text-s-ink` + semibold over a white unselected option,
 * never ink/black, never blue.
 */
export function VariantSwitcher({
  options,
  bottomClassName = "bottom-4",
}: {
  options: { value: string; label: string }[];
  /** Override when a route's own sticky bottom bar (e.g. the booking CTA) would
   *  otherwise sit under the pill. Default clears a normal page footer. */
  bottomClassName?: string;
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const active = searchParams?.get("v") ?? options[0]?.value;

  return (
    <div className={`fixed inset-x-0 ${bottomClassName} z-50 flex justify-center px-4`}>
      <div className="flex items-center gap-1 rounded-full border border-s-border bg-white p-1 shadow-elevation-3">
        {options.map((opt) => {
          const params = new URLSearchParams(searchParams?.toString());
          params.set("v", opt.value);
          const href = `${pathname}?${params.toString()}`;
          const isActive = active === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={
                isActive
                  ? "rounded-full bg-s-bg-sunken px-4 py-2 text-[13px] font-semibold text-s-ink"
                  : "rounded-full px-4 py-2 text-[13px] font-medium text-s-ink-2 transition-colors hover:text-s-ink"
              }
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
