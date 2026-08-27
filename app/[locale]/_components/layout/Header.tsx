"use client";

import * as React from "react";
// Owner 2026-07-31: "when you click services, it goes to the service bit smoothly. It doesn't
// really look like it's jumping to another page. That's what I want."
//
// The plumbing for that was already installed and this file was the one row not using it:
// next-view-transitions 0.3.5 is a dependency, <ViewTransitions> is mounted at app/layout.tsx:74,
// and SalonCard.tsx already imports this Link so a card photo can morph into the PDP hero. The
// header category row imported plain next/link, so every category click was a hard swap with no
// transition. API-identical to next/link, so nothing else in this file changes.
import { Link } from "next-view-transitions";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Home, Menu, MapPin, X, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import MobileMenu from "./MobileMenu";
import { Logo } from "@/app/[locale]/_components/primitives";
import NotificationBell from "./NotificationBell";
import DesktopCitySelector from "./DesktopCitySelector";
import LanguageSwitcher from "@/components-legacy/ui/LanguageSwitcher";
import { getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity, setPersistedCity } from "@/lib/city-cookie";
import { useActiveCities } from "@/hooks/useActiveCities";
import { strokeForSize } from "@/lib/icon-stroke";
import { ownsItsOwnBack } from "./FooterGate";

/**
 * V3 Header, V2-D46 (2026-05-09).
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
// V2-D49d: V3 4-category strip, text-only inline links between logo and
// right-side actions. Mobile: scrolls horizontally w right-edge mask fade.
// Desktop: centered, no fade. Icons retired (V2-D49d revision per user
// "delete the pills and only txt").
const CATEGORIES: { label: string; href: string }[] = [
  { label: "Coiffeur",   href: "/coiffeur"   },
  { label: "Barbershop", href: "/barbershop" },
  { label: "Nails",      href: "/nails"      },
  { label: "Inspo",      href: "/inspo"  },
];

// V3-D75-header (2026-05-18): desktop dropdown menus. Replaces the
// scroll-x category strip on md+ with two hover dropdowns: Services
// (consumer-facing categories) and Für Unternehmen (B2B links). Mobile
// keeps the scroll strip, it works well on touch and the hamburger
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
  // Now points to /business, the new B2B landing page with anchor #anmelden
  // for the signup form scroll target.
  // V3-D208 (2026-05-26, overnight ghost-404 sweep): /business/how, /business/demo,
  // /business/pricing also 404, no sub-routes ever existed. The /business page
  // covers all three intents inline (how-it-works section #3, anmelden form
  // section #9, pricing section #6). Swap to in-page anchors so nav doesn't
  // dead-end. Anchors: #how, #anmelden, #pricing (added to /business page sections
  // when Wave 2 rebuild lands; until then they scroll to nearest section).
  { label: "Werden Sie Solen-Partner",  href: "/partner" },
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
  "search",
] as const;
type CategorySearchSegment = (typeof CATEGORY_SEARCH_SEGMENTS)[number];

// V3-D364 (2026-05-29): the category bar that used to live IN the header's mobile middle
// slot. MOVED 2026-08-10 (owner ask, pill row now renders below the search bar, not above
// it): HEADER_CATEGORIES + the row's JSX now live in ./CategoryPillRow.tsx, mounted directly
// after the search pill on each route that owns one (page.tsx, search/SearchTemplate.tsx,
// inspo/page.tsx) instead of as a sibling of this header. See that file's header comment.

/**
 * DropdownMenu, header dropdown nav item with hover-to-open behavior.
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
          "hover:bg-s-bg-sunken hover:text-s-ink",
          open && "bg-s-bg-sunken text-s-ink",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      >
        {label}
        <ChevronDown
          size={14}
          strokeWidth={1.6}
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
            // mockup-ok: notation cleanup, locked law not new design (2026-07-17).
            // rounded-[16px] numerically equals the rounded-2xl token; zero visual
            // change, also the outer reference for the nested menu-item fix below.
            className="absolute left-0 top-full mt-2 min-w-[240px] rounded-2xl bg-white p-2 z-[60]"
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
                  // mockup-ok: DS-4 nested-radius formula (LOCKFILE:428-431, locked law).
                  // Outer (dropdown) rounded-2xl=16, gap=p-2=8, inner = 16-8 = 8 (was
                  // rounded-[12px], no ladder token equals 8 so kept as an arbitrary value).
                  "flex items-center rounded-[8px] px-4 py-3 font-body text-[14px] font-medium text-s-ink",
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

/**
 * MobileCityChip, V3-D421k (2026-06-06, owner "i want city option"): the mobile
 * header's middle slot on the HOMEPAGE shows the current city as a "{City} ▾" chip
 * (re-introducing a mobile city control after V3-D421g removed the old one, now it
 * has a proper home in the C-header middle). Cookie-persisted + reload, mirroring
 * DesktopCitySelector. Local to Header (not a shared component → no registry entry).
 */
function MobileCityChip({ locale }: { locale: string }) {
  // Its own hook: this is a separate component in the same file, so the Header's tCities is
  // not in scope here. cities.select already exists in all four locales.
  const tCities = useTranslations("cities");
  const [mounted, setMounted] = React.useState(false);
  const [city, setCity] = React.useState<CitySlug>("basel");
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
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  const pick = (slug: CitySlug) => {
    setOpen(false);
    if (slug === city) return;
    setPersistedCity(slug);
    window.location.reload();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={tCities("select")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-body text-[15px] font-semibold text-s-ink",
          "transition-colors duration-150 ease-glide hover:bg-s-bg-sunken",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      >
        <MapPin size={15} strokeWidth={1.9} aria-hidden className="text-s-ink-2" />
        <span>{getCityName(city, locale, activeCities.find((c) => c.slug === city))}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.6}
          aria-hidden
          className={cn("text-s-ink-2 transition-transform duration-150 ease-glide", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={tCities("select")}
          className="absolute left-1/2 top-full z-50 mt-2 w-[170px] -translate-x-1/2 overflow-hidden rounded-xl border border-s-border bg-white shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
        >
          {activeCities.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="option"
              aria-selected={c.slug === city}
              onClick={() => pick(c.slug)}
              className={cn(
                "block w-full px-3.5 py-2.5 text-left font-body text-[14px] transition-colors hover:bg-s-bg-sunken",
                c.slug === city ? "font-bold text-s-ink" : "font-medium text-s-ink",
              )}
            >
              {getCityName(c.slug, locale, c)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ locale }: { locale: string }) {
  const tSD = useTranslations("salonDetail");
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
  // navy band), when any of them is currently passing under the header,
  // header switches to dark navy with light text. Matches the Hims pattern
  // the user pointed at in IMG_4285 ("header color changes too").
  const [tone, setTone] = React.useState<"light" | "dark">("light");
  // The category-pill press state (pressedCategory/handleCategoryPress) moved to
  // ./CategoryPillRow.tsx 2026-08-10 along with the row itself, see the note above
  // HEADER_CATEGORIES used to sit.

  // V3-D215 (verifier #1): pathname guard, only hide-on-scroll on salon-detail
  // PDPs (path matches `/{locale}/salon/{slug}`). Computed once per render.
  const pathname = usePathname() ?? "/";
  const isSalonDetail = React.useMemo(() => {
    if (!pathname) return false;
    const m = pathname.match(/^\/[a-z]{2}\/salon\/[^/]+\/?$/);
    return !!m;
  }, [pathname]);

  // V3-D461 (2026-06-09, council nav): the far-left slot is HOME on top-level destinations and
  // BACK on deep pages, one up-affordance, never both (owner-flagged Home+Back+breadcrumb stack).
  // Top-level = homepage / the category browse routes / search / discover / city-category browse.
  const router = useRouter();
  const isTopLevel = React.useMemo(() => {
    if (!pathname) return true;
    const seg = pathname.replace(/^\/[a-z]{2}/, "").replace(/\/$/, "");
    if (seg === "") return true; // homepage
    const TOP = ["/coiffeur", "/barbershop", "/nails", "/spa", "/search", "/inspo"];
    if (TOP.includes(seg)) return true;
    const parts = seg.split("/").filter(Boolean); // city-category browse, e.g. /basel/coiffeur
    if (parts.length === 2 && ["coiffeur", "barbershop", "nails", "spa"].includes(parts[1])) return true;
    return false;
  }, [pathname]);

  // Routes that render their OWN local back control (ownsItsOwnBack, IMPORTED from
  // FooterGate.tsx, not copied). This is deliberately a DIFFERENT classifier than isTaskStep:
  // isTaskStep answers "hide the footer", ownsItsOwnBack answers "does the page already have a
  // back button". Reusing isTaskStep here once broke /salon/[slug]/reviews (zero back controls,
  // confirmed live 2026-08-23), because that route is task-step (hides the footer) but gave up
  // its own local back on 2026-08-09 and relies on this header. ownsItsOwnBack's own list in
  // FooterGate.tsx is the single source of truth; nothing is duplicated here. On a route this
  // returns true for, the header renders neither the home tile nor its own back in the
  // far-left slot, since the page below already has one.
  const routeOwnsItsOwnBack = React.useMemo(() => {
    if (!pathname) return false;
    const seg = pathname.replace(/^\/[a-z]{2}/, "").replace(/\/$/, "") || "/";
    return ownsItsOwnBack(seg);
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

  // V3-D410 (user): on the Inspo page the logo slot becomes the page title + a
  // "Solen › Inspo" breadcrumb (Solen still taps → home), replacing the standalone
  // wordmark + the page's own big h1 that were stacking redundantly. Route-gated to /inspo.
  const isDiscover = !!pathname && /^\/[a-z]{2}\/inspo\/?$/.test(pathname);
  // Owner 2026-06-29 (council-confirmed): on the HOMEPAGE the far-left slot shows the Solen logo (the
  // home icon is redundant on home). Other top-level pages keep the Home icon as a go-home affordance.
  const isHome = !!pathname && /^\/[a-z]{2}\/?$/.test(pathname);
  // 2026-08-21 (owner, measured live at 390x844, not eyeballed: 2 chrome controls on
  // /auth/login top row against the approved login mockup's 1). The four auth screens
  // (login/register/signup/reset-password) are a single focused flow with nothing the
  // hamburger menu needs to reach, same reasoning the salon-detail / dashboard branches
  // already use elsewhere in this file to drop chrome that doesn't belong on a narrow
  // task. Scoped narrowly: this only feeds the hamburger button's own className below
  // (the far-left back-arrow tile from isTopLevel stays, desktop nav is untouched since
  // the hamburger is already md:hidden there).
  const isFocusedAuthFlow = !!pathname && /^\/[a-z]{2}\/auth\/(login|register|signup|reset-password)(\/|$)/.test(pathname);
  // V3-D (2026-08-01, owner "why is homepage still that bro"): the home route now renders the
  // SAME mobile category-chrome as the category/search routes (the All pill selected via
  // HEADER_CATEGORIES' `home` entry above), so it opts into every MOBILE-ONLY categorySegment
  // gate below (the utility-row hide, the category-pill tab row). `categorySegment` itself
  // stays scoped to the CATEGORY_SEARCH_SEGMENTS union , it still drives the MobileCityChip
  // branch untouched here, and the header's non-breakpoint-scoped `pt-5 pb-1` padding below is
  // widened separately with an explicit `max-md:` guard so desktop home stays `py-5`.
  // I8 (2026-08-01, search-a.html's Inspo tab: the pill row + search pill are the SAME chrome on
  // every category, "All" and Inspo alike). `isDiscover` (bare /inspo route) joins the OR here,
  // deliberately NOT folded into `categorySegment` itself: categorySegment also drives the
  // header's scroll-collapse-to-nothing fold (further down, gated on the bare `categorySegment`
  // variable, intentionally not widened), which hands the top-chrome slot off to a SearchTemplate
  // sticky search band. /inspo has no SearchTemplate mounted, so folding the header there would
  // leave mobile scroll with no chrome at all, same reasoning already recorded for `isHome` above.
  const showCategoryChrome = isHome || !!categorySegment || isDiscover;
  const tDiscover = useTranslations("discover");
  // 2026-07-27 language sweep: five German literals in this file rendered German to English,
  // French and Italian visitors on EVERY page, because the header is global. Four of the five
  // reuse keys that already existed in all four locales (navigation.login, common.back,
  // cities.select); only aboutUs and myAccount were genuinely new.
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const tCities = useTranslations("cities");
  const tDashboardNav = useTranslations("dashboard.nav");
  const tBeautyTabs = useTranslations("account.beauty.tabs");
  const tProfileHub = useTranslations("profileHub");

  // Owner 2026-06-11: profile-subpage titles sit BESIDE the back tile (the stacked
  // page h1 below the header read unbalanced). Same slot idea as the V3-D410
  // discover-title; route-gated so every other page is untouched.
  // Owner 2026-06-12: roll it out to EVERY deep profile page (was only
  // favorites/stamps/looks), "you didn't apply it everywhere". Each page's own
  // body <h1> is removed in the same change, so the title shows once, in the bar.
  // Labels mirror the hub rows the owner taps to get here (chip == the tile that
  // navigated in); intake-forms is shortened to "Formulare"/"Forms"/"Formulaires"/
  // "Moduli" so the long "Konsultationsformulare" can't overflow the mobile bar
  // (measured live at 390px: even the longest of the four, French "Formulaires",
  // renders well inside the bar with room to spare next to the back tile).
  // 2026-08-27 i18n fix: this used to render 20 hardcoded German literals on the
  // GLOBAL header, so every deep profile route read German on /en, /fr and /it
  // too. The comment here used to say the German was hardcoded "on purpose"
  // because "a missing i18n key here would throw and white-screen the app" , but
  // this file already calls useTranslations five other times above, and reading
  // i18n.ts shows the app-wide config already closes that exact risk: `onError`
  // only logs, never throws, and `getMessageFallback` resolves any missing key to
  // the German string automatically. So the fear was never actually true for this
  // codebase. `safeTitle` below adds a second, local layer of the same guarantee
  // (try/catch -> the same German literal used before this fix), so a missing key
  // here cannot throw and cannot white-screen the app, verified two ways rather
  // than asserted. All 20 keys already existed in all four locales before this
  // change (profileHub / dashboard.nav / account.beauty.tabs), zero new keys.
  const safeTitle = React.useCallback((translate: () => string, de: string): string => {
    try {
      const val = translate();
      return val || de;
    } catch (err) {
      console.error("[Header] deepPageTitle: translation key missing, falling back to German:", err);
      return de;
    }
  }, []);
  const deepPageTitle = React.useMemo(() => {
    if (!pathname) return null;
    const TITLES: [RegExp, string, () => string][] = [
      [/\/rewards\/?$/, "Treueprogramm", () => tDashboardNav("loyalty")],
      [/\/profile\/bookings\/?$/, "Termine", () => tProfileHub("tileAppointments")],
      [/\/profile\/favorites\/?$/, "Favoriten", () => tProfileHub("statFavorites")],
      [/\/profile\/stamps\/?$/, "Stempel", () => tProfileHub("statStamps")],
      [/\/profile\/looks\/?$/, "Looks", () => tBeautyTabs("looks")],
      [/\/profile\/gift-cards\/?$/, "Geschenkkarten", () => tProfileHub("walletDesc")],
      [/\/profile\/haarprofil\/?$/, "Haarprofil", () => tProfileHub("haarprofil")],
      [/\/profile\/vouchers\/?$/, "Gutscheine", () => tProfileHub("vouchers")],
      [/\/profile\/intake-forms\/?$/, "Formulare", () => tProfileHub("hubForms")],
      [/\/profile\/referral\/?$/, "Freunde einladen", () => tProfileHub("refer")],
      [/\/profile\/edit\/?$/, "Profil bearbeiten", () => tProfileHub("editProfile")],
      [/\/profile\/settings\/?$/, "Einstellungen", () => tProfileHub("settingsTitle")],
      // Settings hub sub-pages (restructure 2026-07-20): same key-per-route pattern as
      // the rest of this map, see the comment at the top of this block.
      [/\/profile\/settings\/personal\/?$/, "Persönliche Angaben", () => tProfileHub("hubPersonal")],
      [/\/profile\/settings\/password\/?$/, "Passwort", () => tProfileHub("hubPassword")],
      [/\/profile\/settings\/payment\/?$/, "Zahlungsmethoden", () => tProfileHub("hubPayment")],
      [/\/profile\/settings\/language\/?$/, "Sprache", () => tProfileHub("hubLanguage")],
      [/\/profile\/settings\/beauty\/?$/, "Beauty-Profil", () => tProfileHub("secBeauty")],
      [/\/profile\/settings\/notifications\/?$/, "Benachrichtigungen", () => tProfileHub("secNotifications")],
      [/\/profile\/settings\/delete\/?$/, "Konto löschen", () => tProfileHub("hubDeleteAccount")],
      // The content hub (2026-07-20/21 D1 rebuild split /profile into content-only,
      // "Konto" moved to /profile/settings, which already says "Solen Konto" in its
      // own identity block). $-anchored so it never matches the sub-pages above.
      [/\/profile\/?$/, "Profil", () => tProfileHub("secProfile")],
    ];
    for (const [re, de, translate] of TITLES) if (re.test(pathname)) return safeTitle(translate, de);
    return null;
  }, [pathname, tDashboardNav, tBeautyTabs, tProfileHub, safeTitle]);

  React.useEffect(() => {
    const HEADER_H = 80; // approximate header height incl. padding
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      // V3-D377: fold trigger synced to the search band shrink (60 down / 30 up) so
      // the header collapse + the search collapse fire on the same scroll frame.
      setCategoryCollapsed((prev) => (prev ? y > 30 : y > 60));
      // V3-D215: hysteresis matches SalonStickyTabNav.tsx (visible past 200,
      // hide until back near top at 100) so the handoff is clean, no flicker.
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
  // can hide itself while the menu is open. Naturally mobile-only ,
  // the hamburger that toggles `menuOpen` is md:hidden, so on desktop
  // `menuOpen` stays false and the event always carries open=false.
  React.useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("solen:menu-state", { detail: { open: menuOpen } }),
    );
  }, [menuOpen]);

  // V3-D (2026-08-01): the search pill's trailing button (SearchTemplate.tsx) now opens
  // this same MobileMenu instead of the map, since the top-row hamburger that used to own
  // that job is hidden on mobile category/search routes (see the max-md:hidden row above).
  // SearchTemplate has no access to this component's local `menuOpen` state, so it fires a
  // window event the same way `solen:menu-state` is already broadcast OUT of this file, just
  // in the opposite direction.
  React.useEffect(() => {
    const onOpenMenu = () => setMenuOpen(true);
    window.addEventListener("solen:open-menu", onOpenMenu);
    return () => window.removeEventListener("solen:open-menu", onOpenMenu);
  }, []);

  const isDark = tone === "dark";

  // FIX 1 (2026-08-01, transparent-header tap-swallow bug): the header's OWN box should only
  // capture pointer events across its full padding box when it is actually painting a visible
  // background. Mirrors the bg ternary a few lines below exactly, so the two never disagree.
  // When the header is transparent (top of a light page, not scrolled, not dark, not mid
  // menu-toggle) its empty vertical padding must let taps fall through to whatever real,
  // visible page content sits underneath it, instead of swallowing the tap itself (measured:
  // the home search pill's <a href="/de/search"> sat at y=61, under the header's 102px
  // z-50 band, and every tap there navigated to /de/coiffeur, the header's own hit-area,
  // not the pill).
  const headerHasBg = !menuOpen && (isDark || scrolled);

  // V3-D378 (2026-05-30): header auth-awareness. Signed-in users see an account
  // avatar (→ /profile) where the "Anmelden" CTA sits; signed-out keep the CTA.
  // Client-side session detection mirrors BottomTabBar's proven pattern (no change
  // to the shared server layout). Brief signed-out→avatar swap on first paint is
  // acceptable; most header views are marketing (signed-out) anyway.
  const [session, setSession] = React.useState<Session | null>(null);
  React.useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  const loggedIn = !!session;
  const meta = session?.user?.user_metadata as Record<string, string> | undefined;
  const avatarUrl = meta?.avatar_url || meta?.picture || null;
  const accountName = meta?.full_name || meta?.name || session?.user?.email || "";
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || "·";

  // V3-D346: hide the marketing header on the operator dashboard, DashboardLayout
  // owns its own chrome (sidebar + topbar). Prevents the double-header + logo collision.
  if (pathname && /^\/[a-z]{2}\/dashboard(\/|$)/.test(pathname)) return null;

  return (
    <>
    <header
      data-tone={tone}
      className={cn(
        "sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-glide",
        // OVERRIDE 2026-08-01 (owner, live and literal, repeated ask: "why is the category
        // pills still sticky? What the fuck are you doing bro? No."): measured at scroll 0,
        // TWO things were position:sticky at once, this header (carrying the category-pill
        // row below) AND the search pill's own sticky wrapper (HomeSearchPill.tsx /
        // SearchTemplate.tsx). The category row itself has now moved OUT of this element
        // (rendered as a plain, non-sticky sibling right after </header>, see below), so on
        // every route that shows it (home / category-search / inspo) this header box carries
        // no mobile content at all (the utility row is already max-md:hidden on those routes,
        // see showCategoryChrome below). Forcing it to plain flow on mobile there removes the
        // SECOND sticky element entirely, leaving the search pill as the only thing that pins,
        // literally what was asked. `!` wins over the base "sticky" utility above regardless of
        // Tailwind's internal class order (same pattern as FIX 1's `!py-0` a few lines down).
        // Desktop is untouched (no separate search-pill stickiness there), and every OTHER
        // route (profile, PDP, etc., showCategoryChrome false) keeps the normal sticky header.
        showCategoryChrome && "max-md:!static",
        // V3-D354: vertical padding is decoupled from menuOpen so opening the menu
        // never shifts the header height. Before, the menuOpen branch forced py-3
        // over the top-state py-5, so the hamburger -> X box jumped up ~8px on open.
        // py now depends ONLY on scrolled/dark; menuOpen just flips the bg/shadow.
        // V3-D365: on category routes (top state) keep the top breathing (pt-5) but
        // tighten the BOTTOM (pb-1) so the in-page search bar tucks right under the
        // category bar - the 20px py-5 bottom was the real "gap too big" (user). Other
        // routes + scrolled state unchanged.
        scrolled || isDark
          ? "py-3"
          : categorySegment
            ? "pt-5 pb-1"
            // V3-D (2026-08-01): home gets the SAME mobile tuck as a category route (the
            // pill row now renders right below it), but desktop must stay `py-5` unchanged ,
            // hence the `max-md:` guard instead of widening the bare classes above.
            // I8: /inspo joins isHome here (same mobile tuck, same desktop py-5), so its
            // category-pill row sits at the same gap under the header as every other
            // showCategoryChrome route instead of falling through to the untucked default.
            : isHome || isDiscover
              ? "py-5 max-md:pt-5 max-md:pb-1"
              : "py-5",
        // H3 (owner 2026-08-02, "the header, the category and the search bar, they're placed too
        // low and it looks kind of weird"). On every showCategoryChrome route this header's own
        // mobile row is already `max-md:hidden` (the utility row below), so on a phone this box
        // renders NOTHING and its padding is pure empty band above the first thing the eye lands
        // on, measured at 24px. Zeroed on mobile only, so the pill row is the first element on
        // screen. Desktop keeps py-5 / pt-5 exactly as above.
        // This is a SPACING change and nothing else. It deliberately does NOT make the pill row
        // sticky: the owner rejected that by name on 2026-08-01 ("why is the category pills still
        // sticky? What the fuck are you doing bro? No.", the OVERRIDE comment above), and a later
        // rejection outranks the earlier "categories should be sticky" ask.
        showCategoryChrome && "max-md:!py-0", // mockup-ok: removes dead space, no visual element changes
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
        // FIX B (2026-08-01, owner "it should be search bar instead of category bar"): isHome
        // joins this fold. Before, the category-pill row rode inside this sticky header and
        // never folded on home (categorySegment is null there), so on scroll the CATEGORY BAR
        // was the thing pinned at the top, not the search bar. Home's HomeSearchPill (Hero.tsx)
        // is now itself sticky and takes the top-chrome hand-off (mirrors the SearchTemplate
        // pattern this whole block already implements for category/search routes), so the
        // header + its category row can fold away identically on home too.
        (categorySegment || isHome) &&
          (categoryCollapsed && !menuOpen
            // V3-D421j (owner): also zero the vertical padding (the `py-3` scrolled state
            // left a ~24px residual band above the search bar). `!py-0` beats `py-3`
            // regardless of source order, so the header fully collapses to nothing on
            // scroll and ONLY the sticky search band remains. transition-all (on the
            // header) animates max-h + padding + opacity together = the smooth fold.
            ? "max-md:overflow-hidden max-md:max-h-0 max-md:!py-0 max-md:opacity-0 max-md:pointer-events-none"
            : "max-md:overflow-hidden max-md:max-h-[140px]"),
      )}
      style={{
        WebkitBackdropFilter:
          !menuOpen && (scrolled || isDark) ? "blur(14px) saturate(1.4)" : undefined,
        // FIX 1: inline so it always wins over the tailwind class cascade (no ordering
        // ambiguity between "pointer-events-none"/"-auto" utilities). The two direct
        // children below opt back INTO pointer-events themselves, so every real control
        // stays clickable; only the header's own empty padding stops intercepting taps.
        // isSalonDetail+hiddenForSalonNav already carries its own "pointer-events-none"
        // class (the header is translated fully off-screen there) - keep that case in
        // explicit agreement instead of letting this inline style silently override it.
        pointerEvents:
          isSalonDetail && hiddenForSalonNav ? "none" : headerHasBg ? undefined : "none",
      }}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-[1280px] items-center gap-2.5 px-4 md:gap-6 md:px-8",
          // Owner 2026-08-01 ("we removed the home button and the hamburger menu from the top
          // and we put the hamburger where the map view is, did you forget bro, look in the
          // mockup"): on a category/search route this row sits directly above the category-pill
          // row below, and the approved chrome (public/_mockups/home-v3/search-a.html .sa-root)
          // has NO utility row there at all, the hamburger moved into the search pill's trailing
          // slot instead (SearchTemplate.tsx). Hidden on mobile only (`max-md:hidden`), same
          // hidden/md: pattern used for the filter row + count row in SearchTemplate.tsx; markup
          // and every handler stay intact, desktop (md+) is untouched.
          // V3-D (2026-08-01, owner "why is homepage still that bro"): widened from bare
          // categorySegment to showCategoryChrome, the home route now composes the identical
          // chrome (its own search pill's trailing slot owns the hamburger, see
          // HomeSearchPill.tsx), so this row is hidden there too. Deep pages (profile, PDP, etc.)
          // still keep this row, it remains their only nav chrome.
          showCategoryChrome && "max-md:hidden",
        )}
      >
        {/* Logo, V3-D171 (2026-05-26): fades out when menu opens so the
            mobile menu sheet has a clean top edge. opacity-0 +
            pointer-events-none keeps the flex layout intact (hamburger
            position doesn't shift) while making the wordmark invisible
            and untappable while menu is open. */}
        {isDiscover ? (
          /* V3-D411 (user): no breadcrumb on this top-level browse tab, the page title sits in the logo slot
             and taps → home. Breadcrumbs are reserved for deep pages (SOURCE.md §20 navigation pattern). */
          <Link
            href={`/${locale}`}
            aria-label={`${tDiscover("title")}, zur Solen Startseite`}
            className={cn(
              "font-display shrink-0 text-[25px] font-semibold leading-none tracking-normal md:text-[26px]",
              "transition-opacity duration-200 ease-glide focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
              menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
              isDark ? "text-white" : "text-s-ink",
            )}
          >
            {tDiscover("title")}
          </Link>
        ) : isHome ? (
          // Owner 2026-06-29: homepage shows the Solen wordmark, not the redundant home icon.
          <Link
            href={`/${locale}`}
            aria-label="Solen, zur Startseite"
            className={cn(
              "shrink-0 transition-opacity duration-200 ease-glide",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
              menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
            )}
          >
            <Logo size="md" tone={isDark ? "dark" : "light"} />
          </Link>
        ) : isTopLevel ? (
          <Link
            href={`/${locale}`}
            aria-label="Zur Startseite"
            className={cn(
              // V3-D421h (2026-06-05): home-icon button in the far-left slot. V3-D421k:
              // rounded-SQUARE tile. V3-D421L (2026-06-06, council 3/3): FLAT, no shadow
              // (CONTROL_ELEVATION rule 3: zero box-shadow on white chrome; the bar itself
              // lifts on scroll, not the buttons).
              // mockup-ok: S3 fix, 40px -> 44px floor, icon glyph size unchanged (approved fixes-refined)
              // mockup-ok: rounded snapped, punch-list geometry sweep, TASTE_LOG.md:187 2026-07-15
              "grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-elevation-2", // mockup-ok: LOCKFILE NAV CONTROLS (2026-08-10). Shadow, NO border: the design contract says a control carrying elevation drops its border, never both, and this file states that rule itself 300 lines down on the category pill. whisper was too faint to be the only edge on white, so it is elevation-2, which is what that table froze.
              "transition-[opacity,border-color,background-color,transform] duration-200 ease-glide active:scale-[0.94]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
              // V3-D101: invert over dark sections.
              isDark
                ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                : "border-s-border bg-white text-s-ink hover:border-s-ink",
            )}
          >
            <Home size={22} strokeWidth={2.2} aria-hidden />
          </Link>
        ) : routeOwnsItsOwnBack ? (
          // The page below owns its own back (ownsItsOwnBack, imported from FooterGate.tsx), so
          // this slot renders neither home nor back. Same h-11 w-11 footprint as the tile it
          // replaces, kept in the layout (not unmounted) via the same opacity-0
          // pointer-events-none technique this file already uses on the logo/home tile above to
          // hold space while menuOpen, so the hamburger slot never shifts.
          <div className="h-11 w-11 shrink-0 opacity-0 pointer-events-none" aria-hidden />
        ) : (
          // V3-D461: deep page → BACK (router.back with a home fallback for direct loads). Same tile.
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) router.back();
              else router.push(`/${locale}`);
            }}
            aria-label={tCommon("back")}
            className={cn(
              // mockup-ok: S3 fix, 40px -> 44px floor, icon glyph size unchanged (approved fixes-refined)
              // mockup-ok: rounded snapped, punch-list geometry sweep, TASTE_LOG.md:187 2026-07-15
              "grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-elevation-2", // mockup-ok: LOCKFILE NAV CONTROLS (2026-08-10). Shadow, NO border: the design contract says a control carrying elevation drops its border, never both, and this file states that rule itself 300 lines down on the category pill. whisper was too faint to be the only edge on white, so it is elevation-2, which is what that table froze.
              "transition-[opacity,border-color,background-color,transform] duration-200 ease-glide active:scale-[0.94]",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              menuOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
              isDark
                ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
                : "border-s-border bg-white text-s-ink hover:border-s-ink",
            )}
          >
            <ArrowLeft size={22} strokeWidth={2.2} aria-hidden />
          </button>
        )}

        {deepPageTitle && (
          <span
            className={cn(
              "shrink-0 font-heading text-[18px] font-bold tracking-[-0.01em]",
              menuOpen && "opacity-0 pointer-events-none",
              isDark ? "text-white" : "text-s-ink",
            )}
          >
            {deepPageTitle}
          </span>
        )}

        {/* Mobile: middle area. Empty by default (flex spacer pushes the
            hamburger to the right edge, as it was for the homepage + all
            non-category routes).
            V3-D376 (2026-05-29): on a category/search route this slot holds the
            scrollable CATEGORY BAR (Coiffeur / Barber / Nails / Spa). It no longer
            crossfades into a search pill on scroll - instead the WHOLE header folds
            away (see the max-h collapse on <header>) and the sticky search band in
            SearchTemplate takes the top. ONE element shrinks, not two that swap
            (the V3-D375 "flip" the user rejected). When `categorySegment` is null
            this is the same empty spacer as the homepage + every other route. */}
        {/* Mobile middle slot. V3-D421k (2026-06-06, owner "city option in category
            pages, centered"): on a category/search route this is the CITY chip,
            centered between the home + menu tiles. The category PILLS moved to their
            own full-width row below this container (see the category-tab row). Non-
            category routes (homepage etc.) keep the empty spacer (NO city, owner
            "not in homepage"). */}
        {/* V3 (2026-07-01, UX council): on /search the search bar OWNS the city (shows
            "Coiffeur / Bern"), so the header's global cookie-city chip is redundant AND
            can disagree with the search (cookie "Basel" vs search "Bern"). Hide it there;
            keep it on the category landing routes where there is no in-bar city control. */}
        {categorySegment && categorySegment !== "search" ? (
          <div
            className={cn(
              "flex min-w-0 flex-1 justify-center md:hidden",
              menuOpen && "pointer-events-none",
            )}
          >
            <MobileCityChip locale={locale} />
          </div>
        ) : (
          <div className="flex-1 md:hidden" />
        )}

        {/* ── DESKTOP NAV (md+), V3-D75 dropdown menus ──
            Replaces V2-D49d 4-category list. Two hover dropdowns + Entdecken
            direct link. Per user "instead of having many sh like all categories
            listed yk thats ass", dropdowns surface categories on demand
            instead of cluttering the always-on header. */}
        <nav
          aria-label={tNav("mainNavigation")}
          className="hidden md:flex min-w-0 flex-1 items-center justify-center gap-2"
        >
          {/* Two more German literals in the global header, found 2026-08-14 on the live English
              home page: "Für Unternehmen" rendered in German to every English, French and Italian
              visitor on every page. Same defect the 2026-07-27 sweep fixed five times in this file
              and missed here, because these two sit in the desktop nav rather than the mobile menu.
              Keys added to all four locale files. */}
          <DropdownMenu
            label={tNav("services")}
            items={SERVICES_MENU}
            locale={locale}
          />
          <DropdownMenu
            label={tNav("forBusiness")}
            items={BUSINESS_MENU}
            locale={locale}
          />
          <Link
            href={`/${locale}/inspo`}
            className={cn(
              "inline-flex items-center whitespace-nowrap rounded-full px-3 py-2 font-body text-[14px] font-medium text-s-ink-2",
              "transition-colors duration-200 ease-glide",
              "hover:bg-s-bg-sunken hover:text-s-ink",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
            )}
          >
            Inspo
          </Link>
        </nav>

        {/* Right side, Über uns (md+) + Anmelden (md+) + hamburger (mobile).
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
            {tNav("aboutUs")}
          </Link>
          {/* V3-D157 (2026-05-25): desktop city selector. Sits between
              Über uns and Anmelden so it reads as a utility control (right
              of nav, left of primary CTA). Mobile uses CityTopBar →
              MobileMenu instead, desktop has no hamburger until login,
              so the city control needs to live inline in the nav. */}
          <DesktopCitySelector locale={locale} />
          {/* Language, 2026-07-27 (owner: "changing lang doesnt rlly work"). It did not
              work, and this is why: LanguageSwitcher was mounted in exactly ONE place, the
              MobileMenu, whose hamburger trigger is md:hidden (:802). So a desktop visitor
              had no working switcher at all , only the footer's <Link href={`/${code}`}>,
              which throws you to that locale's HOMEPAGE and never sets the NEXT_LOCALE
              cookie, so the choice does not survive the next navigation. Same component, no
              new UI grammar: it sits beside DesktopCitySelector as a second utility control,
              matching the comment above about why the city control lives inline here. */}
          <span className="hidden md:inline-flex">
            <LanguageSwitcher locale={locale} />
          </span>
          {loggedIn ? (
            <Link
              href={`/${locale}/profile`}
              aria-label={tNav("myAccount")}
              className="relative hidden md:grid place-items-center w-9 h-9 shrink-0 overflow-hidden rounded-full border border-s-border bg-s-bg-sunken text-[13px] font-semibold text-s-ink transition-opacity duration-200 ease-glide hover:opacity-90 focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
            >
              <span aria-hidden>{accountInitial}</span>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="36px" className="object-cover" />
              ) : null}
            </Link>
          ) : (
            <Link
              href={`/${locale}/auth/login`}
              className="hidden md:inline-flex items-center rounded-full bg-s-ink px-5 py-[9px] font-body text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(4,51,56,0.18)] transition-all duration-200 ease-glide hover:bg-black hover:shadow-[0_6px_16px_rgba(4,51,56,0.24)] active:scale-[0.97] active:duration-[80ms] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2"
            >
              {tNav("login")}
            </Link>
          )}
          {/* V3-D167 (2026-05-26): notification Bell. Sits LEFT of the
              hamburger so the visual rhythm reads: [Bell] [Menu], both
              utility, then primary nav. Same pill styling as the
              hamburger (44px hit area, white bg, ink stroke); the only
              difference is the icon swings on hover via BellIcon's
              motion/react variants. Currently a no-op click, wire to
              a notifications endpoint / panel once that surface ships.
              Mobile-only for now (matches hamburger's visibility); add
              `md:inline-flex` on the wrapper later to also show desktop. */}
          {/* V3-D167b (2026-05-26): Bell rendered bare, no white pill,
              no shadow. Visual hierarchy: hamburger = primary (boxed,
              elevated), bell = secondary utility (just glyph). Tap target
              kept at 44×44 for accessibility even though the box is gone.
              V3-D171 (2026-05-26): also fades out when menu opens (same
              pattern as Solen logo), only the X close button remains
              visible while the menu is open. */}
          {/* V3-D (2026-06-11): notification Bell RESTORED, the customer panel
              (/notifications) + data source (/api/profile/notifications over the real
              notifications table) now exist. Logged-out renders nothing (no dead control,
              the reason it was removed 2026-06-10). [Bell] [Menu] rhythm per V3-D167. */}
          <NotificationBell hidden={menuOpen} />
          {/* V3-D155 (2026-05-25): mobile map icon removed, the Karte tile
              in MobileCategoriesRow ("Für dich" 3×2 grid, position 6) now
              serves the same entry point, so the header icon was redundant. */}
          <button
            type="button"
            aria-label={menuOpen ? tSD("closeMenu") : tSD("openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              // mockup-ok: rounded-[13px] below snapped to rounded-input (16px, on-ladder),
              // punch-list geometry sweep, TASTE_LOG.md:187 2026-07-15.
              // V3-D421k (2026-06-06): rounded-SQUARE tile matching the home button.
              // V3-D421L (council 3/3): FLAT - no shadow (CONTROL_ELEVATION rule 3). Tap
              // target 40px; folds with the header on category-route scroll.
              "md:hidden relative grid h-11 w-11 place-items-center rounded-input shadow-elevation-2 transition-[transform,background-color,border-color] duration-200 ease-glide active:scale-[0.94] focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
              isDark ? "border-white/30 bg-white/10 text-white" : "border-s-border bg-white text-s-ink",
              // 2026-08-21: the auth screens are a single focused flow (login/register/signup/
              // reset-password), so the menu control is dropped there. The back arrow above
              // (isTopLevel branch) is untouched, this hides only the hamburger, and only on
              // those four routes; every other route keeps it exactly as before.
              isFocusedAuthFlow && "hidden",
            )}
          >
            <span
              className={cn(
                "absolute inset-0 grid place-items-center transition-[opacity,transform] duration-[220ms] ease-glide",
                menuOpen ? "opacity-0 rotate-45 scale-[0.7]" : "opacity-100 rotate-0 scale-100",
              )}
              aria-hidden
            >
              {/* ig9 (owner-approved 2026-07-16): calibrated size-to-stroke table, lib/icon-stroke.ts */}
              <Menu size={22} strokeWidth={strokeForSize(22)} />
            </span>
            <span
              className={cn(
                "absolute inset-0 grid place-items-center transition-[opacity,transform] duration-[220ms] ease-glide",
                menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-45 scale-[0.7]",
              )}
              aria-hidden
            >
              {/* ig9 (owner-approved 2026-07-16): calibrated size-to-stroke table, lib/icon-stroke.ts */}
              <X size={22} strokeWidth={strokeForSize(22)} />
            </span>
          </button>
        </div>
      </div>
    </header>
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} locale={locale} loggedIn={loggedIn} />
    </>
  );
}
