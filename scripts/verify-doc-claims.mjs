#!/usr/bin/env node
/**
 * verify-doc-claims , read every "this is hidden / this was removed" claim in the plan and design
 * docs, and check it against the code.
 *
 * Owner 2026-08-14: "problems are u finishd n u dont renew relevant files."
 *
 * THE CASE. Two plan files said the home page's business block is off the mobile home, and one of
 * them listed it as delivered and verified on a phone. It had never been done: the section was
 * mounted unconditionally and rendered on every phone for two weeks. The owner found it by looking.
 * Nothing in this repo compares what a document CLAIMS against what the code DOES, so a false
 * "delivered" is quieter than an open checkbox and survives longer.
 *
 * WHAT IT CHECKS, deliberately narrow so every hit is real:
 *   claim  : a doc line saying a named component is hidden below md / absent on mobile
 *   code   : the place that mounts that component
 *   verdict: KEPT when the mount carries a responsive-hide class, BROKEN when it does not
 *
 * It does not try to grade prose. Anything it cannot decide, it does not report, because a checker
 * that cries wolf gets ignored and this one exists precisely because nobody was looking.
 *
 * Usage: npm run claims          (exit 1 when a claim is broken, so it can gate later if wanted)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const DOC_DIRS = ["_plans", "_design-system"];
const CODE_DIRS = ["app", "components", "components-legacy"];

// The component name has to be captured WHOLE. A first version let `[^.\n]{0,25}` eat into the name
// and captured "er" out of BusinessTeaser and "ow" out of MobileCategoriesRow, so it looked for a
// component called "er" and reported nothing to check. Anchor the name on a word boundary instead.
const CLAIM = /(?:hide|hidden)[^.\n]{0,25}?\b([A-Z][A-Za-z0-9]{3,})\b[^.\n]{0,25}?below\s+md|\b([A-Z][A-Za-z0-9]{3,})\b[^.\n]{0,25}?(?:hidden below|absent on mobile|not on (?:the )?mobile)/g;
const HIDE_CLASS = /max-md:hidden|hidden\s+md:(?:block|flex|grid)|md:block|md:flex/;

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(join(ROOT, dir)); } catch { return out; }
  for (const e of entries) {
    if (e === "node_modules" || e === ".next" || e.startsWith(".")) continue;
    const rel = join(dir, e);
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const docFiles = DOC_DIRS.flatMap((d) => walk(d)).filter((f) => extname(f) === ".md");
const codeFiles = CODE_DIRS.flatMap((d) => walk(d)).filter((f) => [".tsx", ".ts"].includes(extname(f)));
const code = new Map(codeFiles.map((f) => [f, readFileSync(join(ROOT, f), "utf8")]));

const claims = [];
for (const f of docFiles) {
  const text = readFileSync(join(ROOT, f), "utf8");
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(CLAIM)) {
      const comp = m[1] || m[2];
      if (!comp || comp.length < 4) continue;
      claims.push({ doc: f, line: i + 1, comp, text: line.trim().slice(0, 120) });
    }
  });
}

const results = [];
for (const c of claims) {
  const mounts = [];
  for (const [f, src] of code) {
    if (f.includes("/dev/")) continue;
    const lines = src.split("\n");
    lines.forEach((l, i) => {
      if (new RegExp(`<${c.comp}[\\s/>]`).test(l)) {
        const around = lines.slice(Math.max(0, i - 3), i + 2).join(" ");
        mounts.push({ file: f, line: i + 1, hidden: HIDE_CLASS.test(around) });
      }
    });
  }
  if (!mounts.length) continue; // not mounted anywhere: a different problem, not this one

  // A section can hide ITSELF instead of being wrapped at the mount, and MobileCategoriesRow does
  // exactly that (its own root carries `hidden`). Checking only the mount site called that broken,
  // which would have sent someone to "fix" a thing that already works.
  // Self-hiding counts in any of its forms, including a bare `hidden` in the root className, which
  // is how MobileCategoriesRow does it. `aria-hidden` is not a layout class and must not count.
  const own = [...code.entries()].find(([f]) => f.endsWith(`/${c.comp}.tsx`));
  const ownClasses = own ? [...own[1].matchAll(/className=\{?"([^"]{0,400})"/g)].map((m) => m[1]) : [];
  const selfHides = ownClasses.some((cls) => HIDE_CLASS.test(cls) || /(^|\s)hidden(\s|$)/.test(cls));
  const broken = selfHides ? [] : mounts.filter((m) => !m.hidden);
  results.push({ ...c, mounts, ok: broken.length === 0, broken });
}

const bad = results.filter((r) => !r.ok);
console.log(`doc claims about a section being hidden: ${results.length} checkable`);
console.log(`  honoured by the code: ${results.length - bad.length}`);
console.log(`  contradicted by the code: ${bad.length}`);
for (const r of bad) {
  console.log(`\n  ${r.doc}:${r.line}`);
  console.log(`    says: ${r.text}`);
  for (const m of r.broken) console.log(`    but ${m.file}:${m.line} mounts <${r.comp}> with no hide class`);
}
process.exit(bad.length ? 1 : 0);
