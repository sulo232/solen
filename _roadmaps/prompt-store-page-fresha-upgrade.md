# Store Page Fresha Upgrade — Claude Code Prompts

## Which can run at the same time?

```
Manual A + B + C (DB migrations + Storage bucket — do first, same time)
     ↓
Phase 1 + Phase 2 (same time, different components)
     ↓
Phase 3 (alone, touches StaffSection + StaffProfilePage + new API)
     ↓
Phase 4 (alone, dashboard gallery + about editor)
     ↓
Phase 5 (alone, last — polish + docs)
```

---

---

## Manual Step A — Add `languages` to staff_members

> Supabase → SQL Editor → Run:

```sql
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
```

---

## Manual Step B — Add `about_text` columns to salons

> Supabase → SQL Editor → Run:

```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_de text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_en text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_fr text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS about_text_it text;
```

---

## Manual Step C — Create `salon-gallery` Storage bucket

> Supabase → Storage → New Bucket:

- **Name:** `salon-gallery`
- **Public:** Yes
- **File size limit:** 5MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

---

## Phase 1 — Scroll-Aware Sticky Tabs

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-store-page-fresha-upgrade.md Phase 1 (Steps 1.1, 1.2, 1.3).
This phase replaces the mobile accordion with a unified sticky tab bar.
The tab bar must: (1) stick below the header, (2) auto-update active tab on scroll via IntersectionObserver, (3) work on both mobile + desktop.
CRITICAL: Do NOT rewrite the entire salon page. Only modify the specific sections mentioned.
Keep all booking flow logic (calendarOpen, selectedService, selectedStaff) untouched.
Follow the Pre-Commit Checklist (CLAUDE.md §G) on every new component.
npm run build after every step. Git commit per step as specified.
Run Steps 1–6 of the Smoke Test when done.
```

---

## Phase 2 — Service Category Filter Pills

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-store-page-fresha-upgrade.md Phase 2 (Steps 2.1, 2.2).
This phase adds a horizontally scrollable pill row to filter services by category.
Style pills to match existing review sort buttons (L1006 in salon page).
Do NOT use FilterPills or FilterBar from the discovery page — build a new component.
The existing service click → booking flow must remain intact.
npm run build after every step. Git commit per step as specified.
Run Steps 7–8 of the Smoke Test when done.
```

---

## Phase 3 — Staff Profile Enhancements

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-store-page-fresha-upgrade.md Phase 3 (Steps 3.1–3.5).
This phase adds: (1) languages field to StaffMember type, (2) rating badge overlays on staff avatars, (3) language tags, (4) weekly availability grid on staff profiles, (5) staff schedule API endpoint.
IMPORTANT: DB migration for `languages` column must already be done (Manual Step 1).
StaffSchedule type already exists in lib/types.ts — use it.
The availability grid shows SCHEDULE PATTERNS only, not live booked slots (privacy).
npm run build after every step. Git commit per step as specified.
Run Steps 9–12 of the Smoke Test when done.
```

---

## Phase 4 — Gallery Management

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-store-page-fresha-upgrade.md Phase 4 (Steps 4.1–4.4).
This phase builds: (1) gallery upload/delete/reorder API, (2) dashboard GalleryManager component, (3) dashboard integration, (4) salon about text editor.
IMPORTANT: The Storage bucket `salon-gallery` must already exist (Manual Step 2).
Reference app/api/reviews/[id]/photos/route.ts for the Supabase Storage upload pattern.
This is Zone 3 (Dashboard). NO glassmorphism. NO entry animations.
Check if @dnd-kit is installed for drag-to-reorder. If not, use button-based reorder.
npm run build after every step. Git commit per step as specified.
Run Steps 13–16 of the Smoke Test when done.
```

---

## Phase 5 — Final Polish + Documentation

```text
Read CLAUDE.md and _rules/UI_RULES.md in full.
Execute _roadmaps/roadmap-store-page-fresha-upgrade.md Phase 5 (Steps 5.1–5.3).
This phase: (1) adds service count to mobile CTA, (2) adds green/grey dots to opening hours, (3) updates CLAUDE.md with new components and schema fields.
npm run build after every step. Git commit per step as specified.
Run the FULL Smoke Test (20 checks) when done.
```
