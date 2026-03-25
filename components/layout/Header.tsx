"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, MessageCircle, User,
  Scissors, ScissorsLineDashed, Paintbrush, Droplets, Palette, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  locale: string;
  unreadCount?: number;
}

const NAV_LINKS = [
  { key: "discover", href: "/discover" },
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
  barbershop: { icon: ScissorsLineDashed, label: "Barbershop" },
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
  const [userId, setUserId] = useState<string | undefined>();
  const [scrolled, setScrolled] = useState(false);

  // Scroll morph — pill shrinks after scrolling
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  // Hide global header on dashboard and auth pages (they have their own navigation)
  const isHidden = pathname.includes("/dashboard") || pathname.includes("/auth/");

  // Check session for profile/login redirect — uses browser client directly (API routes timeout on custom domain)
  useEffect(() => {
    import("@/lib/supabase-browser").then(({ createBrowserSupabaseClient }) => {
      const supabase = createBrowserSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setIsLoggedIn(true);
          setUserId(session.user.id);
        }
      });
    }).catch(() => {});
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
    <header className="sticky top-0 z-50 w-full px-4">
      <div className="flex items-center justify-center gap-3">
        {/* Main nav pill */}
        <div className={cn(
          "flex items-center justify-between rounded-full transition-[background,box-shadow,padding,max-width] duration-300 ease-out",
          scrolled
            ? "mt-3 max-w-3xl py-2 px-4 sm:px-6 dark:border-white/[0.06]"
            : "mt-2 max-w-5xl py-3 px-5 sm:px-8 bg-s-bg-base/50 dark:bg-s-dm-bg/50"
        )}
        style={scrolled ? {
          background: "rgba(255,255,255,.82)",
          backdropFilter: "blur(16px) saturate(1.3)",
          WebkitBackdropFilter: "blur(16px) saturate(1.3)",
          border: "1px solid rgba(255,255,255,.70)",
          boxShadow: "0 2px 6px rgba(26,18,9,.08), 0 8px 24px rgba(26,18,9,.06)"
        } : {
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)"
        }}>
          {/* Logo + Sub-site icon */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/${locale}`} className="flex items-center shrink-0" aria-label="Solen.ch – Zur Startseite">
              <img
                src="/logo.svg"
                alt="Solen.ch"
                className="h-8 w-auto dark:invert"
                width={96}
                height={32}
              />
            </Link>
            {CategoryIcon && categoryInfo && (
              <div className="flex items-center gap-1.5 text-s-coral ml-1">
                <span className="text-s-ink/20 dark:text-s-dm-text/20">|</span>
                <CategoryIcon size={18} />
                <AnimatePresence>
                  {!scrolled && (
                    <motion.span
                      key="category-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      style={{ willChange: "width" }}
                      className="text-xs font-heading font-semibold hidden sm:inline overflow-hidden whitespace-nowrap text-s-coral"
                    >
                      {categoryInfo.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Desktop nav */}
          <nav className={cn(
            "hidden md:flex items-center",
            scrolled ? "gap-1" : "gap-4"
          )} aria-label="Hauptnavigation">
            {NAV_LINKS.map(({ key, href }) => {
              const isActive = pathname.includes(href);
              return (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "text-sm font-medium transition-all duration-200 rounded-full",
                    scrolled ? "px-2 py-1 text-xs" : "px-3 py-1.5",
                    isActive
                      ? "text-s-coral bg-s-coral/8"
                      : "text-s-ink/70 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/70 dark:hover:bg-white/5"
                  )}
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

            {/* Notifications Bell */}
            <NotificationBell userId={userId} />

            {/* Messages with unread dot */}
            <Link href={`/${locale}/account/messages`} className="relative p-1.5 min-h-12 min-w-12 flex items-center justify-center rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors" id="tour-messages" aria-label="Nachrichten">
              <MessageCircle className="w-5 h-5 text-s-ink/70 dark:text-s-dm-text/70" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-s-coral" />
              )}
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

        {/* Profile circle — outside nav pill */}
        <Link
          href={profileHref}
          className={cn(
            "hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-s-coral text-white hover:bg-s-coral-hover active:scale-[0.98] transition-all duration-200 shrink-0",
            scrolled ? "mt-3" : "mt-2"
          )}
          style={{ boxShadow: "0 2px 4px rgba(232,98,74,.30)" }}
          aria-label="Profil"
        >
          <User className="w-4 h-4" />
        </Link>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="md:hidden mt-2 rounded-[16px] p-4 dark:border-white/[0.06] overflow-hidden"
            style={{
              background: "rgba(255,255,255,.92)",
              backdropFilter: "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border: "1px solid rgba(255,255,255,.75)",
              boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.08)"
            }}
          >
            <nav className="flex flex-col gap-3">
              {NAV_LINKS.map(({ key, href }) => {
                const isActive = pathname.includes(href);
                return (
                  <Link
                    key={key}
                    href={`/${locale}${href}`}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center py-3 px-2 text-sm font-heading font-semibold transition-colors rounded-[10px] min-h-[44px]",
                      isActive ? "text-s-coral" : "text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03]"
                    )}
                  >
                    {t(key)}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-s-ink/5 dark:border-white/5">
                <Link
                  href={profileHref}
                  className="text-sm font-medium text-s-ink/70 dark:text-s-dm-text/70 hover:text-s-coral transition-colors min-h-12 flex items-center"
                  onClick={() => setMobileOpen(false)}
                >
                  {isLoggedIn ? t("account") : t("login")}
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
