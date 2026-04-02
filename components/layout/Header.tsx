"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu, X, User, Compass, CalendarDays, Heart, LogOut, Search, MessageCircle, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";


import { NotificationBell } from "@/components/notifications/NotificationBell";
import CategoryStickyRow from "@/components/layout/CategoryStickyRow";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";
import { getPersistedCity } from "@/lib/city-cookie";
import { motion, AnimatePresence } from "framer-motion";

const airbnbPopoverVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [persistedCity, setPersistedCity] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const scrollThreshold = 10; // Minimum scroll delta before triggering hide/show

  // Scroll morph — pill shrinks after scrolling + scroll-direction header hide/show
  useEffect(() => {
    const handler = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      // Update scrolled state (for pill morphing)
      setScrolled(currentScrollY > 200);

      // Header hide/show logic with threshold
      if (Math.abs(delta) < scrollThreshold) return; // Ignore tiny scrolls

      if (delta > 0 && currentScrollY > 80) {
        // Scrolling DOWN and past the header height
        setIsHeaderVisible(false);
      } else if (delta < 0) {
        // Scrolling UP
        setIsHeaderVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Read persisted city for city-aware category links
  useEffect(() => {
    setPersistedCity(getPersistedCity() ?? null);
  }, []);

  // Close mobile menu or expanded search on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
      if (e.key === "Escape" && searchExpanded) setSearchExpanded(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen, searchExpanded]);

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
  const isHomepage = withoutLocale === "/";
  const isCategoryPage = CATEGORY_PATHS.some((p) => withoutLocale.startsWith(p));

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
    }).catch((err) => console.error("[Header] failed to load Supabase browser client or get session:", err));
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
    <>
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full flex flex-col transition-[transform,background-color,border-color,box-shadow] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]",
      isHeaderVisible ? "translate-y-0" : "-translate-y-full",
      scrolled
        ? "bg-white border-b border-[#EBEBEB] shadow-sm"
        : "bg-white border-transparent"
    )}>
      {/* ── Top Row: Logo, (Small Pill if scrolled), Profile ── */}
      <div className={cn(
        "max-w-[2520px] mx-auto px-5 md:px-6 lg:px-10 xl:px-20 w-full flex items-center justify-between gap-4 transition-[padding-top] duration-300 relative z-[60]",
        scrolled ? "pt-4" : "pt-6"
      )}>
        {/* Left: Logo */}
        <div className="flex-1 shrink-0 flex items-center justify-start h-14">
          <Link href={`/${locale}`} aria-label={t("homeLink")}>
            <Image
              src="/logo.svg"
              alt="Solen.ch"
              className="h-7 sm:h-8 w-auto"
              width={96}
              height={32}
            />
          </Link>
        </div>

        {/* Center: Homepage scrolled = compact search pill; unscrolled = emoji tabs; Category page = text tabs */}
        <div className="flex-[0_1_850px] shrink-1 w-full flex justify-center" style={{ transformOrigin: 'top center' }}>
          {isHomepage ? (
            <div className="w-full flex items-center justify-center">
              {/* MOBILE (< md): Always-visible search pill → opens GuidedSearch sheet */}
              <div className="md:hidden w-full max-w-[300px]">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))}
                  className="flex items-center gap-2.5 bg-white border border-[#EBEBEB] shadow-[0_1px_4px_rgba(0,0,0,0.1)] rounded-full px-3 py-2 w-full"
                  aria-label="Suchen"
                >
                  <Search className="w-4 h-4 text-[#222222] shrink-0" />
                  <span className="text-[13px] font-body font-semibold text-[#717171] truncate text-left flex-1">
                    Was suchst du?
                  </span>
                </button>
              </div>


              {/* DESKTOP (≥ md): Emoji tabs when unscrolled | compact pill when scrolled */}
              <div className="hidden md:block w-full">
                {/* Emoji category tabs — visible when NOT scrolled */}
                <div className={cn(
                  "flex items-center justify-center gap-6 overflow-x-auto scrollbar-hide px-2 transition-all duration-300",
                  scrolled ? "opacity-0 pointer-events-none absolute" : "opacity-100"
                )}>
                  {[
                    { key: "all",        href: "/",           icon: "✨", label: "Entdecken" },
                    { key: "coiffeur",   href: "/coiffeur",   icon: "✂️", label: "Coiffeur" },
                    { key: "nails",      href: "/nails",       icon: "💅", label: "Nails" },
                    { key: "barbershop", href: "/barbershop",  icon: "💈", label: "Barbershop" },
                    { key: "makeup",     href: "/makeup",      icon: "💄", label: "Makeup" },
                    { key: "waxing",     href: "/waxing",      icon: "🍯", label: "Waxing" },
                  ].map(({ key, href, icon, label }) => {
                    const isActive = withoutLocale === href || (withoutLocale.startsWith(href) && href !== "/");
                    return (
                      <Link
                        key={key}
                        href={`/${locale}${href}`}
                        className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer py-2"
                      >
                        <span className="text-[26px] leading-none h-[30px] mb-1 transition-transform duration-200 origin-bottom group-hover:scale-110 overflow-hidden inline-block">
                          {icon}
                        </span>
                        <span className={cn(
                          "text-[12px] font-body font-semibold pb-2 border-b-2 transition-colors duration-200 whitespace-nowrap",
                          isActive
                            ? "text-[#222222] border-[#222222]"
                            : "text-[#717171] border-transparent group-hover:text-[#222222] group-hover:border-[#EBEBEB]"
                        )}>
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Compact search pill — visible when scrolled */}
                <div className={cn(
                  "flex justify-center transition-all duration-300",
                  scrolled ? "opacity-100" : "opacity-0 pointer-events-none absolute"
                )}>
                  <button
                    onClick={() => setSearchExpanded(true)}
                    className="flex items-center gap-2.5 bg-white border border-[#EBEBEB] shadow-[0_1px_4px_rgba(0,0,0,0.1)] rounded-full px-4 py-2 hover:shadow-[0_2px_8px_rgba(0,0,0,0.14)] transition-shadow duration-200 w-[380px]"
                    aria-label="Suche öffnen"
                  >
                    <Search className="w-4 h-4 text-[#222222] shrink-0" />
                    <span className="text-[14px] font-body font-semibold text-[#717171] truncate text-left flex-1">
                      Service, Salon oder Ort suchen...
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : isCategoryPage ? (
            /* Category page — text tabs, emoji collapses on scroll, city-aware */
            <div className="flex items-stretch gap-6 overflow-x-auto scrollbar-hide px-2">
              {[
                { key: "coiffeur",   icon: "✂️", label: "Coiffeur" },
                { key: "nails",      icon: "💅", label: "Nails" },
                { key: "barbershop", icon: "💈", label: "Barbershop" },
                { key: "makeup",     icon: "💄", label: "Makeup" },
                { key: "waxing",     icon: "🍯", label: "Waxing" },
              ].map(({ key, icon, label }) => {
                const isActive = withoutLocale.startsWith(`/${key}`);
                const href = persistedCity
                  ? `/${locale}/${persistedCity}/${key}`
                  : `/${locale}/${key}`;
                return (
                  <Link
                    key={key}
                    href={href}
                    className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer py-2"
                  >
                    <span className={cn(
                      "text-[28px] leading-none transition-[height,opacity,transform,margin] duration-300 origin-bottom group-hover:scale-110 overflow-hidden",
                      scrolled ? "h-0 opacity-0 scale-50 mb-0" : "h-[32px] opacity-100 scale-100 mb-1"
                    )}>
                      {icon}
                    </span>
                    <span className={cn(
                      "text-[12px] font-body font-semibold pb-2 border-b-2 transition-colors duration-200 whitespace-nowrap",
                      isActive
                        ? "text-[#222222] border-[#222222]"
                        : "text-[#717171] border-transparent group-hover:text-[#222222] group-hover:border-[#EBEBEB]"
                    )}>
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex-1 shrink-0 flex items-center justify-end gap-2 h-14" ref={profileRef}>
          {/* Language toggle — desktop only */}
          <div className="hidden md:flex items-center gap-2 pr-2 relative z-[70]" onClick={(e) => e.stopPropagation()}>
            <LanguageSwitcher locale={locale} variant="header" />
          </div>

          {/* Profile button */}
          <div className="relative shrink-0 z-[60]">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-label={t("account")}
                  aria-expanded={profileOpen}
                  className={cn(
                    "flex items-center justify-center w-[42px] h-[42px] rounded-full text-[#717171] border border-[#EBEBEB] hover:shadow-elevation-2 bg-white solen-press-effect",
                    "transition-[box-shadow,transform] duration-200"
                  )}
                >
                  <Menu className="w-4 h-4 mr-1" />
                  <div className="bg-[#717171] text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <User className="w-[14px] h-[14px]" />
                  </div>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      variants={airbnbPopoverVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      style={{ transformOrigin: "top right" }}
                      className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl z-[80] overflow-hidden bg-white shadow-[0_8px_28px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
                    >
                      <nav className="py-2" role="menu">
                        {[
                          { label: t("account"), href: `/${locale}/profile` },
                          { label: t("bookings"), href: `/${locale}/profile` },
                          { label: t("favorites"), href: `/${locale}/account/saved` },
                          { label: t("messages"), href: `/${locale}/account/messages` },
                        ].map(({ label, href }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setProfileOpen(false)}
                            role="menuitem"
                            className="flex items-center px-4 py-2.5 text-[14px] font-body text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                          >
                            {label}
                          </Link>
                        ))}
                        <div className="border-t border-[#EBEBEB] my-2" />
                        <button
                          onClick={handleSignOut}
                          role="menuitem"
                          className="flex items-center w-full px-4 py-2.5 text-[14px] font-body text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                        >
                          {t("logout")}
                        </button>
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                aria-label={t("login")}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#EBEBEB] hover:shadow-elevation-2 bg-white text-[#222222] transition-[box-shadow,transform] duration-200 solen-press-effect"
              >
                <Menu strokeWidth={2} className="w-4 h-4 ml-1" />
                <div className="bg-[#717171] text-white rounded-full w-[26px] h-[26px] flex items-center justify-center">
                  <User className="w-[14px] h-[14px]" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>


      {/* ── Desktop Search Bar (Homepage + Unscrolled) ── */}
      {!scrolled && isHomepage && (
        <div className="hidden md:flex w-full justify-center pb-6 mt-4 relative z-[60]">
          <div className="max-w-4xl w-full px-6">
            <AirbnbSearchBar scrolledPast80={scrolled} locale={locale} onSearchActiveChange={(active) => setSearchActive(active)} />
          </div>
        </div>
      )}

      {/* ── Mobile Category Strip (Homepage + Unscrolled) ── */}
      {isHomepage && !scrolled && (
        <div className="md:hidden overflow-x-auto scrollbar-hide pb-3 pt-1 px-3 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-1 w-max">
            {[
              { key: "all",        href: "/",           icon: "✨", label: "Entdecken" },
              { key: "coiffeur",   href: "/coiffeur",   icon: "✂️", label: "Coiffeur" },
              { key: "nails",      href: "/nails",       icon: "💅", label: "Nägel" },
              { key: "barbershop", href: "/barbershop",  icon: "💈", label: "Barbershop" },
              { key: "makeup",     href: "/makeup",      icon: "💄", label: "Makeup" },
              { key: "waxing",     href: "/waxing",      icon: "🍯", label: "Waxing" },
            ].map(({ key, href, icon, label }) => {
              const isActive = withoutLocale === href || (withoutLocale.startsWith(href) && href !== "/");
              return (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-heading font-semibold whitespace-nowrap shrink-0 transition-all duration-150",
                    isActive
                      ? "bg-[#1A1A1A] text-white"
                      : "bg-[#F5F5F5] text-[#555555] hover:bg-[#EBEBEB]"
                  )}
                >
                  <span className="text-[14px] leading-none">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}


      {/* ── Lights-Out Overlay (Airbnb §1.1) ── */}
      {searchActive && isHomepage && (
        <div
          className="fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 pointer-events-auto"
          style={{ top: 'var(--header-height, 180px)' }}
          onClick={() => window.dispatchEvent(new CustomEvent("cancelAirbnbSearch"))}
          aria-hidden="true"
        />
      )}
    </header>

    {/* Expanded search overlay — shown when compact pill is clicked */}
    <AnimatePresence>
      {searchExpanded && (
        <>
          {/* Backdrop */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] bg-black/20"
            onClick={() => setSearchExpanded(false)}
            aria-hidden="true"
          />
          {/* Expanded search bar — positioned below the header */}
          <motion.div
            key="search-expanded"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="fixed top-[80px] left-0 right-0 z-[46] flex justify-center px-6 pointer-events-none"
          >
            <div className="max-w-4xl w-full pointer-events-auto">
              <AirbnbSearchBar
                scrolledPast80={false}
                locale={locale}
                onSearchActiveChange={(active) => {
                  if (!active) setSearchExpanded(false);
                }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
