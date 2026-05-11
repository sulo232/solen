"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3 Header — Fluz-match port (locked variant F2, 2026-05-11).
 *
 * Two stacked bars on dark `#1F1714`:
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  Salons (active) · Coiffeure · Stilist:innen     [34px subnav]│
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  solen·  Coiffeur ▾  Barbershop  Nails ▾  Entdecken           │
 *   │                              [Suchen] [?] [Anmelden]   [94px] │
 *   └──────────────────────────────────────────────────────────────┘
 * Total: 128px tall.
 *
 * Wordmark: Anton (Google Fonts, heavy condensed black) — overrides V3 Peace Sans
 * for the logo only. Lowercase "solen" + 9px terracotta dot. Matches Fluz's "fluz"
 * visual weight. Other text stays Peace Sans (display) + Open Sauce One (body).
 *
 * Anmelden pill: emerald gradient (`#2A7B58 → #1F5C42 → #0F3D26`) — V3 emerald
 * family, no purple. Search pill (white) + help icon (?) + Anmelden = 3-item
 * right cluster matching Fluz density.
 *
 * Mobile (<md): logo only on the left + hamburger on the right. Sub-nav hidden.
 */
const CATEGORIES: { label: string; href: string; dropdown?: boolean }[] = [
  { label: "Coiffeur",   href: "/coiffeur",   dropdown: true  },
  { label: "Barbershop", href: "/barbershop"                  },
  { label: "Nails",      href: "/nails",      dropdown: true  },
  { label: "Entdecken",  href: "/discover"                    },
];

const SUBNAV: { label: string; href: string; match: (path: string, locale: string) => boolean }[] = [
  { label: "Salons",      href: "",              match: (p, l) => p === `/${l}` || p === `/${l}/` },
  { label: "Coiffeure",   href: "/coiffeure",    match: (p, l) => p.startsWith(`/${l}/coiffeure`) },
  { label: "Stilist:innen", href: "/stilistinnen", match: (p, l) => p.startsWith(`/${l}/stilistinnen`) },
];

export default function Header({ locale }: { locale: string }) {
  const [farScrolled, setFarScrolled] = React.useState(false);
  const pathname = usePathname() ?? "";

  // Hide whole header on salon-detail pages once scrolled past hero (V2-D53.3 mobile fix).
  const isSalonDetail = /\/salon\/[^/]+\/?$/.test(pathname);
  const hideForTabNav = isSalonDetail && farScrolled;

  React.useEffect(() => {
    const onScroll = () => {
      setFarScrolled((prev) => {
        if (prev) return window.scrollY > 100;
        return window.scrollY > 200;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 bg-[#1F1714] transition-transform duration-300 ease-glide",
        hideForTabNav ? "-translate-y-full" : "translate-y-0",
      )}
    >
      {/* ─── Sub-nav strip · 30px · hidden on mobile (matches Fluz: 30+66=96 total) ─── */}
      <div className="hidden md:flex h-[30px] items-center border-b border-white/[0.08]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-6 px-6 md:px-8">
          {SUBNAV.map((item) => {
            const active = item.match(pathname, locale);
            const href = `/${locale}${item.href}`;
            return (
              <Link
                key={item.label}
                href={href}
                className={cn(
                  "relative font-body text-[11px] tracking-wide transition-colors duration-200",
                  "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
                  active
                    ? "font-bold text-white"
                    : "font-bold text-white/55 hover:text-white/90",
                )}
              >
                {item.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[6px] h-[2px] bg-s-accent"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── MOBILE main bar · 72px · hamburger+search | centered wordmark | login pill ─── */}
      <div className="md:hidden relative h-[72px] flex items-center px-3">
        {/* Left cluster: hamburger + search icon (matches Fluz mobile 41×41 icons) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Menü öffnen"
            aria-expanded={false}
            className="grid h-[41px] w-[41px] place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <Menu size={22} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Suchen"
            className="grid h-[41px] w-[41px] place-items-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <Search size={20} strokeWidth={2.25} aria-hidden />
          </button>
        </div>

        {/* Centered wordmark — absolute positioned so it stays viewport-centered */}
        <Link
          href={`/${locale}`}
          aria-label="Solen zur Startseite"
          className={cn(
            "absolute left-1/2 -translate-x-1/2 inline-flex items-baseline leading-none text-white",
            "text-[28px]",
            "lowercase tracking-[0.01em] font-normal",
            "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:rounded-sm",
          )}
          style={{ fontFamily: '"Anton", "Inter", sans-serif' }}
        >
          solen
          <span
            aria-hidden
            className="ml-[3px] inline-block rounded-full bg-s-accent"
            style={{ width: "7px", height: "7px", transform: "translateY(-2px)" }}
          />
        </Link>

        {/* Spacer pushes Anmelden right */}
        <div className="flex-1" />

        {/* Right: smaller Anmelden pill (matches Fluz mobile ~102×27px login pill) */}
        <Link
          href={`/${locale}/auth/login`}
          className={cn(
            "inline-flex items-center h-[30px] rounded-full px-3.5",
            "font-body text-[12px] font-bold text-white",
            "shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
            "transition-all duration-200 ease-glide hover:opacity-90 active:scale-[0.97]",
            "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
          )}
          style={{ background: "linear-gradient(135deg, #2A7B58 0%, #1F5C42 50%, #0F3D26 100%)" }}
        >
          Anmelden
        </Link>
      </div>

      {/* ─── DESKTOP main bar · 66px · logo | nav | spacer | right cluster ─── */}
      <div className="hidden md:flex h-[66px] items-center">
        <div className="mx-auto flex w-full max-w-[1440px] items-center gap-12 px-8">
          {/* Logo — Anton heavy condensed lowercase "solen" + terracotta dot
              Sized to match Fluz's 70×31px SVG wordmark visual weight. */}
          <Link
            href={`/${locale}`}
            aria-label="Solen zur Startseite"
            className={cn(
              "relative inline-flex shrink-0 items-baseline leading-none text-white",
              "text-[32px] lowercase tracking-[0.01em] font-normal",
              "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
            style={{ fontFamily: '"Anton", "Inter", sans-serif' }}
          >
            solen
            <span
              aria-hidden
              className="ml-[3px] inline-block rounded-full bg-s-accent"
              style={{ width: "8px", height: "8px", transform: "translateY(-2px)" }}
            />
          </Link>

          {/* Inline category nav */}
          <nav aria-label="Kategorien" className="flex shrink-0 items-center gap-7">
            {CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={`/${locale}${c.href}`}
                className={cn(
                  "inline-flex items-center gap-1 whitespace-nowrap font-body text-[16px] font-bold text-white/85",
                  "transition-opacity duration-200 ease-glide hover:opacity-70",
                  "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 focus-visible:rounded-sm",
                )}
              >
                {c.label}
                {c.dropdown && (
                  <span aria-hidden className="text-[11px] leading-none text-white/65 mt-[2px]">▾</span>
                )}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right cluster: search · help · Anmelden */}
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="Suchen"
              className={cn(
                "inline-flex items-center gap-2",
                "h-[38px] rounded-full bg-white/95 px-4 py-[9px]",
                "font-body text-[13px] font-semibold text-s-ink",
                "hover:bg-white transition-colors duration-200",
                "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
              )}
            >
              <Search size={14} strokeWidth={2.5} className="text-s-ink-2" aria-hidden />
              Suchen
            </button>

            <button
              type="button"
              aria-label="Hilfe"
              className={cn(
                "grid h-[38px] w-[38px] place-items-center rounded-full",
                "border border-white/[0.18] font-body text-[16px] font-bold text-white/85",
                "hover:bg-white/10 transition-colors duration-200",
                "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
              )}
            >
              ?
            </button>

            <Link
              href={`/${locale}/auth/login`}
              className={cn(
                "inline-flex items-center h-[38px] rounded-full px-5 py-[10px]",
                "font-body text-[13px] font-bold text-white",
                "shadow-[0_4px_12px_rgba(0,0,0,0.30)]",
                "transition-all duration-200 ease-glide hover:opacity-90 active:scale-[0.97] active:duration-[80ms]",
                "focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2",
              )}
              style={{ background: "linear-gradient(135deg, #2A7B58 0%, #1F5C42 50%, #0F3D26 100%)" }}
            >
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
