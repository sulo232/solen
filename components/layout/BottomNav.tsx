"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState, useCallback } from "react";
import { House, Search, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import ExpandableNavTabs from "@/components/ui/expandable-tabs";
import type { ExpandableTabsItem } from "@/components/ui/expandable-tabs";

const TABS: ExpandableTabsItem[] = [
  { title: "Home", icon: House },
  { title: "Suche", icon: Search },
  { type: "separator" },
  { title: "Termine", icon: Calendar },
  { title: "Profil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const router = useRouter();

  // Don't render on dashboard pages (dashboard has its own bottom nav)
  if (pathname.includes("/dashboard")) return null;

  const routes = [
    `/${locale}`,
    `/${locale}/coiffeur`,
    null, // separator
    `/${locale}/bookings`,
    `/${locale}/profile`,
  ];

  const handleTabChange = (index: number | null) => {
    if (index === null) return;
    const route = routes[index];
    if (route) router.push(route);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 px-4 pb-2 pt-1">
      <ExpandableNavTabs
        tabs={TABS}
        activeColor="text-teal"
        className="w-full justify-center bg-white/90 backdrop-blur-lg shadow-glass border-gray-100"
        onTabChange={handleTabChange}
      />
    </div>
  );
}
