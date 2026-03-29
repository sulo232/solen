"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Compass, Search, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "discover", href: "/discover", Icon: Compass },
  { key: "search",   href: "/search",   Icon: Search },
  { key: "saved",    href: "/account/saved", Icon: Bookmark },
  { key: "account",  href: "/profile",  Icon: User },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation") as any;

  // Hide on dashboard + auth + booking pages
  const isHidden =
    pathname.includes("/dashboard") ||
    pathname.includes("/auth/") ||
    pathname.includes("/booking/");

  if (isHidden) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-frost border-t border-white/20 dark:border-s-dm-text/10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("mobileNavigation") ?? "Navigation"}
    >
      <div className="flex items-stretch h-[58px]">
        {TABS.map(({ key, href, Icon }) => {
          const fullHref = `/${locale}${href}`;
          const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/");
          return (
            <Link
              key={key}
              href={fullHref}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors duration-150",
                isActive ? "text-s-coral" : "text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-ink/70"
              )}
              aria-label={t(key as any)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span className={cn(
                "text-[10px] font-heading font-semibold tracking-[.04em] leading-none",
                isActive ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40"
              )}>
                {t(key as any)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
