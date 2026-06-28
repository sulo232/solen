#!/usr/bin/env node
//
// Infrastructure-invariant health check for the .claude config layer.
//   Run:  node scripts/system-health.mjs           (text report)
//         node scripts/system-health.mjs --json     (machine-readable, for CI)
//
// Asserts the invariants whose violation caused a real audit mess:
//   1. every hook file on disk is wired in some settings.json (or is shelved),
//      and every hook a settings file references actually exists,
//   2. every memory file is in the index and every index link resolves,
//   3. both settings.json parse as valid JSON,
//   4. (soft) doc paths referenced in the project CLAUDE.md exist.
//
// Exits 1 if any HARD failure, else 0, so CI can gate on it.
// House style mirrors scripts/exists.mjs + scripts/inventory.mjs: Node ESM, no deps.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve, dirname } from "node:path";

// ----------------------------------------------------------------------------
// Constants (edit here)
// ----------------------------------------------------------------------------
const GLOBAL_DIR = "/Users/sulo/.claude";
const GLOBAL_SETTINGS = `${GLOBAL_DIR}/settings.json`;
const GLOBAL_HOOKS = `${GLOBAL_DIR}/hooks`;

// PROJECT_DIR: prefer CLAUDE_PROJECT_DIR, else walk up from cwd (max 5 levels)
// looking for the dir that contains .claude/settings.json.
function resolveProjectDir() {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv && existsSync(join(fromEnv, ".claude", "settings.json"))) {
    return resolve(fromEnv);
  }
  let dir = process.cwd();
  for (let i = 0; i <= 5; i++) {
    if (existsSync(join(dir, ".claude", "settings.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fall back to cwd so the script still runs and reports a missing-settings FAIL.
  return process.cwd();
}
const PROJECT_DIR = resolveProjectDir();
const PROJECT_SETTINGS = `${PROJECT_DIR}/.claude/settings.json`;
const PROJECT_HOOKS = `${PROJECT_DIR}/.claude/hooks`;

// Hardcoded; if it doesn't exist, the memory check is SKIPPED (printed note), not failed.
const MEMORY_DIR = "/Users/sulo/.claude/projects/-Users-sulo-Documents-solen/memory";

// Hook-dir filenames that are intentionally NOT wired (helpers / CLIs, not hooks).
const SHELVED = new Set(["sim-shot.sh", "plan-archive.sh"]);

// ----------------------------------------------------------------------------
// Result accumulators
// ----------------------------------------------------------------------------
const fails = []; // HARD failures -> exit 1
const warns = []; // SOFT warnings -> never exit non-zero
const infos = []; // informational notes

const JSON_MODE = process.argv.includes("--json");

// Lines collected per check for the grouped text report.
function runCheck(title, fn) {
  const lines = [];
  const add = (marker, msg, bucket) => {
    lines.push({ marker, msg });
    if (bucket) bucket.push(`[${title}] ${msg}`);
  };
  const ctx = {
    pass: (msg) => add("PASS", msg, null),
    fail: (msg) => add("FAIL", msg, fails),
    warn: (msg) => add("WARN", msg, warns),
    info: (msg) => add("INFO", msg, infos),
  };
  try {
    fn(ctx);
  } catch (err) {
    const msg = `check threw: ${err && err.message ? err.message : String(err)}`;
    ctx.fail(msg);
  }
  return { title, lines };
}

// ----------------------------------------------------------------------------
// Shared helpers
// ----------------------------------------------------------------------------
function listFiles(dir, exts) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

// Read a settings file as raw text (for command-string scanning). Returns null if missing.
function readSettingsText(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

// Expand $CLAUDE_PROJECT_DIR / ${CLAUDE_PROJECT_DIR} in a command string to PROJECT_DIR.
function expandVars(cmd) {
  return cmd
    .replace(/\$\{CLAUDE_PROJECT_DIR\}/g, PROJECT_DIR)
    .replace(/\$CLAUDE_PROJECT_DIR/g, PROJECT_DIR);
}

// Pull every hook `command` string out of a parsed settings object.
function collectCommands(settingsObj) {
  const cmds = [];
  const hooks = settingsObj && settingsObj.hooks;
  if (!hooks || typeof hooks !== "object") return cmds;
  for (const eventArr of Object.values(hooks)) {
    if (!Array.isArray(eventArr)) continue;
    for (const matcherEntry of eventArr) {
      const inner = matcherEntry && matcherEntry.hooks;
      if (!Array.isArray(inner)) continue;
      for (const h of inner) {
        if (h && typeof h.command === "string") cmds.push(h.command);
      }
    }
  }
  return cmds;
}

// ----------------------------------------------------------------------------
// CHECK 1 - Hooks wired (HARD)
// ----------------------------------------------------------------------------
function checkHooksWired(ctx) {
  const hookFiles = [
    ...listFiles(GLOBAL_HOOKS, [".py", ".sh"]),
    ...listFiles(PROJECT_HOOKS, [".py", ".sh"]),
  ];

  // Collect every command string from both settings files (raw text + parsed).
  const commandStrings = [];
  for (const path of [GLOBAL_SETTINGS, PROJECT_SETTINGS]) {
    const text = readSettingsText(path);
    if (text === null) {
      ctx.warn(`settings file not found, cannot read its hook commands: ${path}`);
      continue;
    }
    commandStrings.push(text); // raw text catches commands even if JSON is malformed
    try {
      const obj = JSON.parse(text);
      for (const c of collectCommands(obj)) commandStrings.push(c);
    } catch {
      // JSON invalidity is reported by CHECK 3; raw-text scan above still works.
    }
  }
  const haystack = commandStrings.join("\n");

  if (hookFiles.length === 0) {
    ctx.warn("no hook files found on disk in either hooks dir");
  }

  // Forward: each hook file must be referenced or shelved.
  let orphans = 0;
  for (const full of hookFiles) {
    const name = basename(full);
    if (SHELVED.has(name)) {
      ctx.info(`shelved (allowed unwired): ${name}`);
      continue;
    }
    if (haystack.includes(name)) {
      ctx.pass(`wired: ${name}`);
    } else {
      ctx.fail(`orphaned hook (on disk, not wired, not shelved): ${full}`);
      orphans++;
    }
  }

  // Reverse: each command that points under a hooks dir must resolve to an existing file.
  const hookDirMarkers = ["/.claude/hooks/", "/hooks/"];
  for (const path of [GLOBAL_SETTINGS, PROJECT_SETTINGS]) {
    const text = readSettingsText(path);
    if (text === null) continue;
    let obj;
    try {
      obj = JSON.parse(text);
    } catch {
      continue; // can't reliably extract paths from broken JSON; CHECK 3 owns this.
    }
    for (const rawCmd of collectCommands(obj)) {
      const cmd = expandVars(rawCmd);
      // Extract path-like tokens that live under a hooks dir.
      const tokens = cmd.split(/\s+/);
      for (const tok of tokens) {
        if (!hookDirMarkers.some((m) => tok.includes(m))) continue;
        // Only treat tokens that look like a hook file (end in .py/.sh).
        if (!/\.(py|sh)$/.test(tok)) continue;
        const filePath = expandVars(tok);
        if (existsSync(filePath)) {
          ctx.pass(`settings hook file exists: ${filePath}`);
        } else {
          ctx.fail(`settings references missing hook file: ${filePath}`);
        }
      }
    }
  }

  if (orphans === 0 && hookFiles.length > 0) {
    ctx.info(`${hookFiles.length} hook files scanned, ${SHELVED.size} shelved names allowed`);
  }
}

// ----------------------------------------------------------------------------
// CHECK 2 - Memory index (HARD for dead links, HARD for orphans)
// ----------------------------------------------------------------------------
function checkMemoryIndex(ctx) {
  if (!existsSync(MEMORY_DIR)) {
    ctx.info(`memory dir not found, skipping memory-index check: ${MEMORY_DIR}`);
    return;
  }
  const indexPath = join(MEMORY_DIR, "MEMORY.md");
  if (!existsSync(indexPath)) {
    ctx.fail(`memory index missing: ${indexPath}`);
    return;
  }

  // Files on disk: *.md except MEMORY.md itself.
  const onDisk = readdirSync(MEMORY_DIR)
    .filter((n) => n.endsWith(".md") && n !== "MEMORY.md");

  // Indexed filenames: markdown links of the form ](something.md)
  const indexText = readFileSync(indexPath, "utf8");
  const indexed = new Set();
  const linkRe = /\]\(([^)]+\.md)\)/g;
  let m;
  while ((m = linkRe.exec(indexText)) !== null) {
    indexed.add(basename(m[1])); // strip any leading path, compare on filename
  }

  // ORPHAN: on disk, not indexed -> FAIL, except RETIRED_* -> INFO.
  for (const file of onDisk) {
    if (indexed.has(file)) {
      ctx.pass(`indexed: ${file}`);
    } else if (file.startsWith("RETIRED_")) {
      ctx.info(`archived (RETIRED_, allowed unindexed): ${file}`);
    } else {
      ctx.fail(`memory file on disk but not in index: ${join(MEMORY_DIR, file)}`);
    }
  }

  // DEAD LINK: indexed, file missing on disk -> FAIL.
  for (const name of indexed) {
    const full = join(MEMORY_DIR, name);
    if (!existsSync(full)) {
      ctx.fail(`dead index link (file missing): ${full}`);
    }
  }
}

// ----------------------------------------------------------------------------
// CHECK 3 - Settings JSON valid (HARD)
// ----------------------------------------------------------------------------
function checkSettingsJson(ctx) {
  for (const path of [GLOBAL_SETTINGS, PROJECT_SETTINGS]) {
    if (!existsSync(path)) {
      ctx.fail(`settings file missing: ${path}`);
      continue;
    }
    const text = readFileSync(path, "utf8");
    try {
      JSON.parse(text);
      ctx.pass(`valid JSON: ${path}`);
    } catch (err) {
      ctx.fail(`invalid JSON in ${path}: ${err && err.message ? err.message : String(err)}`);
    }
  }
}

// ----------------------------------------------------------------------------
// CHECK 4 - Doc refs in project CLAUDE.md exist (SOFT / WARN only)
// ----------------------------------------------------------------------------
function checkClaudeMdDocRefs(ctx) {
  const claudeMd = join(PROJECT_DIR, "CLAUDE.md");
  if (!existsSync(claudeMd)) {
    ctx.warn(`project CLAUDE.md not found: ${claudeMd}`);
    return;
  }
  const text = readFileSync(claudeMd, "utf8");

  // Match doc-ish paths in the known top-level dirs. Accept paths ending in .md
  // for the *.md dirs, and any token under _inventory/.
  const refRe = /(_design-system\/[^\s`)"'|]+\.md|_rules\/[^\s`)"'|]+\.md|_tasks\/[^\s`)"'|]+\.md|_inventory\/[^\s`)"'|]+)/g;
  const seen = new Set();
  let m;
  while ((m = refRe.exec(text)) !== null) {
    let ref = m[1];
    // Trim trailing punctuation that markdown prose can leave attached.
    ref = ref.replace(/[.,;:]+$/, "");
    if (seen.has(ref)) continue;
    seen.add(ref);
  }

  if (seen.size === 0) {
    ctx.info("no doc-path references found in CLAUDE.md");
    return;
  }
  for (const ref of seen) {
    const full = join(PROJECT_DIR, ref);
    if (existsSync(full)) {
      ctx.pass(`doc ref exists: ${ref}`);
    } else {
      ctx.warn(`doc ref in CLAUDE.md not found (may be illustrative): ${ref}`);
    }
  }
}

// ----------------------------------------------------------------------------
// Run all checks
// ----------------------------------------------------------------------------
const results = [
  runCheck("CHECK 1 - Hooks wired", checkHooksWired),
  runCheck("CHECK 2 - Memory index", checkMemoryIndex),
  runCheck("CHECK 3 - Settings JSON valid", checkSettingsJson),
  runCheck("CHECK 4 - Doc refs in CLAUDE.md", checkClaudeMdDocRefs),
];

// ----------------------------------------------------------------------------
// Output
// ----------------------------------------------------------------------------
if (JSON_MODE) {
  process.stdout.write(JSON.stringify({ fails, warns, infos }, null, 2) + "\n");
} else {
  console.log("");
  console.log("Solen system-health  (.claude infrastructure invariants)");
  console.log(`  PROJECT_DIR: ${PROJECT_DIR}`);
  console.log("");
  for (const { title, lines } of results) {
    console.log(title);
    if (lines.length === 0) {
      console.log("  (no items)");
    } else {
      for (const { marker, msg } of lines) {
        console.log(`  [${marker}] ${msg}`);
      }
    }
    console.log("");
  }
  console.log(`Summary: ${fails.length} FAIL, ${warns.length} WARN, ${infos.length} INFO`);
  console.log("");
}

process.exit(fails.length > 0 ? 1 : 0);
