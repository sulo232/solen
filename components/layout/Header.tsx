"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, User, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  locale: string;
  unreadCount?: number;
}

export default function Header({ locale, unreadCount = 0 }: HeaderProps) {
  const t = useTranslations("navigation") as any;
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Hide on dashboard/auth pages
  const isHidden = pathname.includes("/dashboard") || pathname.includes("/auth/");
  const withoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  const isHomepage = withoutLocale === "/";

  // Check session
  useEffect(() => {
    import("@/lib/supabase-browser").then(({ createBrowserSupabaseClient }) => {
      const supabase = createBrowserSupabaseClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) setIsLoggedIn(true);
      });
    }).catch((err) => console.error("[Header] failed to load Supabase:", err));
  }, []);

  // Sign out
  const handleSignOut = async () => {
    setProfileOpen(false);
    const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  if (isHidden) return null;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E8E8E8]"
          : "bg-transparent"
      )}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center" aria-label={t("homeLink")}>
            <Image
              src="/logo.svg"
              alt="Solen"
              width={100}
              height={32}
              className="h-7 md:h-8 w-auto"
              priority
            />
          </Link>

          {/* Center: Search bar trigger (only on homepage when not scrolled) */}
          {isHomepage && (
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-full border transition-all duration-200",
                  scrolled
                    ? "bg-white border-[#E8E8E8] shadow-sm hover:shadow-md"
                    : "bg-white/90 border-[#E8E8E8] hover:bg-white hover:shadow-sm"
                )}
              >
                <Search className="w-4 h-4 text-[#717171]" />
                <span className="text-sm text-[#717171] font-medium">
                  {t("searchPlaceholder") || "Search salons..."}
                </span>
              </button>
            </div>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-2" ref={profileRef}>
            
            {/* For Business link */}
            <Link
              href={`/${locale}/fuer-salons`}
              className="hidden md:block text-sm font-medium text-[#101010] hover:bg-[#F7F7F7] px-4 py-2 rounded-full transition-colors"
            >
              {t("forBusiness") || "For business"}
            </Link>

            {/* Language switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher locale={locale} variant="header" />
            </div>

            {/* Profile / Auth button */}
            <div className="relative">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setProfileOpen(prev => !prev)}
                    className="flex items-center gap-2 px-2 py-2 rounded-full border border-[#E8E8E8] hover:shadow-md bg-white transition-all duration-200"
                    aria-expanded={profileOpen}
                    aria-label={t("account")}
                  >
                    <Menu className="w-4 h-4 text-[#717171]" />
                    <div className="w-7 h-7 bg-[#101010] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-xl border border-[#E8E8E8] overflow-hidden z-50"
                      >
                        <nav className="py-2">
                          {[
                            { label: t("account") || "Account", href: `/${locale}/profile` },
                            { label: t("bookings") || "Bookings", href: `/${locale}/profile` },
                            { label: t("favorites") || "Favorites", href: `/${locale}/account/saved` },
                          ].map(({ label, href }) => (
                            <Link
                              key={href}
                              href={href}
                              onClick={() => setProfileOpen(false)}
                              className="block px-4 py-3 text-sm text-[#101010] hover:bg-[#F7F7F7] transition-colors"
                            >
                              {label}
                            </Link>
                          ))}
                          <div className="border-t border-[#E8E8E8] my-1" />
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-3 text-sm text-[#101010] hover:bg-[#F7F7F7] transition-colors"
                          >
                            {t("logout") || "Log out"}
                          </button>
                        </nav>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <Link
                  href={`/${locale}/auth/login`}
                  className="flex items-center gap-2 px-2 py-2 rounded-full border border-[#E8E8E8] hover:shadow-md bg-white transition-all duration-200"
                  aria-label={t("login")}
                >
                  <Menu className="w-4 h-4 text-[#717171]" />
                  <div className="w-7 h-7 bg-[#717171] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-[#F7F7F7] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[#101010]" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {isHomepage && (
        <div className="md:hidden px-4 pb-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("openSearchSheet", { detail: { step: 1 } }))}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-full border border-[#E8E8E8] shadow-sm"
          >
            <Search className="w-4 h-4 text-[#717171]" />
            <span className="text-sm text-[#717171]">{t("searchPlaceholder") || "Search salons..."}</span>
          </button>
        </div>
      )}

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-50 shadow-xl"
            >
              <div className="p-4">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-6 p-2 rounded-full hover:bg-[#F7F7F7]"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <nav className="space-y-1">
                  {[
                    { label: t("coiffeur") || "Hair", href: `/${locale}/coiffeur` },
                    { label: t("nails") || "Nails", href: `/${locale}/nails` },
                    { label: t("barbershop") || "Barber", href: `/${locale}/barbershop` },
                    { label: t("spa") || "Spa", href: `/${locale}/spa` },
                    { label: t("makeup") || "Makeup", href: `/${locale}/makeup` },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-[#101010] hover:bg-[#F7F7F7] rounded-xl transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                  
                  <div className="border-t border-[#E8E8E8] my-4" />
                  
                  <Link
                    href={`/${locale}/fuer-salons`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-[#101010] hover:bg-[#F7F7F7] rounded-xl transition-colors"
                  >
                    {t("forBusiness") || "For business"}
                  </Link>
                  
                  {!isLoggedIn && (
                    <Link
                      href={`/${locale}/auth/login`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-white bg-[#101010] rounded-xl text-center mt-4"
                    >
                      {t("login") || "Log in"}
                    </Link>
                  )}
                </nav>

                {/* Language in mobile menu */}
                <div className="mt-6 px-4">
                  <LanguageSwitcher locale={locale} variant="header" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
