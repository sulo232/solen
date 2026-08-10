# Salon onboarding: the admin approval checklist (trust-05)

**Written 2026-07-27.** At current scale (~28 salons, pre-launch, one owner personally clicking
Approve on every new salon in `/dashboard/approvals`), full automated KYC/business verification
is premature machinery, see `_backend-system/README.md`'s scale caveat. What is due now, at zero
engineering cost, is this checklist: the fixed list of what the admin actually looks at before
clicking Approve. Nothing distinguishes "the founder eyeballed this business and it's real" from
"someone clicked a button" today; this doc is that distinction, made auditable.

## Why this exists

`app/api/salon/documents/route.ts` lets a salon owner upload trade_license / professional_cert /
hygiene_cert / id_proof / address_proof, but `app/api/admin/salons/[id]/approve/route.ts` never
reads `salon_documents` and approves purely on the admin clicking a button. The two systems are
disconnected. `TermsContent.tsx` section 6.2 is honest that proof "is currently not mandatory for
activation." A dead salon-verification Supabase edge function in `_design-system/REMOVED.md` shows
an earlier automation attempt was abandoned and never replaced with a documented manual process.
This doc is that replacement.

## The checklist (read before every Approve click, `/dashboard/approvals`)

1. **Name + address match a real business.** Search the salon name plus the submitted address.
   A working website, an existing Google/Fresha/Instagram presence, or a Swiss commercial-register
   (`zefix.ch`) hit for the business name is enough; a listing with zero independent trace of the
   named business anywhere is the strongest single fraud signal at this scale.
2. **Phone number is real and answers.** Call it. A disconnected number or one that reaches an
   unrelated business is a hard stop.
3. **Address resolves to an actual storefront**, not a residential address or an empty lot
   (spot-check on Google Maps street view is enough; a home address is not automatically
   disqualifying for a mobile/home-based provider, but it should match what the salon's own
   description claims).
4. **Uploaded documents (if any) are legible and match the salon name.** Not mandatory yet
   (ToS section 6.2), but if `salon_documents` has rows for this salon, open and skim them; a
   document for a different business name is a red flag even though the field isn't required.
5. **No duplicate-listing flag.** trust-10 adds a "possible duplicate of `<id>`" warning on this
   screen when the phone or address matches an existing salon; if present, open both listings
   side by side before approving either.

None of this is a hard gate today (`salon_documents.status` is never checked, item 4 stays
optional). This is a discipline checklist, not a code gate.

## When this becomes a code gate instead

Per `_backend-system/README.md`'s scale-caveat convention: the trigger is new-salon signups
exceeding roughly 5 to 10 per week, or the founder no longer personally approving each one
(a hire or a team takes over the queue). At that point, replace step 4 with a hard requirement
(`salon_documents.status = 'approved'` before `is_active = true` in
`app/api/admin/salons/[id]/approve/route.ts`), because a checklist that isn't the same one person
every time stops being reliably followed.

## Related

- trust-10 (duplicate-listing flag on this same approval screen)
- `app/api/salon/documents/route.ts` (the currently-disconnected upload path)
- `app/[locale]/terms/components/TermsContent.tsx` section 6.2 (the ToS text this checklist backs)
