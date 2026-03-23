---
description: how to audit and fix a component's UI, backend, feature flow, and data integrity — step-by-step protocol
---

# Full Component Audit Protocol

Use this for any component/feature audit. Covers UI, backend, feature flow, data integrity, and cross-component issues.

---

## Phase 1: Read & Understand

1. **Read the component source** — `view_file` the main `.tsx` + every sub-component it imports
2. **Read UI_RULES.md** — tokens, dark mode, banned patterns, radii, animation zones
3. **Read CLAUDE.md** — project rules, rate limiting, commit format, imports
4. **Trace every API call** — find every `fetch()`, `supabase.from()`, `useEffect` that loads data:
   - List each endpoint (e.g. `/api/salons`, `/api/profile/favorites`)
   - Check: does the API route file exist?
   - Check: does the Supabase table it queries exist?
   - Check: does it handle errors gracefully (fallback UI, not blank page)?
5. **Trace every navigation** — find every `<Link>` and `router.push()`:
   - Does the target page exist?
   - Is the href correctly prefixed with `/${locale}`?

---

## Phase 2: Live Verification

6. **Visit the live site** — browser subagent, capture screenshots:
   - Desktop light mode
   - Desktop dark mode
   - Mobile (375px)
   - Scrolled states (if sticky elements)
   - Each sub-page / variant
7. **Check network tab** — look for:
   - ❌ 404s (missing API routes or pages)
   - ❌ 500s (backend crashes)
   - ❌ CORS errors
   - ❌ Slow responses (>2s)
8. **Check console** — look for:
   - React hydration mismatches
   - Unhandled promise rejections
   - Missing env variables
9. **Test user flows** — click through the feature as a real user:
   - Does the happy path work end-to-end?
   - What happens when there's no data? (empty state)
   - What happens when the user is logged out? (auth guard)
   - What happens on error? (API down)

---

## Phase 3: Write Audit Report

10. **Create `<component>_audit.md`** with these sections:

### Section A: UI Issues
| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| 1 | Missing dark:text-s-dm-text | Component.tsx:42 | 🟡 | Add dark token |

### Section B: Backend / API Issues
| # | Issue | Endpoint | Severity | Fix |
|---|---|---|---|---|
| 1 | Route returns 404 | /api/salons/counts | 🔴 | Create route |
| 2 | Table missing in Supabase | favorites | 🔴 | Migration needed |
| 3 | Join query crashes (no FK) | /api/profile/favorites | 🔴 | Add fallback |

### Section C: Feature Flow Issues
| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | Backend exists but no UI calls it | 🟡 | Wire up component |
| 2 | UI calls endpoint that doesn't exist | 🔴 | Create endpoint |
| 3 | Feature works but empty state is wrong icon | 🟢 | Swap icon |
| 4 | Nav link goes to page that 404s | 🔴 | Create page or fix link |

### Section D: Data Integrity Issues
| # | Issue | Severity | Fix |
|---|---|---|---|
| 1 | No active salons → all lists empty | 🟡 | Data, not code |
| 2 | Hardcoded fallback data is stale | 🟢 | Update defaults |

### Section E: Cross-Component Issues
| # | Issue | Components | Severity | Fix |
|---|---|---|---|---|
| 1 | Same icon used for 2 different categories | Header + HomePage | 🟡 | Differentiate |
| 2 | Inconsistent radius tokens across pages | SearchBar + FilterBar | 🟡 | Unify |

---

## Phase 4: Plan & Execute

11. **Create task.md** — checklist of every fix
12. **If >5 fixes**: create implementation_plan.md, request approval
13. **If ≤5 fixes**: skip plan, go straight to execution
14. **Fix in severity order** — 🔴 → 🟡 → 🟢
15. **One `multi_replace_file_content` per file** — batch all changes
16. **Update task.md** — mark `[x]` as you go

---

## Phase 5: Verify & Deploy

17. **`git diff --stat`** — sanity check
18. **`npm run build`** — if local env works (Node 20 required)
19. **Commit** — format:
    ```
    fix: <component> audit — <summary>

    - File1: change1, change2
    - File2: change3
    ```
20. **`git push origin main`**
21. **Wait ~60s, browser verify** — light + dark mode on live site
22. **Screenshot sweep** — look for NEW issues from changes
23. **If new issues** → repeat Phase 4-5 as "Round N+1"
24. **Update walkthrough.md** — what changed, verification results, screenshots

---

## Common Checks Table

### UI Checks
| Check | Rule |
|---|---|
| Dark mode | Every `text-s-ink` → add `dark:text-s-dm-text`. Every `bg-white` → add `dark:bg-s-dm-surface` |
| Emojis | No raw ★ ❤️ 🔥 — use lucide-react icons (UI_RULES §7) |
| Border radius | `rounded-card` (12px), `rounded-button` (8px), `rounded-pill` (9999px) — never `rounded-xl/2xl` |
| Touch targets | ≥ `min-h-12 min-w-12` (48px) on all interactive elements |
| Hover | Zone 1: `-translate-y-1`. Zone 3: no transforms |
| Colors | Only design tokens (`s-coral`, `s-blue`, `s-sage`, etc.) — no raw Tailwind |

### Backend Checks
| Check | Rule |
|---|---|
| Rate limiting | Every API route must use `applyRateLimit()` (CLAUDE.md §9) |
| Error handling | Never return raw error objects — wrap in `{ error: message }` |
| Auth guards | Protected routes must check `supabase.auth.getUser()` |
| Edge runtime | API routes should use `export const runtime = "edge"` where possible |
| Cache headers | Public GET endpoints should set `Cache-Control` with `s-maxage` |

### Feature Flow Checks
| Check | Rule |
|---|---|
| API → UI wiring | Every `fetch()` in a component should hit an existing route |
| Empty states | Every list must have a graceful empty state with appropriate icon + message |
| Loading states | Every async operation needs a spinner or skeleton |
| Error states | Failed fetches should show a user-friendly message, not crash |
| Navigation | Every `<Link>` target must exist as a page |
| Auth flow | Logged-out users hitting protected features → redirect to login, not blank page |

### Data Checks
| Check | Rule |
|---|---|
| Required tables | Every `.from("table")` query → that table must exist in Supabase |
| FK relationships | Every `.select("..., relation(...)")` join → FK must exist |
| RLS policies | Every table with user data must have RLS enabled |
| Seed data | If feature needs data to render → note as "data issue, not code bug" |
