"use client";

import * as React from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCityName,
  type CitySlug,
} from "@/lib/cities";
import {
  getPersistedCity,
  setPersistedCity,
} from "@/lib/city-cookie";
import { useActiveCities } from "@/hooks/useActiveCities";
import { useTranslations } from "next-intl";

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
  const tSD = useTranslations("salonDetail");
  const [mounted, setMounted] = React.useState(false);
  const [city, setCity] = React.useState<CitySlug>(DEFAULT_CITY);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  // 2026-07-04 city-rollout refactor: DB `cities WHERE is_active` is now the source of
  // truth for the picker list (was hardcoded CITY_SLUGS).
  const { cities: activeCities } = useActiveCities();

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

  const cityName = getCityName(city, locale, activeCities.find((c) => c.slug === city));

  const handlePick = (slug: CitySlug) => {
    setOpen(false);
    if (slug === city) return;
    setPersistedCity(slug);
    window.location.reload();
  };

  return (
    // V3-D348 (tweak #3): made RESPONSIVE to replace the retired CityTopBar.
    // V3-D421g (2026-06-05): reverted to DESKTOP-ONLY (`hidden md:inline-flex`)
    // per owner "remove the city selector in the header" (mobile). Mobile
    // city-switching stays in the MobileMenu (hamburger); CityTopBar stays retired.
    <div ref={rootRef} className="relative hidden md:inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tSD("selectCity")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-s-border bg-white",
          "px-3 py-[7px] font-body text-[13.5px] font-medium text-s-ink",
          "transition-colors duration-150 ease-glide hover:bg-s-bg-sunken hover:border-s-ink/30",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      >
        <MapPin size={14} strokeWidth={1.6} aria-hidden className="text-s-ink-2" />
        <span>{cityName}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          aria-hidden
          className={cn(
            "text-s-ink-2 transition-transform duration-150 ease-glide",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={tSD("selectCity")}
          className={cn(
            "absolute right-0 top-full mt-2 w-[160px] overflow-hidden",
            "rounded-xl border border-s-border bg-white",
            "shadow-[0_10px_30px_rgba(0,0,0,0.10)]",
            "z-50",
          )}
        >
          {activeCities.map((c) => {
            const isActive = c.slug === city;
            return (
              <button
                key={c.slug}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handlePick(c.slug)}
                className={cn(
                  "block w-full px-3 py-2 text-left font-body text-[13px]",
                  "transition-colors hover:bg-s-bg-sunken",
                  isActive
                    ? "font-bold text-s-ink"
                    : "font-medium text-s-ink",
                )}
              >
                {getCityName(c.slug, locale, c)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
