/**
 * Step — V3-D218 (2026-05-26, /business rebuild).
 *
 * 3-step explainer card primitive for the "Wie es funktioniert" section
 * on /business. Extracted from inline JSX in `business/page.tsx`.
 *
 * Visual signature: rounded-card · bg-s-bg-sunken · accent numeral
 * ("01" / "02" / "03") at 30% opacity to read as semi-decorative
 * "data emphasis" per SOURCE.md §2.1 (royal-blue s-accent use case).
 *
 * Server component — no client-side state or motion. (Entrance animation
 * via the parent's scroll-trigger if needed; the card itself is static.)
 *
 * Typography:
 *   - numeral: Inter Tight 800, 40-48px, leading-none, tracking -0.03em, accent/30
 *   - h3:     Inter Tight 700, clamp(18,2vw,23), tracking -0.03em
 *   - body:   Hanken Grotesk 300, 14px, leading 1.55
 */

export interface StepProps {
  n: string;      // numeric label like "01", "02", "03" — display as-is
  title: string;  // step name, e.g. "Anmelden"
  copy: string;   // short body description
}

export function Step({ n, title, copy }: StepProps) {
  return (
    <li className="rounded-card bg-s-bg-sunken p-7 md:p-8">
      <p className="font-display text-[40px] font-semibold leading-none tracking-[-0.03em] text-s-accent/30 tabular-nums md:text-[48px]">
        {n}
      </p>
      <h3 className="mt-5 font-display text-[clamp(16px,1.6vw,18px)] font-semibold tracking-[-0.03em] text-s-ink">
        {title}
      </h3>
      <p className="mt-2 font-body text-[14px] font-normal leading-[1.55] text-s-ink-2">
        {copy}
      </p>
    </li>
  );
}

export default Step;
