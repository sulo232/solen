"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import MobileMenu from "./MobileMenu";
import DesktopCitySelector from "./DesktopCitySelector";
import { BellIcon } from "./BellIcon";

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
  // V3-D208 (2026-05-26, overnight ghost-404 sweep): /services route never
  // existed. Closest live "all services" surface is /search (all salons across
  // all categories). Swap.
  { label: "Alle Services →",  href: "/search"     },
];

const BUSINESS_MENU: { label: string; href: string }[] = [
  // V3-D147 (2026-05-25): /business/signup was a 404 (no page existed).
  // Now points to /business — the new B2B landing page with anchor #anmelden
  // for the signup form scroll target.
  // V3-D208 (2026-05-26, overnight ghost-404 sweep): /business/how, /business/demo,
  // /business/pricing also 404 — no sub-routes ever existed. The /business page
  // covers all three intents inline (how-it-works section #3, anmelden form
  // section #9, pricing section #6). Swap to in-page anchors so nav doesn't
  // dead-end. Anchors: #how, #anmelden, #pricing (added to /business page sections
  // when Wave 2 rebuild lands; until then they scroll to nearest section).
  { label: "Werde Solen-Partner",  href: "/business#anmelden" },
  { label: "Wie es funktioniert",  href: "/business#how"      },
  { label: "Demo buchen",          href: "/business#anmelden" },
  { label: "Preise",               href: "/business#pricing"  },
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
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
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
                  "hover:bg-s-bg-sunken hover:text-s-ink",
                  "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:bg-s-bg-sunken",
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
  // V3-D215 (verifier #1): hide site header on salon-detail pages when scrolled
  // past 200px. At that threshold SalonStickyTabNav takes over the top chrome
  // role (Fresha PDP pattern). Previously both stacked: translucent header
  // bg-white/65 + blur peeked 18-34px through the slim tabnav, producing a
  // double-bar visual seam. With this state, header slides up (translateY
  // -100%) so the tabnav is the only top fixture at PDP-deep-scroll.
  const [hiddenForSalonNav, setHiddenForSalonNav] = React.useState(false);
  // V3-D101 (2026-05-22): tone state for dynamic section-aware header color.
  // Watches sections marked `data-header-tone="dark"` (e.g. the BentoBusiness
  // navy band) — when any of them is currently passing under the header,
  // header switches to dark navy with light text. Matches the Hims pattern
  // the user pointed at in IMG_4285 ("header color changes too").
  const [tone, setTone] = React.useState<"light" | "dark">("light");

  // V3-D215 (verifier #1): pathname guard — only hide-on-scroll on salon-detail
  // PDPs (path matches `/{locale}/salon/{slug}`). Computed once per render.
  const pathname = usePathname();
  const isSalonDetail = React.useMemo(() => {
    if (!pathname) return false;
    const m = pathname.match(/^\/[a-z]{2}\/salon\/[^/]+\/?$/);
    return !!m;
  }, [pathname]);

  React.useEffect(() => {
    const HEADER_H = 80; // approximate header height incl. padding
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      // V3-D215: hysteresis matches SalonStickyTabNav.tsx (visible past 200,
      // hide until back near top at 100) so the handoff is clean — no flicker.
      setHiddenForSalonNav((prev) => (prev ? y > 100 : y > 200));
      // Tone check: any dark section currently spanning the header band?
      const darkSections = document.querySelectorAll<HTMLElement>(
        '[data-header-tone="dark"]',
      );
      let isDark = false;
      for (const s of Array.from(darkSections)) {
        const r = s.getBoundingClientRect();
        if (r.top < HEADER_H && r.bottom > 0) { isDark = true; break; }
      }
      setTone(isDark ? "dark" : "light");
    };
    onScroll(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // V3-D172 (2026-05-26): broadcast menu open/close state so the
  // CityTopBar (mounted at layout level, no shared state with Header)
  // can hide itself while the menu is open. Naturally mobile-only —
  // the hamburger that toggles `menuOpen` is md:hidden, so on desktop
  // `menuOpen` stays false and the event always carries open=false.
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("solen:menu-state", { detail: { open: menuOpen } }),
    );
  }, [menuOpen]);

  const isDark = tone === "dark";

  return (
    <>
    <header
      data-tone={tone}
      className={cn(
        "sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-glide",
        // Dark tone wins over frosted-light. White text + navy bg over dark sections.
        isDark
          ? "bg-black/85 backdrop-blur-[28px] backdrop-saturate-[1.4] py-3 shadow-[0_1px_24px_rgba(0,0,0,0.15)] text-s-ink"
          : scrolled
            ? "bg-white/65 backdrop-blur-[28px] backdrop-saturate-[1.7] py-3 shadow-[0_1px_24px_rgba(4,51,56,0.04)]"
            : "bg-transparent py-5",
        // V3-D215: hide header when SalonStickyTabNav is taking over (PDP-deep-scroll).
        isSalonDetail && hiddenForSalonNav && "-translate-y-full pointer-events-none",
      )}
      style={{
        WebkitBackdropFilter: scrolled || isDark ? "blur(14px) saturate(1.4)" : undefined,
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-2.5 px-4 md:gap-6 md:px-8">
        {/* Logo — V3-D171 (2026-05-26): fades out when menu opens so the
            mobile menu sheet has a clean top edge. opacity-0 +
            pointer-events-none keeps the flex layout intact (hamburger
            position doesn't shift) while making the wordmark invisible
            and untappable while menu is open. */}
        <Link
          href={`/${locale}`}
          aria-label="Solen zur Startseite"
          className={cn(
            // V3-D193 (2026-05-26): Solen wordmark weight 900 → 800 per "too bold" sweep.
            "font-display relative inline-flex shrink-0 items-baseline text-[22px] font-semibold leading-none tracking-normal md:text-[24px] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
            "transition-opacity duration-200 ease-glide",
            menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
            // V3-D101: invert logo color when header is over a dark section
            isDark ? "text-white" : "text-s-ink",
          )}
        >
          Solen
          {/* V3-D146 (2026-05-25): green dot removed per B&W palette pivot —
              "drop the dot entirely — just 'Solen'". Wordmark is now pure
              typographic. Restore by un-commenting the <span> below + the
              bg-s-ink class. */}
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
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
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
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
          >
            Über uns
          </Link>
          {/* V3-D157 (2026-05-25): desktop city selector. Sits between
              Über uns and Anmelden so it reads as a utility control (right
              of nav, left of primary CTA). Mobile uses CityTopBar →
              MobileMenu instead — desktop has no hamburger until login,
              so the city control needs to live inline in the nav. */}
          <DesktopCitySelector locale={locale} />
          <Link
            href={`/${locale}/auth/login`}
            className="hidden md:inline-flex items-center rounded-full bg-s-ink px-5 py-[9px] font-body text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(4,51,56,0.18)] transition-all duration-200 ease-glide hover:bg-black hover:shadow-[0_6px_16px_rgba(4,51,56,0.24)] active:scale-[0.97] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
          >
            Anmelden
          </Link>
          {/* V3-D167 (2026-05-26): notification Bell. Sits LEFT of the
              hamburger so the visual rhythm reads: [Bell] [Menu] — both
              utility, then primary nav. Same pill styling as the
              hamburger (44px hit area, white bg, ink stroke); the only
              difference is the icon swings on hover via BellIcon's
              motion/react variants. Currently a no-op click — wire to
              a notifications endpoint / panel once that surface ships.
              Mobile-only for now (matches hamburger's visibility); add
              `md:inline-flex` on the wrapper later to also show desktop. */}
          {/* V3-D167b (2026-05-26): Bell rendered bare — no white pill,
              no shadow. Visual hierarchy: hamburger = primary (boxed,
              elevated), bell = secondary utility (just glyph). Tap target
              kept at 44×44 for accessibility even though the box is gone.
              V3-D171 (2026-05-26): also fades out when menu opens (same
              pattern as Solen logo) — only the X close button remains
              visible while the menu is open. */}
          <button
            type="button"
            aria-label="Benachrichtigungen"
            onClick={() => {
              // TODO: open notifications panel when wired
            }}
            className={cn(
              "md:hidden grid h-11 w-11 place-items-center text-s-ink transition-[transform,opacity] duration-200 ease-glide active:scale-[0.94] focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              menuOpen && "opacity-0 pointer-events-none",
            )}
          >
            <BellIcon size={22} strokeWidth={2.2} />
          </button>
          {/* V3-D155 (2026-05-25): mobile map icon removed — the Karte tile
              in MobileCategoriesRow ("Für dich" 3×2 grid, position 6) now
              serves the same entry point, so the header icon was redundant. */}
          <button
            type="button"
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden relative -m-2 grid h-11 w-11 place-items-center rounded-xl p-2 bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 ease-glide active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
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
