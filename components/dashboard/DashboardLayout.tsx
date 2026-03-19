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
  MessageSquareWarning, Star, PieChart,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
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
  { label: "Segmente",            href: "/dashboard/segments",           icon: PieChart },
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
          router.push(`/${locale}/profile`);
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
    <div className="min-h-screen bg-s-bg-surface flex">
      {/* ── Desktop Sidebar (animated) ── */}
      <Sidebar>
        <SidebarBody>
          {/* Logo */}
          <div className="px-4 py-5 border-b border-s-ink/5">
            <Link href={`/${locale}`} className="font-heading font-bold text-xl text-s-ink whitespace-nowrap">
              solen<span className="text-s-coral">.</span>ch
            </Link>
          </div>

          {/* Salon identity */}
          {salonName && (
            <div className="px-3 py-3 border-b border-s-ink/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-s-coral/10 flex items-center justify-center overflow-hidden shrink-0">
                {salonAvatar ? (
                  <Image src={salonAvatar} alt="" width={32} height={32} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-xs font-bold text-s-coral">{salonName[0]}</span>
                )}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = isActive(href);
              const isMessages = href === "/dashboard/messages";
              return (
                <SidebarLink
                  key={href}
                  link={{ label, href: `/${locale}${href}`, icon: <Icon size={16} /> }}
                  active={active}
                  badge={isMessages && unreadCount > 0 ? <span className="w-2 h-2 rounded-full bg-s-coral" /> : undefined}
                />
              );
            })}
          </nav>

          {/* Admin nav */}
          {role === "admin" && (
            <div className="px-2 pb-3 border-t border-s-ink/5 pt-3">
              {ADMIN_NAV.map(({ label, href, icon: Icon }) => (
                <SidebarLink
                  key={href}
                  link={{ label, href: `/${locale}${href}`, icon: <Icon size={16} /> }}
                  active={isActive(href)}
                  className={isActive(href) ? "text-s-coral" : undefined}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="px-3 py-3 border-t border-s-ink/5">
            <Link
              href={`/${locale}`}
              className="text-xs text-s-ink/30 hover:text-s-coral transition-colors whitespace-nowrap"
            >
              ← Zur Website
            </Link>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-s-ink/40 backdrop-blur-sm"
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
              <div className="px-5 py-4 border-b border-s-ink/5 flex items-center justify-between">
                <span className="font-heading font-bold text-lg">solen<span className="text-s-coral">.</span>ch</span>
                <button onClick={() => setMobileSidebarOpen(false)}><X size={20} className="text-s-ink/40" /></button>
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
                        active ? "bg-s-coral/10 text-s-coral" : "text-s-ink/60",
                      ].join(" ")}
                    >
                      <Icon size={16} />{label}
                      {href === "/dashboard/messages" && unreadCount > 0 && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-s-coral" />
                      )}
                    </Link>
                  );
                })}
                {role === "admin" && (
                  <>
                    <p className="text-[10px] font-bold text-s-ink/30 uppercase tracking-widest px-3 mt-3 mb-1">Admin</p>
                    {ADMIN_NAV.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={href}
                        href={`/${locale}${href}`}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={[
                          "flex items-center gap-3 px-3 py-2.5 rounded-button text-sm font-medium transition-colors mb-0.5",
                          isActive(href) ? "bg-s-coral/10 text-s-coral" : "text-s-ink/60",
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
      <div className="flex-1 md:ml-[60px] flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur-lg border-b border-s-ink/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-s-ink/60">
            <Menu size={20} />
          </button>
          <span className="font-heading font-bold text-base">solen<span className="text-s-coral">.</span>ch</span>
        </div>

        <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-s-ink/5 flex">
        {MOBILE_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          const isMessages = href === "/dashboard/messages";
          return (
            <Link
              key={href}
              href={`/${locale}${href}`}
              className={[
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative",
                active ? "text-s-coral" : "text-s-ink/40",
              ].join(" ")}
            >
              <div className="relative">
                <Icon size={20} />
                {isMessages && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-s-coral" />
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
