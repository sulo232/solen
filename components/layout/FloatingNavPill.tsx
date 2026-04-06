"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";

/**
 * Floating Nav Pill — Component Map §06
 *
 * Design intent: "This pill should feel like native app chrome — always there,
 * never distracting, premium glass material."
 *
 * - Floating frost glass pill, centered at bottom
 * - Icons only — no text labels
 * - Active icon: coral #E8735A (filled variant)
 * - Inactive icon: warm gray #8C8279 (outline)
 * - Always visible on mobile, HIDDEN on desktop (1024px+)
 * - 4 icons: Home, Entdecken, Suchen, Profil
 * - Each tap target: 48×48px
 * - Pill height: 52px, border-radius: 99px
 * - Position: fixed, bottom: 16px + safe-area, centered
 * - z-index: 50
 */

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? "#E8735A" : "#8C8279";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? c : "none"} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l9-8 9 8" />
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
    </svg>
  );
}

function DiscoverIcon({ active }: { active: boolean }) {
  const c = active ? "#E8735A" : "#8C8279";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" fill={active ? c : "none"} />
    </svg>
  );
}

function SearchIcon({ active }: { active: boolean }) {
  const c = active ? "#E8735A" : "#8C8279";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? "#E8735A" : "#8C8279";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" fill={active ? c : "none"} />
      <path d="M5 20c0-3.5 3.5-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "home", href: "", icon: HomeIcon, match: (p: string) => /^\/[a-z]{2}\/?$/.test(p) },
  { key: "discover", href: "/discover", icon: DiscoverIcon, match: (p: string) => p.includes("/discover") },
  { key: "search", href: "/search", icon: SearchIcon, match: (p: string) => p.includes("/search") || p.includes("/coiffeur") || p.includes("/nails") || p.includes("/barbershop") },
  { key: "profile", href: "/profile", icon: ProfileIcon, match: (p: string) => p.includes("/profile") },
] as const;

export default function FloatingNavPill() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      className="fixed left-1/2 z-50 lg:hidden"
      style={{
        bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
        transform: "translateX(-50%)",
      }}
      aria-label="Navigation"
    >
      <div
        className="flex items-center"
        style={{
          height: 52,
          padding: "0 8px",
          borderRadius: 99,
          background: "rgba(255,255,255,0.78)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(232,226,220,0.5)",
          boxShadow: "0 4px 24px rgba(44,36,32,0.12), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {NAV_ITEMS.map(({ key, href, icon: Icon, match }) => {
          const isActive = match(pathname);
          const fullHref = `/${locale}${href}`;

          return (
            <Link
              key={key}
              href={fullHref}
              className="flex items-center justify-center active:scale-[0.85] transition-transform duration-100"
              style={{ width: 48, height: 48, borderRadius: "50%" }}
              aria-label={key}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon active={isActive} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
