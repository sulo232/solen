"use client";

import * as React from "react";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import {
  CITIES,
  getCityName,
  type CitySlug,
} from "@/lib/cities";
import {
  getPersistedCity,
  setPersistedCity,
} from "@/lib/city-cookie";
import { useActiveCities } from "@/hooks/useActiveCities";

/**
 * CityTopBar — V3-D142 (2026-05-25), restored at V3-D158 (2026-05-25).
 *
 * Revolut-inspired top bar prompting the user to confirm/switch their city.
 * Mounted at locale-layout level so it appears site-wide above the Header.
 *
 * Visual = Variant B from `public/solen-city-top-bar-variants.html`:
 *   - light grey bg (`bg-s-bg-sunken`) blending into the page
 *   - small ✕ dismiss on the left
 *   - inline message "Sie sehen gerade <City>. Stadt wechseln…"
 *   - dropdown button with Swiss flag + city name + chevron
 *   - brand-ink round arrow CTA on the right
 *
 * Why restored (V3-D158, 2026-05-25): briefly tried a minimal "tap to open
 * menu" variant (V3-D157) that dropped the flag chip and inline dropdown,
 * then reverted per user request — they wanted the city selection visible
 * directly in the bar, not hidden behind a menu trip. The MobileMenu city
 * selector (V3-D157 in MobileMenu.tsx) STAYS in place as a secondary way to
 * change the city; both surfaces share the same `setPersistedCity` helper.
 *
 * Behaviour:
 *   - Reads persisted city via lib/city-cookie.ts (`getPersistedCity()`)
 *   - First-visit default: Basel
 *   - ✕ → sets `solen-city-bar-dismissed` cookie for 30 days → bar hides
 *   - Pick a city + tap → → `setPersistedCity()` + dismiss + reload
 *   - Outside click closes the dropdown
 *
 * Hydration: returns `null` pre-mount to avoid a flash of bar-then-no-bar
 * for users who have already dismissed.
 */

const DISMISSAL_COOKIE = "solen-city-bar-dismissed";
const DISMISSAL_DAYS = 30;
const DEFAULT_CITY: CitySlug = "basel";

interface Props {
  locale: string;
}

const COPY: Record<
  "de" | "en" | "fr" | "it",
  {
    sentence_pre: string;
    sentence_post: string;
    aria_close: string;
    aria_dropdown: string;
    aria_confirm: string;
  }
> = {
  de: {
    sentence_pre: "Sie sehen gerade",
    sentence_post: "Stadt wechseln für lokale Inhalte:",
    aria_close: "Banner schließen",
    aria_dropdown: "Stadt wählen",
    aria_confirm: "Stadt bestätigen",
  },
  en: {
    sentence_pre: "You're viewing",
    sentence_post: "Switch city for local content:",
    aria_close: "Dismiss banner",
    aria_dropdown: "Choose city",
    aria_confirm: "Confirm city",
  },
  fr: {
    sentence_pre: "Vous consultez",
    sentence_post: "Changer de ville pour du contenu local :",
    aria_close: "Fermer la bannière",
    aria_dropdown: "Choisir la ville",
    aria_confirm: "Confirmer la ville",
  },
  it: {
    sentence_pre: "Stai vedendo",
    sentence_post: "Cambia città per contenuti locali:",
    aria_close: "Chiudi banner",
    aria_dropdown: "Scegli città",
    aria_confirm: "Conferma città",
  },
};

/** Swiss flag rendered via CSS only (no image asset). Red bg + 2 white
 *  rectangles forming the cross. Cheap, sharp at any size. */
const swissFlagStyle: React.CSSProperties = {
  backgroundColor: "#DA291C",
  backgroundImage:
    "linear-gradient(white, white), linear-gradient(white, white)",
  backgroundSize: "50% 14%, 14% 50%",
  backgroundPosition: "center, center",
  backgroundRepeat: "no-repeat",
};

export default function CityTopBar({ locale }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [city, setCity] = React.useState<CitySlug>(DEFAULT_CITY);
  const [dismissed, setDismissed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  // V3-D172 (2026-05-26): hide the bar while MobileMenu is open. State
  // arrives via the `solen:menu-state` window event Header broadcasts.
  // Naturally mobile-only — desktop never opens the menu so this stays
  // false on desktop.
  const [hiddenByMenu, setHiddenByMenu] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  // 2026-07-04 city-rollout refactor: DB `cities WHERE is_active` is now the source of
  // truth for the picker list (was hardcoded CITY_SLUGS).
  const { cities: activeCities } = useActiveCities();

  React.useEffect(() => {
    setMounted(true);
    const persisted = getPersistedCity();
    if (persisted) setCity(persisted);
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${DISMISSAL_COOKIE}=([^;]*)`),
    );
    if (match) setDismissed(true);
  }, []);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setHiddenByMenu(!!detail?.open);
    };
    window.addEventListener("solen:menu-state", handler);
    return () => window.removeEventListener("solen:menu-state", handler);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!mounted || dismissed || hiddenByMenu) return null;

  const copy = COPY[locale as keyof typeof COPY] ?? COPY.de;
  const cityName = getCityName(city, locale, activeCities.find((c) => c.slug === city));

  const handleDismiss = () => {
    const maxAge = DISMISSAL_DAYS * 24 * 60 * 60;
    document.cookie = `${DISMISSAL_COOKIE}=1;path=/;max-age=${maxAge};SameSite=Lax`;
    setDismissed(true);
  };

  const handleConfirm = () => {
    setPersistedCity(city);
    handleDismiss();
    window.location.reload();
  };

  return (
    <div
      role="region"
      aria-label="Stadt-Auswahl"
      // V3-D149-fix (2026-05-25): relative z-[60] keeps the bar's dropdown
      // above Header's sticky z-50 stacking context so it isn't shadowed
      // by header content if they overlap.
      className="relative z-[60] flex items-center gap-2.5 border-b border-s-border bg-s-bg-sunken px-4 py-2.5"
    >
      {/* ✕ dismiss — sets dismissal cookie for 30 days */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={copy.aria_close}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-s-ink-2 transition-colors hover:bg-white hover:text-s-ink focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
      >
        <X size={14} strokeWidth={1.6} aria-hidden />
      </button>

      {/* Message — truncates on narrow viewports */}
      <p className="min-w-0 flex-1 truncate font-body text-[13px] leading-[1.4] text-s-ink-2">
        {copy.sentence_pre}{" "}
        <strong className="font-semibold text-s-ink">{cityName}</strong>.{" "}
        <span className="hidden sm:inline">{copy.sentence_post}</span>
      </p>

      {/* City dropdown */}
      <div ref={dropdownRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={copy.aria_dropdown}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="inline-flex items-center gap-1.5 rounded-full border border-s-border bg-white py-1 pl-1 pr-2.5 font-body text-[13px] font-semibold text-s-ink transition-[border-color,transform] duration-150 ease-glide hover:-translate-y-[1px] hover:border-s-ink focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
        >
          <span
            aria-hidden
            className="block h-5 w-5 shrink-0 rounded-full"
            style={swissFlagStyle}
          />
          <span>{cityName}</span>
          <ChevronDown
            size={14}
            strokeWidth={1.6}
            aria-hidden
            className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label={copy.aria_dropdown}
            className="absolute right-0 top-full z-10 mt-1 w-[160px] overflow-hidden rounded-xl border border-s-border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
          >
            {activeCities.map((c) => {
              const isActive = c.slug === city;
              return (
                <button
                  key={c.slug}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setCity(c.slug);
                    setOpen(false);
                  }}
                  className={`block w-full px-3 py-2 text-left font-body text-[13px] transition-colors hover:bg-s-bg-sunken ${
                    isActive
                      ? "font-bold text-s-ink"
                      : "font-medium text-s-ink"
                  }`}
                >
                  {getCityName(c.slug, locale, c)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm → arrow — persists city + dismisses + reloads */}
      <button
        type="button"
        onClick={handleConfirm}
        aria-label={copy.aria_confirm}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-ink text-white shadow-[0_2px_6px_rgba(0,0,0,0.20)] transition-[transform,box-shadow,background-color] duration-150 ease-glide hover:-translate-y-[1px] hover:bg-black hover:shadow-[0_4px_10px_rgba(0,0,0,0.30)] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
      >
        <ArrowRight size={14} strokeWidth={1.6} aria-hidden />
      </button>
    </div>
  );
}

// Suppress "unused" warning if tree-shaken: CITIES is exported for callers
// that may want to read other localized fields elsewhere.
export { CITIES };
