/**
 * /dev/decisions , the STANDING list of every decision waiting on the owner.
 *
 * Owner decision 11 (2026-08-07): "one page per substantial task, plus a standing page of every
 * open decision", and the complaint that made it urgent: "you don't even tell me at the end what's
 * left". He asked for this and it did not get built, which he then named as the laziness.
 *
 * The point is that it never rots. It reads `_plans/*.md` FROM DISK on every request and finds the
 * open-decision markers itself, the same anti-rot design as /dev/mockups. There is no hand-kept
 * list, so there is nothing to forget to update. A decision leaves this page exactly one way: the
 * line in the plan file stops being marked open.
 *
 * Dev-only, notFound() in production, matching every other /dev/* route.
 * exists-check: `npm run exists decisions` = 1 hit, a graveyard line about Chinese subagent
 * prompts, unrelated. No route, no component. The nearest existing thing is /dev/mockups (an
 * on-disk index) whose scan-and-group shape this reuses rather than reinvents.
 */
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";

const REPO_ROOT = process.cwd();
const PLANS = path.join(REPO_ROOT, "_plans");

/** Markers a plan file uses for something only the owner can settle. */
const OPEN_MARKER =
  /(OPEN,? owner-only|owner-only|BLOCKED on owner|OWNER DECISION NEEDED|owner decides|owner picks|awaiting owner|needs? an owner|PARKED|Open for you|waiting on you|your call)/i;

/** Already answered, so it must not show up here. */
const SETTLED = /(ANSWERED|RESOLVED|DECIDED|DROPPED|owner chose|owner picked|he picked|^- \[x\])/i;

type Item = { plan: string; text: string; line: number };

function collect(): Item[] {
  const out: Item[] = [];
  let names: string[] = [];
  try {
    names = fs.readdirSync(PLANS).filter((n) => n.toLowerCase().endsWith(".md"));
  } catch {
    return out;
  }
  for (const name of names) {
    const full = path.join(PLANS, name);
    let raw = "";
    try {
      raw = fs.readFileSync(full, "utf8");
    } catch {
      continue;
    }
    raw.split("\n").forEach((ln, i) => {
      if (!OPEN_MARKER.test(ln)) return;
      if (SETTLED.test(ln)) return;
      // strip markdown noise so he reads a sentence, not syntax
      const text = ln
        .replace(/^[\s>|-]*\[[ x]\]\s*/i, "")
        .replace(/[*`_]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();
      if (text.length < 25) return;
      out.push({ plan: name.replace(/\.md$/, ""), text, line: i + 1 });
    });
  }
  return out;
}

export default function DecisionsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const items = collect();
  const byPlan = new Map<string, Item[]>();
  for (const it of items) {
    const list = byPlan.get(it.plan) ?? [];
    list.push(it);
    byPlan.set(it.plan, list);
  }
  const plans = [...byPlan.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <main className="mx-auto max-w-[720px] px-[18px] py-7 pb-16">
      <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
        Waiting on you
      </h1>
      <p className="mt-2 text-s-ink-2">
        Every decision across the plans that only you can settle. Read from the files each time you
        open this, so it cannot go stale. A line leaves when the plan says it is answered.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-s-border bg-white px-3 py-1.5 text-s-ink-2">
          <b className="font-semibold tabular-nums text-s-ink">{items.length}</b> open
        </span>
        <span className="rounded-full border border-s-border bg-white px-3 py-1.5 text-s-ink-2">
          <b className="font-semibold tabular-nums text-s-ink">{plans.length}</b> plans
        </span>
      </div>

      {plans.length === 0 ? (
        <p className="mt-6 text-s-ink-2">Nothing is waiting on you.</p>
      ) : (
        plans.map(([plan, list]) => (
          <section key={plan} className="mt-6">
            <h2 className="text-[18px] font-semibold leading-tight text-s-ink">
              {plan.replace(/_/g, " ").toLowerCase()}
              <span className="ml-2 font-normal tabular-nums text-s-ink-2">{list.length}</span>
            </h2>
            <div className="mt-2.5 rounded-[16px] border border-s-border bg-white px-[18px] py-1">
              {list.map((it) => (
                <p
                  key={`${it.plan}-${it.line}`}
                  className="border-t border-s-border py-2.5 text-s-ink first:border-t-0"
                >
                  {it.text}
                </p>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
