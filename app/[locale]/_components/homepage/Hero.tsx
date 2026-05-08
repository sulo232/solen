/**
 * Homepage hero — V3 (post V2-D26 typography + V2-D15-3 brand pivot).
 *
 * Spec:
 *   - LIVE_TRUTH §13 hero
 *   - LIVE_TRUTH §5g atmosphere wash (softened hero variant)
 *   - LIVE_TRUTH §5 typography (Cooper BT display + ITC Avant Garde body)
 *   - LIVE_TRUTH §0d.4 mobile-first (centered on mobile, left-aligned desktop)
 *
 * Mockup: public/solen-v2-homepage.html lines ~1010-1064.
 *
 * Server component. Search bar is **visual-only** for commit #1; interactions
 * (Was/Wo/Wann segment sheets, autocomplete, submit) wire in a follow-up
 * commit once Phase 1 §F.x sheet/dropdown patterns are wired.
 *
 * TODO:
 *   - i18n via next-intl `useTranslations("home.hero")` once de/en/fr/it
 *     messages are updated for the new V3 copy. Existing keys in messages/
 *     have legacy copy ("Beauty Buchungsplattform · Schweiz" etc.) — left
 *     hardcoded here in DE for now to ship the visual.
 *   - Wire search bar interactions (Phase 1).
 *   - Body-wide atmosphere wash (currently hero-only — body wash is a
 *     separate page-level concern, not Hero's responsibility).
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* §5g atmosphere wash — softened hero variant.
          5 layered radial + 1 linear gradient per LIVE_TRUTH §5g recipe. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 65% 55% at 72% 28%, rgba(202, 232, 255, 0.42) 0%, transparent 60%),
            radial-gradient(ellipse 58% 50% at 22% 78%, rgba(194, 240, 241, 0.38) 0%, transparent 65%),
            radial-gradient(ellipse 55% 65% at 100% 105%, rgba(0, 88, 152, 0.14) 0%, transparent 55%),
            radial-gradient(ellipse 45% 55% at 0% -5%, rgba(0, 88, 152, 0.12) 0%, transparent 50%),
            linear-gradient(180deg, transparent 65%, rgba(3, 30, 72, 0.03) 100%)
          `,
        }}
      />

      {/* pt accounts for the absolute V3 Header (floats over wash):
          mobile = ~68px header + 32px breathing = 100px (pt-25)
          desktop = ~80px header + 48px breathing = 128px (pt-32)
          tailwind doesn't have pt-25, use arbitrary value. */}
      <div className="relative mx-auto flex max-w-[1280px] flex-col px-8 pt-[100px] pb-20 md:pt-32 max-md:items-center max-md:text-center">
        <div className="max-md:w-full">
          {/* Eyebrow with brand-colored dot before. whitespace-nowrap prevents
              awkward 2-line wrap on narrow desktop widths (~1024px). */}
          <span className="font-body mb-[18px] inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.18em] text-s-ink-3 before:block before:h-[6px] before:w-[6px] before:rounded-full before:bg-s-brand before:content-['']">
            Beauty in der Schweiz
          </span>

          {/* H1 — Cooper BT 900, clamped 40-96px, brand color on emphasized word.
              V2-D15: italic banned. The emphasized "buchen" uses brand color, not italic. */}
          <h1 className="font-display mb-6 text-[clamp(40px,7vw,96px)] font-black leading-[0.95] tracking-[-0.025em] text-s-ink">
            Schöner aussehen, schneller{" "}
            <span className="text-s-brand">buchen</span>.
          </h1>

          {/* Deck */}
          <p className="font-body mb-8 max-w-[520px] text-[17px] leading-[1.55] text-s-ink-2 max-md:mx-auto">
            Vom Coiffeur in der Steinenvorstadt bis zur Massage am Rheinufer —
            die besten Beauty-Adressen der Schweiz, alle in einer App.{" "}
            <a
              href="#"
              className="font-semibold text-s-brand underline underline-offset-[3px]"
            >
              So funktioniert&apos;s →
            </a>
          </p>
        </div>

        <SearchBar />
      </div>
    </section>
  );
}

/**
 * Hero search bar — 3 segments (Was / Wo / Wann) + submit.
 *
 * Mobile (default, < 768px): stacked vertical card. Each row has icon + label + value.
 * Desktop (≥ 768px): horizontal pill. Rows flex-row, fully-rounded container.
 *
 * Visual-only for now. Each row will become a button that opens a sheet/dropdown
 * in Phase 1 (Was = service search autocomplete, Wo = location picker, Wann =
 * date+time picker).
 */
function SearchBar() {
  return (
    <div
      className="
        flex w-full max-w-[540px] flex-col rounded-2xl border border-black/5 bg-white p-2
        shadow-[0_1px_3px_rgba(50,47,44,0.04),0_4px_12px_rgba(50,47,44,0.04)]
        max-md:mx-auto
        md:max-w-none md:flex-row md:items-stretch md:rounded-full md:p-[6px_6px_6px_8px]
        md:shadow-[0_1px_3px_rgba(50,47,44,0.04),0_8px_24px_rgba(50,47,44,0.08)]
      "
    >
      {/* WAS — active by default to telegraph affordance */}
      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <circle cx={11} cy={11} r={7} />
            <path d="m21 21-4.3-4.3" />
          </svg>
        }
        label="Was"
        value="Service oder Salon"
        isPlaceholder
        isActive
        isFirst
      />

      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
            <circle cx={12} cy={10} r={3} />
          </svg>
        }
        label="Wo"
        value="Für deine Stadt"
        isPlaceholder
      />

      <SearchRow
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
            <rect x={3} y={4} width={18} height={18} rx={2} />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        }
        label="Wann"
        value="Heute · jederzeit"
      />

      {/* Submit — ink bg, hover brand. Full-width on mobile, pill on right desktop. */}
      <button
        type="button"
        className="
          font-body shrink-0 rounded-full border-0 bg-s-ink p-4 font-semibold text-white transition-colors
          hover:bg-s-brand
          md:px-7
        "
      >
        Solen durchsuchen
      </button>
    </div>
  );
}

interface SearchRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isPlaceholder?: boolean;
  isActive?: boolean;
  isFirst?: boolean;
}

function SearchRow({
  icon,
  label,
  value,
  isPlaceholder,
  isActive,
  isFirst,
}: SearchRowProps) {
  // Active row gets warm-cream background per V3 §1 substrate active state
  // (mockup uses #FFF4E8 = s-bg-active token).
  // Mobile: each row is bordered top (except first) via border-b on previous-sibling.
  // Desktop: no borders between rows; all rounded-full.
  return (
    <button
      type="button"
      className={`
        group flex shrink-0 cursor-pointer items-center gap-3 rounded-[10px] p-[14px_16px] text-left
        transition-colors hover:bg-s-bg-sunken
        ${isActive ? "bg-s-bg-active" : ""}
        ${!isFirst ? "border-t border-black/5 max-md:border-t md:border-t-0" : ""}
        md:flex-1 md:rounded-full md:border-t-0 md:p-[14px_22px]
      `}
    >
      <span className="shrink-0 text-s-ink-2">{icon}</span>
      {/* Label visible on mobile (stacked-card layout) for clarity, hidden on
          desktop (horizontal pill) where the icon + value alone are enough.
          Hiding desktop labels reclaims ~70px per segment so values aren't
          truncated to "Ser..." and "Heut..." at common laptop widths. */}
      <span className="font-body w-14 shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-s-ink-3 md:hidden">
        {label}
      </span>
      <span
        className={`
          font-body min-w-0 flex-1 truncate text-base
          ${isPlaceholder ? "font-normal text-s-ink-3" : "font-medium text-s-ink"}
        `}
      >
        {value}
      </span>
    </button>
  );
}
