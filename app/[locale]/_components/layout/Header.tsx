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
  // V3-D352 (2026-05-30): canonical B2B page is now /fuer-salons (the /business
  // rebuild was absorbed there). /business + /partner 301 → /fuer-salons via
  // next.config.mjs. Anchors live on the /fuer-salons page: #features
  // (how it works), #anmelden (signup form), #pricing.
  { label: "Werde Solen-Partner",  href: "/fuer-salons#anmelden" },
  { label: "Wie es funktioniert",  href: "/fuer-salons#features" },
  { label: "Demo buchen",          href: "/fuer-salons#anmelden" },
  { label: "Preise",               href: "/fuer-salons#pricing"  },
];

// V3-D349 (2026-05-28): compact search pill fused into the mobile header on
// the category/search routes (Airbnb shrink-into-nav). The big search lives in
// SearchTemplate's document flow and scrolls away; once `scrolled` flips true
// this pill takes over the previously-empty mobile middle slot. Route-gated +
// scroll-gated so the homepage and all non-category routes are untouched.
// `search` → the segment that maps to /search (all services, no category label).
const CATEGORY_SEARCH_SEGMENTS = [
  "coiffeur",
  "barbershop",
  "nails",
  "spa",
  "makeup",
  "waxing",
  "search",
] as const;
type CategorySearchSegment = (typeof CATEGORY_SEARCH_SEGMENTS)[number];

// V3-D364 (2026-05-29): the category bar that lives IN the header's mobile middle
// slot (between the logo and the hamburger) at the top of category routes - per
// repeated user request ("the red box"). Mirrors SearchTemplate's CATEGORY_PILLS
// (coiffeur / barbershop / nails / spa; icons under /public/icons/categories).
const HEADER_CATEGORIES: { slug: string; route: string; label: string; iconSrc: string }[] = [
  { slug: "coiffeur", route: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/scissors.png" },
  { slug: "barbershop", route: "barbershop", label: "Barber", iconSrc: "/icons/categories/clippers.png" },
  { slug: "nails", route: "nails", label: "Nails", iconSrc: "/icons/categories/nails.png" },
  { slug: "spa", route: "spa", label: "Spa", iconSrc: "/icons/categories/spa.png" },
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
  // V3-D377 (2026-05-29): category-route header FOLD threshold, kept SEPARATE from
  // `scrolled` (the >30 frost trigger) and SYNCED to the search band's shrink in
  // SearchTemplate. The approved mock (public/solen-search-shrink.html) toggles ONE
  // class at ONE scroll point, so the header-collapse + the search-shrink move as a
  // SINGLE motion. Matching the band's hysteresis (collapse past 60, release under 30)
  // stops the two-stage "header vanishes, THEN search shrinks 30px later" desync.
  const [categoryCollapsed, setCategoryCollapsed] = React.useState(false);
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

  // V3-D349 (2026-05-28): detect a category/search route so the fused compact
  // search pill only ever appears there. Matches /{locale}/{segment} exactly
  // (trailing slash tolerated); query string is irrelevant to pathname.
  const categorySegment = React.useMemo<CategorySearchSegment | null>(() => {
    if (!pathname) return null;
    const m = pathname.match(/^\/[a-z]{2}\/([^/?#]+)\/?$/);
    const seg = m?.[1];
    return seg && (CATEGORY_SEARCH_SEGMENTS as readonly string[]).includes(seg)
      ? (seg as CategorySearchSegment)
      : null;
  }, [pathname]);

  React.useEffect(() => {
    const HEADER_H = 80; // approximate header height incl. padding
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      // V3-D377: fold trigger synced to the search band shrink (60 down / 30 up) so
      // the header collapse + the search collapse fire on the same scroll frame.
      setCategoryCollapsed((prev) => (prev ? y > 30 : y > 60));
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

  // V3-D346: hide the marketing header on the operator dashboard — DashboardLayout
  // owns its own chrome (sidebar + topbar). Prevents the double-header + logo collision.
  if (pathname && /^\/[a-z]{2}\/dashboard(\/|$)/.test(pathname)) return null;

  return (
    <>
    <header
      data-tone={tone}
      className={cn(
        "sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-glide",
        // V3-D354: vertical padding is decoupled from menuOpen so opening the menu
        // never shifts the header height. Before, the menuOpen branch forced py-3
        // over the top-state py-5, so the hamburger -> X box jumped up ~8px on open.
        // py now depends ONLY on scrolled/dark; menuOpen just flips the bg/shadow.
        // V3-D365: on category routes (top state) keep the top breathing (pt-5) but
        // tighten the BOTTOM (pb-1) so the in-page search bar tucks right under the
        // category bar - the 20px py-5 bottom was the real "gap too big" (user). Other
        // routes + scrolled state unchanged.
        scrolled || isDark ? "py-3" : categorySegment ? "pt-5 pb-1" : "py-5",
        // V3-D352: with the mobile menu open, the header goes fully transparent (no
        // frosted band, no shadow) so the menu reads as one clean full-screen sheet
        // from the top - only the X floats in the corner. Checked first so its bg wins.
        menuOpen
          ? "bg-transparent shadow-none"
          : // Dark tone wins over frosted-light. White text + navy bg over dark sections.
            isDark
            ? "bg-black/85 backdrop-blur-[28px] backdrop-saturate-[1.4] shadow-[0_1px_24px_rgba(0,0,0,0.15)] text-s-ink"
            : scrolled
              ? "bg-white/65 backdrop-blur-[28px] backdrop-saturate-[1.7] shadow-[0_1px_24px_rgba(4,51,56,0.04)]"
              : "bg-transparent",
        // V3-D215: hide header when SalonStickyTabNav is taking over (PDP-deep-scroll).
        isSalonDetail && hiddenForSalonNav && "-translate-y-full pointer-events-none",
        // V3-D376 (2026-05-29): Airbnb shrink-search handoff. On category/search
        // routes (MOBILE only) the WHOLE header FOLDS AWAY on scroll - logo +
        // category bar + hamburger collapse together - so the sticky search band in
        // SearchTemplate (z-[55], above this z-50) takes over the very top. "The
        // search replaces the header" per the user-approved mock
        // (public/solen-search-shrink.html). max-h collapses the FLOW box (border-box
        // clamps padding too), so the page content + that search rise to top-0;
        // opacity + pointer-events finish the handoff. Desktop (md+) is untouched -
        // the dropdown-nav header stays put (the shrink-search is a mobile pattern).
        // ONE max-h value per state (ternary, not two competing utilities) - cn() here
        // is clsx-only, so two `max-md:max-h-*` would both emit and CSS source-order
        // would let the larger win (the header would go invisible but keep its height).
        categorySegment &&
          (categoryCollapsed && !menuOpen
            ? "max-md:overflow-hidden max-md:max-h-0 max-md:opacity-0 max-md:pointer-events-none"
            : "max-md:overflow-hidden max-md:max-h-[140px]"),
      )}
      style={{
        WebkitBackdropFilter:
          !menuOpen && (scrolled || isDark) ? "blur(14px) saturate(1.4)" : undefined,
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
            "font-display relative inline-flex shrink-0 items-baseline text-[25px] font-semibold leading-none tracking-normal md:text-[26px] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
            "transition-opacity duration-200 ease-glide",
            menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
            // V3-D101: invert logo color when header is over a dark section
            isDark ? "text-white" : "text-s-ink",
            // V3-D376 (2026-05-29): the logo no longer self-hides on scroll - it
            // folds away WITH the whole header (see the header max-h collapse above).
          )}
        >
          Solen
          {/* V3-D146 (2026-05-25): green dot removed per B&W palette pivot —
              "drop the dot entirely — just 'Solen'". Wordmark is now pure
              typographic. Restore by un-commenting the <span> below + the
              bg-s-ink class. */}
        </Link>

        {/* Mobile: middle area. Empty by default (flex spacer pushes the
            hamburger to the right edge — as it was for the homepage + all
            non-category routes).
            V3-D376 (2026-05-29): on a category/search route this slot holds the
            scrollable CATEGORY BAR (Coiffeur / Barber / Nails / Spa). It no longer
            crossfades into a search pill on scroll - instead the WHOLE header folds
            away (see the max-h collapse on <header>) and the sticky search band in
            SearchTemplate takes the top. ONE element shrinks, not two that swap
            (the V3-D375 "flip" the user rejected). When `categorySegment` is null
            this is the same empty spacer as the homepage + every other route. */}
        {categorySegment ? (
          <div
            role="tablist"
            aria-label="Kategorien"
            className={cn(
              // md:hidden — desktop uses the dropdown <nav> below instead.
              // mr-3 = clear gap from the hamburger. Right fade mask signals
              // "more categories scroll" + stops the last pill jamming the menu.
              "md:hidden flex min-w-0 flex-1 items-center gap-2 overflow-x-auto scrollbar-none mr-3",
              menuOpen && "pointer-events-none",
            )}
            style={{
              scrollbarWidth: "none",
              WebkitMaskImage: "linear-gradient(90deg, #000 86%, transparent)",
              maskImage: "linear-gradient(90deg, #000 86%, transparent)",
            }}
          >
            {[...HEADER_CATEGORIES]
              .sort(
                (a, b) =>
                  (a.slug === categorySegment ? 0 : 1) -
                  (b.slug === categorySegment ? 0 : 1),
              )
              .map((c) => {
                const isActive = c.slug === categorySegment;
                return (
                  <Link
                    key={c.slug}
                    href={`/${locale}/${c.route}`}
                    role="tab"
                    aria-selected={isActive}
                    className={cn(
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4",
                      "font-body text-[15px] leading-none transition-colors duration-150 ease-glide",
                      "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                      isActive
                        ? "border-s-bg-sunken bg-s-bg-sunken font-semibold text-s-ink"
                        : "border-s-border bg-white font-medium text-s-ink",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.iconSrc}
                      alt=""
                      className="h-[22px] w-[22px] shrink-0 object-contain"
                      aria-hidden
                    />
                    {c.label}
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="flex-1 md:hidden" />
        )}

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
              // V3-D362 (2026-05-29): hide the bell on category/search routes
              // ALWAYS (not just when scrolled) - user wants those pages' header
              // to be just logo + hamburger. Bell stays on the homepage + elsewhere.
              categorySegment && "hidden",
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
            className={cn(
              "md:hidden relative -m-2 grid place-items-center rounded-xl p-2 bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 ease-glide active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              // V3-D376 (2026-05-29): hamburger no longer self-hides on scroll - it
              // folds away WITH the whole header (max-h collapse on <header>) so the
              // sticky search band takes the top. Tap target stays 44px (h-10 w-10).
              "h-10 w-10",
            )}
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
