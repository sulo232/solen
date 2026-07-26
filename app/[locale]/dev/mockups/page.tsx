/**
 * /dev/mockups , GENERATED index of every mockup on disk (owner 2026-07-02: "all mockup link
 * dead"; REBUILT 2026-07-26 after the owner caught a quoted mockup count that could not be
 * backed up and a link to an already-approved page mislabelled as parked work). The old version
 * hand-listed 11 items while ~60 route mockups + ~250 html mockups actually existed, so it rotted
 * the moment nobody remembered to add a row. This version reads `app/[locale]/dev/*` and
 * `public/_mockups/**` FROM DISK on every request , there is no hand-maintained list to rot.
 *
 * Grouping answers the owner's actual complaint (things quoted as "needs your approval" that were
 * already-shipped code changes): it cross-references `_plans/MOCKUP_QUEUE.md`'s own `[x]`/`[ ]`
 * rows against the files found on disk, by exact slug match. A queue row's slug is only reliable
 * for the sweep- and v2- loop this file documents; the ~60 /dev/* routes and most standalone .html
 * files predate that queue and are never mentioned in it, so they land in "needs your eyes" too ,
 * that is an honest reflection of "not tracked as decided", not a claim that every one is unseen.
 *
 * Dev-only, notFound() in production, matching every other /dev/* route.
 * exists-check: `npm run exists mockups` = this exact route (being extended, not duplicated) +
 * graveyard hits unrelated to it (tiktok-embed, collections, black-selected).
 */
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";

const REPO_ROOT = process.cwd();
const DEV_DIR = path.join(REPO_ROOT, "app", "[locale]", "dev");
const MOCKUPS_DIR = path.join(REPO_ROOT, "public", "_mockups");
const QUEUE_FILE = path.join(REPO_ROOT, "_plans", "MOCKUP_QUEUE.md");

const NOT_MOCKUP_MARKERS = [
  "(COPY, not mockup)",
  "(BEHAVIOR, not mockup)",
  "(IA DECISION, not visual mockup)",
  "(DECISION, not mockup)",
];

type MockItem = {
  slug: string;
  label: string;
  desc: string;
  href: string;
  mtime: number;
  kind: "route" | "html";
  matched: boolean;
};

type NotMockupRow = { text: string; marker: string; done: boolean };

function humanize(slugPath: string): string {
  return slugPath
    .split("/")
    .map((part) =>
      part
        .replace(/^_+/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" / ");
}

// Reads the leading doc comment (block `/** */` or line `//`) of a page.tsx, skipping "use
// client" and any code that comes before it, and returns the first meaningful sentence, hard
// truncated to ~100 chars. Never invents a description , empty string if none is found.
function extractRouteDesc(file: string): string {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
  const lines = raw.split("\n").slice(0, 20);
  const commentLines: string[] = [];
  let foundStart = false;
  let inBlock = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === "" || t === '"use client";' || t === "'use client';") continue;
    if (!foundStart) {
      if (t.startsWith("/**") || t.startsWith("/*")) {
        foundStart = true;
        inBlock = true;
        const rest = t.replace(/^\/\*+/, "").trim();
        if (rest && !rest.includes("*/")) commentLines.push(rest);
        continue;
      }
      if (t.startsWith("//")) {
        foundStart = true;
        commentLines.push(t.replace(/^\/\//, "").trim());
        continue;
      }
      continue; // keep scanning past imports/consts for a later comment
    }
    if (inBlock) {
      if (t.includes("*/")) {
        const rest = t.replace(/\*\//, "").replace(/^\*/, "").trim();
        if (rest) commentLines.push(rest);
        break;
      }
      commentLines.push(t.replace(/^\*/, "").trim());
      continue;
    }
    if (t.startsWith("//")) {
      commentLines.push(t.replace(/^\/\//, "").trim());
      continue;
    }
    break;
  }
  let text = commentLines.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  text = text.replace(/^\/dev\/[a-z0-9/_-]+\s*[,:-]\s*/i, "");
  const chunks = text.split(/(?<!e\.g)(?<!i\.e)(?<!\betc)\.\s+(?=[A-Z(0-9])/);
  let idx = 0;
  while (
    idx < chunks.length &&
    (/exists-check|npm run exists/i.test(chunks[idx]) ||
      /^`/.test(chunks[idx].trim()) ||
      chunks[idx].trim().length < 15)
  ) {
    idx++;
  }
  let sentence = (chunks[idx] ?? text).trim();
  if (sentence.length > 100) sentence = sentence.slice(0, 97).trimEnd() + "...";
  return sentence;
}

// Every app/[locale]/dev/** directory that itself contains a page.tsx (dev/pdp has no page.tsx of
// its own, only subdirectories, so this filter , not directory-exists , is the correct one).
function findRouteMockups(): MockItem[] {
  const items: MockItem[] = [];
  function walk(dir: string, relParts: string[]) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const pageFile = path.join(dir, "page.tsx");
    if (relParts.length > 0 && entries.some((e) => e.isFile() && e.name === "page.tsx")) {
      const slugPath = relParts.join("/");
      if (slugPath !== "mockups") {
        let mtime = 0;
        try {
          mtime = fs.statSync(pageFile).mtimeMs;
        } catch {
          mtime = 0;
        }
        items.push({
          slug: slugPath,
          label: humanize(slugPath),
          desc: extractRouteDesc(pageFile),
          href: `/dev/${slugPath}`,
          mtime,
          kind: "route",
          matched: false,
        });
      }
    }
    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name), [...relParts, e.name]);
    }
  }
  walk(DEV_DIR, []);
  return items;
}

// Every .html under public/_mockups/**, recursively. Root index.html is the stale hand-written
// list (owner: "leave it alone") , skipped, never re-listed here.
function findHtmlMockups(): { item: MockItem; matchToken: string }[] {
  const out: { item: MockItem; matchToken: string }[] = [];
  function walk(dir: string, relParts: string[]) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        walk(path.join(dir, e.name), [...relParts, e.name]);
        continue;
      }
      if (!e.isFile() || !e.name.endsWith(".html")) continue;
      if (relParts.length === 0 && e.name === "index.html") continue;
      const relPath = [...relParts, e.name].join("/");
      const isIndex = e.name === "index.html";
      const labelSlug = isIndex ? relParts.join("/") || e.name.replace(/\.html$/, "") : relPath.replace(/\.html$/, "");
      const matchToken = (isIndex ? relParts[relParts.length - 1] : e.name.replace(/\.html$/, "")) ?? relPath;
      let mtime = 0;
      try {
        mtime = fs.statSync(path.join(dir, e.name)).mtimeMs;
      } catch {
        mtime = 0;
      }
      out.push({
        item: {
          slug: labelSlug,
          label: humanize(labelSlug),
          desc: "",
          href: `/_mockups/${relPath}`,
          mtime,
          kind: "html",
          matched: false,
        },
        matchToken: matchToken.toLowerCase(),
      });
    }
  }
  walk(MOCKUPS_DIR, []);
  return out;
}

// Parses _plans/MOCKUP_QUEUE.md: `[x]` rows feed the "already decided" set, `[ ]`/`[~]` rows are
// still open (so anything only matched to an open row still counts as "needs your eyes"). Rows
// carrying one of the not-mockup markers never produce a slug , they were code/copy changes, not
// visual A/Bs, and are surfaced as inert text (group C) instead.
function parseQueue(): { doneTokens: Set<string>; notMockupRows: NotMockupRow[] } {
  const doneTokens = new Set<string>();
  const notMockupRows: NotMockupRow[] = [];
  let raw = "";
  try {
    raw = fs.readFileSync(QUEUE_FILE, "utf8");
  } catch {
    return { doneTokens, notMockupRows };
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^- \[([ x~])\]\s*(.*)$/);
    if (!m) continue;
    const status = m[1];
    const text = m[2];
    const marker = NOT_MOCKUP_MARKERS.find((mk) => text.includes(mk));
    if (marker) {
      notMockupRows.push({ text: text.trim(), marker, done: status === "x" });
      continue;
    }
    if (status !== "x") continue;
    const tokens = text.match(/\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/gi) || [];
    for (const tok of tokens) doneTokens.add(tok.toLowerCase());
  }
  return { doneTokens, notMockupRows };
}

function formatDate(mtime: number): string {
  if (!mtime) return "unknown date";
  return new Date(mtime).toISOString().slice(0, 10);
}

export default async function MockupsIndex({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;

  const routeMockups = findRouteMockups();
  const htmlMockupsRaw = findHtmlMockups();
  const { doneTokens, notMockupRows } = parseQueue();

  const routeItems: MockItem[] = routeMockups.map((it) => ({
    ...it,
    href: `/${locale}${it.href}`,
    matched: doneTokens.has(it.slug.split("/").pop()!.toLowerCase()),
  }));
  const htmlItems: MockItem[] = htmlMockupsRaw.map(({ item, matchToken }) => ({
    ...item,
    matched: doneTokens.has(matchToken),
  }));

  const allItems = [...routeItems, ...htmlItems];
  const needsEyes = allItems.filter((i) => !i.matched).sort((a, b) => b.mtime - a.mtime);
  const decided = allItems.filter((i) => i.matched).sort((a, b) => b.mtime - a.mtime);

  function renderRow(it: MockItem) {
    return (
      <Link
        key={`${it.kind}:${it.slug}`}
        href={it.href}
        className="flex items-center justify-between gap-3 rounded-[16px] border border-s-border bg-white px-4 py-3 active:scale-[0.99]"
      >
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-s-ink">{it.label}</span>
          <span className="block truncate text-[12px] text-s-ink-2">
            {it.kind === "route" ? "Route" : "HTML"} , {formatDate(it.mtime)}
            {it.desc ? ` , ${it.desc}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-semibold text-s-accent">Open</span>
      </Link>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[640px] px-5 pb-16 pt-8">
        <p className="text-[12px] font-semibold text-s-ink-3">Solen , mockups index</p>
        <h1 className="mt-1 font-heading text-[22px] font-bold text-s-ink">Every mockup on disk</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          Generated at request time from {routeMockups.length} /dev route{routeMockups.length === 1 ? "" : "s"} and{" "}
          {htmlMockupsRaw.length} public/_mockups html file{htmlMockupsRaw.length === 1 ? "" : "s"}. No hand-maintained
          list, so this cannot go stale the way the old version did.
        </p>
        <p className="mt-2 text-[12px] text-s-ink-2">
          The done/decided split below only comes from `_plans/MOCKUP_QUEUE.md`, which tracks the sweep-* / v2-* loop.
          Older /dev routes and standalone .html files that predate that queue are not mentioned in it at all, so they
          land in "needs your eyes" too , that means "not tracked as decided", not "definitely unseen."
        </p>

        <section className="mt-7">
          <h2 className="text-[14px] font-bold text-s-ink">Needs your eyes ({needsEyes.length})</h2>
          <p className="mb-3 text-[12.5px] text-s-ink-2">
            On disk, not matched to a done row in MOCKUP_QUEUE.md. Newest first.
          </p>
          {needsEyes.length === 0 ? (
            <p className="rounded-[16px] border border-s-border bg-white px-4 py-3.5 text-[13px] text-s-ink-2">
              Nothing here.
            </p>
          ) : (
            <div className="space-y-2">{needsEyes.map(renderRow)}</div>
          )}
        </section>

        <section className="mt-7">
          <h2 className="text-[14px] font-bold text-s-ink">Already decided ({decided.length})</h2>
          <p className="mb-3 text-[12.5px] text-s-ink-2">
            On disk AND matched to a `[x]` row in MOCKUP_QUEUE.md. Newest first.
          </p>
          {decided.length === 0 ? (
            <p className="rounded-[16px] border border-s-border bg-white px-4 py-3.5 text-[13px] text-s-ink-2">
              Nothing here.
            </p>
          ) : (
            <div className="space-y-2">{decided.map(renderRow)}</div>
          )}
        </section>

        <section className="mt-7">
          <h2 className="text-[14px] font-bold text-s-ink">Not a mockup, already applied as code ({notMockupRows.length})</h2>
          <p className="mb-3 text-[12.5px] text-s-ink-2">
            MOCKUP_QUEUE.md rows marked as a copy, behavior, or IA decision, not a visual A/B. Plain text, not links.
          </p>
          {notMockupRows.length === 0 ? (
            <p className="rounded-[16px] border border-s-border bg-white px-4 py-3.5 text-[13px] text-s-ink-2">
              Nothing here.
            </p>
          ) : (
            <div className="space-y-2">
              {notMockupRows.map((row, i) => (
                <div key={i} className="rounded-[16px] border border-s-border bg-s-bg-sunken px-4 py-3">
                  <span className="block text-[12px] font-semibold text-s-ink-2">
                    {row.marker} {row.done ? ", done" : ", open"}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-s-ink-2">{row.text.slice(0, 220)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
