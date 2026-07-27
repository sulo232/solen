# The 9, run as a loop (owner instruction, 2026-07-27)

Owner, verbatim:

> report signed in and also othr stuff make it as liop like yk how i said dedicated session
> fotr translation n stuff like the 9go one by one park the one u genuinely need my opinion
> but like its common scrnce like for example report button yk log in cz ppl can mass report
> etc but ye so like fix each 9 autonomously continuously jst park ones u cant do and
> continue as a loop

**The standard this sets, and it is stricter than "use your judgement":** a question is only
parked if I *genuinely cannot* answer it. "It would be nice to confirm" is not a park. The
worked example they gave is the report button: signed-in, obviously, because otherwise people
mass-report. That is the bar , if the answer follows from how the product works, decide it,
write down WHY, and keep going.

Every decision I make alone is recorded here with its reasoning, so a wrong call is visible
and reversible in one line rather than buried in a diff.

## Decided by the owner in that message

- [x] **Report = signed-in only.** Their words, their reason: "cz ppl can mass report etc".
      No change needed to `content_reports`' `auth.role() = 'authenticated'` insert policy ,
      it already enforces exactly this. The question I had parked dissolves.

## Decided by me, with the reasoning

- [ ] **L1. Reviews toggle: disabling blocks NEW reviews; the existing ones stay visible.**
      Reasoning: the same logic the owner just used on the report button. A control is designed
      against its abuse case. If switching reviews off also hid the 260 already written, the
      button stops being "I don't want reviews" and becomes "delete my bad history", and a
      marketplace whose salons can erase criticism is worth nothing to a customer. Blocking
      new ones is a legitimate business choice; rewriting the past is not.
- [ ] **L2. Report a photo, signed-in.** Owner-answered. Build it end to end.
- [ ] **L3. Review-photo upload no-op fixed, then the photos toggle.** The toggle is
      unverifiable until an upload has ever succeeded.
- [ ] **L4. Empty-photo card: make the CODE match the written rule (option A).** Reasoning: two
      undocumented shipped variants against one written rule is how the next person picks the
      wrong one. Docs that describe reality are worth more than reality bent to match a doc
      nobody chose deliberately.
- [ ] **L5. SalonCard from-price: name the service.** Not a taste call , SECO permits a
      from-price in advertising ONLY when the copy says which offer it buys. Naming it keeps
      the information; dropping the price loses it. Statutory floor outranks the mockup-first
      habit here, and the change is one string.
- [ ] **L6. Backfill the 6 salons stranded at `registration_completed = false`.** Pre-launch
      seed data, one additive idempotent update, and without it the approvals fix helps only
      salons that sign up from now on.
- [ ] **L7. French register sweep (`vous` to `tu`).** The dedicated session, run here as the
      owner asked.
- [ ] **L8. Photo takedown promise: 48 hours, no questions asked.** Reasoning: Fresha and
      Treatwell both require removal on withdrawal but state no window, which is weaker than a
      number. 48h is short enough to mean something and long enough for one person to honour.
      Written as the default; one line to change if the owner wants a different number.

## Genuinely parked, and why the park is real

- [ ] **P1. Measured restore time (RTO).** Not a judgement call I am withholding: it needs a
      Supabase Pro `--with-data` branch, which costs money, and it copies real personal data
      into a second database, which is an nFADP decision about someone else's data. Both are
      the owner's to make, not mine.

## Ledger

| item | state |
|---|---|
| owner-answered | 1 |
| decided by me | 8 |
| genuinely parked | 1 |
