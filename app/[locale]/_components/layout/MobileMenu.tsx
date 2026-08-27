"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ChevronRight,
  Globe,
  Gift,
  Award,
  Users,
  User,
  HelpCircle,
  LogIn,
  Info,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components-legacy/ui/LanguageSwitcher";
import { getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity, setPersistedCity } from "@/lib/city-cookie";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { useActiveCities } from "@/hooks/useActiveCities";

/**
 * MobileMenu — V3-D77 (2026-05-19).
 *
 * Fresha-style full-screen mobile nav overlay. Replaces the previous
 * (dead) Menu icon in Header.tsx. Three sections:
 *
 *   1. Für Kund:innen — auth + help + language (white card stack)
 *   2. Stöbern — horizontal category chips (Coiffeur/Barber/Nails/Spa/Entdecken)
 *   3. Für Salons — B2B card with emerald arrow CTA
 *
 * Why this pattern: marketplaces are task-focused (search → book → leave),
 * NOT session-hoppy like social apps. Bottom nav slots would compete with
 * content for no real benefit since users don't switch nav targets often.
 * Hide auth/utility behind hamburger, give the screen back to the SearchBar.
 *
 * Anatomy when open:
 *   - Page (Header.tsx stage) opacity → 0 (no blur — full takeover)
 *   - This overlay slides up from 8px + fades in
 *   - Header itself stays sharp at top with X close button
 *   - Body scroll locked while open
 *   - Esc + click-on-link close
 *
 * Routes used (Phase 2 wire-up depends on these existing):
 *   /auth/login, /help, /coiffeur, /barbershop, /nails, /spa,
 *   /inspo, /business/signup
 */

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  loggedIn?: boolean;
}

const CATEGORIES: { label: string; href: string }[] = [
  { label: "Coiffeur",       href: "/coiffeur"   },
  { label: "Barbershop",     href: "/barbershop" },
  { label: "Nails",          href: "/nails"      },
  { label: "Spa & Wellness", href: "/spa"        },
  { label: "Inspo",          href: "/inspo"  },
];

// V3-D168 (2026-05-26): Swiss flag rendered via CSS only — same recipe
// as CityTopBar's bottom-bar chip. Red bg with two intersecting white
// rectangles forming the cross. Cheap, sharp at any size.
const swissFlagStyle: React.CSSProperties = {
  backgroundColor: "#DA291C",
  backgroundImage:
    "linear-gradient(white, white), linear-gradient(white, white)",
  backgroundSize: "50% 14%, 14% 50%",
  backgroundPosition: "center, center",
  backgroundRepeat: "no-repeat",
};

export default function MobileMenu({ open, onClose, locale, loggedIn = false }: MobileMenuProps) {
  // V3-D354 (2026-05-28): i18n for the rebuilt Schnellzugriff grid + utility rows.
  const t = useTranslations("ui.mobileMenu");
  // V3-D378 (2026-05-30): account row label when signed in (reuses navigation.account).
  const tNav = useTranslations("navigation");
  // FIX 2 (2026-08-01, no-close-control bug): reuses the SAME "salonDetail.closeMenu" key
  // Header.tsx already uses for its own hamburger-to-X aria-label (searched for an existing
  // close/schliessen key before adding one, per house rules; verified present in all four
  // locales, no new i18n key added).
  const tSD = useTranslations("salonDetail");
  // V3-D157 (2026-05-25): city selector state. Reads persisted city when the
  // menu opens (not on first mount — the menu may render before the user has
  // any cookie). Reload on change matches CityTopBar's existing behavior so
  // SSR'd city-aware sections (Nearby, etc.) pick up the new value.
  const [currentCity, setCurrentCity] = React.useState<CitySlug>("basel");
  // V3-D168 (2026-05-26): expand-on-tap dropdown state for the city
  // selector. Replaces the always-visible 3-pill row.
  const [cityDropdownOpen, setCityDropdownOpen] = React.useState(false);
  // 2026-07-04 city-rollout refactor: DB `cities WHERE is_active` is now the source of
  // truth for the picker list (was hardcoded CITY_SLUGS), so the admin Staedte toggle
  // actually adds/removes a city here.
  const { cities: activeCities } = useActiveCities();
  React.useEffect(() => {
    if (!open) return;
    const persisted = getPersistedCity();
    if (persisted) setCurrentCity(persisted);
    // reset dropdown when menu re-opens
    setCityDropdownOpen(false);
  }, [open]);

  // V3: role-gated "Dashboard" entry - show it for salon owners / admins so they can reach
  // the operator dashboard from the site menu (same gate the DashboardLayout itself
  // enforces). Checked via /api/profile when the menu opens, but only when a client
  // session exists. A signed-out user has no dashboard card anyway, and gating on
  // getSession() (local cookie read, no network) avoids a guaranteed 401 in the browser
  // console every time a guest opens the menu.
  // NOTE (authz-rls-02, 2026-07-27): staff_salon_id was previously included in this gate,
  // promising a "Dashboard" entry to linked staff accounts. middleware.ts's dashboard guard
  // only ever allows role === "salon_owner" or "admin" (staff is not a legal profiles.role
  // value today, see profiles_role_check), so a staff account that clicked this entry was
  // redirected straight back to the homepage. Do not re-add staff_salon_id here until
  // middleware.ts actually grants staff a real (even if scoped) dashboard route.
  const [canDash, setCanDash] = React.useState(false);
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    createBrowserSupabaseClient()
      .auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled || !session) return;
        return fetch("/api/profile")
          .then((r) => (r.ok ? r.json() : null))
          .then((p) => {
            if (cancelled) return;
            setCanDash(
              !!p && (p.role === "admin" || p.role === "salon_owner" || !!p.salon_id),
            );
          });
      })
      .catch((err) => console.error("[MobileMenu] dashboard-access check failed:", err));
    return () => { cancelled = true; };
  }, [open]);

  // Body scroll lock + Esc handler. Mirrors MorphingDialog's escape behavior.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const handleCityPick = (slug: CitySlug) => {
    if (slug === currentCity) {
      onClose();
      return;
    }
    setPersistedCity(slug);
    onClose();
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Hauptmenü"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed inset-0 z-40 md:hidden",
            "bg-s-bg-base overflow-y-auto",
            // V3-D171 (2026-05-26): pt-32 → pt-20. Header now fades out
            // its Solen logo + Bell icon when menu opens (only the X
            // close stays visible), so we only need to clear that single
            // 44px button + ~36px margin. Content sits closer to the
            // top edge → tighter, less wasted vertical space.
            // V3-D352: pt-20 -> pt-16. Header is transparent while the menu is open
            // (only the X floats top-right), so content can sit higher / more balanced.
            // FIX 3 (2026-08-01): pt-16 (64px) was clearance for HEADER'S hamburger-to-X
            // button, which is now hidden on mobile on every categorySegment/showCategoryChrome
            // route (Header.tsx's utility row gets `max-md:hidden` there, 2026-08-01 owner
            // change), so that clearance reasoning no longer holds and the panel's own first
            // item (the city pill) was sitting at y=64 with nothing above it. This panel now
            // owns its own close X (FIX 2, in the same row as the city pill below), so pt only
            // needs to clear the safe-area inset, not a phantom 64px button.
            "pt-[max(16px,env(safe-area-inset-top))] pb-16 px-5",
            "[-webkit-overflow-scrolling:touch]",
          )}
        >
          <div className="mx-auto w-full max-w-[480px]">
            {/* ─── City selector (V3-D168) — h2 "Stadt" removed V3-D171
                per user "remove the stadt thing no need". The flag-chip
                button is self-evident; the label was noise. */}
            {/* FIX 2 (2026-08-01): the close X now shares this row (right side), the
                panel's own reading-order top, instead of depending on Header.tsx's
                hamburger-to-X (hidden on mobile for every showCategoryChrome route, see
                the FIX 3 note on the panel's pt above, which is why this menu had no
                visible way to close). Anatomy per project CLAUDE.md copy-economy rule 5:
                a 38px circled X, bordered circle, white background, never a bare X. */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => setCityDropdownOpen((v) => !v)}
                  aria-expanded={cityDropdownOpen}
                  aria-haspopup="listbox"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full",
                    "border border-s-border bg-s-bg-surface",
                    "py-1.5 pl-1.5 pr-4 font-body text-[14px] font-semibold text-s-ink",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
                    "transition-colors duration-150 ease-glide",
                    "active:bg-s-bg-sunken",
                  )}
                >
                  <span
                    aria-hidden
                    className="block h-6 w-6 shrink-0 rounded-full"
                    style={swissFlagStyle}
                  />
                  <span>{getCityName(currentCity, locale, activeCities.find((c) => c.slug === currentCity))}</span>
                </button>

                {cityDropdownOpen && (
                <div
                  role="listbox"
                  aria-label="Stadt wählen"
                  className="mt-2 overflow-hidden rounded-[14px] border border-s-border bg-s-bg-surface shadow-[0_4px_14px_rgba(26,18,9,0.06)]"
                >
                  {activeCities.map((c) => {
                    const isActive = c.slug === currentCity;
                    return (
                      <button
                        key={c.slug}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => handleCityPick(c.slug)}
                        className={cn(
                          "block w-full px-4 py-3 text-left font-body text-[14px]",
                          "transition-colors active:bg-s-bg-sunken",
                          isActive ? "font-bold text-s-ink" : "font-medium text-s-ink",
                        )}
                      >
                        {getCityName(c.slug, locale, c)}
                      </button>
                    );
                  })}
                </div>
              )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={tSD("closeMenu")}
                className={cn(
                  "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full",
                  "border border-s-border bg-white text-s-ink",
                  "transition-transform duration-150 ease-glide active:scale-[0.94] active:duration-[80ms]",
                  "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
                )}
              >
                <X size={19} strokeWidth={2.2} aria-hidden />
              </button>
            </div>

            {/* ─── Schnellzugriff (V3-D354, Variant B per user pick): a 2x2
                quick-action grid of personal shortcuts (echoes the search "Fuer
                dich" row), then utility rows below. Replaces the 3 plain text
                rows (user: the menu "looks really dry"). Every destination is a
                route verified to exist (no 404s). i18n via ui.mobileMenu. ─── */}
            {/* V3: operator Dashboard entry — owners / managers / admins only (role-gated). */}
            {canDash && (
              <Link
                href={`/${locale}/dashboard`}
                onClick={onClose}
                className={cn(
                  "mb-4 flex items-center justify-between gap-4",
                  "rounded-[16px] bg-s-bg-surface p-4",
                  "shadow-[0_1px_3px_rgba(26,18,9,0.04)]",
                  // transform must be in the transition list or the press scale never animates
                  "transition-[transform,box-shadow] duration-200 ease-glide",
                  "hover:shadow-[0_4px_14px_rgba(26,18,9,0.08)]",
                  "active:scale-[0.98] active:duration-[80ms]",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-ink text-white">
                    <LayoutDashboard size={17} strokeWidth={1.9} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-body text-[15px] font-bold text-s-ink">Dashboard</span>
                    <span className="mt-0.5 block font-body text-[12px] font-medium text-s-ink-2">Salon verwalten</span>
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink-2" aria-hidden />
              </Link>
            )}

            <p className="mb-2 ml-1 font-body text-[12px] font-semibold uppercase tracking-[0.05em] text-s-ink-2">
              {t("quickAccess")}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {/* V3-D378: Profil promoted into the quick-access grid (swapped with Geschenkkarten). */}
              <QuickTile
                href={`/${locale}/profile`}
                label={tNav("account")}
                icon={<User size={22} strokeWidth={2.2} aria-hidden />}
                onClick={onClose}
              />
              <QuickTile
                href={`/${locale}/profile/stamps`}
                label={t("loyalty")}
                icon={<Award size={22} strokeWidth={2.2} aria-hidden />}
                onClick={onClose}
              />
              <QuickTile
                href={`/${locale}/profile/referral`}
                label={t("invite")}
                icon={<Users size={22} strokeWidth={2.2} aria-hidden />}
                onClick={onClose}
              />
              <QuickTile
                href={`/${locale}/help`}
                label={t("help")}
                icon={<HelpCircle size={22} strokeWidth={2.2} aria-hidden />}
                onClick={onClose}
              />
            </div>

            {/* Utility rows below the grid: sign-in (primary), Warum Solen,
                language. Each row carries a leading icon (kills the "dry" feel). */}
            <div className="mt-3 overflow-hidden rounded-[18px] bg-s-bg-surface shadow-[0_1px_3px_rgba(26,18,9,0.04)]">
              {/* Gift cards (Geschenkkarten) HIDDEN from customers (owner, 2026-06-14)
                  in favour of a Solen-wide loyalty card. Restore this MenuRow to re-enable. */}
              {!loggedIn && (
                <MenuRow
                  href={`/${locale}/auth/login`}
                  label={t("signIn")}
                  icon={<LogIn size={20} strokeWidth={2.2} aria-hidden />}
                  primary
                  onClick={onClose}
                />
              )}
              <MenuRow
                href={`/${locale}/warum-solen`}
                label={t("whySolen")}
                icon={<Info size={20} strokeWidth={2.2} aria-hidden />}
                onClick={onClose}
              />
              {/* Language — real locale switch via the existing LanguageSwitcher (sets the
                  NEXT_LOCALE cookie + swaps the path segment). Was a fake MenuRow that just
                  linked to its own homepage and never changed language (audit #13). */}
              <div className="flex w-full items-center justify-between gap-3 px-4 py-3.5">
                <span className="flex items-center gap-3 text-[15px] font-medium text-s-ink">
                  <Globe size={20} strokeWidth={2.2} aria-hidden />
                  {t("language")}
                </span>
                <LanguageSwitcher locale={locale} variant="sheet" />
              </div>
            </div>

            {/* ─── Stöbern (categories) ─── */}
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold tracking-[-0.02em] text-s-ink mt-5 mb-2">
              Stöbern
            </h2>
            <div
              className={cn(
                "-mx-5 px-5 flex gap-2 overflow-x-auto pb-1",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "[-webkit-overflow-scrolling:touch]",
              )}
            >
              {CATEGORIES.map((c) => (
                <Link
                  key={c.href}
                  href={`/${locale}${c.href}`}
                  onClick={onClose}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full bg-s-bg-surface",
                    "border border-s-border",
                    "px-4 py-2.5 font-body text-[13px] font-semibold text-s-ink",
                    "transition-colors duration-150 ease-glide",
                    "active:bg-s-bg-sunken",
                  )}
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {/* ─── Für Stores ─── */}
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold tracking-[-0.02em] text-s-ink mt-5 mb-2">
              Für Salons
            </h2>
            <Link
              href={`/${locale}/partner`}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between gap-4",
                // V3-D168: padding p-5 → p-4 (tighter Fresha-style row)
                "rounded-[16px] bg-s-bg-surface p-4",
                "shadow-[0_1px_3px_rgba(26,18,9,0.04)]",
                // transform must be in the transition list or the press scale never animates
                "transition-[transform,box-shadow] duration-200 ease-glide",
                "hover:shadow-[0_4px_14px_rgba(26,18,9,0.08)]",
                "active:scale-[0.98] active:duration-[80ms]",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[15px] font-bold text-s-ink">
                  Werden Sie Solen-Partner
                </span>
                <span className="mt-0.5 block font-body text-[12px] font-medium text-s-ink-2">
                  In 60 Sekunden eintragen, kostenlos starten
                </span>
              </span>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-ink text-white">
                <ArrowRight size={16} strokeWidth={1.9} aria-hidden />
              </span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuRow({
  href,
  label,
  primary,
  icon,
  isLast,
  onClick,
}: {
  href: string;
  label: string;
  primary?: boolean;
  icon?: React.ReactNode;
  isLast?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        // V3-D168: compactness — px-5 py-[18px] → px-4 py-3.5
        // (~14px vertical), text-[16px] → text-[15px]. Matches Fresha
        // row density. Border kept for separator clarity.
        "flex w-full items-center justify-between gap-3 px-4 py-3.5",
        !isLast && "border-b border-s-border",
        "transition-colors duration-150 ease-glide active:bg-s-bg-sunken",
        "font-body text-[15px]",
        primary ? "font-bold text-s-ink" : "font-semibold text-s-ink",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon && <span className="text-s-ink-2">{icon}</span>}
        {label}
      </span>
      <ChevronRight
        size={18}
        strokeWidth={1.9}
        className={primary ? "text-s-ink" : "text-s-ink-2"}
        aria-hidden
      />
    </Link>
  );
}

// V3-D354: a quick-action tile for the Schnellzugriff 2x2 grid (Variant B).
// Icon top-left, label below - the same square-tile family as the search
// "Fuer dich" shortcuts, sized for a 2-column grid.
function QuickTile({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex flex-col gap-2.5 rounded-[16px] border border-s-border bg-s-bg-surface p-3.5",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        "transition-[transform,box-shadow] duration-150 ease-glide",
        "hover:shadow-[0_4px_14px_rgba(26,18,9,0.08)] active:scale-[0.98] active:duration-[80ms]",
        "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
      )}
    >
      <span className="text-s-ink">{icon}</span>
      <span className="font-body text-[13.5px] font-semibold leading-tight text-s-ink">
        {label}
      </span>
    </Link>
  );
}
