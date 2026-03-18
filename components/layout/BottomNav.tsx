"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState, useRef } from "react";
import { House, Search, Calendar, User, LayoutDashboard } from "lucide-react";
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
      .catch(() => {});
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

  // Build tabs and routes dynamically based on role
  const tabs: ExpandableTabsItem[] = [
    { title: "Home", icon: House },
    { title: "Suche", icon: Search },
    { type: "separator" as const },
    { title: "Termine", icon: Calendar },
    { title: "Profil", icon: User },
  ];

  const routes: (string | null)[] = [
    `/${locale}`,
    `/${locale}/coiffeur`,
    null, // separator
    `/${locale}/termine`,
    profileRoute,
  ];

  // Add Dashboard tab for salon/admin users (conditionally, not hidden)
  if (isDashboardUser) {
    tabs.push({ title: "Dashboard", icon: LayoutDashboard });
    routes.push(`/${locale}/dashboard`);
  }

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
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
        activeColor="text-teal"
        className="w-full justify-center bg-white/90 backdrop-blur-lg shadow-glass border-gray-100 min-h-12"
        onTabChange={handleTabChange}
      />
    </div>
  );
}
