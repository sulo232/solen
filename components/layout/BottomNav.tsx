"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { House, Search, Calendar, User, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation";
import ExpandableNavTabs from "@/components/ui/expandable-tabs";
import type { ExpandableTabsItem } from "@/components/ui/expandable-tabs";

export default function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role once on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((p) => {
        if (p?.role) setUserRole(p.role);
      })
      .catch(() => {});
  }, []);

  // Don't render on dashboard pages (dashboard has its own bottom nav)
  if (pathname.includes("/dashboard")) return null;

  const isDashboardUser = userRole === "salon_owner" || userRole === "admin";

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
    `/${locale}/profile`,
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
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 px-4 pb-2 pt-1">
      <ExpandableNavTabs
        tabs={tabs}
        activeColor="text-teal"
        className="w-full justify-center bg-white/90 backdrop-blur-lg shadow-glass border-gray-100"
        onTabChange={handleTabChange}
      />
    </div>
  );
}
