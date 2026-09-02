import Link from "next/link";
import { getTranslations } from "next-intl/server";

/**
 * CategoryTabs — V3-D138 (2026-05-25).
 *
 * Slot 2 of the homepage restructure spec. Primary nav to category subpages,
 * sits between the layout Header (slot 1) and Hero (slot 3). Replaces the
 * deleted MobileCategoriesRow ("Für dich" 3-icon row).
 *
 * Visual: minimal text-link row. Reuses existing tokens (font-body, text-s-ink,
 * text-s-ink) — per restructure rule "Do NOT add new colors/fonts/spacing".
 * Centered row, gap between tabs. No active indicator (homepage has no
 * inherent active category). Hover swaps to s-brand to signal click affordance.
 */

interface Tab {
  slug: string;
  label: string;
}

const TABS: Tab[] = [
  { slug: "coiffeur",   label: "Coiffeur" },
  { slug: "barbershop", label: "Barber" },
  { slug: "nails",      label: "Nails" },
];

export default async function CategoryTabs() {
  // i18n sweep: aria-label was a hardcoded German literal ("Kategorien"), so it never
  // localized on en/fr/it. Pulled from navigation.categories, matching layout.tsx's
  // no-locale-arg getTranslations pattern (locale already established upstream).
  const tNav = await getTranslations("navigation");
  return (
    <nav
      aria-label={tNav("categories")}
      className="relative z-[1] mx-auto flex max-w-[1280px] items-center justify-center gap-8 px-4 pt-3 pb-1 md:gap-12 md:px-6"
    >
      {TABS.map(({ slug, label }) => (
        <Link
          key={slug}
          href={`/de/${slug}`}
          className="font-body text-[15px] font-semibold text-s-ink transition-colors duration-150 hover:text-s-ink focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-4 focus-visible:rounded-sm md:text-[16px]"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
