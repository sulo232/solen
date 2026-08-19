"use client";

import { ChevronDown } from "lucide-react";

/**
 * FAQItem — V3-D218 (2026-05-26, /business rebuild).
 *
 * Native <details><summary> accordion. No JS state — relies on the
 * browser's built-in disclosure widget so keyboard + ARIA work for free
 * (Enter/Space toggles, aria-expanded auto-managed, focus ring works).
 *
 * Only animation: the chevron rotates 180° on group-open via Tailwind's
 * built-in group-open: variant + transition-transform.
 *
 * The content reveal is instant (not animated) — animating <details>
 * height without JS is non-trivial; accept the instant reveal as the
 * v1 default. (Most users don't expect a reveal animation on FAQs.)
 *
 * "use client" because <details> events + group-open variant work fine
 * without JS, BUT lucide-react ChevronDown is a client-side icon that
 * Next sometimes server-renders awkwardly when colocated with <details>;
 * marking the file client-side avoids server/client boundary surprises.
 */

export interface FAQItemProps {
  q: string;
  a: string | React.ReactNode;
  defaultOpen?: boolean;
}

export function FAQItem({ q, a, defaultOpen = false }: FAQItemProps) {
  return (
    <details open={defaultOpen} className="group py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-body text-[15px] font-semibold text-s-ink">
        {q}
        <ChevronDown
          size={18}
          strokeWidth={1.9}
          aria-hidden
          className="shrink-0 text-s-ink-2 transition-transform duration-200 ease-glide group-open:rotate-180"
        />
      </summary>
      <div className="mt-3 font-body text-[14px] font-normal leading-[1.55] text-s-ink-2">
        {a}
      </div>
    </details>
  );
}

export default FAQItem;
