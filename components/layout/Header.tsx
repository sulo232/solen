"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Menu, X, User, Compass, CalendarDays, Heart, LogOut, Search, MessageCircle, Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ThemeToggle from "@/components/ui/ThemeToggle";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import CategoryStickyRow from "@/components/layout/CategoryStickyRow";
import { CoiffeurIcon } from "@/components/icons/category/CoiffeurIcon";
import { BarberIcon } from "@/components/icons/category/BarberIcon";
import { NailsIcon } from "@/components/icons/category/NailsIcon";
import { SpaIcon } from "@/components/icons/category/SpaIcon";
import { MakeupIcon } from "@/components/icons/category/MakeupIcon";
import { WaxingIcon } from "@/components/icons/category/WaxingIcon";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";

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
    const handler = () => setScrolled(window.scrollY > 200);
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
    <header className={cn(
      "sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,padding-bottom] duration-300",
      scrolled 
        ? "bg-white/95 dark:bg-s-dm-surface/95 border-b border-s-ink/[0.08] dark:border-white/[0.08] shadow-sm backdrop-blur-md pb-0"
        : "bg-white dark:bg-transparent border-transparent pb-0"
    )}>
      {/* ── Top Row: Logo, Search Bar, Profile ── */}
      <div className={cn(
        "max-w-[2520px] mx-auto px-4 sm:px-6 flex items-start justify-between gap-4 transition-[padding-top] duration-300 relative z-[60]",
        scrolled ? "pt-4" : "pt-6"
      )}>
        {/* Left: Logo */}
        <div className="flex-1 shrink-0 flex items-center justify-start h-14">
          <Link href={`/${locale}`} className="hidden sm:block" aria-label={t("homeLink")}>
            <img
              src="/logo.svg"
              alt="Solen.ch"
              className="h-8 w-auto dark:invert"
              width={96}
              height={32}
            />
          </Link>
        </div>

        {/* Center: AirbnbSearchBar (Desktop) & Mobile Pill */}
        <div className="flex-[0_1_850px] shrink-1 w-full" style={{ transformOrigin: 'top center' }}>
          {/* Desktop Search */}
          <AirbnbSearchBar scrolledPast80={scrolled} locale={locale} />
          
          {/* Mobile Search/Filter Pill */}
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))
            }
            aria-label={t("search")}
            className="flex md:hidden items-center gap-3 px-4 w-full h-[52px] rounded-[100px] border border-s-ink/[0.08] dark:border-white/[0.08] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:bg-s-dm-surface/60 transition-[transform] duration-150"
          >
            <Search size={18} className="text-[#222222] shrink-0" strokeWidth={2.5} aria-hidden="true" />
            <div className="flex flex-col items-start min-w-0 text-left">
              <span className="font-heading font-semibold text-[#222222] text-[13px] leading-[14px]">Was suchen?</span>
              <span className="font-body text-[#717171] text-[11px] leading-[14px] truncate">Ort • Woche</span>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex-1 shrink-0 flex items-center justify-end gap-2 h-14" ref={profileRef}>
          {/* Dark mode & Language toggle — desktop only */}
          <div className="hidden md:flex items-center gap-2 pr-2">
            <ThemeToggle />
            <LanguageSwitcher locale={locale} variant="header" />
          </div>

          {/* Profile button */}
          <div className="relative shrink-0">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => setProfileOpen(prev => !prev)}
                  aria-label={t("account")}
                  aria-expanded={profileOpen}
                  className={cn(
                    "flex items-center justify-center w-[42px] h-[42px] rounded-full text-[#717171] border border-[#dddddd] hover:shadow-elevation-2 bg-white",
                    "transition-[box-shadow,transform] duration-200"
                  )}
                >
                  <Menu className="w-4 h-4 mr-1" />
                  <div className="bg-[#717171] text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <User className="w-[14px] h-[14px]" />
                  </div>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-2xl z-[60] overflow-hidden bg-white shadow-[0_8px_28px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
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
                      <div className="border-t border-[#dddddd] my-2" />
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="flex items-center w-full px-4 py-2.5 text-[14px] font-body text-[#222222] hover:bg-[#f7f7f7] transition-colors"
                      >
                        {t("logout")}
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <Link
                href={`/${locale}/auth/login`}
                aria-label={t("login")}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#dddddd] hover:shadow-elevation-2 bg-white text-[#222222] transition-[box-shadow] duration-200"
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

      {/* ── Bottom Row: 3D Category Strip (Hidden on Scroll, or sticky? Sticky under header keeps context) ── */}
      {showCategoryNav && (
        <div className={cn(
          "max-w-[2520px] mx-auto px-6 overflow-hidden transition-[height,opacity,margin-top,padding-top] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative z-50 border-b border-s-ink/[0.06] dark:border-white/[0.06]",
          scrolled ? "h-[42px] mt-[10px] opacity-100 border-t border-s-ink/[0.06] pt-0" : "h-[84px] mt-4 opacity-100"
        )}>
          <div className="flex gap-8 overflow-x-auto scrollbar-hide items-center justify-start h-full pb-2">
            {[
              { key: "all", href: "/", icon: "✨", label: "Entdecken" },
              { key: "coiffeur", href: "/coiffeur", icon: "✂️", label: "Coiffeur" },
              { key: "nails", href: "/nails", icon: "💅", label: "Nails" },
              { key: "barbershop", href: "/barbershop", icon: "💈", label: "Barbershop" },
              { key: "makeup", href: "/makeup", icon: "💄", label: "Makeup" },
              { key: "waxing", href: "/waxing", icon: "🍯", label: "Waxing" },
            ].map(({ key, href, icon, label }) => {
              const isActive = withoutLocale === href || withoutLocale.startsWith(href) && href !== "/";
              return (
                <Link
                  key={key}
                  href={`/${locale}${href}`}
                  className="flex flex-col items-center justify-end flex-shrink-0 group cursor-pointer h-full"
                >
                  <div className={cn(
                    "text-[28px] transition-all duration-300 origin-bottom flex items-end hover:scale-110",
                    scrolled ? "h-0 opacity-0 scale-50 mb-0" : "h-[32px] opacity-100 scale-100 mb-[6px]"
                  )}>
                    {icon}
                  </div>
                  <span className={cn(
                    "text-[12px] font-body font-semibold transition-colors duration-200 pb-2 border-b-2", 
                    isActive ? "text-[#222222] border-[#222222] dark:text-white dark:border-white" : "text-[#717171] border-transparent group-hover:text-[#222222] group-hover:border-[#dddddd] dark:text-[#a0a0a0] dark:group-hover:text-white dark:group-hover:border-[#333333]"
                  )}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
