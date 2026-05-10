"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * V3 Header — V2-D46 (2026-05-09).
 *
 * Sticky frost-on-scroll navbar adapted from `public/solen-v2-full-editorial.html`.
 * Transparent at top → frosted (white/78 + blur(14px)) once scrolled past 30px.
 *
 * Anatomy (md+):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Solen·    Salons  Stilist:innen  Entdecken  Über uns  [Anmelden] │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Mobile: Logo + hamburger only (desktop nav hidden < md).
 *
 * Why client component now (was server): scroll-state-driven className
 * toggle needs `useEffect` + `useState`. Header was already small so the
 * "use client" directive cost is negligible. Logo is still next/link.
 */
// V2-D49d: V3 4-category strip — text-only inline links between logo and
// right-side actions. Mobile: scrolls horizontally w right-edge mask fade.
// Desktop: centered, no fade. Icons retired (V2-D49d revision per user
// "delete the pills and only txt").
const CATEGORIES: { label: string; href: string }[] = [
  { label: "Coiffeur",   href: "/coiffeur"   },
  { label: "Barbershop", href: "/barbershop" },
  { label: "Nails",      href: "/nails"      },
  { label: "Entdecken",  href: "/entdecken"  },
];

export default function Header({ locale }: { locale: string }) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-glide",
        scrolled
          ? "bg-white/[0.78] backdrop-blur-[14px] backdrop-saturate-[1.4] py-3 shadow-[0_1px_12px_rgba(4,51,56,0.06)]"
          : "bg-transparent py-5",
      )}
      style={{
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(1.4)" : undefined,
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-5 md:gap-6 md:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          aria-label="Solen zur Startseite"
          className="font-display relative inline-flex shrink-0 items-baseline text-[22px] font-black leading-none tracking-normal text-s-ink md:text-[24px] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm"
        >
          Solen
          <span
            aria-hidden
            className="ml-[2px] inline-block h-2 w-2 rounded-full bg-s-accent"
            style={{ transform: "translateY(-2px)" }}
          />
        </Link>

        {/* V2-D49d: V3 categories — text-only inline links.
            Mobile: scroll-x w right-edge mask fade so off-screen labels
            taper out instead of being abruptly cut.
            Desktop: justify-center + no mask (no overflow expected). */}
        <nav
          aria-label="Kategorien"
          className={cn(
            "flex min-w-0 flex-1 items-center gap-5 overflow-x-auto",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "[mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)]",
            "md:justify-center md:gap-8 md:[mask-image:none]",
          )}
        >
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={`/${locale}${c.href}`}
              className={cn(
                "shrink-0 whitespace-nowrap font-body text-[14px] font-medium text-s-ink-2",
                "transition-colors duration-200 ease-glide hover:text-s-ink",
                "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm",
              )}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Right side — Über uns (md+) + Anmelden (md+) + hamburger (mobile).
            V2-D49d: Über uns brought back per user request; the other utility
            links (Salons / Stilist:innen / Entdecken) move to mobile menu
            / footer in a follow-up. */}
        <div className="flex shrink-0 items-center gap-3 md:gap-5">
          <Link
            href={`/${locale}/about`}
            className="hidden md:inline-flex font-body text-[14px] font-medium text-s-ink-2 transition-colors duration-200 ease-glide hover:text-s-ink"
          >
            Über uns
          </Link>
          <Link
            href={`/${locale}/auth/login`}
            className="hidden md:inline-flex items-center rounded-full bg-s-brand px-5 py-[9px] font-body text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(4,51,56,0.18)] transition-all duration-200 ease-glide hover:bg-s-brand-mid hover:shadow-[0_6px_16px_rgba(4,51,56,0.24)] active:scale-[0.97] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
          >
            Anmelden
          </Link>
          <button
            type="button"
            aria-label="Menü öffnen"
            aria-expanded={false}
            className="md:hidden -m-2 grid h-11 w-11 place-items-center rounded-lg p-2 text-s-ink transition-colors hover:bg-s-ink/5 focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
          >
            <Menu size={24} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </header>
  );
}
