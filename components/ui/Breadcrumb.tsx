"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  coiffeur: "Coiffeur",
  barbershop: "Barbershop",
  nails: "Nails",
  spa: "Spa",
  makeup: "Makeup",
  waxing: "Waxing",
  "last-minute": "Angebote",
  salon: "Salon",
  termine: "Termine",
  profile: "Profil",
  dashboard: "Dashboard",
  bookings: "Buchungen",
  messages: "Nachrichten",
  settings: "Einstellungen",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  // Strip locale prefix to get meaningful segments
  const withoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Don't show on homepage, dashboard, auth, booking, checkout, onboarding
  const EXCLUDED = ["/dashboard", "/auth", "/booking", "/checkout", "/onboarding", "/walk-in-pay", "/tip"];
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
        onClick={() => router.back()}
        className="md:hidden flex items-center gap-1.5 text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors min-h-12"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      {/* Desktop breadcrumb */}
      <nav className="hidden md:flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link
          href={`/${locale}`}
          className="text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors"
        >
          Home
        </Link>
        {segments.map((segment, i) => {
          const href = `/${locale}/${segments.slice(0, i + 1).join("/")}`;
          const isLast = i === segments.length - 1;
          const label = SEGMENT_LABELS[segment] || decodeURIComponent(segment);

          return (
            <span key={href} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="text-s-ink/20 dark:text-s-dm-text/20" />
              {isLast ? (
                <span className="text-s-ink/70 dark:text-s-dm-text/70 font-medium">{label}</span>
              ) : (
                <Link
                  href={href}
                  className="text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors"
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
