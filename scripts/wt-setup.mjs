#!/usr/bin/env node
// wt-setup - provision a fresh git worktree so `npm run dev` works immediately.
// Symlinks node_modules and .env.local from the MAIN checkout (never a sibling
// worktree, which is how worktrees end up depending on each other and breaking
// when one is pruned). Idempotent: safe to re-run; repoints stale/sibling links.
//
//   npm run wt:setup               provision the current worktree
//   npm run wt:setup -- --doctor   audit every worktree's node_modules link
//
// Exists-check: searched scripts/ + package.json; no worktree-provisioning
// script existed (only a prose memory note). This is the net-new piece.

import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, symlinkSync, realpathSync, rmSync, readdirSync } from 'node:fs'
import { dirname, join, resolve, basename } from 'node:path'

// execFile (not exec) with a fixed binary + arg array - no shell, no injection.
function git(args, cwd) {
  return execFileSync('git', args, { encoding: 'utf8', cwd }).trim()
}

function mainCheckout(cwd) {
  const common = resolve(cwd, git(['rev-parse', '--git-common-dir'], cwd))
  return common.endsWith('.git') ? dirname(common) : common
}

function suggestedPort(name) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return 3000 + (h % 800) // 3000-3799, stable per worktree name
}

function provision(cwd, mainRoot, name) {
  const dst = join(cwd, name)
  const src = join(mainRoot, name)
  if (!existsSync(src)) {
    console.log(`! ${name}: not present in main checkout (${src}) - skipping`)
    return
  }
  const realSrc = realpathSync(src)
  let link = null
  try { link = lstatSync(dst) } catch { /* missing */ }
  if (link) {
    if (link.isSymbolicLink()) {
      let tgt = null
      try { tgt = realpathSync(dst) } catch { /* dangling */ }
      if (tgt === realSrc) { console.log(`= ${name}: already linked to main`); return }
      rmSync(dst)
      symlinkSync(realSrc, dst)
      console.log(`~ ${name}: repointed to main checkout (was ${tgt || 'dangling'})`)
      return
    }
    console.log(`= ${name}: real path present, left as-is`)
    return
  }
  symlinkSync(realSrc, dst)
  console.log(`+ ${name}: symlinked from main checkout`)
}

function doctor(cwd, mainRoot) {
  const wtDir = join(mainRoot, '.claude', 'worktrees')
  if (!existsSync(wtDir)) { console.log('no .claude/worktrees dir'); return }
  const realMainNM = realpathSync(join(mainRoot, 'node_modules'))
  let problems = 0
  for (const wt of readdirSync(wtDir)) {
    const nm = join(wtDir, wt, 'node_modules')
    let st = null
    try { st = lstatSync(nm) } catch { continue }
    if (!st.isSymbolicLink()) continue
    let tgt = null
    try { tgt = realpathSync(nm) } catch {
      console.log(`x ${wt}: node_modules is DANGLING`); problems++; continue
    }
    if (tgt !== realMainNM && tgt.includes('/.claude/worktrees/')) {
      console.log(`x ${wt}: node_modules points at a SIBLING worktree, not main (${tgt})`); problems++
    }
  }
  console.log(problems ? `\n${problems} problem(s). Run \`npm run wt:setup\` inside each to repoint.` : 'all worktree node_modules links healthy')
}

const cwd = process.cwd()
const mainRoot = mainCheckout(cwd)

if (process.argv.includes('--doctor')) {
  doctor(cwd, mainRoot)
} else if (resolve(mainRoot) === resolve(cwd)) {
  console.log('This is the main checkout - nothing to provision.')
} else {
  console.log(`main checkout: ${mainRoot}`)
  provision(cwd, mainRoot, 'node_modules')
  provision(cwd, mainRoot, '.env.local')
  console.log(`\nready. suggested port for this worktree: npm run dev -- -p ${suggestedPort(basename(cwd))}`)
}
