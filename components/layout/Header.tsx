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
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    if (isHidden) return;
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isHidden]);

  if (isHidden) return null;

  // Detect current category for sub-site icon
  const currentCategory = Object.keys(CATEGORY_ICONS).find((cat) =>
    pathname.includes(`/${cat}`)
  );
  const categoryInfo = currentCategory ? CATEGORY_ICONS[currentCategory] : null;
  const CategoryIcon = categoryInfo?.icon;

  // Profile link: redirect to login if not logged in
  const profileHref = isLoggedIn ? `/${locale}/profile` : `/${locale}/auth/login`;

  // Glass nav token from roadmap
  const base = "bg-white/80 backdrop-blur-lg border-b border-gray-100 dark:bg-dm-surface/80 dark:border-white/5";
  const shrunk = scrolled ? "py-2" : "py-3";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${base} ${shrunk}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo + Sub-site icon */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="Solen Startseite">
            <span className="font-heading font-bold text-xl text-dark dark:text-dm-text tracking-tight">
              solen<span className="text-teal">.</span>ch
            </span>
          </Link>
          {CategoryIcon && categoryInfo && (
            <div className="flex items-center gap-1.5 text-teal ml-1">
              <span className="text-dark/20">|</span>
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
                  isActive ? "text-teal" : "text-dark/70 hover:text-dark dark:text-dm-text/70 dark:hover:text-dm-text"
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
            <MessageCircle className="w-5 h-5 text-dark/70 dark:text-dm-text/70" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-coral" />
            )}
          </Link>

          {/* Account */}
          <Link
            href={profileHref}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 min-h-12 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors"
            aria-label="Konto"
          >
            <User className="w-4 h-4" />
            {t("account")}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 min-h-12 min-w-12 flex items-center justify-center text-dark/70 dark:text-dm-text/70"
            aria-label={mobileOpen ? "Menü schliessen" : "Menü öffnen"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg dark:bg-dm-surface/95 dark:border-white/5">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={`/${locale}${href}`}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-dark/70 hover:text-teal transition-colors py-1 min-h-12 flex items-center"
              >
                {t(key)}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href={profileHref}
                className="text-sm font-medium text-dark/70 hover:text-teal transition-colors min-h-12 flex items-center"
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
