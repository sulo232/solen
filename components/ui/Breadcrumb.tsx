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
        {t("back")}
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
          const label = t.has(segment) ? t(segment) : decodeURIComponent(segment);

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
