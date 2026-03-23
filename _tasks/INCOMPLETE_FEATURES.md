# ⚠️ Incomplete Features & Blockers

> **RULE:** NEVER DELETE OR OVERWRITE THIS FILE. **APPEND ONLY.**
> If you (the AI) cannot finish a feature because an API is missing, a dependency is blocked, or you lack context, you MUST append a new entry here so the user and other agents know exactly what is missing and where to pick up.

---

## Example Entry (Do not delete)
- **Feature/Page:** `app/[locale]/dashboard/settings/page.tsx` — Salon Settings Gallery
- **Current State:** Using a primitive text input for Image URLs.
- **Blocker:** Missing Supabase Storage upload route (`POST /api/upload`).
- **Next Steps:** Dev 1 needs to build the API route. Once done, swap the text input for a Drag & Drop file uploader.

---

## Profile Sub-Pages (2026-03-22)
- ALL profile sub-pages (packages, gift-cards, intake-forms) have been BUILT AND COMPLETED.

- **Feature/Page:** `components/disputes/ReportProblemButton.tsx` — Customer Dispute Button
- **Current State:** Fetches `/api/bookings/[id]/report` via useSWR for each completed booking independently.
- **Blocker:** Causes N+1 queries on the frontend if a user has many completed bookings.
- **Next Steps:** Create a batch endpoint `/api/bookings/disputes` or use Supabase directly to fetch all user disputes in one request, similar to the dashboard implementation.

