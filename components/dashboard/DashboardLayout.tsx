"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, ChevronRight,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star, PieChart, Paintbrush, Compass, Camera,
  UserCheck, Megaphone, Image as ImageIcon, Sparkles, LayoutGrid,
} from "lucide-react";

import Skeleton from "@/components/ui/Skeleton";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import type { Profile, UserRole } from "@/lib/types";

// ─────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────

const ADMIN_NAV = [
  { key: "approvals",       href: "/dashboard/approvals",           icon: ShieldCheck },
  { key: "allSalons",         href: "/dashboard/all-salons",          icon: Store },
  { key: "allUsers",         href: "/dashboard/all-users",           icon: UsersRound },
  { key: "revenue",              href: "/dashboard/revenue",             icon: DollarSign },
  { key: "platformAnalytics", href: "/dashboard/platform-analytics", icon: BarChart3 },
  { key: "badges",              href: "/dashboard/badge-manager",       icon: Award },
  { key: "content",             href: "/dashboard/content-editor",     icon: FileEdit },
  { key: "reviewModeration",   href: "/dashboard/review-moderation",  icon: MessageSquareWarning },
  { key: "segments",            href: "/dashboard/segments",           icon: PieChart },
  { key: "visualEditor",       href: "/dashboard/editor",             icon: Paintbrush },
  { key: "discovery",           href: "/dashboard/discovery-admin",    icon: Compass },
  { key: "homepage",            href: "/dashboard/homepage-admin",     icon: LayoutGrid },
] as const;

const OWNER_NAV = [
  { key: "overview",    href: "/dashboard",            icon: Home },
  { key: "bookings",      href: "/dashboard/bookings",   icon: Calendar },
  { key: "calendar",     href: "/dashboard/calendar",   icon: Clock },
  { key: "messages",  href: "/dashboard/messages",   icon: MessageCircle },
  { key: "team",         href: "/dashboard/staff",      icon: Users },
  { key: "clients",       href: "/dashboard/clients",    icon: UserCheck },
  { key: "services",     href: "/dashboard/services",   icon: Scissors },
  { key: "marketing",    href: "/dashboard/marketing",  icon: Megaphone },
  { key: "analytics",  href: "/dashboard/analytics",  icon: BarChart },
  { key: "reviews",        href: "/dashboard/reviews",    icon: Star },
  { key: "gallery",        href: "/dashboard/gallery",    icon: ImageIcon },
  { key: "posts",  href: "/dashboard/discovery-posts", icon: Camera },
  { key: "nailClients",  href: "/dashboard/nail-clients", icon: Sparkles },
  { key: "barberClients", href: "/dashboard/barber-clients", icon: Scissors },
  { key: "barberOps",   href: "/dashboard/barber-ops",     icon: BarChart3 },
  { label: "Treueprogramm",href: "/dashboard/loyalty",        icon: Award },
  { label: "Einstellungen",href: "/dashboard/settings",   icon: Settings },
  { label: "Verifizierung",href: "/dashboard/verification", icon: ShieldCheck },
] as const;

const OWNER_NAV_GROUPS = [
  {
    label: "Betrieb",
    items: [
      { key: "overview",  href: "/dashboard",          icon: Home },
      { key: "bookings",  href: "/dashboard/bookings", icon: Calendar },
      { key: "calendar",  href: "/dashboard/calendar", icon: Clock },
      { key: "messages",  href: "/dashboard/messages", icon: MessageCircle },
    ],
  },
  {
    label: "Team & Kunden",
    items: [
      { key: "team",    href: "/dashboard/staff",   icon: Users },
      { key: "clients", href: "/dashboard/clients", icon: UserCheck },
    ],
  },
  {
    label: "Business",
    items: [
      { key: "services",   href: "/dashboard/services",        icon: Scissors },
      { key: "marketing",  href: "/dashboard/marketing",       icon: Megaphone },
      { key: "analytics",  href: "/dashboard/analytics",       icon: BarChart },
      { key: "reviews",    href: "/dashboard/reviews",         icon: Star },
      { key: "gallery",    href: "/dashboard/gallery",         icon: ImageIcon },
      { key: "posts",      href: "/dashboard/discovery-posts", icon: Camera },
    ],
  },
  {
    label: "Spezial",
    items: [
      { key: "nailClients",  href: "/dashboard/nail-clients",   icon: Sparkles },
      { key: "barberClients", href: "/dashboard/barber-clients", icon: Scissors },
      { key: "barberOps",   href: "/dashboard/barber-ops",      icon: BarChart3 },
    ],
  },
  {
    label: "Mehr",
    items: [
      { label: "Treueprogramm", href: "/dashboard/loyalty",       icon: Award },
      { label: "Einstellungen", href: "/dashboard/settings",      icon: Settings },
      { label: "Verifizierung", href: "/dashboard/verification",  icon: ShieldCheck },
    ],
  },
] as const;

const STAFF_NAV = [
  { key: "myCalendar", href: "/dashboard/calendar",  icon: Clock },
  { key: "myBreaks",  href: "/dashboard/my-breaks", icon: Calendar },
  { key: "myPortfolio", href: "/dashboard/my-portfolio", icon: ImageIcon },
  { key: "myProfile",   href: "/dashboard/settings",  icon: Settings },
] as const;

// Mobile bottom nav shows 5 items: first 3 + Messages + "Mehr"
const MOBILE_NAV = [
  { key: "overview",   href: "/dashboard",           icon: Home },
  { key: "bookings",     href: "/dashboard/bookings",  icon: Calendar },
  { key: "messages", href: "/dashboard/messages",  icon: MessageCircle },
  { key: "team",        href: "/dashboard/staff",     icon: Users },
  { key: "more",        href: "/dashboard/settings",  icon: Menu },
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
  const t = useTranslations("dashboard.nav");
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [isStaff, setIsStaff] = useState(false);

  // Auth guard — role must be salon_owner, admin, or linked staff
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
        } else if (p.role === "customer" && !(p as any).staff_salon_id) {
          router.push(`/${locale}/profile`);
        } else {
          setRole(p.role);
          setIsStaff(!!(p as any).staff_salon_id && p.role !== "salon_owner" && p.role !== "admin");
          setAuthChecked(true);
        }
      })
      .catch(() => router.push(`/${locale}/auth/login`));
  }, [locale, pathname, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-[60px] border-r border-s-ink/[0.06] dark:border-white/[0.06] p-3 gap-4">
          <Skeleton className="h-8 w-8 rounded-[8px]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-[8px]" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === `/${locale}/dashboard`
      : pathname.startsWith(`/${locale}${href}`);

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex">
      {/* ── Desktop Sidebar (animated) ── */}
      <Sidebar>
        <SidebarBody>
          {/* Salon identity */}
          <div className="px-4 py-4 border-b border-s-ink/[0.05]">
            {salonAvatar && (
              <Image src={salonAvatar} alt={salonName ?? ""} width={32} height={32}
                className="rounded-[8px] mb-3" />
            )}
            {!salonAvatar && salonName && (
              <div className="w-8 h-8 rounded-[8px] bg-s-coral/10 flex items-center justify-center mb-3">
                <span className="text-xs font-bold text-s-coral">{salonName[0]}</span>
              </div>
            )}
            <p className="font-heading font-bold text-sm text-s-ink truncate">{salonName ?? "Dashboard"}</p>
            <p className="text-[9px] font-heading uppercase tracking-[.18em] text-s-ink/35 mt-0.5">Dashboard</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2 px-1">
            {isStaff ? (
              STAFF_NAV.map((item) => {
                const { href, icon: Icon } = item;
                const active = isActive(href);
                return (
                  <Link key={href} href={`/${locale}${href}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                      active
                        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                        : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                    }`}>
                    <Icon size={15} className={active ? "text-s-coral" : "text-s-ink/35"} />
                    <span className="flex-1 overflow-hidden whitespace-nowrap">{t(item.key)}</span>
                  </Link>
                );
              })
            ) : (
              OWNER_NAV_GROUPS.map((group) => (
                <div key={group.label} className="px-3 pt-4 pb-1">
                  <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1">{group.label}</p>
                  {group.items.map((item) => {
                    const { href, icon: Icon } = item;
                    const label = "key" in item ? t(item.key as string) : (item as any).label;
                    const active = isActive(href);
                    const isMessages = href === "/dashboard/messages";
                    return (
                      <Link key={href} href={`/${locale}${href}`}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-1 py-2 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                          active
                            ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                            : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                        }`}>
                        <Icon size={15} className={active ? "text-s-coral" : "text-s-ink/35"} />
                        <span className="flex-1 overflow-hidden whitespace-nowrap">{label}</span>
                        {isMessages && unreadCount > 0 && (
                          <span className="ml-auto text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-[6px] bg-s-coral text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </nav>

          {/* Admin nav */}
          {role === "admin" && (
            <div className="px-1 pb-3 border-t border-s-ink/[0.06] pt-3">
              <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1 px-4">Admin</p>
              {ADMIN_NAV.map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={`/${locale}${href}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                      active
                        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                        : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                    }`}>
                    <Icon size={15} className={active ? "text-s-coral" : "text-s-ink/35"} />
                    <span className="flex-1 overflow-hidden whitespace-nowrap">{t(key)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="px-3 py-3 border-t border-s-ink/[0.06]">
            <Link
              href={`/${locale}`}
              className="text-xs text-s-ink/30 hover:text-s-coral transition-colors whitespace-nowrap"
            >
              ← {t("backToSite")}
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
            className="md:hidden fixed inset-0 z-40 bg-s-ink/40"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-s-dm-surface border-r border-s-ink/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-s-ink/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                <span className="font-heading font-bold text-base text-s-ink">solen<span className="text-s-coral">.</span>ch</span>
                <button onClick={() => setMobileSidebarOpen(false)}><X size={20} className="text-s-ink/40 dark:text-s-dm-text/40" /></button>
              </div>
              <nav className="py-3 px-1 overflow-y-auto">
                {(isStaff ? STAFF_NAV : OWNER_NAV).map((item) => {
                  const { href, icon: Icon } = item;
                  const label = "key" in item ? t(item.key) : (item as any).label;
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      href={`/${locale}${href}`}
                      onClick={() => setMobileSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                        active
                          ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                          : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                      }`}
                    >
                      <Icon size={15} className={active ? "text-s-coral" : "text-s-ink/35"} />
                      <span className="flex-1">{label}</span>
                      {href === "/dashboard/messages" && unreadCount > 0 && (
                        <span className="ml-auto text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-[6px] bg-s-coral text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {role === "admin" && (
                  <>
                    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1 px-4 mt-4">Admin</p>
                    {ADMIN_NAV.map(({ key, href, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={`/${locale}${href}`}
                          onClick={() => setMobileSidebarOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                            active
                              ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                              : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                          }`}
                        >
                          <Icon size={15} className={active ? "text-s-coral" : "text-s-ink/35"} />
                          <span className="flex-1">{t(key)}</span>
                        </Link>
                      );
                    })}
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
        <div className="md:hidden sticky top-0 z-20 bg-white dark:bg-s-dm-surface border-b border-s-ink/[0.06] dark:border-white/[0.06] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-s-ink/60 dark:text-s-dm-text/60">
            <Menu size={20} />
          </button>
          <span className="font-heading font-bold text-base">solen<span className="text-s-coral">.</span>ch</span>
        </div>

        <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-s-ink/[0.06] bg-white dark:bg-s-dm-surface"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex">
          {MOBILE_NAV.map(({ key, href, icon: Icon }) => {
            const active = isActive(href);
            const isMessages = href === "/dashboard/messages";
            return (
              <Link
                key={href}
                href={`/${locale}${href}`}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  active ? "text-s-coral" : "text-s-ink/40"
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {isMessages && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-s-coral" />
                  )}
                </div>
                <span className="text-[8px] font-heading font-semibold uppercase tracking-[.08em]">
                  {t(key)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
