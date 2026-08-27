"use client";

import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = useTranslations("breadcrumb");

  // Strip locale prefix to get meaningful segments
  const withoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Don't show on homepage, dashboard, auth, booking, checkout, onboarding.
  // V3-D207 (2026-05-26, salon-detail Fresha-parity): exclude `/salon` too.
  // V3-D224 (2026-05-26, wave 3 verifier): exclude /search + 4 category routes
  // for the same reason — SearchTemplate now renders its OWN breadcrumb
  // (SOLEN › Coiffeur eyebrow). Without this, all 5 routes render TWO
  // breadcrumbs stacked (legacy global on top + SearchTemplate's). The legacy
  // one also uses retired `text-s-accent` hover. Removing it leaves SearchTemplate
  // as the single source.
  // Fresha mobile PDP has NO chrome between site header and hero photo — back
  // arrow lives ON the photo (which SalonHero already renders). The global
  // breadcrumb was wedging 64px of "Zurück" button + retired text-s-accent
  // hover above the V3 hero, breaking the Fresha-parity goal. Legacy salon
  // page (no `?v3=1`) already renders its OWN in-page breadcrumb, so removing
  // the global one drops duplicate chrome on both V3 and legacy.
  const EXCLUDED = ["/dashboard", "/auth", "/booking", "/checkout", "/onboarding", "/walk-in-pay", "/tip", "/salon", "/search", "/coiffeur", "/barbershop", "/nails", "/spa"];
  // More robust homepage detection
  const normalizedPath = pathname.replace(/\/$/, ""); // strip trailing slash
  const isHomepage =
    normalizedPath === "" ||
    normalizedPath === "/" ||
    normalizedPath === `/${locale}` ||
    // handles /de, /en, /fr, /it with or without trailing slash
    /^\/(de|en|fr|it)\/?$/.test(normalizedPath);
  if (isHomepage) return null;
  // V3-D384 (2026-05-30): /inspo is a top-level browse destination (reached from header nav, like the homepage) —
  // no standalone back-bar, which was leaving a tall empty band + a lone arrow above the title. Exact match only, so
  // the detail page /inspo/[id] keeps its breadcrumb back button.
  if (normalizedPath === `/${locale}/inspo`) return null;
  if (EXCLUDED.some((prefix) => withoutLocale.startsWith(prefix))) return null;

  // V3-D449: /{city}/{category} pages (e.g. /basel/coiffeur) render SearchTemplate, which
  // already provides its own breadcrumb + back affordance. The startsWith EXCLUDED list above
  // only catches the bare /{category} routes, NOT /{city}/{category} — so this global bar was
  // stacking a SECOND, redundant back button right under the header home (owner-flagged).
  // Exclude any path whose last segment is a category slug.
  const CATEGORY_SLUGS = ["coiffeur", "barbershop", "nails", "spa"];
  const lastSeg = withoutLocale.split("/").filter(Boolean).pop();
  if (lastSeg && CATEGORY_SLUGS.includes(lastSeg)) return null;

  const segments = withoutLocale.split("/").filter(Boolean);

  // Mobile: simple back button
  // Desktop: breadcrumb path
  return (
    // V3-D461 (2026-06-09): desktop-only. Mobile up-navigation is now the Header's left slot (Back on
    // deep pages) — the old mobile back button here was the redundant second affordance the owner flagged.
    <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 py-2">
      {/* Desktop breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm" aria-label={t("landmark")}>
        <Link
          href={`/${locale}`}
          className="text-s-ink/40 hover:text-s-ink transition-colors"
        >
          Home
        </Link>
        {segments.map((segment, i) => {
          const href = `/${locale}/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          const label = (t as any).has(segment) ? (t as any)(segment) : decodeURIComponent(segment);

          return (
            <span key={href} className="flex items-center gap-1.5">
              <ChevronRight size={14} strokeWidth={1.6} className="text-s-ink/20" />
              {isLast ? (
                <span className="text-s-ink/70 font-medium">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-s-ink/40 hover:text-s-ink transition-colors"
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
