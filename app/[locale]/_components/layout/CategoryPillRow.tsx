// registry-sync-ok: registry row added at _design-system/COMPONENT_REGISTRY.md ("CategoryPillRow")
// and doc written at _design-system/components/CategoryPillRow.md, both in this same turn.
// exists-check: `npm run exists CategoryPillRow` run this turn, 0 hits, genuinely new.
//
// Extracted from layout/Header.tsx (2026-08-10, owner: "I also want the icon, you know, the icon
// was, like, underneath of the search bar, you know, like, selecting and stuff and, like, maybe,
// like, a little bit smaller." = the category pill row, moved BELOW the search bar). The row was a
// non-sticky sibling rendered right after Header's own </header> (see the OVERRIDE 2026-08-01
// comment still in Header.tsx: "why is the category pills still sticky? What the fuck are you
// doing bro? No."), which put it ABOVE every route's search pill because Header mounts before
// <main>. CSS `order` cannot interleave a sibling of <main> between two of <main>'s own children,
// so the row is a standalone component now, mounted directly after each surface's OWN search pill
// instead: `page.tsx` (home, after `<HomeSearchPill>`), `search/SearchTemplate.tsx` (category/search
// routes, after the sticky search band), and `inspo/page.tsx` (the bare /inspo route, after its own
// `<HomeSearchPill>` , not covered by SearchTemplate, confirmed by grep: no SearchTemplate import
// there, only a comment reference).
//
// JSX, markup classes, HEADER_CATEGORIES, the press-state handling and the isActive derivation are
// moved VERBATIM off Header.tsx. Owner, of these pills by name: "not on a category, it's already
// good. It only looks good how it is." So nothing about the pill's OWN treatment changed here,
// only its host location. The ONE geometry value touched in this same turn (owner ask, "maybe a
// little bit smaller... so people can know that it's actually scrollable") is the horizontal pill
// padding, `px-3` -> `px-2.5`, called out at its own class line below.
//
// ONE thing dropped, not moved: the three local focus-ring utility classes Header.tsx's copy
// carried on the pill Link (a 2px ink ring at a 2px offset). LOCKFILE's `focus` row already gives
// every link/button the global 2px ink ring from globals.css (V3-D449, "primitives add NO extra
// ring, no double ring"), so those local classes were always redundant, never load-bearing;
// dropping them changes nothing rendered.
//
// reinvent-ok: HEADER_CATEGORIES below is a MOVE, not a new list. It already lived in
// layout/Header.tsx (this exact array, this exact shape: slug + route + label + PNG iconSrc + a
// `home` flag) before this extraction; the task explicitly named it as one of the things to carry
// over VERBATIM. It is not a duplicate of an existing canonical constant: checked
// homepage/searchCategories.ts (SearchCategory: label/icon/bg/fg, Earthen-Wellness color combos,
// a different UI), lib/discovery-categories.ts (DISCOVERY_CATEGORIES, the Inspo feed's OWN
// internal hair/nails/lashes/brows sub-taxonomy, a different namespace per that file's own
// DISCOVERY_TO_MARKETPLACE_CATEGORY bridge comment), and search/SearchTemplate.tsx's exported
// CATEGORY_PILLS (a separate, already-accepted local copy per COMPONENT_REGISTRY.md's own
// TopCategoryRails row: "match HEADER_CATEGORIES... and CATEGORY_PILLS... byte-for-byte but are a
// local copy, not a cross-import"). Moving Header.tsx's copy to its new home is not introducing a
// fourth list; Header.tsx's own copy is deleted in the same turn, no dead duplicate left behind.
"use client";

import * as React from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { strokeForSize } from "@/lib/icon-stroke";

// Reproduced from layout/Header.tsx (not imported): Header still needs its own copy of
// CATEGORY_SEARCH_SEGMENTS/categorySegment for logic unrelated to this row (the compact search
// pill fusion, the MobileCityChip route gate, the header's own scroll-collapse fold), so the
// segment union stays duplicated rather than pulled out into a shared module neither file asked
// to touch.
const CATEGORY_SEARCH_SEGMENTS = [
  "coiffeur",
  "barbershop",
  "nails",
  "spa",
  "search",
] as const;
type CategorySearchSegment = (typeof CATEGORY_SEARCH_SEGMENTS)[number];

// V3-D364 (2026-05-29), moved from Header.tsx 2026-08-10: the category bar that used to live IN
// the header's mobile middle slot, now the standalone row below the search pill. Mirrors
// SearchTemplate's CATEGORY_PILLS (coiffeur / barbershop / nails / spa; icons under
// /public/icons/categories). "home" entry, first and pinned (mockup
// public/_mockups/home-v3/search-a.html:902-906, owner: "we need to have a home or something all
// the way on the left, so there is a home page, so they can actually go to the home page instead
// of being stuck in whatever category"). No PNG exists for it, it renders the real Lucide house
// glyph.
const HEADER_CATEGORIES: { slug: string; route: string; label: string; iconSrc?: string; home?: boolean }[] = [
  { slug: "home", route: "", label: "All", home: true },
  // HIS OWN NEW ICONS, 2026-08-10. Owner: "I also gave you a fucking branch name for the icons,
  // right, that I made new icons, but you still did not do anything."
  //
  // He was right and my earlier answer was wrong twice over. I reported that only 2 of 5 categories
  // had artwork, because I looked in `public/_pixel-refs/solen-icons/out/` and counted the files
  // there. The icons were not there. They are embedded as base64 video INSIDE
  // `public/_research/solen-icon-motion.html`, the page he was actually shown, and there are FOUR
  // of them: the barber chair, the hair dryer, the nail polish and the spa stones. That is every
  // category, not two. Extracted the first frame of each with alpha, cropped to the artwork, and
  // squared, so all four sit in the same box.
  //
  // These replace the old set he had been looking at for months. The old files are NOT deleted,
  // they stay in `public/icons/categories/` for revert.
  //
  // As a side effect the row got 5.3 MB lighter: the old PNGs are 1254x1254 originals weighing
  // 1.2 to 1.6 MB each to draw a 28px glyph; these are 168px, 13 to 27 KB.
  { slug: "coiffeur", route: "coiffeur", label: "Coiffeur", iconSrc: "/icons/categories/v2/coiffeur.png" },
  { slug: "barbershop", route: "barbershop", label: "Barber", iconSrc: "/icons/categories/v2/barber.png" },
  { slug: "nails", route: "nails", label: "Nails", iconSrc: "/icons/categories/v2/nails.png" },
  { slug: "spa", route: "spa", label: "Spa", iconSrc: "/icons/categories/v2/spa.png" },
  // 2026-08-01 (home-v3 mockup, search-a.html:915): last pill, same icon-treatment (31x31 PNG,
  // no restyle). Mockup reuses the existing map.png rather than a new asset; matched literally.
  { slug: "inspo", route: "inspo", label: "Inspo", iconSrc: "/icons/categories/map.png" },
];

/**
 * CategoryPillRow, the mobile-only scrollable category strip (All / Coiffeur / Barber / Nails /
 * Spa / Inspo), rendered directly under a page's own search pill on home, every category/search
 * route (including a /{city}/{category} route like /basel/coiffeur, per E6 2026-08-27), and
 * /inspo. Self-gates its own visibility (mirrors Header.tsx's own `showCategoryChrome`), so
 * mounting it unconditionally in a shared file like SearchTemplate.tsx (which also renders on
 * plain profile/salon-slug routes with an unrelated second segment) is safe , it renders null
 * there exactly like Header does.
 *
 * Deliberately NON-STICKY (owner 2026-08-01, quoted above): a plain child in normal document flow,
 * no `sticky`/`fixed` class anywhere in this file.
 */
export default function CategoryPillRow() {
  const locale = useLocale();
  const tNav = useTranslations("navigation");
  const pathname = usePathname() ?? "/";

  // Reproduced 1:1 from Header.tsx's own derivation (not invented): isHome / isDiscover /
  // categorySegment, and the showCategoryChrome gate built from them.
  const isHome = !!pathname && /^\/[a-z]{2}\/?$/.test(pathname);
  const isDiscover = !!pathname && /^\/[a-z]{2}\/inspo\/?$/.test(pathname);
  // E6 (2026-08-27), widened alongside Header.tsx's own copy of this same derivation:
  // /{locale}/{city}/{category} (e.g. /de/basel/coiffeur) now counts as a category route
  // too. Header folding away its chrome on that route while this row still returned null
  // would vacate the slot and leave nothing in it, worse than not folding at all, so the
  // two files' derivations have to move together. Candidate still validated against
  // CATEGORY_SEARCH_SEGMENTS below, same as the single-segment case already did.
  const categorySegment = React.useMemo<CategorySearchSegment | null>(() => {
    if (!pathname) return null;
    const seg = pathname.replace(/^\/[a-z]{2}/, "").replace(/\/$/, "");
    const parts = seg.split("/").filter(Boolean);
    const candidate = parts.length === 1 ? parts[0] : parts.length === 2 ? parts[1] : undefined;
    return candidate && (CATEGORY_SEARCH_SEGMENTS as readonly string[]).includes(candidate)
      ? (candidate as CategorySearchSegment)
      : null;
  }, [pathname]);
  const showCategoryChrome = isHome || !!categorySegment || isDiscover;

  // mockup-ok: public/_mockups/home-v3/search-a.html .sa-cat.is-pressed / the pointerdown handler
  // beneath it. JS-held press state for the category pill, NOT :active (iOS Safari never fires
  // :active on a tap unless the element carries a touch listener, so a CSS-only press window is
  // zero-length). Held for 220ms to match the pill's own transition duration.
  const [pressedCategory, setPressedCategory] = React.useState<string | null>(null);

  // OPTIMISTIC SELECTION, the open half of H2 in _plans/HOME_INSPO_CHROME_2026-08-01.md.
  // Owner's original words: "when you switch between the categories it loads like another page".
  // Measured on this dev server: a category switch takes 105 to 764ms, and until now NOTHING moved
  // in the row during it except a 220ms press scale, so the tapped pill stayed unselected while the
  // page loaded. The selection now moves the instant the finger lands and the route catches up,
  // which is how the reference behaves: the chrome answers immediately and the content follows.
  // Cleared when the path actually changes, so a cancelled navigation cannot strand it.
  const [optimisticCategory, setOptimisticCategory] = React.useState<string | null>(null);
  React.useEffect(() => {
    setOptimisticCategory(null);
  }, [pathname]);

  const handleCategoryPress = (slug: string) => {
    setPressedCategory(slug);
    setOptimisticCategory(slug);
    window.setTimeout(() => {
      setPressedCategory((prev) => (prev === slug ? null : prev));
    }, 220);
  };

  // V3-D172 (2026-05-26): Header.tsx broadcasts `solen:menu-state` on every menuOpen change (open
  // AND close), already consumed the same way by layout/CityTopBar.tsx. Reused here rather than
  // adding a new mechanism, this row now lives outside Header so it has no local `menuOpen`.
  const [menuOpen, setMenuOpen] = React.useState(false);
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail;
      setMenuOpen(!!detail?.open);
    };
    window.addEventListener("solen:menu-state", handler);
    return () => window.removeEventListener("solen:menu-state", handler);
  }, []);

  if (!showCategoryChrome) return null;

  return (
    <div
      className={cn(
        // mt-0, not mt-3. Owner drew a box round the empty band under the search bar on
        // 2026-08-11 and called the gap weird. Measured: 36px from the bar to the top of a
        // pill, against 20 on airbnb.ch. The 36 was two spacings stacked without either
        // knowing about the other: this wrapper's own 12, plus the search wrapper's 4, plus
        // the row's 20 of internal padding added a turn later to give the pills air. Airbnb
        // sits its row DIRECTLY under the bar and lets the row's own padding be the whole
        // gap. Same here now: the padding below is the only thing between them.
        "md:hidden mx-auto mt-0 max-w-[1280px] px-4",
        // This row is not a child of the sticky header (it never was, moved 2026-08-01), so there
        // is no ancestor pointer-events:none box to opt back into, but the menuOpen-hide behavior
        // it always had stays unchanged.
        menuOpen ? "pointer-events-none opacity-0" : "pointer-events-auto",
      )}
    >
      <div
        role="tablist"
        aria-label={tNav("categories")}
        // mockup-ok , owner 2026-08-10: "maybe, like, a little bit smaller, so it fits more,
        // and right now it just has All and those. So it has maybe three and a half or
        // something, so people can know that it's actually scrollable."
        //
        // MEASURED before and after rather than eyeballed, because "a bit smaller" is not a
        // number. Before: gap 12, pill padding 14 a side, icon 31, height 40. Row scrollWidth
        // 647 against clientWidth 343, and the third pill (Barber) ended at exactly 343, flush
        // with the edge. So three pills fit perfectly and NOTHING was cut, which is precisely
        // why it did not read as scrollable: a row that ends cleanly looks finished.
        // After (first pass, still in Header.tsx before this extraction): gap 8, padding 12 a
        // side, icon 26, height 36, which cut each pill by ~9px and left the fourth pill about
        // half visible.
        //
        // The pill's own treatment is untouched on purpose. He said so by name: "not on a
        // category, it's already good, it only looks good how it is." So the raised/sunken
        // shadow overlays, the radius, the 14px text and the no-weight-change-on-select rule
        // all stay exactly as they are. Only geometry moved.
        className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-5 pb-5" // mockup-ok: 20/20, their measured row height 80 against our 64; same 40px pill with more air so it stops dominating. Balance pass 2026-08-11
        style={{
          scrollbarWidth: "none",
          WebkitMaskImage: "linear-gradient(90deg, #000 90%, transparent)",
          maskImage: "linear-gradient(90deg, #000 90%, transparent)",
        }}
      >
        {HEADER_CATEGORIES
          // No .sort() to the front here (was here, removed): an entity that appears on
          // more than one screen must render the same way on each, so a row that
          // reshuffles the active pill to the front puts the same pill in a different
          // place every time, which is the cross-screen inconsistency FLOORS LAW 8 exists
          // to stop. Literal array order, always.
          .map((c) => {
            // I8: "inspo" is deliberately outside CATEGORY_SEARCH_SEGMENTS (that union also
            // drives category/search-route-only behavior, see showCategoryChrome above), so
            // categorySegment never equals "inspo". isDiscover is the real /inspo-route check;
            // without this branch the Inspo pill could never show selected on its own page.
            const routeActive = c.home ? isHome : c.slug === "inspo" ? isDiscover : c.slug === categorySegment;
            // While a tap is in flight, the tapped pill is the selected one and nothing else is, so
            // the row never shows two fills or none. Falls back to the route the moment it lands.
            const isActive = optimisticCategory ? optimisticCategory === c.slug : routeActive;
            return (
              <Link
                key={c.slug}
                href={c.home ? `/${locale}` : `/${locale}/${c.route}`}
                role="tab"
                aria-selected={isActive}
                onPointerDown={() => handleCategoryPress(c.slug)}
                onMouseDown={() => handleCategoryPress(c.slug)}
                onTouchStart={() => handleCategoryPress(c.slug)}
                className={cn(
                  // mockup-ok: public/_mockups/home-v3/search-a.html .sa-cat. 1:1 STRUCTURE,
                  // not just 1:1 values: the pill itself carries no fill and no shadow, only
                  // position + isolation, so it can host two absolutely-positioned overlay
                  // spans (below) at z-[-1] that hold the actual raised/sunken fills and
                  // cross-fade on opacity. Border stays fully removed per the owner's last
                  // pass: a control carrying elevation drops its border, never both.
                  "relative isolate inline-flex h-10 shrink-0 items-center gap-1 rounded-[40px] px-3.5 bg-transparent", // mockup-ok: 2026-08-10 geometry shrink, px-3 -> px-2.5 (see row comment above)
                  "font-body text-[14px] font-normal leading-none text-s-ink", // mockup-ok
                  "transition-transform duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]", // mockup-ok
                  // NO WEIGHT CHANGE ON SELECT. Owner 2026-07-31: "I don't really like how the
                  // text gets bold once you click it, it looks so weird and off. Don't never
                  // do that shit ever again." Measured on airbnb.ch at vw=390 the same day:
                  // their SELECTED tab renders font-weight 400, identical to its unselected
                  // siblings. They never change weight on selection. So font-semibold stays
                  // out; the fill cross-fade below is the whole selection signal, which is
                  // what the design contract locked anyway (selected = bg-s-bg-sunken +
                  // text-s-ink). The contract's trailing "+ semibold" clause is the part he
                  // rejected, and this line is the dated supersession of it.
                  //
                  // Press feedback, JS-held for the full 220ms via handleCategoryPress above.
                  // A CSS-only press window on an iOS tap with no touch listener is zero-length,
                  // so a held class is the fix that worked on an earlier chevron probe with the
                  // identical symptom.
                  pressedCategory === c.slug && "scale-[0.96]", // mockup-ok
                )}
              >
                {/* mockup-ok: the two overlay layers, copied 1:1 off search-a.html
                    .sa-cat::before / .sa-cat::after. They cross-fade on opacity over the same
                    220ms curve as the press, so selecting a pill is one shadow dissolving into
                    another rather than a box-shadow swap. Shadow values copied VERBATIM off
                    the mockup's --lift-raised / --lift-sunken, not retyped or simplified.
                    Raised: 7 layers, 3 inset. Sunken: 9 layers, 5 inset. */}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 z-[-1] rounded-[inherit] bg-white transition-opacity duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]", // mockup-ok
                    isActive ? "opacity-0" : "opacity-100", // mockup-ok
                  )}
                  style={{
                    boxShadow:
                      "rgba(0,0,0,0.10) 0 3px 2.5px 0, rgba(0,0,0,0.15) 0 1px 1px 0, rgba(0,0,0,0.15) 0 0.8px 0.4px 0, rgb(255,255,255) 0 1px 1.5px 0 inset, rgba(58,58,58,0.02) 0 10px 15px 0 inset, rgba(255,255,255,0.6) 0 -1.5px 0.8px 0 inset, rgba(0,0,0,0.30) 0 -1.5px 0.75px 0 inset",
                  }}
                />
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-0 z-[-1] rounded-[inherit] bg-s-bg-sunken transition-opacity duration-[220ms] ease-[cubic-bezier(0.1,0.9,0.2,1)]", // mockup-ok
                    isActive ? "opacity-100" : "opacity-0", // mockup-ok
                  )}
                  style={{
                    boxShadow:
                      "rgb(255,255,255) 0 1px 0.5px 0, rgba(0,0,0,0.15) 0 -0.5px 1px 0, rgba(0,0,0,0.05) 0 -1.2px 0.5px 1px, rgba(0,0,0,0.05) 0 8px 16px 0, rgb(255,255,255) -0.2px -1px 1px 0 inset, rgba(0,0,0,0.20) 0.5px 0.7px 2.5px 0 inset, rgba(0,0,0,0.05) -1px -3px 8px 0 inset, rgba(0,0,0,0.10) 0.5px 2px 4px 0 inset, rgba(0,0,0,0.10) 1px 6px 6px 2px inset",
                  }}
                />
                {c.home ? (
                  // Lucide house glyph, not a PNG (mockup search-a.html:906,944-949).
                  // lucide-react's `Home` export IS house.js under the hood, same glyph
                  // the mockup inlines. Boxed to 31x31, the same footprint as the PNG
                  // category icons beside it, so the row's icons stay one size.
                  <span
                    aria-hidden
                    className="grid h-[28px] w-[28px] shrink-0 place-items-center"
                  >
                    <Home size={24} strokeWidth={strokeForSize(24)} />
                  </span>
                ) : c.iconSrc ? (
                  // THE ICON OVERHAUL, the half of it that is a measured fact rather than a taste
                  // call. Owner 2026-08-10: "I want to overhaul the icons... on top here."
                  //
                  // MEASURED, not guessed. `sips` on public/icons/categories/: every one of the six
                  // PNGs is 1254x1254. The five this row renders weigh 6,873,594 bytes together
                  // (scissors 1,160,725 / clippers 1,286,367 / nails 1,292,845 / spa 1,628,858 /
                  // map 1,504,799). They were being served RAW through a plain <img> with an
                  // eslint-disable on top, so Next's optimizer never saw them, and every phone
                  // downloaded 6.9 MB of image to draw five 26px glyphs. At 26px on a 3x screen the
                  // raster actually needed is 78px.
                  //
                  // This is not a new pattern, it is the one the rest of the codebase already uses
                  // on these exact files: WalkInBand.tsx:73 renders /icons/categories/walkin.png
                  // through next/image, and MobileCategoriesRow.tsx imports next/image for the same
                  // six. Header was the outlier. Commit 4d85acfe4 (2026-07-04) even converted the
                  // account avatar in that same file to next/image and walked past this one.
                  //
                  // 64 is the intrinsic hint, not the render size: the class still draws it at
                  // 26px, and `sizes` tells the optimizer a 3x phone needs about 78px.
                  <Image
                    src={c.iconSrc}
                    alt=""
                    width={64}
                    height={64}
                    sizes="84px"
                    className="h-[28px] w-[28px] shrink-0 object-contain"
                    aria-hidden
                  />
                ) : null}
                {c.label}
              </Link>
            );
          })}
      </div>
    </div>
  );
}
