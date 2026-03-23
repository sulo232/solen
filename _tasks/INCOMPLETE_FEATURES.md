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
- **Feature/Page:** `app/[locale]/profile/packages/page.tsx` — My Packages (multi-session punch cards)
- **Current State:** Link exists in ProfilePage.tsx but page does not exist. Users get 404.
- **Blocker:** Page not built yet.
- **Next Steps:** Create page that fetches `package_purchases` joined with `service_packages` for the logged-in user.

- **Feature/Page:** `app/[locale]/profile/gift-cards/page.tsx` — My Gift Cards
- **Current State:** Link exists in ProfilePage.tsx but page does not exist. Users get 404.
- **Blocker:** Page not built yet.
- **Next Steps:** Create page that fetches `gift_cards` where `purchaser_id = user.id` or `recipient_email = user.email`.

- **Feature/Page:** `app/[locale]/profile/intake-forms/page.tsx` — My Consultation Forms
- **Current State:** Link exists in ProfilePage.tsx but page does not exist. Users get 404.
- **Blocker:** Page not built yet.
- **Next Steps:** Create page that fetches `intake_forms` for the logged-in user, grouped by `template_type`.
