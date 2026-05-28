"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CITY_SLUGS,
  getCityName,
  type CitySlug,
} from "@/lib/cities";
import {
  getPersistedCity,
  setPersistedCity,
} from "@/lib/city-cookie";

/**
 * DesktopCitySelector — V3-D157 (2026-05-25).
 *
 * Desktop-only (md+) city picker that sits beside "Über uns" in the Header.
 * Mobile uses the bar (CityTopBar) → MobileMenu pattern instead; desktop has
 * no hamburger until the user logs in, so the city control needs to live
 * directly in the nav.
 *
 * Trigger: a subtle text-link-style button "{City} ▾" matching the visual
 * weight of "Über uns" — not so loud that it competes with the Anmelden
 * primary CTA. On click → small popover with the three city options.
 *
 * Behavior on select: persist via city-cookie + reload. Reloading is
 * consistent with how CityTopBar (mobile) used to handle it and with how
 * MobileMenu's selector now handles it (V3-D157, MobileMenu.tsx) — SSR'd
 * city-aware sections (Nearby etc.) pick up the new value on the next
 * paint.
 */

interface Props {
  locale: string;
}

const DEFAULT_CITY: CitySlug = "basel";

export default function DesktopCitySelector({ locale }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [city, setCity] = React.useState<CitySlug>(DEFAULT_CITY);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    const persisted = getPersistedCity();
    if (persisted) setCity(persisted);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted) return null;

  const cityName = getCityName(city, locale);

  const handlePick = (slug: CitySlug) => {
    setOpen(false);
    if (slug === city) return;
    setPersistedCity(slug);
    window.location.reload();
  };

  return (
    <div ref={rootRef} className="relative hidden md:inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Stadt wählen"
        className={cn(
          "inline-flex items-center gap-1 font-body text-[14px] font-medium",
          "text-s-ink-2 transition-colors duration-150 ease-glide",
          "hover:text-s-ink",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
        )}
      >
        <span>{cityName}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          aria-hidden
          className={cn(
            "transition-transform duration-150 ease-glide",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Stadt wählen"
          className={cn(
            "absolute right-0 top-full mt-2 w-[160px] overflow-hidden",
            "rounded-xl border border-black/[0.07] bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
            "z-50",
          )}
        >
          {CITY_SLUGS.map((slug) => {
            const isActive = slug === city;
            return (
              <button
                key={slug}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handlePick(slug)}
                className={cn(
                  "block w-full px-3 py-2 text-left font-body text-[13px]",
                  "transition-colors hover:bg-s-bg-sunken",
                  isActive
                    ? "font-bold text-s-ink"
                    : "font-medium text-s-ink",
                )}
              >
                {getCityName(slug, locale)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
