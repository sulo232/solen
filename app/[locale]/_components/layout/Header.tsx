import Link from "next/link";
import { Menu } from "lucide-react";

/**
 * V3 Header — minimal hamburger-only chrome (LIVE_TRUTH §12).
 *
 * Replaces legacy `components-legacy/layout/Header.tsx` which had a duplicate
 * search bar (Was/Wo/Wann pill) AND a profile avatar button. Per user
 * feedback (2026-05-09): drop both. Hero already owns the search bar; the
 * profile dropdown belongs in Phase 3 §AC.7 (avatar dropdown menu).
 *
 * Anatomy:
 *   ┌─────────────────────────────────────────┐
 *   │  Solen·       (glass bg over wash)   ☰  │
 *   └─────────────────────────────────────────┘
 *
 * Position: `absolute top-0`, z-50. Floats over the page so the hero's
 * §5g atmosphere wash bleeds through the glass background. This is why
 * Hero gets a tall padding-top — to leave room for this floating header.
 *
 * Accessibility:
 *   - `<header>` landmark
 *   - Logo Link uses native `<a>` semantics via next/link
 *   - Hamburger button has aria-label "Menü öffnen"
 *   - Hit area 44×44 per LIVE_TRUTH §11 hit targets
 *
 * NOT in this commit:
 *   - Hamburger drawer/sheet wiring (Phase 1 — uses §F.3 Sheet primitive)
 *   - Desktop nav links (Coiffeur / Barbershop / etc.) — defer until v1
 *     decision on whether to keep mobile-only nav vs add desktop. User
 *     pick: simple = mobile-only for now.
 *   - Login/profile dropdown (Phase 3 §AC.7 once auth ships)
 *   - Locale switcher (defer to settings)
 */
export default function Header({ locale }: { locale: string }) {
  return (
    <header
      className="absolute left-0 right-0 top-0 z-50 border-b border-black/5"
      style={{
        background: "rgba(255, 255, 255, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-5 py-[18px] md:px-8 md:py-6">
        {/* Logo: "Solen" with brand-teal dot — Cooper BT 900 */}
        <Link
          href={`/${locale}`}
          aria-label="Solen — zur Startseite"
          className="font-display relative inline-flex items-baseline text-[28px] font-black leading-none tracking-[-0.025em] text-s-ink md:text-[32px] focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm"
        >
          Solen
          <span
            aria-hidden
            className="ml-[2px] inline-block h-2 w-2 rounded-full bg-s-brand"
            style={{ transform: "translateY(-2px)" }}
          />
        </Link>

        {/* Hamburger — opens nav sheet (Phase 1 wires §F.3 Sheet) */}
        <button
          type="button"
          aria-label="Menü öffnen"
          aria-expanded={false}
          className="-m-2 grid h-11 w-11 place-items-center rounded-lg p-2 text-s-ink transition-colors hover:bg-s-ink/5 focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2"
        >
          <Menu size={24} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </header>
  );
}
