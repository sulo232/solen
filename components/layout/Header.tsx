"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu, X, User, Compass, CalendarDays, Heart, LogOut, Search, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

import CategoryStickyRow from "@/components/layout/CategoryStickyRow";
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
  { key: "last_minute", href: "/angebote", Icon: CalendarDays },
];


export default function Header({ locale, unreadCount = 0 }: HeaderProps) {
  const t = useTranslations("navigation") as any;
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

  // Hide category nav on non-category/non-discovery pages (partner, compare, legal, help, etc.)
  const withoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  const CATEGORY_PATHS = ["/coiffeur", "/barbershop", "/nails", "/spa", "/makeup", "/waxing", "/discover", "/angebote", "/search"];
  const showCategoryNav = withoutLocale === "/" || CATEGORY_PATHS.some((p) => withoutLocale.startsWith(p));

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

  return (
    <header className="sticky top-0 z-50 w-full px-4">
      <div className="flex items-center justify-center gap-3">
        {/* Main nav pill */}
        <div className={cn(
          "flex items-center justify-between rounded-full transition-[max-width,padding,min-height,background-color,border-color,box-shadow] duration-300 ease-out w-full",
          scrolled
            ? "mt-2 max-w-4xl min-h-[52px] py-1.5 px-4 sm:px-6 glass-frost shadow-warm-lg"
            : "mt-3 max-w-5xl min-h-[56px] py-2.5 px-5 sm:px-8 glass-frost shadow-warm-sm"
        )}>
          {/* Logo — hidden on mobile when scrolled (replaced by compact search pill) */}
          <div className={cn("items-center shrink-0", scrolled ? "hidden sm:flex" : "flex")}>
            <Link href={`/${locale}`} className="flex items-center shrink-0" aria-label={t("homeLink")}>
              <img
                src="/logo.svg"
                alt="Solen.ch"
                className="h-8 w-auto dark:invert"
                width={96}
                height={32}
              />
            </Link>
          </div>

          {/* Desktop nav — only on homepage + category/discovery pages */}
          {showCategoryNav && <nav className="hidden md:flex items-center gap-1.5 transition-opacity duration-300" aria-label="Hauptnavigation">
            {NAV_LINKS.map(({ key, href, Icon }) => {
              const isActive = pathname.includes(href);
              return (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  aria-label={t(key as any)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex flex-col items-center justify-center transition-colors duration-200 rounded-full",
                    scrolled ? "p-2" : "p-2.5",
                    isActive
                      ? "text-white bg-s-ink dark:text-s-ink dark:bg-white shadow-elevation-2"
                      : "text-s-ink/60 hover:text-s-ink hover:bg-s-ink/5 dark:text-s-dm-text/60 dark:hover:text-s-dm-text dark:hover:bg-white/5"
                  )}
                >
                  <Icon width={20} height={20} className="w-5 h-5 shrink-0" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-s-coral" />
                  )}
                  {/* Tooltip */}
                  <span className="absolute top-[120%] left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-s-ink text-white dark:bg-white dark:text-s-ink text-[10px] font-heading font-medium tracking-wide uppercase px-2.5 py-1.5 rounded-md shadow-elevation-3 whitespace-nowrap z-50">
                    {t(key as any)}
                  </span>
                </Link>
              );
            })}
          </nav>}

          {/* Compact search pill — MOBILE: replaces logo when scrolled */}
          {scrolled && (
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))
              }
              aria-label={t("search")}
              className="flex sm:hidden items-center gap-2 px-4 py-2.5 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-s-dm-surface/60 text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-ink/20 hover:text-s-ink transition-[border-color,color] backdrop-blur-sm flex-1 max-w-xs"
              style={{ fontSize: 13, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
            >
              <Search size={14} className="text-s-coral shrink-0" aria-hidden="true" />
              <span className="font-heading font-bold truncate">{t("searchCompact")}</span>
            </button>
          )}

          {/* Compact search pill — DESKTOP: visible when scrolled */}
          {scrolled && (
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))
              }
              aria-label={t("search")}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-pill border border-s-ink/[0.08] dark:border-white/[0.08] bg-white/60 dark:bg-s-dm-surface/60 text-[12px] font-heading font-bold text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-ink/20 dark:hover:border-white/20 hover:text-s-ink dark:hover:text-s-dm-text transition-[border-color,color] backdrop-blur-sm"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}
            >
              <Search size={13} className="text-s-coral" aria-hidden="true" />
              {t("search")}
            </button>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-3">

            {/* Language toggle — always visible, desktop only */}
            <div className="hidden md:block">
              <LanguageSwitcher locale={locale} variant="header" />
            </div>

            {/* Show only for authenticated users */}
            {!!isLoggedIn && (
              <NotificationBell userId={userId} />
            )}

            {/* Mobile hamburger — hidden on all sizes (BottomTabBar handles mobile nav) */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="hidden p-1.5 min-h-12 min-w-12 flex items-center justify-center text-s-ink/70 dark:text-s-dm-text/70"
              aria-label={mobileOpen ? t("menuClose") : t("menuOpen")}
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
                  "active:scale-[0.98] transition-transform duration-200",
                  profileOpen && "ring-2 ring-s-coral/30"
                )}
                style={{ boxShadow: "0 2px 4px rgba(232,98,74,.30)" }}
              >
                <User className="w-4 h-4" />
              </button>

              {/* Dropdown panel */}
              {profileOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-input z-[60] overflow-hidden glass-frost shadow-v5-float"
                >
                  <nav className="py-1" role="menu">
                    {[
                      { label: t("account"), href: `/${locale}/profile`, icon: User },
                      { label: t("bookings"), href: `/${locale}/profile`, icon: CalendarDays },
                      { label: t("favorites"), href: `/${locale}/account/saved`, icon: Heart },
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
              className="flex items-center justify-center w-10 h-10 rounded-full bg-s-ink/[0.06] text-s-ink hover:bg-s-ink/[0.10] active:scale-[0.98] transition-[background-color,transform] duration-200"
            >
              <User className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Airbnb-style inline category row — appears when homepage grid scrolls out of view */}
      <CategoryStickyRow locale={locale} />

    </header>
  );
}
