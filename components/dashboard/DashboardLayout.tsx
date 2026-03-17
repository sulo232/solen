"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, ChevronRight,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { Profile, UserRole } from "@/lib/types";

// ─────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────

const ADMIN_NAV = [
  { label: "Genehmigungen",       href: "/dashboard/approvals",           icon: ShieldCheck },
  { label: "Alle Salons",         href: "/dashboard/all-salons",          icon: Store },
  { label: "Alle Nutzer",         href: "/dashboard/all-users",           icon: UsersRound },
  { label: "Umsatz",              href: "/dashboard/revenue",             icon: DollarSign },
  { label: "Plattform Statistiken", href: "/dashboard/platform-analytics", icon: BarChart3 },
  { label: "Badges",              href: "/dashboard/badge-manager",       icon: Award },
  { label: "Inhalte",             href: "/dashboard/content-editor",     icon: FileEdit },
  { label: "Bewertungen",         href: "/dashboard/review-moderation",  icon: MessageSquareWarning },
] as const;

const NAV = [
  { label: "Übersicht",    href: "/dashboard",            icon: Home },
  { label: "Termine",      href: "/dashboard/bookings",   icon: Calendar },
  { label: "Kalender",     href: "/dashboard/calendar",   icon: Clock },
  { label: "Nachrichten",  href: "/dashboard/messages",   icon: MessageCircle },
  { label: "Team",         href: "/dashboard/staff",      icon: Users },
  { label: "Services",     href: "/dashboard/services",   icon: Scissors },
  { label: "Statistiken",  href: "/dashboard/analytics",  icon: BarChart },
  { label: "Bewertungen", href: "/dashboard/reviews",    icon: Star },
  { label: "Einstellungen",href: "/dashboard/settings",   icon: Settings },
] as const;

// Mobile bottom nav shows 5 items: first 3 + Messages + "Mehr"
const MOBILE_NAV = [
  { label: "Übersicht",   href: "/dashboard",           icon: Home },
  { label: "Termine",     href: "/dashboard/bookings",  icon: Calendar },
  { label: "Nachrichten", href: "/dashboard/messages",  icon: MessageCircle },
  { label: "Team",        href: "/dashboard/staff",     icon: Users },
  { label: "Mehr",        href: "/dashboard/settings",  icon: Menu },
] as const;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  salonName?: string;
  salonAvatar?: string | null;
  unreadCount?: number;
}

export default function DashboardLayout({
  children,
  salonName,
  salonAvatar,
  unreadCount = 0,
}: DashboardLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth guard — role must be salon_owner or admin
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
        } else if (p.role === "customer") {
          router.push(`/${locale}/account`);
        } else {
          setRole(p.role);
          setAuthChecked(true);
        }
      })
      .catch(() => router.push(`/${locale}/auth/login`));
  }, [locale, pathname, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === `/${locale}/dashboard`
      : pathname.startsWith(`/${locale}${href}`);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-white/90 backdrop-blur-lg border-r border-gray-100 z-30">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href={`/${locale}`} className="font-heading font-bold text-xl text-dark">
            solen<span className="text-teal">.</span>ch
          </Link>
          <p className="text-xs text-dark/40 mt-0.5">Salon Dashboard</p>
        </div>

        {/* Salon identity */}
        {salonName && (
          <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center overflow-hidden shrink-0">
              {salonAvatar ? (
                <Image src={salonAvatar} alt="" width={32} height={32} className="object-cover w-full h-full" />
              ) : (
                <span className="text-xs font-bold text-teal">{salonName[0]}</span>
              )}
            </div>
            <span className="text-sm font-medium text-dark truncate">{salonName}</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            const isMessages = href === "/dashboard/messages";
            return (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors mb-0.5 relative",
                  active ? "text-teal" : "text-dark/60 hover:bg-gray-50 hover:text-dark",
                ].join(" ")}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-button bg-teal/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10 flex-1">{label}</span>
                {isMessages && unreadCount > 0 && (
                  <span className="relative z-10 ml-auto w-2 h-2 rounded-full bg-coral" />
                )}
                {active && <ChevronRight size={14} className="relative z-10 ml-auto opacity-40" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin nav */}
        {role === "admin" && (
          <div className="px-2 pb-3 border-t border-gray-100 pt-3">
            <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest px-3 mb-1">Admin</p>
            {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={`/${locale}${href}`}
                  className={[
                    "flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors mb-0.5 relative",
                    active ? "bg-coral/10 text-coral" : "text-dark/60 hover:bg-gray-50 hover:text-dark",
                  ].join(" ")}
                >
                  <Icon size={16} />
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto opacity-40" />}
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <Link
            href={`/${locale}`}
            className="text-xs text-dark/30 hover:text-teal transition-colors"
          >
            ← Zur Website
          </Link>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-dark/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 35 }}
              className="absolute left-0 top-0 h-full w-64 bg-white/95 backdrop-blur-xl shadow-glass"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <span className="font-heading font-bold text-lg">solen<span className="text-teal">.</span>ch</span>
                <button onClick={() => setMobileSidebarOpen(false)}><X size={20} className="text-dark/40" /></button>
              </div>
              <nav className="py-3 px-2">
                {NAV.map(({ label, href, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={`/${locale}${href}`}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={[
                        "flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors mb-0.5",
                        active ? "bg-teal/10 text-teal" : "text-dark/60",
                      ].join(" ")}
                    >
                      <Icon size={16} />{label}
                      {href === "/dashboard/messages" && unreadCount > 0 && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-coral" />
                      )}
                    </Link>
                  );
                })}
                {role === "admin" && (
                  <>
                    <p className="text-[10px] font-bold text-dark/30 uppercase tracking-widest px-3 mt-3 mb-1">Admin</p>
                    {ADMIN_NAV.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={`/${locale}${href}`}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={[
                          "flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors mb-0.5",
                          isActive(href) ? "bg-coral/10 text-coral" : "text-dark/60",
                        ].join(" ")}
                      >
                        <Icon size={16} />{label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-dark/60">
            <Menu size={20} />
          </button>
          <span className="font-heading font-bold text-base">solen<span className="text-teal">.</span>ch</span>
        </div>

        <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 flex">
        {MOBILE_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          const isMessages = href === "/dashboard/messages";
          return (
            <Link
              key={href}
              href={`/${locale}${href}`}
              className={[
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative",
                active ? "text-teal" : "text-dark/40",
              ].join(" ")}
            >
              <div className="relative">
                <Icon size={20} />
                {isMessages && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-coral" />
                )}
              </div>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
