#!/usr/bin/env bash
#
# tunnel-supervisor , kill the recurring "tunnel dead / gimme link" toil.
#
# Usage: scripts/tunnel-supervisor.sh [port]   (default 3000)
#
# Ensures a cloudflared quick-tunnel is up for localhost:$PORT and prints its URL.
# Reuses a healthy existing tunnel (checked via URL file + a live HTTP probe). If the
# existing tunnel is dead, kills the old supervisor and starts a fresh detached one
# that respawns cloudflared whenever it dies, so the URL file always self-heals
# instead of needing a manual restart every time the process drops.

set -u

PORT="${1:-3000}"

URL_FILE="$HOME/.claude/tunnel-url-$PORT.txt"
PIDFILE="$HOME/.claude/tunnel-$PORT.pid"
LOGFILE="$HOME/.claude/tunnel-$PORT.log"

mkdir -p "$HOME/.claude"

pid_alive() {
  local pid="$1"
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 1 + 2: reuse a healthy existing supervisor, if any.
if [ -f "$PIDFILE" ]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null)"
  if pid_alive "$OLD_PID"; then
    URL="$(cat "$URL_FILE" 2>/dev/null)"
    if [ -n "$URL" ]; then
      CODE="$(curl -s -m 6 -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)"
      if [ -n "$CODE" ] && [ "$CODE" -ge 200 ] 2>/dev/null && [ "$CODE" -lt 400 ] 2>/dev/null; then
        echo "$URL"
        exit 0
      fi
    fi
    # dead/unhealthy , kill the old supervisor's process group and fall through.
    kill -- "-$OLD_PID" 2>/dev/null
    kill "$OLD_PID" 2>/dev/null
  fi
fi

# 3: verify something listens on localhost:$PORT before starting a fresh tunnel.
if ! curl -s -m 3 "http://localhost:$PORT" >/dev/null 2>&1; then
  echo "ERROR: nothing running on port $PORT, start the dev server first"
  exit 1
fi

: > "$URL_FILE"

# 4: spawn a detached supervisor loop that respawns cloudflared whenever it dies.
nohup bash -c '
  PORT="'"$PORT"'"
  URL_FILE="'"$URL_FILE"'"
  LOGFILE="'"$LOGFILE"'"
  while true; do
    : > "$LOGFILE"
    cloudflared tunnel --url "http://localhost:$PORT" >> "$LOGFILE" 2>&1 &
    CF_PID=$!
    FOUND=""
    for _ in $(seq 1 60); do
      MATCH="$(grep -oE "https://[a-z0-9-]*\.trycloudflare\.com" "$LOGFILE" 2>/dev/null | head -n 1)"
      if [ -n "$MATCH" ]; then
        FOUND="$MATCH"
        echo "$FOUND" > "$URL_FILE"
        break
      fi
      if ! kill -0 "$CF_PID" 2>/dev/null; then
        break
      fi
      sleep 1
    done
    wait "$CF_PID" 2>/dev/null
    : > "$URL_FILE"
    sleep 3
  done
' >/dev/null 2>&1 &
disown
SUPERVISOR_PID=$!
echo "$SUPERVISOR_PID" > "$PIDFILE"

# 5: foreground , poll up to 45s for the URL file to become non-empty.
for _ in $(seq 1 45); do
  URL="$(cat "$URL_FILE" 2>/dev/null)"
  if [ -n "$URL" ]; then
    echo "$URL"
    exit 0
  fi
  sleep 1
done

echo "ERROR: tunnel did not come up, see $LOGFILE"
exit 1
