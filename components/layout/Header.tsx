"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu, X, MessageCircle, User,
  Scissors, Paintbrush, Droplets, Palette, Sparkles,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

interface HeaderProps {
  locale: string;
  unreadCount?: number;
}

const NAV_LINKS = [
  { key: "coiffeur", href: "/coiffeur" },
  { key: "barbershop", href: "/barbershop" },
  { key: "nails", href: "/nails" },
  { key: "spa", href: "/spa" },
  { key: "makeup", href: "/makeup" },
  { key: "waxing", href: "/waxing" },
  { key: "last_minute", href: "/last-minute" },
];

// Category icons for sub-site indicator
const CATEGORY_ICONS: Record<string, { icon: typeof Scissors; label: string }> = {
  coiffeur: { icon: Scissors, label: "Coiffeur" },
  barbershop: { icon: Scissors, label: "Barbershop" },
  nails: { icon: Paintbrush, label: "Nails" },
  spa: { icon: Droplets, label: "Spa" },
  makeup: { icon: Palette, label: "Makeup" },
  waxing: { icon: Sparkles, label: "Waxing" },
};

export default function Header({ locale, unreadCount = 0 }: HeaderProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Hide global header on dashboard and auth pages (they have their own navigation)
  const isHidden = pathname.includes("/dashboard") || pathname.includes("/auth/");

  // Check session for profile/login redirect
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((p) => {
        if (p?.id) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  if (isHidden) return null;

  // Detect current category for sub-site icon
  const currentCategory = Object.keys(CATEGORY_ICONS).find((cat) =>
    pathname.includes(`/${cat}`)
  );
  const categoryInfo = currentCategory ? CATEGORY_ICONS[currentCategory] : null;
  const CategoryIcon = categoryInfo?.icon;

  // Profile link: redirect to login if not logged in
  const profileHref = isLoggedIn ? `/${locale}/profile` : `/${locale}/auth/login`;

  return (
    <header className="sticky top-4 z-50 mx-auto max-w-3xl px-4">
      <div className="glass rounded-full shadow-warm-sm py-2.5 px-4 sm:px-6 flex items-center justify-between dark:bg-s-dm-surface/80 dark:border-white/5">
        {/* Logo + Sub-site icon */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="Solen Startseite">
            <span className="font-display text-2xl tracking-[0.06em] uppercase text-s-ink dark:text-s-dm-text">
              so<span className="text-s-coral">.</span>len
            </span>
          </Link>
          {CategoryIcon && categoryInfo && (
            <div className="flex items-center gap-1.5 text-s-coral ml-1">
              <span className="text-s-ink/20 dark:text-s-dm-text/20">|</span>
              <CategoryIcon size={18} />
              <span className="text-sm font-medium hidden sm:inline">{categoryInfo.label}</span>
            </div>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Hauptnavigation">
          {NAV_LINKS.map(({ key, href }) => {
            const isActive = pathname.includes(href);
            return (
              <Link
                key={key}
                href={`/${locale}${href}`}
                className={`text-sm font-medium transition-colors duration-150 ${
                  isActive ? "text-s-coral" : "text-s-ink/70 hover:text-s-ink dark:text-s-dm-text/70 dark:hover:text-s-dm-text"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle />

          {/* Messages with unread dot */}
          <Link href={`/${locale}/account/messages`} className="relative p-1.5 min-h-12 min-w-12 flex items-center justify-center" id="tour-messages" aria-label="Nachrichten">
            <MessageCircle className="w-5 h-5 text-s-ink/70 dark:text-s-dm-text/70" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-s-coral" />
            )}
          </Link>

          {/* Account */}
          <Link
            href={profileHref}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 min-h-12 rounded-full bg-s-coral text-white text-sm font-medium hover:bg-s-coral-hover transition-colors"
            aria-label="Profil"
          >
            <User className="w-4 h-4" />
            {t("account")}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 min-h-12 min-w-12 flex items-center justify-center text-s-ink/70 dark:text-s-dm-text/70"
            aria-label={mobileOpen ? "Menü schliessen" : "Menü öffnen"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-s-ink/5 bg-s-bg-base/95 backdrop-blur-lg dark:bg-s-dm-surface/95 dark:border-white/5 shadow-warm-md overflow-hidden">
          <nav className="px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={`/${locale}${href}`}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-s-ink/70 hover:text-s-coral transition-colors py-1 min-h-12 flex items-center"
              >
                {t(key)}
              </Link>
            ))}
            <div className="pt-2 border-t border-s-ink/5 dark:border-white/5">
              <Link
                href={profileHref}
                className="text-sm font-medium text-s-ink/70 hover:text-s-coral transition-colors min-h-12 flex items-center"
                onClick={() => setMobileOpen(false)}
              >
                {isLoggedIn ? t("account") : t("login")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
