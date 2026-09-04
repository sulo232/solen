"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Calendar, Clock, MessageCircle, Users, Scissors,
  BarChart, Settings, Menu, X, Search, ChevronDown,
  ShieldCheck, Store, UsersRound, DollarSign, BarChart3, Award, FileEdit,
  MessageSquareWarning, Star, PieChart, Paintbrush, Compass, Camera,
  UserCheck, Megaphone, Image as ImageIcon, Sparkles, LayoutGrid, FlaskConical,
  Scale, RotateCcw, TrendingUp, Percent, ArrowLeft, Package, Layers, MapPin, Gauge, Crown, ToggleLeft, Flag,
} from "lucide-react";

import { Skeleton } from "@/app/[locale]/_components/primitives";
import type { Profile, UserRole } from "@/lib/types";
import { useMemo } from "react";
import { getCategoryNavGroups } from "@/lib/dashboard/category-nav";
import CommandPalette from "@/components-legacy/dashboard/CommandPalette";
import NotificationCenter from "@/components-legacy/dashboard/NotificationCenter";
import SalonSwitcher from "@/components-legacy/dashboard/SalonSwitcher";

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
  { key: "commission",           href: "/dashboard/commission-admin",    icon: Percent },
  { key: "platformAnalytics", href: "/dashboard/platform-analytics", icon: BarChart3 },
  { key: "aiLimit",              href: "/dashboard/ai-limits-admin",     icon: Gauge },
  { key: "badges",              href: "/dashboard/badge-manager",       icon: Award },
  { key: "content",             href: "/dashboard/content-editor",     icon: FileEdit },
  { key: "reviewModeration",   href: "/dashboard/review-moderation",  icon: MessageSquareWarning },
  { key: "reports",             href: "/dashboard/reports",            icon: Flag },
  { key: "segments",            href: "/dashboard/segments",           icon: PieChart },
  { key: "visualEditor",       href: "/dashboard/editor",             icon: Paintbrush },
  { key: "discovery",           href: "/dashboard/discovery-admin",    icon: Compass },
  { key: "homepage",            href: "/dashboard/homepage-admin",     icon: LayoutGrid },
  { key: "cities",              href: "/dashboard/cities-admin",       icon: MapPin },
  { key: "salonOfMonth",        href: "/dashboard/salon-of-month-admin", icon: Crown },
  { key: "featureFlags",        href: "/dashboard/feature-flags-admin", icon: ToggleLeft },
  { key: "sandbox",             href: "/dashboard/admin-sandbox",      icon: FlaskConical },
] as const;

const OWNER_NAV_GROUPS = [
  {
    label: "Betrieb",
    items: [
      { key: "overview",  href: "/dashboard",          icon: Home },
      { key: "bookings",  href: "/dashboard/bookings", icon: Calendar },
      { key: "calendar",  href: "/dashboard/calendar", icon: Clock },
      // messaging turned off for now (owner 2026-06-13) — nav entry removed
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

// V3-D347 (W1): Fresha icon-rail nav — the 9 operator sections. Labels are tooltips
// (icon-only rail); i18n keys for the new taxonomy land in the i18n pass.
// V3-D347 (W1): Fresha icon-rail nav — the operator sections. SINGLE source of truth
// for BOTH the desktop icon-rail AND the mobile slide-out sidebar (the rail renders these
// flat as icons; the sidebar renders them grouped by `group`). Keeps PC + mobile in sync.
const RAIL_NAV = [
  { key: "overview",  href: "/dashboard",           icon: LayoutGrid, label: "Übersicht",       group: "Betrieb" },
  { key: "calendar",  href: "/dashboard/calendar",  icon: Calendar,   label: "Kalender",        group: "Betrieb" },
  // V3-D421 (G11): walk-in queue rail item, barbershop-only (filtered at render).
  { key: "queue",     href: "/dashboard/barber-ops", icon: UsersRound, label: "Warteschlange", barbershopOnly: true, group: "Betrieb" },
  { key: "catalog",   href: "/dashboard/services",  icon: Scissors,   label: "Katalog",         group: "Verkauf & Kunden" },
  { key: "bundles",   href: "/dashboard/bundles",   icon: Layers,     label: "Combos",          group: "Verkauf & Kunden" },
  { key: "clients",   href: "/dashboard/clients",   icon: Users,         label: "Kund:innen",    group: "Verkauf & Kunden" },
  // messaging turned off for now (owner 2026-06-13) — nav entry removed
  { key: "marketing", href: "/dashboard/marketing", icon: Megaphone,     label: "Marketing",     group: "Business" },
  { key: "sales",     href: "/dashboard/bookings",  icon: DollarSign, label: "Verkäufe",        group: "Verkauf & Kunden" },
  { key: "team",      href: "/dashboard/staff",     icon: UserCheck,  label: "Team",            group: "Business" },
  { key: "reports",   href: "/dashboard/analytics", icon: BarChart3,  label: "Berichte",        group: "Business" },
  { key: "refunds",   href: "/dashboard/refunds",   icon: RotateCcw,  label: "Rückerstattungen", group: "Abrechnung" },
  { key: "upcharge",  href: "/dashboard/upcharge",  icon: TrendingUp, label: "Mehrbelastung",   group: "Abrechnung" },
  { key: "cases",     href: "/dashboard/cases",     icon: Scale,      label: "Fälle", adminOnly: true, group: "Abrechnung" },
  { key: "settings",  href: "/dashboard/settings",  icon: Settings,   label: "Einstellungen",   group: "Mehr" },
] as const;

const NAV_GROUP_ORDER = ["Betrieb", "Verkauf & Kunden", "Business", "Abrechnung", "Mehr"] as const;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  salonName?: string;
  salonAvatar?: string | null;
  salonCategories?: string[];
}

export default function DashboardLayout({
  children,
  salonName,
  salonAvatar,
  salonCategories,
}: DashboardLayoutProps) {
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const t = useTranslations("dashboard.nav") as any;
  const [authChecked, setAuthChecked] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewSalonName, setPreviewSalonName] = useState<string | null>(null);
  const [fetchedSalonName, setFetchedSalonName] = useState<string | null>(null);
  // P12 (2026-07-16): the topbar bell needs a real salon id to load its activity stack , the
  // profile fetch below already returns salon_id/staff_salon_id, just wasn't kept anywhere.
  const [fetchedSalonId, setFetchedSalonId] = useState<string | null>(null);
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
          // Fallback salon name for subpages that don't pass the salonName prop (the layout
          // already fetches the profile here — reuse it so the topbar/sidebar show the real
          // salon name instead of "Dein Salon").
          setFetchedSalonName((p as any).salon_name ?? null);
          setFetchedSalonId((p as any).salon_id ?? (p as any).staff_salon_id ?? null);
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
      <div data-surface="dashboard" className="min-h-screen bg-s-bg-sunken flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-[240px] border-r border-s-ink/[0.06] p-3 gap-4">
          <Skeleton className="h-8 w-8" rounded={16} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" rounded={16} />
          ))}
        </div>
        {/* Content skeleton */}
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" rounded={8} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" rounded={12} />
            ))}
          </div>
          <Skeleton className="h-64" rounded={12} />
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === `/${locale}/dashboard`
      : pathname.startsWith(`/${locale}${href}`);

  return (
    <div data-surface="dashboard" className="min-h-screen bg-s-bg-sunken flex">
      {/* ── Desktop icon rail (V3-D347 W1 — Fresha structure) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-[64px] bg-white border-r border-s-border flex-col items-center py-3 z-30">
        <Link href={`/${locale}/dashboard`} aria-label="Solen" className="w-9 h-9 grid place-items-center text-[20px] font-bold tracking-[-0.04em] text-s-ink mb-2">S</Link>
        <nav aria-label="Dashboard-Navigation" className="flex-1 flex flex-col gap-1 items-center w-full">
          {RAIL_NAV.filter((it) => (!("barbershopOnly" in it) || salonCategories?.includes("barbershop")) && (!("adminOnly" in it) || role === "admin")).map(({ key, href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link key={key} href={`/${locale}${href}`} aria-current={active ? "page" : undefined}
                className={`group relative w-10 h-10 rounded-xl grid place-items-center transition-colors ${active ? "bg-s-border text-s-ink" : "text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"}`}>
                <Icon size={20} strokeWidth={2.2} />
                {/* messaging unread badge removed — feature off (owner 2026-06-13) */}
                <span className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-s-ink px-2 py-1 text-[12px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">{label}</span>
              </Link>
            );
          })}
          {role === "admin" && (
            <>
              <span className="my-1.5 h-px w-7 bg-s-border" aria-hidden />
              {ADMIN_NAV.slice(0, 6).map(({ key, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={key} href={`/${locale}${href}`} aria-current={active ? "page" : undefined}
                    className={`group relative w-10 h-10 rounded-xl grid place-items-center transition-colors ${active ? "bg-s-border text-s-ink" : "text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"}`}>
                    <Icon size={19} strokeWidth={2.2} />
                    <span className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-s-ink px-2 py-1 text-[12px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">{t(key)}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <Link href={`/${locale}`} className="group relative w-10 h-10 rounded-xl grid place-items-center text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink transition-colors mb-1.5">
          <span aria-hidden className="text-[17px] leading-none">←</span>
          <span className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-s-ink px-2 py-1 text-[12px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity z-50">{t("backToSite")}</span>
        </Link>
        {salonAvatar ? (
          <Image src={salonAvatar} alt={salonName ?? ""} width={34} height={34} className="rounded-full object-cover" />
        ) : (
          <div className="w-[34px] h-[34px] rounded-full bg-s-ink text-white grid place-items-center text-[12px] font-semibold">{((salonName ?? fetchedSalonName)?.trim()?.[0] ?? "S").toUpperCase()}</div>
        )}
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
            className="md:hidden fixed inset-0 z-40 bg-s-ink/40"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-0 h-full w-[300px] max-w-[85vw] bg-white border-r border-s-border flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Salon header */}
              <div className="px-4 py-4 border-b border-s-border flex items-center gap-3">
                <SalonSwitcher variant="sidebar" fallbackName={salonName ?? fetchedSalonName ?? undefined} />
                <button onClick={() => setMobileSidebarOpen(false)} aria-label={t("closeMenu")} className="p-1 -mr-1 text-s-ink-2 hover:text-s-ink transition-colors"><X size={20} strokeWidth={2.2} /></button>
              </div>

              {/* Scrollable grouped nav */}
              <nav aria-label="Dashboard-Navigation" className="flex-1 overflow-y-auto px-2 py-2">
                {isStaff ? (
                  STAFF_NAV.map(({ key, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={`/${locale}${href}`} onClick={() => setMobileSidebarOpen(false)} aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${active ? "bg-s-bg-sunken text-s-ink font-semibold" : "text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken"}`}>
                        <Icon size={20} strokeWidth={2.2} className={active ? "text-s-ink" : "text-s-ink-2"} />
                        <span className="flex-1">{t(key)}</span>
                      </Link>
                    );
                  })
                ) : (
                  <>
                    {/* Unified nav — SAME set as the desktop rail (RAIL_NAV), grouped for the sidebar */}
                    {NAV_GROUP_ORDER.map((groupLabel) => {
                      const items = RAIL_NAV.filter((it) =>
                        (it as any).group === groupLabel
                        && (!("barbershopOnly" in it) || salonCategories?.includes("barbershop"))
                        && (!("adminOnly" in it) || role === "admin"),
                      );
                      if (items.length === 0) return null;
                      return (
                        <div key={groupLabel}>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2 px-3 mt-5 mb-1 first:mt-1">{groupLabel}</p>
                          {items.map(({ key, href, icon: Icon, label }) => {
                            const active = isActive(href);
                            return (
                              <Link key={key} href={`/${locale}${href}`} onClick={() => setMobileSidebarOpen(false)} aria-current={active ? "page" : undefined}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${active ? "bg-s-bg-sunken text-s-ink font-semibold" : "text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken"}`}>
                                <Icon size={20} strokeWidth={2.2} className={active ? "text-s-ink" : "text-s-ink-2"} />
                                <span className="flex-1">{label}</span>
                                {/* messaging unread badge removed — feature off (owner 2026-06-13) */}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Admin */}
                    {role === "admin" && (
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2 px-3 mt-5 mb-1">Admin</p>
                        {ADMIN_NAV.map(({ key, href, icon: Icon }) => {
                          const active = isActive(href);
                          return (
                            <Link key={href} href={`/${locale}${href}`} onClick={() => setMobileSidebarOpen(false)} aria-current={active ? "page" : undefined}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors ${active ? "bg-s-bg-sunken text-s-ink font-semibold" : "text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken"}`}>
                              <Icon size={20} strokeWidth={2.2} className={active ? "text-s-ink" : "text-s-ink-2"} />
                              <span className="flex-1">{t(key)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </nav>

              {/* Footer */}
              <div className="border-t border-s-border px-2 py-2">
                <Link href={`/${locale}`} onClick={() => setMobileSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken transition-colors">
                  <ArrowLeft size={20} strokeWidth={2.2} className="text-s-ink-2" />
                  <span className="flex-1">{t("backToSite")}</span>
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 md:ml-[64px] flex flex-col min-h-screen">
        {/* Desktop top bar */}
        <div className="hidden md:flex sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-s-border h-[56px] items-center gap-3 px-6">
          <div className="px-3 py-1.5 rounded-full border border-s-border hover:bg-s-bg-sunken transition-colors">
            <SalonSwitcher variant="bar" fallbackName={salonName ?? fetchedSalonName ?? undefined} />
          </div>
          <div className="flex-1" />
          <button onClick={() => setPaletteOpen(true)} aria-label="Suche öffnen (Ctrl+K)" className="w-[38px] h-[38px] rounded-full grid place-items-center text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink transition-colors">
            <Search size={19} strokeWidth={2.2} />
          </button>
          <NotificationCenter salonId={fetchedSalonId ?? undefined} />
        </div>
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-white border-b border-s-ink/[0.06] px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 -ml-1.5 text-s-ink-2" aria-label="Menu öffnen">
            <Menu size={20} strokeWidth={2.2} />
          </button>
          <div className="flex-1 min-w-0"><SalonSwitcher variant="bar" fallbackName={salonName ?? fetchedSalonName ?? undefined} /></div>
          <button onClick={() => setPaletteOpen(true)} aria-label="Suche öffnen (Ctrl+K)" className="p-1.5 text-s-ink/40 hover:text-s-ink/70 transition-colors">
            <Search size={16} strokeWidth={1.9} />
          </button>
          <NotificationCenter salonId={fetchedSalonId ?? undefined} />
        </div>

        {/* Admin preview banner */}
        {isPreviewing && (
          <div className="sticky top-0 z-30 flex items-center gap-3 px-5 py-2.5 bg-s-warning-bg border-b border-s-warning/20 text-s-ink text-[13px] font-medium">
            <FlaskConical size={15} strokeWidth={1.9} className="shrink-0 text-s-warning" />
            <span className="flex-1 truncate">
              {t("previewBanner")} <span className="font-semibold">{previewSalonName}</span>
            </span>
            <button
              onClick={exitPreview}
              disabled={exitingPreview}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white border border-s-border hover:bg-s-bg-sunken transition-colors text-[12px] font-medium disabled:opacity-60"
              aria-label={t("previewExit")}
            >
              {t("previewExit")}
            </button>
          </div>
        )}

        {/* mockup-ok (owner 2026-07-27, "6/7 ye fix"): the operator dashboard had NO
            page-level width at all , measured 2136px of content at a 2200px viewport, with
            max-width:none , so on a 27-inch or ultrawide monitor a table row grew about a
            metre wide and the eye lost the line between the left and right columns. This one
            element reaches 44 of the 49 dashboard pages; 5 bypass the shell entirely
            (editor, messages, gallery, setup, queue-display).
            THREE THINGS IN THIS CLASS STRING ARE LOAD-BEARING:
            - 1400px REUSES the /business hero width already frozen in LOCKFILE section 7
              rather than inventing a fourth container width. That table holds 1280 (page
              outer), 1400 (/business hero) and 1180 (PDP grid); a dashboard is denser than a
              customer page, so it takes the widest value the system already has.
            - mx-auto, or the content hugs the 64px rail and dumps every pixel of slack into
              one right-hand gutter, which looks more broken than no cap at all.
            - w-full, and this one is mandatory rather than stylistic: <main> is a flex item
              in a flex-col parent (:431), so width is the CROSS axis, and per CSS Flexbox 9.6
              align-self:stretch is suppressed the moment a cross-axis margin is auto. Without
              w-full the mx-auto collapses this to its content width.
            The sticky topbar (:433) is a SIBLING and stays viewport-pinned, matching the rail,
            which is also viewport-pinned chrome. Same arrangement Stripe and Fresha use. */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 pt-6 pb-10 sm:px-6 md:py-8">
          {children}
        </main>
      </div>

      {/* ── Command Palette ── */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
