"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, MessageCircle, User, Compass, CalendarDays, Heart, LogOut, Building2,
  Scissors, ScissorsLineDashed, Paintbrush, Droplets, Palette, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CitySelector from "@/components/ui/CitySelector";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";

interface HeaderProps {
  locale: string;
  unreadCount?: number;
}

const NAV_LINKS = [
  { key: "discover", href: "/discover", Icon: Compass },
  { key: "coiffeur", href: "/coiffeur", Icon: CoiffeurIcon },
  { key: "barbershop", href: "/barbershop", Icon: BarberIcon },
  { key: "nails", href: "/nails", Icon: NailsIcon },
  { key: "spa", href: "/spa", Icon: SpaIcon },
  { key: "makeup", href: "/makeup", Icon: MakeupIcon },
  { key: "waxing", href: "/waxing", Icon: WaxingIcon },
  { key: "last_minute", href: "/last-minute", Icon: CalendarDays },
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
  const tCities = useTranslations("cities");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Sign out handler
  const handleSignOut = async () => {
    setProfileOpen(false);
    const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  if (isHidden) return null;

  // Detect current category for sub-site icon
  const currentCategory = Object.keys(CATEGORY_ICONS).find((cat) =>
    pathname.includes(`/${cat}`)
  );
  const categoryInfo = currentCategory ? CATEGORY_ICONS[currentCategory] : null;
  const CategoryIcon = categoryInfo?.icon;

  return (
    <header className="sticky top-0 z-50 w-full px-4">
      <div className="flex items-center justify-center gap-3">
        {/* Main nav pill */}
        <div className={cn(
          "flex items-center justify-between rounded-full transition-[background,box-shadow,padding,max-width] duration-300 ease-out",
          scrolled
            ? "mt-2 max-w-3xl min-h-[56px] py-2 px-4 sm:px-6 dark:border-white/[0.06]"
            : "mt-3 max-w-5xl min-h-[64px] py-3 px-5 sm:px-8 bg-s-bg-base/50 dark:bg-s-dm-bg/50"
        )}
        style={scrolled ? {
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px) saturate(1.3)",
          WebkitBackdropFilter: "blur(16px) saturate(1.3)",
          border: "1px solid var(--glass-border)",
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
            scrolled ? "gap-1" : "gap-3"
          )} aria-label="Hauptnavigation">
            {NAV_LINKS.map(({ key, href, Icon }) => {
              const isActive = pathname.includes(href);
              return (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  aria-current={isActive ? "page" : undefined}
                  title={t(key as any)}
                  className={cn(
                    "flex flex-col items-center justify-center transition-all duration-200 rounded-full",
                    scrolled ? "p-2" : "p-2.5",
                    isActive
                      ? "text-s-coral bg-s-coral/10"
                      : "text-s-ink/60 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/60 dark:hover:text-s-dm-text dark:hover:bg-white/5"
                  )}
                >
                  <Icon size={20} className={isActive ? "text-s-coral" : "text-current"} />
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* City selector — desktop only */}
            <div className="hidden lg:flex items-center">
              <CitySelector variant="header" />
            </div>

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

        {/* Profile button — outside nav pill */}
        <div className={cn("hidden sm:block relative shrink-0", scrolled ? "mt-3" : "mt-2")} ref={profileRef}>
          {isLoggedIn ? (
            <>
              {/* Logged-in: button opens dropdown */}
              <button
                onClick={() => setProfileOpen(prev => !prev)}
                aria-label={t("account")}
                aria-expanded={profileOpen}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full bg-s-coral text-white",
                  "active:scale-[0.98] transition-all duration-200",
                  profileOpen && "ring-2 ring-s-coral/30"
                )}
                style={{ boxShadow: "0 2px 4px rgba(232,98,74,.30)" }}
              >
                <User className="w-4 h-4" />
              </button>

              {/* Dropdown panel */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-input z-[60] overflow-hidden"
                  style={{
                    background: "var(--glass-bg-strong)",
                    backdropFilter: "blur(16px) saturate(1.2)",
                    WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.08)"
                  }}
                >
                  <nav className="py-1" role="menu">
                    {[
                      { label: t("account"), href: `/${locale}/profile`, icon: User },
                      { label: t("bookings"), href: `/${locale}/bookings`, icon: CalendarDays },
                      { label: t("favorites"), href: `/${locale}/favorites`, icon: Heart },
                      { label: t("messages"), href: `/${locale}/account/messages`, icon: MessageCircle },
                    ].map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setProfileOpen(false)}
                        role="menuitem"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-heading font-medium text-s-ink/70 hover:text-s-ink hover:bg-s-ink/[0.03] transition-colors min-h-[40px]"
                      >
                        <Icon size={15} className="shrink-0 text-s-ink/40" />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-s-ink/[0.06] my-1" />
                    {/* Sign out */}
                    <button
                      onClick={handleSignOut}
                      role="menuitem"
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-heading font-medium text-s-coral hover:bg-s-coral/[0.04] transition-colors min-h-[40px]"
                    >
                      <LogOut size={15} className="shrink-0" />
                      {t("logout")}
                    </button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            /* Logged-out: direct link to login */
            <Link
              href={`/${locale}/auth/login`}
              aria-label={t("login")}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-s-ink/[0.06] text-s-ink hover:bg-s-ink/[0.10] active:scale-[0.98] transition-all duration-200"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </div>
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
              background: "var(--glass-bg-strong)",
              backdropFilter: "blur(20px) saturate(1.3)",
              WebkitBackdropFilter: "blur(20px) saturate(1.3)",
              border: "1px solid var(--glass-border-subtle)",
              boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 32px rgba(26,18,9,.08)"
            }}
          >
            <nav className="flex flex-col gap-2">
              {/* Mobile nav items — complete set including migrated BottomNav items */}
              {[
                // Core navigation:
                { key: "discover", href: `/${locale}/discover`, icon: Compass },
                { key: "last_minute", href: `/${locale}/last-minute`, icon: Compass },
                // Migrated from BottomNav:
                { key: "bookings", href: `/${locale}/bookings`, icon: CalendarDays },
                { key: "favorites", href: `/${locale}/favorites`, icon: Heart },
                { key: "messages", href: `/${locale}/account/messages`, icon: MessageCircle },
              ].map(({ key, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 text-sm font-heading font-semibold transition-colors rounded-[10px] min-h-[44px]",
                      active ? "text-s-coral bg-s-coral/[0.05]" : "text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03]"
                    )}
                  >
                    <Icon size={18} className="shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    {t(key as any)}
                  </Link>
                );
              })}

              {/* Divider */}
              <div className="border-t border-s-ink/[0.06] my-2" />

              {/* City selector — mobile menu */}
              <div className="px-4 py-2">
                <p className="text-[10px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
                  {tCities("label")}
                </p>
                <CitySelector variant="menu" />
              </div>

              {/* Logged in: profile shortcut */}
              {isLoggedIn && (
                <Link
                  href={`/${locale}/profile`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-3 px-3 text-sm font-heading font-semibold text-s-ink/65 hover:text-s-ink hover:bg-s-ink/[0.03] transition-colors rounded-[10px] min-h-[44px]"
                >
                  <User size={18} className="shrink-0" strokeWidth={1.8} />
                  {t("account")}
                </Link>
              )}

              {/* Salon Eintragen CTA */}
              <div className="pt-2">
                <Link
                  href={`/${locale}/partner`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-pill bg-s-coral text-white text-sm font-heading font-bold transition-colors hover:brightness-[1.06] active:scale-[0.98] min-h-[44px]"
                  style={{ boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}
                >
                  <Building2 size={16} />
                  {t("registerSalon")}
                </Link>
              </div>

              {/* Language switcher — mobile menu */}
              <div className="mt-2 flex justify-center pb-2">
                <LanguageSwitcher locale={locale} variant="menu" />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
