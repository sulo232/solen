# Owner answers batch (2026-07-27)

Workstream 44. The owner answered the 9 open items from `PRINCIPLES_LOOP.md`. Their answers
are not all "yes/no": several turned into new scope. Every ask below is atomic. Each ends
DELIVERED (with proof) or BLOCKED (with a named dependency), never "later".

Owner message verbatim (source of truth for the close condition):

> 4 ye for salon we dont rlly need but we need to be able to temove but also salon to be able
> to temove their own pics yk but like for salon bfr they go live we can approve or dissaprove
> right as admin we can see all details n stuff if not make it better yk for admin view on
> reviewing and for customer/reviews make it able to post but like salon can disable or enable
> reviews n stuff yk or pictures and also being able to report pictures
>
> 1 yes there is a whole problem with translation we need dedicated session for fixing
> everywhere cz almst everywhere is either mixed german english sh andchanging lang doesnt
> rlly work and also we need a gate or a hook to acc enforce multi langual while writing yk
> 2 research whats legal 3 for pics we use unsplash like stoco pics for previews cz we are not
> live yet but we need to be easy to acc distinguish cx u keep forgetting 5 cant we incl in
> the terms n service all pictures uploaded are mine like solen n solen can use that for ads
> evrth like or how does fresha uber eats any ithr company do like airbnb etc and 6/7 ye fix
> 8ye write 9yr we need whole principle for that

## Ground truth measured before planning (2026-07-27, from `_inventory/_db-columns.json`)

- `salons` already has `approved_at`, `approved_by`, `rejected_at`, `rejection_reason`,
  `is_active`, `listed_on_marketplace`, `registration_completed`. Salon-level approval columns
  EXIST; the question is whether anything reads or writes them.
- `reviews` already has `is_hidden`, `is_flagged`, `flag_reason`, `moderation_status`,
  `removal_reason`, and `/dashboard/review-moderation` exists.
- `salon_photos` (11 cols, **0 rows**) has NO moderation, report, or visibility column.
- `profiles` already has `tos_accepted_at`, `tos_accepted_version`.
- Existing i18n tooling: `scripts/check-i18n-parity.mjs`, `scripts/check-i18n-sentinel.mjs`,
  `npm run check:i18n-parity`. No i18n hook in `~/.claude/hooks/`.

## A. Moderation and photo control (owner item 4)

- [ ] A1. Confirm decision recorded: salon gallery photos do NOT get per-photo pre-publish review
- [ ] A2. Admin can remove any salon photo
- [ ] A3. Salon can remove their own photos
- [ ] A4. Admin approves / disapproves a SALON before it goes live
- [ ] A5. Admin salon-review view shows the full detail needed to judge, or gets made better
- [ ] A6. Customer reviews still post immediately (no pre-moderation) , confirm not regressed
- [ ] A7. Salon can enable / disable reviews on their profile
- [ ] A8. Salon can enable / disable photos on reviews
- [ ] A9. Anyone can report a photo

## B. Translation (owner item 1)

- [ ] B1. French aligned to informal (owner said yes)
- [ ] B2. Measure the "mixed German / English everywhere" problem with real numbers
- [ ] B3. Diagnose "changing language doesnt rlly work" , find the actual root cause
- [ ] B4. Gate / hook that enforces multilingual AT WRITE TIME (owner asked for this by name)
- [ ] B5. Dedicated workstream opened for the full fix (owner asked for a dedicated session)

## C. Price law (owner item 2)

- [ ] C1. Research what Swiss law actually requires for "ab CHF" / starting-from pricing
- [ ] C2. Turn the finding into a decision + a check

## D. Stock photos must be obviously stock (owner item 3)

- [ ] D1. Preview / Unsplash photos are easy to tell apart from real salon photos
- [ ] D2. A gate so this is not forgotten again (owner: "cz u keep forgetting")

## E. Photo rights in the Terms (owner item 5)

- [ ] E1. Research how Fresha, Uber Eats, Airbnb and peers actually word uploaded-photo rights
- [ ] E2. Draft the Solen clause
- [ ] E3. Surface the ownership-vs-licence difference to the owner (they said "are mine")

## F / G. Dashboard layout (owner items 6 and 7, both approved)

- [ ] F1. Dashboard page-level max-width on wide monitors
- [ ] G1. Dashboard free-text line-length cap

## H. Restore drill (owner item 8, authorised)

- [ ] H1. Run a real restore end to end, or name the exact blocker
- [ ] H2. Replace the guessed RTO in the runbook with the measured one

## I. Incident principle (owner item 9)

- [ ] I1. Write the whole incident-response + postmortem principle
- [ ] I2. Wire it so it is reachable at the moment it is needed

## Unplanned additions

(none yet)
