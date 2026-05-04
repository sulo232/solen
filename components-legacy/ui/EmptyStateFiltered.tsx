"use client";

/**
 * EmptyStateFiltered — Q60 Treatment C (filter returned no matches, neutral).
 *
 * Smallest treatment. Utility recovery moment, NOT a brand moment — neutral bg,
 * grey magnifier, neutral outline button (NOT coral). Brand-coral on a "you typed
 * wrong" moment feels accusatory; this stays calm.
 *
 * Anatomy (locked per SOLEN_DESIGN.md §20 Q60):
 *   - neutral `#FAF7F3` bg (NOT amber, NOT coral)
 *   - small grey magnifier line-icon (`stroke=var(--ink3)`)
 *   - Anton "Keine Treffer" (or equivalent localized headline)
 *   - direct copy
 *   - neutral outline button (white bg, ink border, ink text — explicitly NOT coral)
 *
 * i18n: caller must localize all string props.
 */
interface EmptyStateFilteredProps {
  /** Anton uppercase headline, e.g. "Keine Treffer" */
  headline: string;
  /** Direct sub-copy, e.g. "Versuch andere Filter oder zeig alle Termine." */
  subCopy: string;
  /** Reset-button label, e.g. "Filter zurücksetzen" */
  resetLabel: string;
  /** Reset action (clears filters) */
  onReset: () => void;
  /** Optional icon override; defaults to magnifier */
  icon?: React.ReactNode;
  className?: string;
}

const DefaultMagnifier = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="text-s-ink/35"
  >
    <circle cx="44" cy="44" r="22" />
    <path d="m76 76-16-16" />
  </svg>
);

export default function EmptyStateFiltered({
  headline,
  subCopy,
  resetLabel,
  onReset,
  icon,
  className,
}: EmptyStateFilteredProps) {
  return (
    <div
      className={[
        "rounded-[10px] px-3 py-4 flex flex-col items-center text-center",
        className ?? "",
      ].join(" ")}
      style={{ background: "#FAF7F3" }}
    >
      <div className="mb-2 flex items-center justify-center">{icon ?? <DefaultMagnifier />}</div>
      <h3 className="font-heading text-[14px] sm:text-[16px] leading-[0.95] text-s-ink uppercase">
        {headline}
      </h3>
      <p className="mt-1.5 font-body text-[11px] leading-[1.4] text-s-ink/55 max-w-[260px]">
        {subCopy}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex items-center justify-center h-8 px-3.5 rounded-full bg-white border border-s-ink/20 text-s-ink font-body text-[10px] font-semibold transition-[transform,filter] duration-150 hover:border-s-ink/40 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2"
      >
        {resetLabel}
      </button>
    </div>
  );
}
