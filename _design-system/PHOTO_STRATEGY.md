# Photo strategy spike — W11-prep (2026-06-12)

Decision-support for the 6 category-landing heroes (Pattern 2 full-bleed) + general imagery pipeline. Final calls marked OWNER.

## 1. CDN / serving

**Recommendation: no new vendor.**
- The 6 category heroes are STATIC assets → ship optimized files in `/public/_category-heroes/` (pre-sized 1600w + 800w AVIF/WebP), served through Netlify's CDN via `next/image`. Zero infra, zero recurring cost, cache-friendly.
- Dynamic salon photos already live in Supabase Storage → keep serving via `next/image` with a remote loader (already configured for the existing PDP photos). Supabase image transforms are NOT required for the landings.
- Cloudinary rejected: a third vendor + monthly cost for what is, at this stage, 6 static files and an existing storage bucket. Reconsider only when salons upload at volume and we need on-the-fly transforms beyond next/image.

## 2. AI placeholder source

**Recommendation: Nano Banana (Gemini image gen) — the owner already uses it** (existing outputs in ~/solen/screenshots). One coherent prompt family across the 6 categories keeps a consistent look (same lighting/grade), which matters more than per-image quality.
- License: Google's generated-content terms permit commercial use; **OWNER: confirm current Gemini image terms before public launch** (terms shift).
- Fallback: licensed stock (Unsplash+ / Pexels license review) if generation quality fails the gate.

## 3. Quality gate

Manual owner review per category BEFORE the sweep starts (the W11 plan already requires this): 6 images presented as a single contact-sheet mockup, approve/reject each. No landing ships with an unapproved hero.

## 4. Spec for generation (when approved)

- 3:2 master at ≥2400px wide, subject right-weighted (Pattern 2 places the search card left), darkened-edge-friendly (DS-10 scrim goes over).
- One per category: coiffeur, barbershop, nails, spa, makeup, waxing. Swiss-plausible interiors, no readable faces (avoids likeness issues), no text in image.
