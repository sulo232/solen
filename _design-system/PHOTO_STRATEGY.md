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

## 5. Dynamic upload pipeline (salon gallery, review, service, client, avatar photos)

The 6 static hero images above are pre-optimized once at build time; everything in this
section is the much larger volume of photos a real salon owner or customer uploads live,
which needs its own pipeline (imagery-icons-06, 2026-07-27).

- **Metadata strip**: every upload route (`app/api/salons/[slug]/gallery`, `app/api/reviews/[id]/photos`,
  `app/api/services/[id]/photos`, `app/api/clients/[id]/photos`, `app/api/salon/documents`,
  `app/api/dashboard/coiffeur/formula-photo`, `app/api/profile/avatar`) calls the shared
  `verifyAndStripImage()` helper (`lib/upload-security.ts`, A15-upload-hardening 2026-07-27)
  before the file reaches Storage. Sharp re-encodes without `.withMetadata()`, which drops
  EXIF/GPS/ICC data unconditionally.
- **Weight budget**: the 5MB accepted-upload size is an INPUT ceiling only, not a served-weight
  guarantee. `verifyAndStripImage()` resizes the longest edge down to `maxDimension` (default
  **2000px**, `fit: "inside"`, `withoutEnlargement` so small sources are never upscaled) before
  encoding at **quality 82** (jpeg/webp) or `compressionLevel: 9` (png). The avatar route passes
  a tighter `maxDimension: 512` since an avatar never renders above a few hundred px anywhere in
  the product. Measured: a synthetic 4032x3024 phone-photo-sized JPEG re-encoded the OLD way
  (no resize, quality 90) stayed full resolution; the NEW pipeline produces a 2000x1500 output
  at roughly a quarter of the byte weight on the same source.
- **Format verification**: the real format is sniffed from the file's own magic bytes (sharp's
  `.metadata()`), never trusted from the client-supplied `file.type` string or filename extension.

## 6. Pre-publish moderation (salon gallery + review photos)

**Status: NOT closed.** Discovery content has a dedicated moderation admin surface
(`app/api/admin/discovery/moderation/route.ts`); salon-gallery photos (`salon_portfolio_images`)
and review photos (`review_photos`) have no equivalent. Today both insert straight into a
public-read table with no `moderation_status` column and no gate, so an uploaded photo is live
the instant the POST succeeds; the only backstop is a post-hoc report/flag/ban action, which
only catches the problem after the image has already been publicly served (imagery-icons-02,
2026-07-27).

The fix needs a schema change (a `moderation_status` column on both tables, defaulting to
`'pending'` or `'approved'` per the owner's launch-risk call, plus an RLS predicate on the
public SELECT policy so an unmoderated row cannot render even if application code forgets to
filter it) and extending the existing Discovery moderation admin page to cover the two new
tables. **This migration has not been written or applied** (writing/applying a migration is
outside this pass's remit; flagged for the next session with DB-migration authority). Until
it ships, treat every live salon-gallery and review photo as unmoderated by design, a known,
named launch-risk gap, not a silent one.

## 7. User-generated content rights (salon gallery + review photos)

Rights/licensing language today covers ONLY the 6 static AI-generated category heroes (section
2 above: confirm current Gemini generated-content terms before public launch). The much larger
volume of live images, salon-gallery uploads and review photos, has zero rights/consent capture
anywhere in the upload flow (imagery-icons-07, 2026-07-27): `app/api/salons/[slug]/gallery/route.ts`
and `app/api/reviews/[id]/photos/route.ts` both go straight from the multipart file to
`.upload()`, no consent/rights field read or recorded.

**Policy (owner sign-off needed before the UI ships, mockup-first law):** any upload flow
publishing a photo of a real place or a real person requires the uploader to affirmatively
confirm they own the rights or have the depicted person's consent, at the moment of upload,
logged with a timestamp. A Terms of Service clause nobody reads does not satisfy this. Proposed
implementation: a required, unstyled inline checkbox above the upload button on the gallery
uploader and the review-photo composer ("Ich bestätige, dass ich die Rechte an diesem Foto habe
oder die Zustimmung der abgebildeten Person eingeholt habe" or equivalent per locale), disabling
the submit action until checked, with the confirmation timestamp written alongside the upload
row. **Not yet implemented**: adding a new visible control to a live customer/owner upload
surface is a visible UI change under this project's mockup-first law, queued for the owner to
approve the exact copy and placement before it ships.

## 8. Salon-owned video (policy, written before the feature is built)

REMOVED.md already anticipated this as a real near-term feature when the TikTok inline-embed
was rejected for `/entdecken`: "real inline player ONLY for owned/salon video (we have the file)".
LOCKFILE's no-video-on-marketing-surfaces rule does not reach this case (it is scoped to
marketing surfaces + the `/entdecken` carve-out, not the PDP, which is transactional, not
marketing). Per this project's build-self-test-then-integrate discipline, no salon-video upload
path may ship until this policy is settled (imagery-icons-09, 2026-07-27):

- **Formats**: mp4 (h.264) only at upload; re-encoded server-side same as photos (never trust
  the client-supplied container/codec claim).
- **Duration/size ceiling**: proposed 60 seconds / 50MB input ceiling, re-encoded down to a
  served-weight budget analogous to section 5 above. Owner sign-off needed on the exact numbers.
- **Placement**: below the photo gallery on the PDP, never autoplaying, never replacing the
  hero photo (the imagery floor's photographic-area measurement is photo-based; video is
  additive, not a substitute for it).
- **Imagery-floor interaction**: a video thumbnail (a still frame + play affordance) counts
  toward the photographic-area floor the same as a photo; the PLAYING state does not, since
  the floor is measured on the static first-viewport render.
- This section is the policy; the feature itself is not built, and building it triggers the
  standard mockup-first gate like any other new customer-facing surface.

## 9. Below-the-fold image loading (LQIP question, resolved)

imagery-icons-10 (2026-07-27) asked whether photo grids need a blur-up/LQIP placeholder for
images below the fold, since `placeholder="blur"` has zero hits in the codebase. Re-verified:
every photo-grid tile in the product (`SalonPortfolio.tsx`'s `UniformGrid`, the Inspo masonry
feed's `ItemCard.tsx`, `ProfileTabs.tsx`'s `CollageTile`/`BookingThumb`) already renders its
image inside a container carrying `bg-s-bg-sunken` at a fixed aspect ratio (`aspect-square` /
an explicit `aspect-[w/h]` class). Since the `<img>`/`next/image` element is transparent until
its bytes decode, the sunken-grey container color is what's visible during load, not a blank
white flash, and the fixed aspect-ratio class reserves the box before the image arrives, so
there is no layout shift either. This already satisfies the two failure modes LQIP exists to
solve (blank flash, layout shift) by a different, simpler mechanism than a base64 blur-up
placeholder, and it does not conflict with the separately-locked rule that the ABOVE-FOLD hero
must NOT use a lingering blur-up (that rule is about a blur placeholder specifically, not about
having no placeholder at all). **No further LQIP/blur work is needed here**; a future new photo
grid should follow the same recipe (sunken-bg container + fixed aspect-ratio class), not add a
`placeholder="blur"` prop.
