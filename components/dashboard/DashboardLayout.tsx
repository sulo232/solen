"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, Search,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star, PieChart, Paintbrush, Compass, Camera,
  UserCheck, Megaphone, Image as ImageIcon, Sparkles, LayoutGrid, FlaskConical,
} from "lucide-react";

import Skeleton from "@/components/ui/Skeleton";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar";
import type { Profile, UserRole } from "@/lib/types";
import { useMemo } from "react";
import { getCategoryNavGroups } from "@/lib/dashboard/category-nav";
import CommandPalette from "@/components/dashboard/CommandPalette";
import NotificationCenter from "@/components/dashboard/NotificationCenter";

// ─────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────

// Category-to-nav mapping: which nav items require which category
const CATEGORY_NAV_MAP: Record<string, string> = {
  nailClients: "nails",
  barberClients: "barbershop",
  barberOps: "barbershop",
  // Future: coiffeurCrm: "coiffeur", spaAdmin: "spa", etc.
};

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
  { key: "sandbox",             href: "/dashboard/admin-sandbox",      icon: FlaskConical },
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
  salonCategories?: string[];
}

export default function DashboardLayout({
  children,
  salonName,
  salonAvatar,
  unreadCount = 0,
  salonCategories,
}: DashboardLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("dashboard.nav") as any;
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewSalonName, setPreviewSalonName] = useState<string | null>(null);
  const [exitingPreview, setExitingPreview] = useState(false);

  // Global Ctrl+K / Cmd+K shortcut to open command palette
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Filter nav groups by salon categories (desktop)
  const filteredOwnerNavGroups = useMemo(() => {
    return OWNER_NAV_GROUPS.map(group => {
      if (group.label !== "Spezial") return group;

      // If no categories provided, show all (safe fallback)
      if (!salonCategories || salonCategories.length === 0) return group;

      const filtered = group.items.filter(item => {
        const requiredCategory = CATEGORY_NAV_MAP["key" in item ? item.key : ""];
        // If no mapping exists, always show (generic items)
        if (!requiredCategory) return true;
        return salonCategories.includes(requiredCategory);
      });

      // Hide group entirely if no items match
      if (filtered.length === 0) return null;
      return { ...group, items: filtered };
    }).filter((g): g is NonNullable<typeof g> => g !== null);
  }, [salonCategories]);

  // Filter flat nav for mobile sidebar
  const filteredOwnerNav = useMemo(() => {
    if (!salonCategories || salonCategories.length === 0) return OWNER_NAV;
    return OWNER_NAV.filter(item => {
      const requiredCategory = CATEGORY_NAV_MAP["key" in item ? item.key : ""];
      if (!requiredCategory) return true;
      return salonCategories.includes(requiredCategory);
    });
  }, [salonCategories]);

  // Get category-specific nav groups
  const categoryNavGroups = useMemo(() => {
    if (!salonCategories || salonCategories.length === 0) return [];
    return getCategoryNavGroups(salonCategories as any[]);
  }, [salonCategories]);

  const exitPreview = async () => {
    setExitingPreview(true);
    try {
      await fetch("/api/admin/preview-salon", { method: "DELETE" });
      router.push(`/${locale}/dashboard/admin-sandbox`);
      router.refresh();
    } finally {
      setExitingPreview(false);
    }
  };

  // Auth guard — role must be salon_owner, admin, or linked staff
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p: Profile) => {
        if (!p?.id) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
        } else if (
          p.role === "customer" &&
          !(p as any).staff_salon_id &&
          !(p as any).salon_id
        ) {
          // Only redirect if user is truly a customer (no salon, no staff link)
          router.push(`/${locale}/profile`);
        } else {
          setRole(p.role);
          setIsStaff(!!(p as any).staff_salon_id && p.role !== "salon_owner" && p.role !== "admin");
          if ((p as any).is_previewing) {
            setIsPreviewing(true);
            setPreviewSalonName((p as any).preview_salon_name ?? null);
          }
          setAuthChecked(true);
        }
      })
      .catch(() => router.push(`/${locale}/auth/login`));
  }, [locale, pathname, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-[240px] border-r border-s-ink/[0.06] p-3 gap-4">
          <Skeleton className="h-8 w-8 rounded-input" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-input" />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-[12px]" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-[12px]" />
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === `/${locale}/dashboard`
      : pathname.startsWith(`/${locale}${href}`);

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Desktop Sidebar (animated) ── */}
      <Sidebar>
        <SidebarBody>
          {/* Salon identity */}
          <div className="px-4 py-4 border-b border-s-ink/[0.05]">
            {salonAvatar && (
              <Image src={salonAvatar} alt={salonName ?? ""} width={32} height={32}
                className="rounded-input mb-3" />
            )}
            {!salonAvatar && salonName && (
              <div className="w-8 h-8 rounded-input bg-s-coral/10 flex items-center justify-center mb-3">
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
              <>
                {filteredOwnerNavGroups.map((group) => (
                  <div key={group.label} className="px-3 pt-4 pb-1">
                    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1">{group.label}</p>
                    {group.items.map((item) => {
                      const { href, icon: Icon } = item;
                      const label = "key" in item ? t(item.key as Parameters<typeof t>[0]) : ("label" in item ? item.label : "");
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
                            <span className="ml-auto text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-pill bg-s-coral text-white">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ))}
                {/* Category-specific nav groups */}
                {categoryNavGroups.map(group => (
                  <div key={group.category} className="px-3 pt-4 pb-1">
                    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1">
                      {t(group.labelKey as any)}
                    </p>
                    {group.items.map(item => (
                      <Link key={item.key} href={`/${locale}${item.href}`}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={`flex items-center gap-3 px-1 py-2 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                          isActive(item.href)
                            ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                            : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                        }`}>
                        <item.icon size={15} className={isActive(item.href) ? "text-s-coral" : "text-s-ink/35"} />
                        <span className="flex-1 overflow-hidden whitespace-nowrap">{t(item.labelKey as any)}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </>
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
              className="absolute left-0 top-0 h-full w-64 bg-white border-r border-s-ink/[0.06]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-4 border-b border-s-ink/[0.06] flex items-center justify-between">
                <span className="font-heading font-bold text-base text-s-ink">solen<span className="text-s-coral">.</span>ch</span>
                <button onClick={() => setMobileSidebarOpen(false)}><X size={20} className="text-s-ink/40" /></button>
              </div>
              <nav className="py-3 px-1 overflow-y-auto">
                {(isStaff ? STAFF_NAV : filteredOwnerNav).map((item) => {
                  const { href, icon: Icon } = item;
                  const label = "key" in item ? t(item.key as Parameters<typeof t>[0]) : ("label" in item ? item.label : "");
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
                        <span className="ml-auto text-[10px] font-heading font-bold px-1.5 py-0.5 rounded-pill bg-s-coral text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {/* Category-specific nav items (mobile) */}
                {!isStaff && categoryNavGroups.map(group => (
                  <div key={`mobile-${group.category}`}>
                    <p className="text-[8px] font-heading font-bold uppercase tracking-[.20em] text-s-ink/25 mb-1 px-4 mt-4">
                      {t(group.labelKey as any)}
                    </p>
                    {group.items.map(item => (
                      <Link
                        key={item.key}
                        href={`/${locale}${item.href}`}
                        onClick={() => setMobileSidebarOpen(false)}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-heading font-semibold transition-colors duration-150 border-l-2 ${
                          isActive(item.href)
                            ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
                            : "border-transparent text-s-ink/55 hover:text-s-ink hover:bg-s-ink/[0.03]"
                        }`}
                      >
                        <item.icon size={15} className={isActive(item.href) ? "text-s-coral" : "text-s-ink/35"} />
                        <span className="flex-1">{t(item.labelKey as any)}</span>
                      </Link>
                    ))}
                  </div>
                ))}
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
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-s-ink/[0.06] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-s-ink/60" aria-label="Menu öffnen">
            <Menu size={20} />
          </button>
          <span className="font-heading font-bold text-base flex-1">solen<span className="text-s-coral">.</span>ch</span>
          <button onClick={() => setPaletteOpen(true)} aria-label="Suche öffnen (Ctrl+K)" className="p-1.5 text-s-ink/40 hover:text-s-ink/70 transition-colors">
            <Search size={16} />
          </button>
          <NotificationCenter salonId={undefined} />
        </div>

        {/* Admin preview banner */}
        {isPreviewing && (
          <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-2.5 bg-s-amber text-white text-xs font-heading font-semibold">
            <FlaskConical size={13} className="shrink-0" />
            <span className="flex-1 truncate">
              {t("previewBanner")} <span className="font-bold">{previewSalonName}</span>
            </span>
            <button
              onClick={exitPreview}
              disabled={exitingPreview}
              className="shrink-0 px-2.5 py-1 rounded-[6px] bg-white/20 hover:bg-white/30 transition-colors text-[11px] font-bold uppercase tracking-[.06em] disabled:opacity-60"
              aria-label={t("previewExit")}
            >
              {t("previewExit")}
            </button>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 py-6 md:py-8">
          {children}
        </main>
      </div>

      {/* ── Command Palette ── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-s-ink/[0.06] bg-white"
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
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-pill bg-s-coral" />
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
