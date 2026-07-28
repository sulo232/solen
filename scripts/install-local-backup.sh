#!/usr/bin/env bash
# install-local-backup , schedule the nightly database backup on THIS MAC, no deploy.
#
# Owner 2026-07-28: "github turn it on but i dont want to deploy".
#
# Why this and not GitHub Actions, measured not assumed:
#   - GitHub's registered workflow is `disabled_inactivity`, and its remote copy has NO
#     db-backup job (18 jobs: reminders, SMS, pre-charge, no-show...). Enabling it would fire
#     those against seed data and still back nothing up.
#   - https://solen.ch/api/cron/db-backup returns content-type text/html (the Next catch-all),
#     while /api/health returns application/json , so the backup route is not on the deployed
#     build either.
#   Both fixes need code on the default branch, i.e. a deploy. This does not.
#
# Uses launchd rather than cron: launchd runs a missed job when the Mac wakes, and plain cron
# silently skips it. A backup that quietly does not run is the failure mode this whole thing
# exists to end.
#
#   bash scripts/install-local-backup.sh          install + run once now
#   bash scripts/install-local-backup.sh --remove uninstall
set -euo pipefail

LABEL="ch.solen.db-backup"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$HOME/solen/backups/_logs"
NODE_BIN="$(command -v node)"

if [[ "${1:-}" == "--remove" ]]; then
  launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
  rm -f "$PLIST"
  echo "removed ${LABEL}"
  exit 0
fi

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${NODE_BIN}</string>
    <string>${REPO}/scripts/backup-local.mjs</string>
    <string>--local-copy</string>
  </array>
  <key>WorkingDirectory</key><string>${REPO}</string>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>45</integer></dict>
  <key>StandardOutPath</key><string>${LOG_DIR}/backup.log</string>
  <key>StandardErrorPath</key><string>${LOG_DIR}/backup.err.log</string>
  <key>RunAtLoad</key><false/>
</dict>
</plist>
PLIST_EOF

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "installed ${LABEL}  ,  runs 03:45 daily"
echo "  script : ${REPO}/scripts/backup-local.mjs"
echo "  logs   : ${LOG_DIR}/backup.log"
echo
echo "running once now to prove it works:"
"${NODE_BIN}" "${REPO}/scripts/backup-local.mjs" --local-copy | tail -3
echo
echo "check it is registered:  launchctl list | grep ${LABEL}"
echo "uninstall:               bash scripts/install-local-backup.sh --remove"
