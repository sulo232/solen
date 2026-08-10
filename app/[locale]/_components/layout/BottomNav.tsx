"use client";

// exists-check: `npm run exists BottomNav` returns 2 REMOVED rows and 0 live components. Both
// graveyard rows are NARROWER than they read and NEITHER covers this surface:
//   2026-07-02  a FABRICATED bottom bar drawn on a map MOCKUP ("Solen has NO bottom nav")
//   2026-07-15  a SECOND nav on the operator DASHBOARD, which already has a sidebar
// The customer mobile-web surface has no nav of its own at all, which is the gap this fills.
// A reversal row was filed with `npm run removed` in the same turn, carrying the owner's verbatim
// yes, so a future session finds the approval instead of the old refusal.
//
// Owner 2026-08-10, live and explicit, after picking option C off /dev/menu-placement:
//   "I saw the hamburger menu. I think I want to have, like, a bottom navigation bar for, you
//    know, the web area, so it's actually, like, easier."
//
// MEASURED, NOT EYEBALLED. airbnb.ch, real mobile web, 375x812, the same day:
//   bar      fixed, white, border-top 1px #EBEBEB, NO shadow, z-index 1
//   height   125 total, of which 60 is bottom padding for browser chrome + home indicator
//   items    THREE, each 73x44
//   icon     24x24
//   label    10px, weight 500 active / 400 inactive
//   active   brand red #DA1247 on icon AND label; inactive #6C6C6C
//   hamburger  none anywhere on the page
// That measurement also killed my own first objection before I could raise it. I was about to say
// a bottom bar is an APP pattern that mobile web does not use. It is false, and checking cost
// thirty seconds.
//
// THREE DELIBERATE DIFFERENCES FROM THE REFERENCE, each with its reason:
//
//  1. LABEL IS 12px, NOT THEIR 10. Sub-12px text is below this project's legibility floor
//     (LOCKFILE 2.5) and an armed drift gate refuses it. A statutory-adjacent floor does not lose
//     to a reference measurement. The cost, named: our bar is a few px taller than theirs.
//
//  2. ACTIVE IS INK, NOT A BRAND COLOUR. Theirs is Rausch red on icon and label. Our contract puts
//     blue on small clickable accents only and never on a selected state, and the CONTENT TABS row
//     (owner 2026-07-21) settles the nearest case: active = 600 ink, inactive = 400 ink-2, no fill.
//     A bottom tab is a content tab that happens to live at the thumb, so it inherits that, and the
//     icon fill carries the rest of the signal.
//
//  3. FOUR ITEMS, AND THE FOURTH IS THE MENU. Theirs is three and has no menu at all, because
//     Airbnb puts location inside search. Ours cannot: `MobileMenu` carries the city selector AND
//     the language switcher, and after this lands it has no other trigger on any customer route.
//     Dropping it to three would strand both, which is the exact defect that stopped the hamburger
//     from simply being deleted last turn.
//
// WHERE IT HIDES, and this is a floor deciding rather than a preference: `SalonMobileBookBar`
// (`fixed inset-x-0 bottom-0 z-[800] lg:hidden`) is the PDP's Buchen commit action. Two fixed bars
// stacked at the bottom is precisely the "now we have two navigation, just clutter" the owner
// killed on the dashboard on 2026-07-15. The sticky-CTA floor (hierarchy-density-06) says the
// commit action owns that slot, so the nav yields to it. Same for the booking flow, checkout and
// the queue tracker, which `HideInBooking` already enumerates.
//
// registry-sync-ok: row added to _design-system/COMPONENT_REGISTRY.md and
// _design-system/components/BottomNav.md written in the same turn.

import * as React from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bookmark, Compass, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every label comes from the existing `navigation` namespace. No new copy was written. */
const ITEMS = [
  { key: "search", href: "", labelKey: "search", Icon: Search },
  // Compass, not Sparkles. Sparkles is banned by name in this project's icon rules, and
  // Compass is the app's OWN prior answer for this destination: the deprecated
  // components-legacy/layout/BottomTabBar.tsx used `Compass` for `/inspo` before web dropped its
  // bar. Reusing it rather than picking a fresh glyph.
  { key: "inspo", href: "/inspo", labelKey: "discover", Icon: Compass },
  { key: "saved", href: "/inspo/saved", labelKey: "saved", Icon: Bookmark },
] as const;

export default function BottomNav({ locale }: { locale: string }) {
  const pathname = usePathname() ?? "/";
  const t = useTranslations("navigation");

  const base = `/${locale}`;
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) || "/" : pathname;

  const isActive = (href: string) => {
    if (!href) {
      // "Suchen" owns the home page and every category/search route, which is where the search
      // pill lives. Anything deeper belongs to no tab and leaves them all inactive, rather than
      // lighting one up wrongly.
      return rest === "/" || /^\/(search|coiffeur|barbershop|nails|spa)(\/|$)/.test(rest);
    }
    return rest === href || rest.startsWith(href + "/");
  };

  return (
    <nav
      aria-label={t("mobileNavigation")}
      className={cn(
        // md:hidden , desktop already carries the full nav inside the header, and adding a second
        // one there would be the dashboard mistake on a different surface.
        "md:hidden fixed inset-x-0 bottom-0 z-[700]",
        // mockup-ok: white + a single hairline, no shadow. Measured off airbnb.ch, and it is also
        // what this project's own contract says: a surface earns elevation from its background,
        // and a bar sitting on the page edge does not need a shadow to be found.
        "border-t border-s-border bg-white",
        // The home indicator and the browser's own bottom chrome. Airbnb reserves 60px here; this
        // reads the real inset instead of hardcoding a number, so it collapses to nothing on a
        // device that has none.
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex max-w-[680px] items-stretch justify-around px-2">
        {ITEMS.map(({ key, href, labelKey, Icon }) => {
          const on = isActive(href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={`${base}${href}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  // 44px is the touch floor from the design contract, and it is also exactly what
                  // Airbnb's own items measure.
                  "flex h-14 flex-col items-center justify-center gap-1",
                  "transition-colors duration-150 ease-glide",
                  on ? "text-s-ink" : "text-s-ink-2",
                )}
              >
                <Icon size={24} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
                <span
                  className={cn(
                    "font-body text-[12px] leading-none",
                    on ? "font-semibold" : "font-normal",
                  )}
                >
                  {t(labelKey)}
                </span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          {/* The menu. Fires the same `solen:open-menu` window event the search-bar hamburger used
              to, so MobileMenu keeps its one existing trigger contract and nothing new is wired.
              This is the item that makes removing the hamburger safe: the city selector and the
              language switcher live in that sheet and have no other way in. */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("solen:open-menu"))}
            className="flex h-14 w-full flex-col items-center justify-center gap-1 text-s-ink-2 transition-colors duration-150 ease-glide"
          >
            <Menu size={24} strokeWidth={1.8} aria-hidden />
            <span className="font-body text-[12px] font-normal leading-none">{t("menu")}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
