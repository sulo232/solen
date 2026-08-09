/**
 * /dev/decisions/reviewed , every open decision, reviewed once, with a verdict on each.
 *
 * Owner, 2026-08-09: "for 144 can u spon up alot of subagents and review each one and like gimme
 * ur opinion and kill ones we dont need etc", and then, asked what the agents should kill on their
 * own: "Nothing, show me all 163" and "Everything that survived, however many". So nothing is
 * filtered here. Every line gets a verdict and he decides what dies.
 *
 * 13 agents read 163 scraped lines from `_plans/**` and returned one of three verdicts each:
 *   KEEP , a real fork only he can settle (taste, scope, money, brand)
 *   MINE , a real open question, but mine to answer, not his
 *   KILL , not a live decision: a status row, a heading, already settled, or internal tooling
 *
 * WHY A SNAPSHOT AND NOT A LIVE SCAN. The sibling page `/dev/decisions` reads the plan files on
 * every request precisely so it cannot rot, and that is the right design for a LIST. A verdict is
 * a judgement made at a point in time by a named process, and pretending it re-derives itself
 * would be a lie about where it came from. So this reads a written result, and the date is on it.
 *
 * exists-check: `npm run exists decisions` = /[locale]/dev/decisions (the live list, extended
 * here rather than rebuilt) plus one unrelated graveyard line. The list page keeps its job; this
 * adds the verdict layer it never had.
 *
 * Dev-only, notFound() in production, matching every other /dev/* route.
 */
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

type Row = {
  ref: string;
  verdict: "KEEP" | "MINE" | "KILL";
  reason?: string;
  question?: string;
  options?: string[];
  recommendation?: string;
  cost_if_ignored?: string;
  checked?: "DONE" | "NOT_DONE" | "MOOT" | "UNCLEAR";
  effort?: string;
};

function load(): { reviewed: string; rows: Row[] } {
  const p = path.join(process.cwd(), "_plans", "_data", "decisions-triage.json");
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { reviewed: "", rows: [] };
  }
}

export default function ReviewedDecisionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { reviewed, rows } = load();
  const keep = rows.filter((r) => r.verdict === "KEEP");
  const mine = rows.filter((r) => r.verdict === "MINE");
  const kill = rows.filter((r) => r.verdict === "KILL");

  return (
    <main className="mx-auto max-w-[720px] px-[18px] py-7 pb-16">
      <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
        All {rows.length}, reviewed
      </h1>
      <p className="mt-2 text-[15px] text-s-ink-2">
        Every open decision, read once by a separate agent, with what I think each one is. Nothing
        is hidden: the dead ones are listed too, so you can see what I want to throw away.
      </p>
      <a href="/de/dev/decisions" className="mt-2 inline-block text-[15px] text-s-accent hover:underline">
        The live list this came from
      </a>

      <div className="mt-5 flex flex-wrap gap-2 text-[13px] text-s-ink-2">
        <span className="rounded-full border border-s-border bg-white px-3 py-1.5">
          <span className="tabular-nums text-s-ink">{keep.length}</span> need you
        </span>
        <span className="rounded-full border border-s-border bg-white px-3 py-1.5">
          <span className="tabular-nums text-s-ink">{mine.length}</span> mine to do
        </span>
        <span className="rounded-full border border-s-border bg-white px-3 py-1.5">
          <span className="tabular-nums text-s-ink">{kill.length}</span> dead
        </span>
        {reviewed ? (
          <span className="rounded-full border border-s-border bg-white px-3 py-1.5">
            read {reviewed}
          </span>
        ) : null}
      </div>

      <section className="mt-9">
        <h2 className="text-[20px] font-semibold text-s-ink">Needs you</h2>
        <p className="mt-1 text-[15px] text-s-ink-2">
          Real forks. Nothing I measure or read settles these.
        </p>
        <ol className="mt-4 space-y-5">
          {keep.map((r) => (
            <li key={r.ref} className="rounded-card border border-s-border bg-white p-4">
              <p className="text-[15px] text-s-ink">{r.question || r.reason}</p>
              {r.options?.length ? (
                <ul className="mt-3 space-y-1.5 text-[15px] text-s-ink">
                  {r.options.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              ) : null}
              {r.recommendation ? (
                <p className="mt-3 text-[15px] text-s-ink-2">My pick: {r.recommendation}</p>
              ) : null}
              {r.cost_if_ignored ? (
                <p className="mt-2 text-[13px] text-s-ink-2">
                  If it stays unanswered: {r.cost_if_ignored}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-semibold text-s-ink">Mine to do</h2>
        <p className="mt-1 text-[15px] text-s-ink-2">
          Real open questions that I was handing you instead of answering. Tell me if any of these
          is actually yours.
        </p>
        <ul className="mt-4 space-y-3">
          {mine.map((r) => (
            <li key={r.ref} className="rounded-card border border-s-border bg-white p-4">
              <p className="text-[15px] text-s-ink">{r.recommendation || r.reason}</p>
              {r.recommendation && r.reason ? (
                <p className="mt-1.5 text-[13px] text-s-ink-2">{r.reason}</p>
              ) : null}
              {r.checked ? (
                <p className="mt-2 text-[13px] text-s-ink-2">
                  {r.checked === "DONE"
                    ? "Already done in an earlier session."
                    : r.checked === "MOOT"
                      ? "No longer applies, that screen was rebuilt."
                      : r.checked === "UNCLEAR"
                        ? "Could not settle it by reading the code."
                        : `Still to do${r.effort ? `, ${r.effort}` : ""}.`}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-[20px] font-semibold text-s-ink">Dead</h2>
        <p className="mt-1 text-[15px] text-s-ink-2">
          What I want to throw away, with the reason for each. Anything you disagree with, say the
          number and it comes back.
        </p>
        <ol className="mt-4 space-y-2 text-[13px] text-s-ink-2">
          {kill.map((r, i) => (
            <li key={r.ref} className="border-b border-s-border pb-2">
              <span className="mr-2 tabular-nums text-s-ink">{i + 1}.</span>
              {r.reason}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
