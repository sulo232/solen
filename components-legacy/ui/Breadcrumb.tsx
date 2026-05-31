"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function Breadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
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
  if (EXCLUDED.some((prefix) => withoutLocale.startsWith(prefix))) return null;

  const segments = withoutLocale.split("/").filter(Boolean);

  // Mobile: simple back button
  // Desktop: breadcrumb path
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
      {/* Mobile back button */}
      <button
        type="button"
        onClick={() => router.back()}
        aria-label={t("back")}
        className="md:hidden grid place-items-center w-9 h-9 rounded-full border border-s-border text-s-ink hover:bg-s-bg-sunken transition-colors duration-200"
      >
        <ArrowLeft size={18} aria-hidden />
      </button>

      {/* Desktop breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
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
              <ChevronRight size={14} className="text-s-ink/20" />
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
