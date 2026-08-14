#!/usr/bin/env bash
# dev-doctor.sh — diagnose + fix the two recurring local-env breakages (2026-07 incidents).
# Usage: bash scripts/dev-doctor.sh [port]   (default 3000)
# 1. node_modules symlink broken/partial (framer-motion incident): re-links to main.
# 2. .next chunk corruption ("ENOENT _document.js", boundary-chunk 404s, 500s
#    under parallel load): clears .next so the next dev-server start is clean.
# For LONG/parallel test runs prefer a prod server: npm run build && npx next start -p <port>
# (next dev corrupts its cache under concurrent agent load; reference_test_server_pattern).
set -uo pipefail
PORT="${1:-3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MAIN_NM="/Users/sulo/Documents/solen/node_modules"
echo "== dev-doctor @ $ROOT =="
# 1. node_modules health
if [[ -L node_modules ]]; then
  if [[ -e node_modules/framer-motion ]]; then echo "node_modules: symlink OK ($(readlink node_modules))"
  else echo "node_modules: symlink BROKEN -> re-linking"; rm -rf node_modules; ln -sfn "$MAIN_NM" node_modules; fi
elif [[ -d node_modules ]]; then
  if [[ -e node_modules/framer-motion ]]; then echo "node_modules: real dir, deps look present (leaving alone)"
  else echo "node_modules: real dir MISSING deps -> replacing with symlink to main"; rm -rf node_modules; ln -sfn "$MAIN_NM" node_modules; fi
else
  echo "node_modules: absent -> linking to main"; ln -sfn "$MAIN_NM" node_modules
fi
# 2. .next corruption markers
CORRUPT=0
[[ -d ".next/server/app" && ! -f ".next/server/pages/_document.js" ]] && CORRUPT=1
ls -d ".next/static/chunks/app/"*" 2" >/dev/null 2>&1 && CORRUPT=1
if [[ "$CORRUPT" == "1" ]]; then echo ".next: corruption markers found -> clearing"; rm -rf .next
else echo ".next: no corruption markers (or absent)"; fi
# 3. server probe
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "http://localhost:$PORT/de" 2>/dev/null || echo 000)
echo "server :$PORT /de -> $CODE  (000 = not running; restart it via the preview tool / npm run dev)"
echo "== done. If problems persist: use the prod test server (npm run build && npx next start)."
