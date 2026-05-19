"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import MobileMenu from "./MobileMenu";

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

// V3-D75-header (2026-05-18): desktop dropdown menus. Replaces the
// scroll-x category strip on md+ with two hover dropdowns: Services
// (consumer-facing categories) and Für Unternehmen (B2B links). Mobile
// keeps the scroll strip — it works well on touch and the hamburger
// already exists for everything else.
const SERVICES_MENU: { label: string; href: string }[] = [
  { label: "Coiffeur",         href: "/coiffeur"   },
  { label: "Barbershop",       href: "/barbershop" },
  { label: "Nails",            href: "/nails"      },
  { label: "Spa & Wellness",   href: "/spa"        },
  { label: "Alle Services →",  href: "/services"   },
];

const BUSINESS_MENU: { label: string; href: string }[] = [
  { label: "Werde Solen-Partner",  href: "/business/signup" },
  { label: "Wie es funktioniert",  href: "/business/how"    },
  { label: "Demo buchen",          href: "/business/demo"   },
  { label: "Preise",               href: "/business/pricing" },
];

/**
 * DropdownMenu — header dropdown nav item with hover-to-open behavior.
 *
 * Pattern: <button> trigger with chevron + animated dropdown panel below.
 * Hover open (with small close delay to allow cursor travel from trigger
 * to dropdown) + click-outside-close. Backdrop blur + soft shadow for
 * Apple-feel panel surface.
 */
function DropdownMenu({
  label,
  items,
  locale,
}: {
  label: string;
  items: { label: string; href: string }[];
  locale: string;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const handleEnter = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    // Small delay so users can move cursor to dropdown without it closing.
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  // Click-outside-close (covers click-trigger + escape scenarios).
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap font-body text-[14px] font-medium text-s-ink-2",
          "rounded-full px-3 py-2 transition-colors duration-200 ease-glide",
          "hover:bg-s-ink/[0.05] hover:text-s-ink",
          open && "bg-s-ink/[0.05] text-s-ink",
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
        )}
      >
        {label}
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={cn(
            "transition-transform duration-200 ease-glide",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full mt-2 min-w-[240px] rounded-[16px] bg-white p-2 z-[60]"
            style={{
              boxShadow:
                "0 12px 36px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.04)",
              border: "1px solid rgba(26, 28, 25, 0.04)",
            }}
            role="menu"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                role="menuitem"
                className={cn(
                  "flex items-center rounded-[12px] px-4 py-3 font-body text-[14px] font-medium text-s-ink",
                  "transition-colors duration-150 ease-glide",
                  "hover:bg-s-bg-sunken hover:text-s-brand",
                  "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:bg-s-bg-sunken",
                )}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header({ locale }: { locale: string }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300 ease-glide",
        scrolled
          ? "bg-white/65 backdrop-blur-[28px] backdrop-saturate-[1.7] py-3 shadow-[0_1px_24px_rgba(4,51,56,0.04)]"
          : "bg-transparent py-5",
      )}
      style={{
        WebkitBackdropFilter: scrolled ? "blur(14px) saturate(1.4)" : undefined,
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-2.5 px-4 md:gap-6 md:px-8">
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

        {/* Mobile: empty middle area (was scroll-x category strip, now in MobileMenu §Stöbern).
            Flex spacer pushes the hamburger to the right edge. */}
        <div className="flex-1 md:hidden" />

        {/* ── DESKTOP NAV (md+) — V3-D75 dropdown menus ──
            Replaces V2-D49d 4-category list. Two hover dropdowns + Entdecken
            direct link. Per user "instead of having many sh like all categories
            listed yk thats ass" — dropdowns surface categories on demand
            instead of cluttering the always-on header. */}
        <nav
          aria-label="Hauptnavigation"
          className="hidden md:flex min-w-0 flex-1 items-center justify-center gap-2"
        >
          <DropdownMenu
            label="Services"
            items={SERVICES_MENU}
            locale={locale}
          />
          <DropdownMenu
            label="Für Unternehmen"
            items={BUSINESS_MENU}
            locale={locale}
          />
          <Link
            href={`/${locale}/entdecken`}
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 font-body text-[14px] font-medium text-s-ink-2",
              "transition-colors duration-200 ease-glide",
              "hover:bg-s-ink/[0.05] hover:text-s-ink",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
            )}
          >
            Entdecken
          </Link>
        </nav>

        {/* Right side — Über uns (md+) + Anmelden (md+) + hamburger (mobile).
            V2-D49d: Über uns brought back per user request; the other utility
            links (Salons / Stilist:innen / Entdecken) move to mobile menu
            / footer in a follow-up. */}
        <div className="flex shrink-0 items-center gap-3 md:gap-5">
          <Link
            href={`/${locale}/about`}
            className={cn(
              "hidden md:inline-flex font-body text-[14px] font-medium text-s-ink-2",
              "transition-colors duration-200 ease-glide hover:text-s-ink",
              // V2-D62 (2026-05-15): same liquid-glass pill bloom as the category chips.
              // Without it the link reads as plain copy and people miss that it's clickable.
              "relative",
              "before:absolute before:-inset-x-2.5 before:-inset-y-1 before:-z-[1] before:rounded-full",
              "before:bg-white/30 before:backdrop-blur-[22px] before:backdrop-saturate-[1.7]",
              "before:shadow-[inset_0_1px_0_rgba(255,255,255,0.40),0_1px_3px_rgba(26,18,9,0.08)]",
              "before:scale-[0.6] before:opacity-0 before:content-['']",
              "before:transition-[transform,opacity] before:duration-[280ms] before:ease-[cubic-bezier(0.4,1.4,0.4,1)]",
              "hover:before:scale-100 hover:before:opacity-100",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
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
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden relative -m-2 grid h-11 w-11 place-items-center rounded-xl p-2 bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 ease-glide active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
          >
            <span
              className={cn(
                "absolute inset-0 grid place-items-center transition-[opacity,transform] duration-[220ms] ease-glide",
                menuOpen ? "opacity-0 rotate-45 scale-[0.7]" : "opacity-100 rotate-0 scale-100",
              )}
              aria-hidden
            >
              <Menu size={22} strokeWidth={2.2} />
            </span>
            <span
              className={cn(
                "absolute inset-0 grid place-items-center transition-[opacity,transform] duration-[220ms] ease-glide",
                menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-[0.7]",
              )}
              aria-hidden
            >
              <X size={22} strokeWidth={2.2} />
            </span>
          </button>
        </div>
      </div>
    </header>
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} locale={locale} />
    </>
  );
}
