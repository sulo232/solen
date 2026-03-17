"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, MessageCircle, User } from "lucide-react";

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

export default function Header({ locale, unreadCount = 0 }: HeaderProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide global header on dashboard and auth pages (they have their own navigation)
  const isHidden = pathname.includes("/dashboard") || pathname.includes("/auth/");

  useEffect(() => {
    if (isHidden) return;
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [isHidden]);

  if (isHidden) return null;

  // Glass nav token from roadmap
  const base = "bg-white/80 backdrop-blur-lg border-b border-gray-100";
  const shrunk = scrolled ? "py-2" : "py-3";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${base} ${shrunk}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2 shrink-0">
          <span className="font-heading font-bold text-xl text-dark tracking-tight">
            solen<span className="text-teal">.</span>ch
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ key, href }) => {
            const isActive = pathname.includes(href);
            return (
              <Link
                key={key}
                href={`/${locale}${href}`}
                className={`text-sm font-medium transition-colors duration-150 ${
                  isActive ? "text-teal" : "text-dark/70 hover:text-dark"
                }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Messages with unread dot */}
          <Link href={`/${locale}/account/messages`} className="relative p-1.5" id="tour-messages">
            <MessageCircle className="w-5 h-5 text-dark/70" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-coral" />
            )}
          </Link>

          {/* Account */}
          <Link
            href={`/${locale}/account`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-teal text-white text-sm font-medium hover:bg-teal/90 transition-colors"
          >
            <User className="w-4 h-4" />
            {t("account")}
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-1.5 text-dark/70"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-lg">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
            {NAV_LINKS.map(({ key, href }) => (
              <Link
                key={key}
                href={`/${locale}${href}`}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-dark/70 hover:text-teal transition-colors py-1"
              >
                {t(key)}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-medium text-dark/70 hover:text-teal transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {t("login")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
