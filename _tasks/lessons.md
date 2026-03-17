# Lessons Learned

> Agents MUST read this file at the start of every session to avoid repeating past mistakes.
> Append new lessons at the bottom. Never delete old entries.

---

## 2026-03-16

- **NPM Permissions**: macOS has `EPERM` / `EACCES` issues on `~/.npm`. Always use `--cache ./.npm-cache` if running npm locally.
- **`stores.cat` column**: The `cat` column in Supabase `stores` table is NOT NULL. Always provide a fallback value like `['Uncategorized']` if categories aren't selected during registration.
- **`index.html` is sacred**: It's 14k+ lines. Never delete large sections without understanding the full context. Two agents editing it simultaneously = corruption.
- **Don't remove filter bars without replacing them**: Claude Code previously deleted the search/filter HTML sections. Before removing UI, ensure the replacement is ready.
