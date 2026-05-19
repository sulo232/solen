"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

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
 *   /entdecken, /business/signup
 */

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  locale: string;
}

const CATEGORIES: { label: string; href: string }[] = [
  { label: "Coiffeur",       href: "/coiffeur"   },
  { label: "Barbershop",     href: "/barbershop" },
  { label: "Nails",          href: "/nails"      },
  { label: "Spa & Wellness", href: "/spa"        },
  { label: "Entdecken",      href: "/entdecken"  },
];

export default function MobileMenu({ open, onClose, locale }: MobileMenuProps) {
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
            "pt-[88px] pb-16 px-5",
            "[-webkit-overflow-scrolling:touch]",
          )}
        >
          <div className="mx-auto w-full max-w-[480px]">
            {/* ─── Für Kund:innen ─── */}
            <h2 className="font-display text-[clamp(28px,7.5vw,36px)] font-extrabold tracking-[-0.025em] text-s-ink mb-3.5">
              Für Kund:innen
            </h2>
            <div className="overflow-hidden rounded-[18px] bg-s-bg-surface shadow-[0_1px_3px_rgba(26,18,9,0.04)]">
              <MenuRow
                href={`/${locale}/auth/login`}
                label="Anmelden oder Registrieren"
                primary
                onClick={onClose}
              />
              <MenuRow
                href={`/${locale}/help`}
                label="Hilfe & Support"
                onClick={onClose}
              />
              <MenuRow
                href={`/${locale}`}
                label="Deutsch"
                icon={<Globe size={20} strokeWidth={1.75} aria-hidden />}
                onClick={onClose}
                isLast
              />
            </div>

            {/* ─── Stöbern (categories) ─── */}
            <h2 className="font-display text-[clamp(28px,7.5vw,36px)] font-extrabold tracking-[-0.025em] text-s-ink mt-7 mb-3.5">
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
                    "border border-s-ink/[0.06]",
                    "px-4 py-2.5 font-body text-[13px] font-semibold text-s-ink",
                    "transition-colors duration-150 ease-glide",
                    "active:bg-s-ink/[0.04]",
                  )}
                >
                  {c.label}
                </Link>
              ))}
            </div>

            {/* ─── Für Salons ─── */}
            <h2 className="font-display text-[clamp(28px,7.5vw,36px)] font-extrabold tracking-[-0.025em] text-s-ink mt-7 mb-3.5">
              Für Salons
            </h2>
            <Link
              href={`/${locale}/business/signup`}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between gap-4",
                "rounded-[18px] bg-s-bg-surface p-5",
                "shadow-[0_1px_3px_rgba(26,18,9,0.04)]",
                "transition-shadow duration-200 ease-glide",
                "hover:shadow-[0_4px_14px_rgba(26,18,9,0.08)]",
                "active:scale-[0.99] active:duration-[80ms]",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-body text-[17px] font-bold text-s-ink">
                  Werde Solen-Partner
                </span>
                <span className="mt-1 block font-body text-[13px] font-medium text-s-ink-3">
                  In 60 Sekunden eintragen — kostenlos starten
                </span>
              </span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-brand text-white">
                <ArrowRight size={18} strokeWidth={2.4} aria-hidden />
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
        "flex w-full items-center justify-between gap-3 px-5 py-[18px]",
        !isLast && "border-b border-s-ink/[0.06]",
        "transition-colors duration-150 ease-glide active:bg-s-ink/[0.03]",
        "font-body text-[16px]",
        primary ? "font-bold text-s-brand" : "font-semibold text-s-ink",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {icon && <span className="text-s-ink-2">{icon}</span>}
        {label}
      </span>
      <ChevronRight
        size={18}
        strokeWidth={2}
        className={primary ? "text-s-brand" : "text-s-ink-3"}
        aria-hidden
      />
    </Link>
  );
}
