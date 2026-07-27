# Uploaded-content rights (photos, reviews, video)

<!-- exists-check: `npm run exists "content rights"` = 0 matches. Checked _rules/LEGAL_COPY.md
     (price copy only), _rules/SECURITY_RULES.md, _backend-system/research/privacy-data-protection.md,
     and app/[locale]/terms/components/TermsContent.tsx. The Terms ALREADY carry the licence
     grant (see below); this file holds the WARRANTY + CONSENT delta that is missing, plus the
     upload-time attestation, which no existing doc covers. -->

Owner asked, 2026-07-27: *"cant we incl in the terms n service all pictures uploaded are
mine like solen n solen can use that for ads evrth like or how does fresha uber eats any
ithr company do like airbnb etc"*

Research: `_design-system/research/owner-answers-2026-07-27/photo-rights-tos.md`
(Airbnb, Fresha consumer + partner, Uber, Booking.com guest + partner, Treatwell, Yelp,
Google, with URLs and the operative wording of each).

---

## The direct answer: no, and you already have the better thing

**Zero of the six platforms take ownership.** All six take a broad licence and say so
explicitly; Uber and Google go out of their way to state the content stays the user's. The
only place ownership appears anywhere in that research is Fresha owning the photos its own
paid photographers produce, which is a different transaction entirely: you own what you paid
to create, you licence what someone uploads.

**And Solen already grants itself that licence.** `app/[locale]/terms/components/TermsContent.tsx:247-248`
already says the Salon Partner keeps ownership and grants solen.ch a non-exclusive,
royalty-free, worldwide licence to use, reproduce and publish the content on the platform
**and in promotional materials (social media, advertisements, website)**. That is the
industry-standard clause, already written, already shipped, in German and English.

**Demanding assignment instead would cost more than it buys.** Everything the owner listed
(ads, social, SEO, banners, cropping, third-party channels) is already achievable under a
licence. Ownership adds only two powers: suing third parties over a salon's photo, and
stopping a salon from using its own picture. Solen wants neither, and the second is a
support nightmare and a churn driver. Separately, under Swiss URG the moral rights
(Urheberpersönlichkeitsrecht) cannot be assigned at all, so a blanket "all pictures are
mine" clause would be partly unenforceable on its own terms and would read as an unusual
clause to any consumer-protection review.

---

## What IS missing, and it is the part that actually bites

The licence is fine. The chain of permission behind it does not exist. Fresha's partner
terms and Treatwell's partner terms converge on the same answer from opposite ends of
Europe, which is the strongest signal in the whole research, and Solen has neither half.

### 1. No uploader warranty
Every platform makes the uploader represent they hold the rights. Booking.com's guest
wording is the plainest: the user confirms they have permission to share it and that no
privacy rights are violated, and accepts liability for claims. Solen's Terms say nothing.

### 2. No depicted-person consent duty , the one that matters most here
This is a beauty marketplace. A salon photo is usually a photograph **of a client**, and
the client is not the uploader. Fresha requires the partner to obtain that individual's
consent BEFORE uploading, parental consent for minors, to KEEP CONSENT RECORDS, and to
REMOVE the content if consent is withdrawn. Treatwell requires the same, including records.

Under the Swiss nFADP and, for EU data subjects, the GDPR, a recognisable photograph is
personal data, and using it in ADVERTISING is a distinct purpose from displaying it on the
salon's own profile. Solen cannot lawfully rely on a licence from the salon to advertise
using a picture of a person who never agreed to anything. Beauty and treatment context can
also push a photo toward special-category data (Art. 9 GDPR / nFADP Art. 5), which raises
the consent bar rather than lowering it.

### 3. No upload-time attestation
The Terms bind at signup; the photo is uploaded months later by whoever is at the desk. No
checkbox, no notice, no stored record of who attested what and when. That record is what
turns a clause into a defence.

### 4. Three drafting gaps in the existing clause
- **Not sublicensable.** Without it, Solen cannot lawfully push a salon photo to Reserve
  with Google, an Instagram partner ad, or a distribution channel. Every comparable takes a
  sublicensable grant; Treatwell enumerates the channels by name rather than leaving it generic.
- **No survival after termination.** Treatwell's licence expressly survives. Solen's is silent,
  so a salon leaving arguably strips Solen's right to campaign material already published.
- **Moral rights untouched.** Fresha uses a NON-ASSERTION ("agree not to assert any moral
  rights") rather than a US-style waiver. That phrasing is the civil-law-correct one and is
  what a Swiss draft should copy; a waiver would likely be void here.

---

## Draft clause outline (for a lawyer to finalise, not to ship as-is)

Extend the existing §7-ish content clause in `TermsContent.tsx` with:

1. **Warranty.** The uploader represents and warrants they hold all rights necessary to
   grant the licence, and indemnifies Solen against third-party claims.
2. **Depicted-person consent.** Where an uploaded photo or video shows, relates to, or may
   enable identification of any individual, the uploader must obtain that individual's prior
   consent, including consent to marketing use; parental or guardian consent for minors; must
   keep records of those consents; and must notify Solen and remove the content if consent is
   withdrawn.
3. **Sublicensable**, enumerating the channels the way Treatwell does rather than leaving it
   generic: the marketplace, Solen's own social accounts, paid advertising, search and
   distribution partners.
4. **Survival**: the licence survives termination for material already published.
5. **Moral rights**: non-assertion, not waiver (Swiss URG).
6. **Takedown**: a stated turnaround for a removal request from a depicted person, and the
   route to make it. Pick a number and honour it; Fresha-style "on withdrawal" with no SLA is
   weaker than a stated window.

### Upload-time attestation (the product half)

One required checkbox at every photo-upload entry point, storing `{ user_id, salon_id,
uploaded_at, tos_version }` so the attestation is evidence rather than decoration. The
existing `profiles.tos_accepted_version` column is the pattern to mirror. Entry points:
`app/api/salons/[slug]/gallery` (dashboard GalleryManager AND the separate onboarding
direct-to-bucket path), review photos, client photos, staff portfolio.

**The one thing only the owner can decide** is item 6: what Solen PROMISES when a depicted
person objects. The checkbox is trivial; the promise is policy, and it sets the support load.

---

## Sources

Airbnb ToS, Fresha Terms of Use + Partner Terms, Uber User Generated Content Policy,
Booking.com T&Cs §A15.4 + General Delivery Terms §3, Treatwell Partner Terms of Business,
Yelp ToS §5, Google Terms of Service. Full extraction with URLs and operative wording:
`_design-system/research/owner-answers-2026-07-27/photo-rights-tos.md`

**Engineering research, not legal advice.** A Swiss lawyer signs off the final wording,
particularly the moral-rights non-assertion and the special-category consent basis.
