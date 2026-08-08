/**
 * /dev/reply-templates , the seven reply shapes, on a page he can read on his phone.
 *
 * Owner, 2026-08-08: "we need to make multiple templates of how you should respond, output
 * principles. Because I think by now it's just fixing and capturing and not making actual change."
 *
 * A markdown file would have been the fifth copy of the same failure: he does not read markdown,
 * and memory `feedback_visual_plain_english_deliverables` says a deliverable is a served page plus
 * plain English in the same turn. So the operative file is `~/.claude/REPLY_TEMPLATES.md` (what the
 * agent reads) and this route is his view of it.
 *
 * Anti-rot, the same design as /dev/decisions and /dev/mockups: it reads the file FROM DISK on
 * every request and parses the sections itself. There is no second copy of the content here, so it
 * cannot drift from what the agent is actually following.
 *
 * Dev-only, notFound() in production, matching every other /dev/* route. Copy is English because
 * this is a dev/comparison surface, not the localized app (mockup-english-gate).
 * exists-check: `npm run exists reply-templates` = 0 matches. Nearest existing surfaces are
 * /dev/decisions (on-disk read + notFound gate, reused here) and REPLY_LAW.md (the WHY, which
 * stays where it is). Net-new is only this view.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { notFound } from "next/navigation";

const SOURCE = path.join(os.homedir(), ".claude", "REPLY_TEMPLATES.md");

type Template = {
  n: string;
  title: string;
  shape: string;
  note: string;
  wrong: string;
  right: string;
};

type Parsed = {
  index: { when: string; n: string }[];
  templates: Template[];
  shared: string[];
  goesIn: string[];
  staysOut: string[];
  missing: boolean;
};

/** Bullets under one bolded lead-in inside the in/out section. */
function bullets(section: string, lead: string): string[] {
  const start = section.indexOf(lead);
  if (start === -1) return [];
  const rest = section.slice(start + lead.length);
  const end = rest.search(/\n\s*\n\*\*/);
  return (end === -1 ? rest : rest.slice(0, end))
    .split("\n")
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.replace(/^\s*-\s*/, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim());
}

function parse(): Parsed {
  let raw = "";
  try {
    raw = fs.readFileSync(SOURCE, "utf8");
  } catch {
    return { index: [], templates: [], shared: [], goesIn: [], staysOut: [], missing: true };
  }

  const index: { when: string; n: string }[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*(\d)\s*\|$/);
    if (m && !/template/i.test(m[1])) index.push({ when: m[1], n: m[2] });
  }

  const templates: Template[] = [];
  const sections = raw.split(/^## /m).slice(1);
  for (const sec of sections) {
    const head = sec.split("\n")[0].trim();
    const m = head.match(/^(\d)\.\s+(.+)$/);
    if (!m) continue;
    const body = sec.slice(head.length);
    const fence = body.match(/```\n([\s\S]*?)```/);
    const wrong = body.match(/WRONG\s*,\s*\*"([\s\S]*?)"\*/);
    const right = body.match(/RIGHT\s*,\s*\*"([\s\S]*?)"\*/);
    const afterFence = fence ? body.slice(body.indexOf(fence[0]) + fence[0].length) : body;
    const note = afterFence
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .find((p) => p && !/^(WRONG|RIGHT)/.test(p) && !p.startsWith("---"));
    templates.push({
      n: m[1],
      title: m[2],
      shape: fence ? fence[1].trimEnd() : "",
      note: note ? note.replace(/\s+/g, " ") : "",
      wrong: wrong ? wrong[1].replace(/\s+/g, " ") : "",
      right: right ? right[1].replace(/\s+/g, " ") : "",
    });
  }

  const sharedSec = raw.split(/^## What every template shares$/m)[1];
  const shared = sharedSec
    ? sharedSec
        .split(/^## /m)[0]
        .split("\n")
        .filter((l) => l.trim().startsWith("- "))
        .map((l) => l.replace(/^\s*-\s*/, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim())
    : [];

  const inOutSec = raw.split(/^## What goes in, and what never does$/m)[1] || "";
  const inOut = inOutSec.split(/^## /m)[0];

  return {
    index,
    templates,
    shared,
    goesIn: bullets(inOut, "**IN, because he can use it:**"),
    staysOut: bullets(inOut, "**OUT, always, no exceptions:**"),
    missing: false,
  };
}

export default function ReplyTemplatesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const { index, templates, shared, goesIn, staysOut, missing } = parse();

  return (
    <main className="min-h-dvh bg-s-bg-sunken">
      <div className="mx-auto max-w-[720px] px-4 py-10">
        <h1 className="font-display text-[30px] font-semibold leading-[1.1] text-s-ink">
          Seven reply shapes
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-s-ink-2">
          The shape is picked before the first word, and it fixes how many lines the reply gets. It
          is picked from your last message, not from what I did.
        </p>

        {missing ? (
          <div className="mt-8 rounded-card border border-s-border bg-white p-4">
            <p className="text-[14px] text-s-ink">
              The source file is missing. Expected at <code className="font-mono">{SOURCE}</code>.
            </p>
          </div>
        ) : null}

        {index.length ? (
          <div className="mt-8 overflow-hidden rounded-[24px] bg-white shadow-whisper">
            {index.map((row, i) => (
              <div
                key={row.when}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  i ? "border-t border-s-border" : ""
                }`}
              >
                <span className="text-[14px] leading-snug text-s-ink">{row.when}</span>
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-s-ink">
                  {row.n}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-10 space-y-4">
          {templates.map((t) => (
            <section key={t.n} className="rounded-card border border-s-border bg-white p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[14px] font-semibold tabular-nums text-s-ink-2">{t.n}</span>
                <h2 className="text-[15px] font-semibold text-s-ink">{t.title}</h2>
              </div>

              {t.shape ? (
                <pre className="mt-3 overflow-x-auto rounded-[12px] bg-s-bg-sunken p-3 font-mono text-[12px] leading-[1.6] text-s-ink">
                  {t.shape}
                </pre>
              ) : null}

              {t.note ? (
                <p className="mt-3 text-[14px] leading-[1.55] text-s-ink-2">{t.note}</p>
              ) : null}

              {t.wrong ? (
                <p className="mt-3 border-l-2 border-s-border pl-3 text-[14px] leading-[1.55] text-s-ink-2">
                  {t.wrong}
                </p>
              ) : null}
              {t.right ? (
                <p className="mt-2 border-l-2 border-s-ink pl-3 text-[14px] leading-[1.55] text-s-ink">
                  {t.right}
                </p>
              ) : null}
            </section>
          ))}
        </div>

        {goesIn.length || staysOut.length ? (
          <div className="mt-10">
            <h2 className="font-display text-[22px] font-semibold leading-tight text-s-ink">
              What goes in a reply
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[24px] bg-white shadow-whisper">
                <p className="px-4 pt-4 text-[15px] font-semibold text-s-ink">Goes in</p>
                <div className="mt-2">
                  {goesIn.map((l, i) => (
                    <p
                      key={l}
                      className={`px-4 py-3 text-[14px] leading-[1.55] text-s-ink-2 ${
                        i ? "border-t border-s-border" : ""
                      }`}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-[24px] bg-white shadow-whisper">
                <p className="px-4 pt-4 text-[15px] font-semibold text-s-ink">Never goes in</p>
                <div className="mt-2">
                  {staysOut.map((l, i) => (
                    <p
                      key={l}
                      className={`px-4 py-3 text-[14px] leading-[1.55] text-s-ink-2 ${
                        i ? "border-t border-s-border" : ""
                      }`}
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-[1.55] text-s-ink-2">
              The test when something sits on the line: could you do anything differently because of
              that sentence? If not, it is mine to keep and not yours to read.
            </p>
          </div>
        ) : null}

        {shared.length ? (
          <div className="mt-10 overflow-hidden rounded-[24px] bg-white shadow-whisper">
            <p className="px-4 pt-4 text-[15px] font-semibold text-s-ink">All seven share this</p>
            <div className="mt-2">
              {shared.map((l, i) => (
                <p
                  key={l}
                  className={`px-4 py-3 text-[14px] leading-[1.55] text-s-ink-2 ${
                    i ? "border-t border-s-border" : ""
                  }`}
                >
                  {l}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <p className="mt-10 text-[12px] leading-[1.6] text-s-ink-2">
          This page re-reads the source file on every load, so what is here is exactly what I follow.
        </p>
      </div>
    </main>
  );
}
