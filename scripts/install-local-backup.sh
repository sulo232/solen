#!/usr/bin/env bash
# install-local-backup , schedule the nightly database backup on THIS MAC.
#
# Owner 2026-07-28: "github turn it on but i dont want to deploy".
#
# Why this and not GitHub Actions, measured not assumed:
#   - GitHub's registered workflow is `disabled_inactivity`, and its remote copy has NO
#     db-backup job (18 jobs: reminders, SMS, pre-charge, no-show...). Switching it on would
#     fire those against seed data and still back nothing up.
#   - https://solen.ch/api/cron/db-backup answers with content-type text/html (the Next
#     catch-all page), while /api/health answers application/json, so the backup route is not
#     on the live build either.
#   Both fixes need code on the default branch. This needs none.
#
# Uses launchd rather than cron: launchd runs a missed job when the Mac wakes, plain cron
# silently skips it. A backup that quietly does not run is the failure mode this exists to end.
#
# STATE AS OF 2026-07-28: steps 1 and 2 are ALREADY DONE on this machine. The launcher is at
# ~/solen/bin/solen-backup.sh, the plist is at ~/Library/LaunchAgents/ch.solen.db-backup.plist
# (plutil -lint clean), and the whole chain has been run end to end: 24/24 tables, 2468 rows,
# 0 failures. Only step 3, the `launchctl` registration, is outstanding, because registering a
# Mach service is refused inside the agent sandbox. Measured that day, three ways:
#     launchctl bootstrap gui/501 <plist>   ->  Bootstrap failed: 5: Input/output error
#     launchctl load -w <plist>             ->  Load failed: 5: Input/output error
#     crontab -l                            ->  operation not permitted: crontab
# Re-running this script is harmless and idempotent; it rewrites both files and retries step 3.
#
#   bash scripts/install-local-backup.sh          install + run once now
#   bash scripts/install-local-backup.sh --remove uninstall
set -euo pipefail

LABEL="ch.solen.db-backup"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LAUNCHER="$HOME/solen/bin/solen-backup.sh"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$HOME/solen/backups/_logs"

if [[ "${1:-}" == "--remove" ]]; then
  launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  rm -f "$PLIST" "$LAUNCHER"
  echo "removed ${LABEL}"
  exit 0
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/solen/bin" "$LOG_DIR"

# ---- 1. the launcher -------------------------------------------------------------------
# Deliberately OUTSIDE the git checkout. A plist pointing straight at a worktree path dies the
# day that worktree is removed, and it dies silently, because launchd logs to a file nobody
# reads. This resolves the first checkout that actually exists, preferring the main one.
cat > "$LAUNCHER" <<'LAUNCHER_EOF'
#!/bin/bash
set -uo pipefail

CANDIDATES=(
  "/Users/sulo/Documents/solen"
  "/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559"
)

# Node 18+ `fetch` does NOT read HTTPS_PROXY the way curl does: it resolves DNS directly and
# fails with ENOTFOUND behind a proxy curl sails through. Measured 2026-07-28 in a proxied
# session: curl got HTTP 401 from Supabase while node fetch got ENOTFOUND on the same host in
# the same shell. NODE_USE_ENV_PROXY=1 (node 24+) makes fetch honour the proxy vars, and is a
# no-op on a machine with no proxy configured, so it is always safe to set.
export NODE_USE_ENV_PROXY=1

for repo in "${CANDIDATES[@]}"; do
  script="$repo/scripts/backup-local.mjs"
  [ -f "$script" ] || continue
  [ -d "$repo/node_modules/@supabase/supabase-js" ] || continue
  cd "$repo" || continue
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] running backup from $repo"
  exec /usr/local/bin/node "$script" --local-copy
done

echo "[$(date '+%Y-%m-%d %H:%M:%S')] FAIL: no checkout with both scripts/backup-local.mjs and node_modules" >&2
echo "  looked in: ${CANDIDATES[*]}" >&2
exit 1
LAUNCHER_EOF
chmod +x "$LAUNCHER"

# ---- 2. the plist ----------------------------------------------------------------------
cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${LAUNCHER}</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>45</integer></dict>
  <key>StandardOutPath</key><string>${LOG_DIR}/backup.log</string>
  <key>StandardErrorPath</key><string>${LOG_DIR}/backup.err.log</string>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
PLIST_EOF

plutil -lint "$PLIST"

# ---- 3. register -----------------------------------------------------------------------
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "installed ${LABEL}  ,  runs 03:45 daily"
echo "  launcher : ${LAUNCHER}"
echo "  script   : ${REPO}/scripts/backup-local.mjs"
echo "  logs     : ${LOG_DIR}/backup.log"
echo
echo "running once now to prove the whole chain:"
/bin/bash "$LAUNCHER" | tail -3
echo
echo "check it is registered:  launchctl list | grep ${LABEL}"
echo "uninstall:               bash scripts/install-local-backup.sh --remove"
