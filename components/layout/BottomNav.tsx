"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { House, Search, Compass, User, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import ExpandableNavTabs from "@/components/ui/expandable-tabs";
import type { ExpandableTabsItem } from "@/components/ui/expandable-tabs";

export default function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // Fetch user role once on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((p) => {
        if (p?.role) {
          setUserRole(p.role);
          setIsLoggedIn(true);
        }
      })
      .catch((err) => console.error("[BottomNav] failed to fetch user profile/role:", err));
  }, []);

  // Scroll-hide: Instagram-style hide on scroll down, show on scroll up
  useEffect(() => {
    const threshold = 10;
    const handler = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        setHidden(false);
      } else if (currentY > lastScrollY.current + threshold) {
        setHidden(true);
      } else if (currentY < lastScrollY.current - threshold) {
        setHidden(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Don't render on dashboard pages (dashboard has its own bottom nav)
  if (pathname.includes("/dashboard")) return null;

  const isDashboardUser = userRole === "salon_owner" || userRole === "admin";

  // Profile route: login redirect if not logged in
  const profileRoute = isLoggedIn ? `/${locale}/profile` : `/${locale}/auth/login`;

  // Q14 lock 2026-04-22: 4 tabs only (Home · Suche · Discover · Profil).
  // Termine removed (Q9: /termine redirects to /profile/bookings, reachable via Profil tab).
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },
    { title: "Suche", icon: Search },
    { title: "Discover", icon: Compass },
    { title: "Profil", icon: User },
  ];

  const routes: (string | null)[] = [
    `/${locale}`,
    `/${locale}/discover`,
    `/${locale}/discover`,
    profileRoute,
  ];

  // Add Dashboard tab for salon/admin users (conditionally, not hidden)
  if (isDashboardUser) {
    tabs.push({ title: "Dashboard", icon: LayoutDashboard });
    routes.push(`/${locale}/dashboard`);
  }

  const handleTabChange = (index: number | null) => {
    if (index === null) return;

    // "Suche" tab (index 1): scroll to top + focus search on homepage, otherwise navigate to /coiffeur
    if (index === 1) {
      if (pathname === `/${locale}`) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => document.getElementById("tour-search")?.focus(), 400);
      } else {
        router.push(`/${locale}/discover`);
      }
      return;
    }

    const route = routes[index];
    if (route) router.push(route);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 md:hidden z-50 px-4 pb-2 pt-1 transition-transform duration-300 ${
        hidden ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <ExpandableNavTabs
        tabs={tabs}
        activeColor="text-s-coral"
        className="w-full justify-center bg-white border-t border-s-ink/[0.06] min-h-12"
        onTabChange={handleTabChange}
        aria-label="Hauptnavigation"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      />
    </div>
  );
}
