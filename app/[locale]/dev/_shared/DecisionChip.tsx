/**
 * Exists-check: `npm run exists decision-mockup` = 1 REMOVED hit (bundles, unrelated,
 * not this surface). No existing "A/B decision label" primitive found via
 * `npm run exists TabPill` (closest neutral pill primitive, but it's a selectable
 * filter chip, not a static label) so this tiny static label is net-new.
 *
 * Shared label pair for the 5 decision-mockup routes: a neutral "A"/"B" chip + the
 * literal value under test + a one-line caption naming the decision. Kept in one
 * place so every route's chip/caption markup is byte-identical, and so each route's
 * A vs B columns differ ONLY in the decision value passed in, not in surrounding markup.
 */
export function DecisionChip({ letter, value }: { letter: "A" | "B"; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-s-border bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink">
      <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-s-ink text-[12px] font-bold text-white">
        {letter}
      </span>
      {value}
    </span>
  );
}

export function DecisionCaption({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[12px] leading-[1.4] text-s-ink-2">{children}</p>;
}

export function DecisionHeader({
  title,
  decision,
}: {
  title: string;
  decision: string;
}) {
  return (
    <div className="border-b border-s-border px-4 pb-4 pt-6">
      <h1 className="font-display text-[18px] font-semibold tracking-[-0.01em] text-s-ink">
        {title}
      </h1>
      <p className="mt-1 text-[13px] leading-[1.4] text-s-ink-2">{decision}</p>
    </div>
  );
}
