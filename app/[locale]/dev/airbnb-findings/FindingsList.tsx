"use client";

// exists-check: `npm run exists airbnb-findings` = 0. Read first and NOT duplicated:
// `app/[locale]/dev/airbnb-01-home/` (the home rail comparison, one screen, with live phones),
// `app/[locale]/dev/airbnb-02-search/` (the search page comparison), and the nine
// `_design-system/references/airbnb--*.md` documents. This page is the LIST of everything the wide
// council found across all screens, which none of those hold.
//
// measure-ok: every number on this page came from the council's own live measurements at 390x844
// on 2026-08-12, both sides, and is reproduced verbatim from its structured output rather than
// retyped. The generated data file says where it came from.

import * as React from "react";
import { FINDINGS, type Finding } from "./findings";

const SCREEN_LABEL: Record<string, string> = {
  "/de": "Home",
  "/de/search": "Search results",
  "/de/salon/[slug]": "Salon page",
  "/de/profile": "Profile",
  "/de/profile/bookings": "Your bookings",
  "/de/auth/login": "Sign in",
  "/de/auth/register": "Sign up",
  "/de/inspo/saved": "Saved looks",
  "/de/queue/[token]": "Walk-in tracker",
  "/de/partner": "For salons",
  "/de/help": "Help",
  "every customer screen": "Everywhere",
};

function shortScreen(s: string) {
  const first = s.split(",")[0].split(" (")[0].trim();
  return SCREEN_LABEL[first] ?? first;
}

function Row({ f, n }: { f: Finding; n: number }) {
  const clash = f.collidesWith && f.collidesWith.toLowerCase() !== "none";
  return (
    <li className="rounded-[16px] border border-s-border p-4">
      <p className="text-[14px] font-semibold leading-snug text-s-ink">
        {n}. {f.element}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-s-ink">{f.gap}</p>
      <dl className="mt-3 grid grid-cols-[86px_1fr] gap-x-3 gap-y-1 text-[13px] leading-relaxed">
        <dt className="text-s-ink-2">Theirs</dt>
        <dd className="text-s-ink">{f.airbnb}</dd>
        <dt className="text-s-ink-2">Ours</dt>
        <dd className="text-s-ink">{f.solen}</dd>
        <dt className="text-s-ink-2">To do</dt>
        <dd className="text-s-ink">{f.proposal}</dd>
        <dt className="text-s-ink-2">Costs</dt>
        <dd className="text-s-ink-2">{f.cost}</dd>
      </dl>
      {clash ? (
        <p className="mt-3 rounded-[12px] bg-s-bg-sunken p-3 text-[13px] leading-relaxed text-s-ink">
          <span className="font-semibold">Touches a rule you set: </span>
          {f.collidesWith}
        </p>
      ) : null}
    </li>
  );
}

export default function FindingsList() {
  const groups = React.useMemo(() => {
    const map = new Map<string, Finding[]>();
    for (const f of FINDINGS) {
      const k = shortScreen(f.screen);
      map.set(k, [...(map.get(k) ?? []), f]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  const [open, setOpen] = React.useState<string | null>(groups[0]?.[0] ?? null);

  return (
    <div className="mt-8">
      <div className="mb-6 flex flex-wrap gap-2">
        {groups.map(([name, list]) => (
          <button
            key={name}
            onClick={() => setOpen(name === open ? null : name)}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] transition-colors ${
              name === open
                ? "border-s-bg-sunken bg-s-bg-sunken font-semibold text-s-ink"
                : "border-s-border bg-white font-medium text-s-ink"
            }`}
          >
            {name}
            <span className="text-s-ink-2">{list.length}</span>
          </button>
        ))}
      </div>

      {groups
        .filter(([name]) => open === null || name === open)
        .map(([name, list]) => (
          <section key={name} className="mb-10">
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-s-ink">{name}</h2>
            <ol className="mt-3 space-y-3">
              {list.map((f, i) => (
                <Row key={`${name}-${i}`} f={f} n={i + 1} />
              ))}
            </ol>
          </section>
        ))}
    </div>
  );
}
