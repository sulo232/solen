<!-- exists-check: net-new vs the CLAUDE.md "Copy economy" block (5 rules about how MUCH to write),
     _design-system/SOURCE.md section on voice, and _rules/I18N_ROUTING.md (routing + which strings must
     be translated). None of those decides the REGISTER, none covers FR/IT, and none is a writing manual.
     This is the writing law: how to write a string, in four languages. -->

# COPY + VOICE LAW , how we write, in four languages

**Owner, 2026-07-29, verbatim-ish (dictated):** *"password minimum is eight ... make it the Sie
instead of the du ... research everything and make a whole principle about, like, type... like, when
you're writing something, how to do it and stuff."*

**Scope this session:** backend and translation ONLY. The owner is doing frontend work in a parallel
session and asked for no big frontend changes here, to avoid conflicts.

---

## Decisions taken by the owner, 2026-07-29

- **D1 password minimum = 8.** SETTLED. `lib/validations.ts:686` already reads
  `z.string().min(8).max(200)`, verified this session, so there is nothing to change. ASVS 5.0 6.2.1
  is satisfied; the NIST 15-character recommendation is knowingly declined.
- **D2 leaked-password toggle: the owner will do it himself, by end.** Cost reason. **STOP
  SURFACING IT.** Removed from the open-decision list; not to be re-raised.
- **D6 German register = Sie.** SETTLED, replaces the informal `du`.

---

## The measurement that makes D6 bigger than German

Counted this session across all four locale files on `main`:

| locale | informal | formal | reading |
|---|---|---|---|
| de | **332** (du/dein/dir/dich) | 32 (Sie/Ihr/Ihnen) | 91% informal |
| fr | 40 (tu/ton/toi) | **371** (vous/votre/vos) | 90% **formal already** |
| it | **237** (tu/tuo/ti) | **0** (Lei/Suo) | 100% informal |
| en | n/a, English has one register | | |

**The three languages do not agree with each other today.** French is already almost entirely
formal, Italian is entirely informal, German is mostly informal. Whatever the register is, one of
these was going to have to move; the owner picking Sie means German and Italian move toward where
French already is, rather than French moving backwards.

---

## Atomic boxes

### A. Explain, in plain English (owner asked directly)
- [x] A1 , explain the `staff_ratings_view` problem in plain English. Delivered in chat 2026-07-29.
- [x] A2 , explain decision 5, the stranded branch, in plain English. Delivered in chat 2026-07-29.

### B. Record the decisions
- [x] B1 , D1 password = 8 recorded, and verified no code change is needed (`lib/validations.ts:686`).
- [x] B2 , D2 recorded as owner-owned, and removed from the open list so it stops being raised.
- [x] B3 , D6 register = Sie recorded.

### C. The writing law itself
- [x] C1 , register researched. Swiss consumer trend runs toward `du` (Swiss retailers lean informal
      in advertising; formal suits over-40 and professional-services audiences), so Sie is a
      deliberate MINORITY position for a services marketplace. Counter-evidence recorded in
      `COPY_LAW.md` section 1 rather than argued.
- [x] C2 , `_design-system/COPY_LAW.md` written. 9 sections: register, sentence, warmth-inside-formal,
      punctuation, numbers/money, per-string-type shapes, translation mechanics, enforcement, open.
      Commit `a289a2154`.
- [x] C3 , FR and IT covered in section 1: `vous` confirmed as already-normal (371 of 411), `Lei`
      named as net-new for Italian with zero existing examples.
- [x] C4 , enforcement named per rule in section 8. Three rules are wired gates today; the register
      itself is greppable and becomes a ratchet gate AFTER the sweep, because arming it first would
      block every existing string.
- [x] C5 (unplanned, closes a PRINCIPLE_RESEARCH open item) , the expansion figure measured on our
      own corpus and `_rules/I18N_ROUTING.md` Rule 35 corrected in place. 5,671 pairs: de 1.10x
      median / 1.60x p90, **fr 1.17x / 1.72x**, it 1.14x / 1.58x. French is our longest language,
      not German, and the old "30%" was wrong in both magnitude and language.

### D. The sweep , BLOCKED, with a concrete named blocker (not a punt)

**The tool exists and is in the layered loop. `scripts/register-sweep.mjs` was built by the `coder`
subagent and graded by the read-only `loop-reviewer`. Round 1 came back FAIL.** The blocker is
specific and it is a data-safety one, so running `--write` today would corrupt customer copy:

> German weak-verb imperatives end in `-e`, not `-st` (`Wähle ein Datum für deinen Termin`). The
> script's "needs a human" detector keyed on `-st`, so it had near-zero recall on the single most
> common sentence shape in our CTA, onboarding and empty-state copy. The reviewer hand-classified
> ~68 candidates and confirmed at least **30 genuine misses in German alone**, each of which would
> have shipped as a half-converted sentence (formal possessive, informal verb) with nothing flagging
> it. Same failure in Italian: `prenota`, our most common CTA verb, was not in the whitelist.
> Plus Italian standalone `ti` was invisible to the tool entirely (8 strings), and French `t'`
> elision was unmapped.

Round 2 is running. The reviewer PASSED data safety, formatting preservation (byte-identical JSON
round trip on all three files), the longest-match ordering, the over-reach guards and the house
rules, so the structure is sound and only the detector needs work.

**UPDATE 2026-07-29, the tool PASSED after three rounds and the sweep is running.**
Verified by me, not taken from the agents: de 330 changed / 169 flagged, it 231 / 109, fr 51 / 25;
`git status messages/` clean on a dry run; 0 em-dashes; one import.

- [~] D1 , German. **Round 1 applied and committed (`69fc74d65`): 330 mechanical swaps plus 161
      hand conjugations.** Round 2 (commit `26c025cf5`): the named 41-item punch list minus 4 false
      positives, plus 45 more found via independent re-derivation, all fixed and re-verified.
      **Round 3, this session: the reviewer's 34-ish structural-detector punch list (sibling-mismatch,
      A through F in their message) applied in full, 39 distinct keys touched** (their count and my
      literal list-count differ by 5, same shape as the earlier 5686/5687 mismatch, flagging not
      silently reconciling): the 4 untouched-sibling strings, the 6-item 3-step-widget titles, the
      10-item marketing/landing batch, the 5 dashboard strings, the 9 booking/profile strings
      (including switching `categoryPage.loadMore` to the file's own `Mehr laden` infinitive
      convention instead of Sie-conjugating it, per explicit instruction), and the 5 email
      placeholders reworked to a person-neutral `max@...` example rather than a `Ihre@` swap, which
      also resolves the earlier round-1 call on those same 5 strings that this round's reviewer
      explicitly reversed. Verified: parses; sweep 0 changed; only `de.json` in the diff (39
      insertions/39 deletions); leaf count 5687 total values (5686 strings + the 1 pre-existing
      `refundFlow._todo_translate` boolean, which resolves the earlier discrepancy above rather than
      leaving it open); 0 ICU mismatches; 0 hits on every broken form; the 5 pre-existing `ß`
      characters and the em-dash count (54) both untouched. **My own honest read, asked for directly
      this round: I do not believe the file is certifiably clean, and I agree with F1's diagnosis
      below rather than contradicting it.** I ran my own independent sibling-mismatch pass afterward
      (same method as F1) and it returned **15 candidates, not zero**; I hand-triaged every one and
      all 15 are false positives, but of a specific, real shape: system progress/status captions
      (`Lade...`, `Suche...`, `Erstelle...` used as "Loading.../Searching.../Creating...", not
      commands) and Noun+Infinitive action-label constructions (`Suche verfeinern` = "refine search",
      `Suche löschen` = "clear search", same person-neutral pattern as the `Bitte alle Felder
      ausfüllen` false positive from round 2). That a THIRD independent pass, on a different method
      again, still lands on the same two false-positive shapes rather than a new genuine defect is
      weak positive evidence, but 15-candidates-all-false is not the same claim as "no more exist,"
      for the exact precision-collapse reason F1 names. Not self-certifying PASS; that is what F2 is
      for.
- [x] D2 , Italian to Lei. verified: commit `a0423867d`. 231 strings changed, exactly what the tool
      predicted. Checked by me, not by the agent: parses; `node scripts/register-sweep.mjs it`
      reports 0 changed; 5658 leaf keys before and after with 0 added and 0 removed; 0 ICU
      placeholder mismatches; and zero hits for `Lei hai`, `Lei sei`, `Lei puoi`, `Lei vuoi`,
      `Lei ti`.
- [x] D3 , French to vous. verified: same commit `a0423867d`. 51 strings changed (the corrected
      count; my earlier coarser key-level count said 40). 5669 leaf keys before and after, 0 ICU
      mismatches, zero hits for `vous as`, `vous es`, `vous peux`, `vous veux`.
- [x] D5a , **French half: DONE, and the answer is that there is nothing to fix.** verified: scan run
      this session over `messages/fr.json`, output at `/tmp/claude/bare_fr.txt`, **1 candidate and it
      is a false positive**: `dashboardCoiffeur.metricsAvgDays`, "Jours moy. entre visites", where
      `entre` is the preposition "between", not the imperative of `entrer`. French carries no
      pronoun-free informal verbs. Nothing to change, and the box is closed on that basis rather
      than left open forever.
- [ ] D5b , **Italian half: 18 candidates, coder running.** CONCRETE BLOCKER: the fix needs a human
      Italian read, because a regex cannot separate a third-person imperative from a noun phrase in
      Italian any more than it can in German, and I proved that failure mode this session (see F1).
      Confirmed genuine and shipping informal right now: `discovery.errorMessage` "Controlla la
      connessione e riprova", `ui.searchOverlay.errorBody` (same sentence), and
      `salonRegistration.step3.subtitle` "Scegli tra i modelli o crea servizi personalizzati", which
      needs BOTH verbs. Confirmed false or ambiguous: `booking.confirmation.title` "Revisione e
      conferma" and `dashboard.verificationPage.title` "Documenti e verifica" are noun pairs, not
      commands. List: `/tmp/claude/bare_it.txt`. (Checked this round while working the German box:
      `messages/it.json` is out of my task's explicit scope, German-only, and it is another coder's
      live file, so I did not open or touch it. Confirmed still correctly open.)
- [x] D5c , record of the original scan. The pronoun-only blindness that cost
      German 41 strings is not German-specific. Scanned it/fr for
      the same shape: **Italian 18 candidates, French 1.** The French one is a false positive
      (`dashboardCoiffeur.metricsAvgDays`, "Jours moy. entre visites", where `entre` is the
      preposition, not an imperative). Several Italian ones are genuine and shipping informal right
      now, for example `discovery.errorMessage` "Controlla la connessione e riprova" (needs
      `Controlli` / `riprovi`), `ui.searchOverlay.errorBody` (same), and
      `salonRegistration.step3.subtitle` "Scegli tra i modelli o crea servizi personalizzati" (needs
      `Scelga` / `crei`). Others are noun phrases my regex cannot tell apart from imperatives
      (`Revisione e conferma`, `Documenti e verifica`, `Accedi o registrati` as a menu label), so the
      list needs human triage rather than a blind pass. List: `/tmp/claude/bare_it.txt`.

### THE FINDING THAT MATTERS, and it invalidates every count quoted for this job including mine

**The sweep only looks at PRONOUNS, so strings carrying an informal VERB and no pronoun were
invisible to it.** `"Bitte wähle eine Bewertung aus"` contains no `du`, no `dein`, so it never
entered the changed set and never appeared in the review list. Not a bug in the tool; a hole in how
the job was specified, mine.

**Measured by me: 41 German strings in that exact shape**, list at `/tmp/claude/bare_imperatives.txt`.
So the real German informal set was **330 + 41 = 371**, not the 332 this file has been quoting.
Several are grammatically broken in the shipped file right now, for example
`ui.searchOverlay.errorBody` reads "Prüf Ihre Verbindung und versuch es nochmal", informal verb next
to formal possessive, while its near-duplicate `common.errorMessage` was converted correctly.

The reviewer also caught one break the greps could not see, because the pronoun and verb are not
adjacent: `resendAccess.hurryGotLink`, "Falls Sie ... erhalten hast, nutze diesen". And an ALL-CAPS
case break where the mechanical `DEIN` to `Ihr` swap dropped the upper case, so the homepage headline
currently renders "Ihr NÄCHSTER TERMIN WARTET".

**Consequence for the law:** `COPY_LAW.md` section 8 now says any future register gate must match
verbs, not only pronouns, or it gives a false all-clear.
- [ ] D4 , the branch collision. **BLOCKED on OWNER DECISION D5**, which is what to do with
      `claude/principles-security-audit-0ae738`. That branch flipped 18 German business strings the
      OTHER way, Sie to du, so merging it after the sweep silently reverts part of this decision.
      Nothing to do here until D5 is answered; my lean, recorded in chat 2026-07-29, is cherry-pick
      the security migration and the method file and leave the other 658 files alone. (Checked this
      round: still blocked on the same owner decision, nothing changed, correctly left open rather
      than guessing D5 myself.)

## E. The dead-key measurement (was parked as "timed out", now done)

**Result: roughly 27% of the German translation corpus is unreachable from any source file.**

Two independent tests, both run 2026-07-29 against `main`:

| test | method | result |
|---|---|---|
| quoted-token | every quoted identifier-like token in `app`, `components`, `lib` (7,971 distinct); a key counts as live if the full key or ANY of its dotted suffixes appears | **1,660 of 5,687 unreferenced (29%)** |
| strict | the key's LEAF name must appear nowhere in source at all, even unquoted, against a 26,420-word identifier vocabulary | **1,518 dead (27%)** |

The 142-key gap between the two is keys whose leaf collides with some bare identifier, so they may be
reached dynamically. Take **1,518** as the defensible floor.

Spot-verified by hand, not inferred: `booking.bookingErrorAfterPayment` and `profileHub.nextAppointment`
appear **nowhere** outside `messages/`, despite `profileHub` being an actively used namespace
(`app/[locale]/profile/page.tsx:31` and three other call sites). So a live namespace is carrying dead
keys, which is exactly why a namespace-level check would have missed this.

Worst namespaces: `common` 168, `dashboard` 137, `barber` 129, `ui` 93, `refundFlow` 89,
`dashboardMakeup` 85, `home` 83, `booking` 78, `dashboardWaxing` 68, `partner` 50.

**Why this matters to the sweep specifically:** more than a quarter of the register-conversion work,
in all four languages, is being spent on strings no user will ever see. Had this run first, it would
have cut the job by roughly 27%.

**Known limit, stated rather than papered over:** this is a static test. A key assembled at runtime
(`t(\`stat${kind}\`)`) looks dead to it. The 142-key gap is the visible part of that risk; there may
be more. So this list is a strong candidate list, **not** a delete list.

**NOT deleted, and deliberately so.** Removing 1,518 keys across four locale files is a destructive
change to 6,072 lines, it is irreversible in practice once the translations are gone, and it needs
the owner to say go. Lists on disk: `/tmp/claude/dead_keys.txt` (1,660) and
`/tmp/claude/dead_strict.txt` (1,518).

- [x] E1 , measure the dead keys. verified: commit `89b959eee`; lists written to
      `/tmp/claude/dead_keys.txt` (1,660) and `/tmp/claude/dead_strict.txt` (1,518); hand spot-checks
      on `booking.bookingErrorAfterPayment` and `profileHub.nextAppointment` returned zero source
      hits outside `messages/`, against `app/[locale]/profile/page.tsx:31` proving the namespace
      itself is live.
- [ ] E2 , delete them. **BLOCKED on owner sign-off**, destructive and irreversible. (Checked this
      round: still blocked, no sign-off on record, correctly left open; not mine to authorize.)

## F. ESCALATION , regex cannot certify this file, and that is the finding

**The convergence rule was violated and I am not looping a fourth time on the same method.**
Round-1 review: 5 blocking items. Round-2 review: **34**. That is not a shrinking tail.

**Why, diagnosed rather than guessed.** Every scan run so far, mine and the coder's, has been a
**verb-stem list**. Add stems, find a new layer. So I tried a structural detector instead, on the
theory that a formal sibling next to an informal one is visible without morphology: for each JSON
object, flag any value with no `Sie`/`Ihr` when a sibling has one, plus any capitalised first word
ending in `-e`. **It returned 441 candidates and they are overwhelmingly false positives**, because
German noun phrases are shaped exactly like imperatives to a regex: `Keine Ergebnisse`,
`Alle ansehen`, `Neue Buchungen`, `Beliebte Salons`. Precision collapsed; recall was never the
problem.

**The honest conclusion: there is no regex that certifies `messages/de.json` is free of informal
German.** Distinguishing `Finde` the imperative from `Freunde` the noun needs morphology, not
pattern matching. What closes this properly is one of:
1. a native or fluent German read of the ~600 customer-visible strings, which is a person, not a
   script;
2. a real morphological analyser (spaCy `de_core_news_sm` + a POS filter for `VERB` with
   `Person=2|Number=Sing`), which is a new dependency and a genuine build;
3. accepting the current state, which is materially better than where it started and not certified.

**Where it actually stands, measured:** German began at 332 pronoun-carrying informal strings plus at
least 41 pronoun-free ones. 330 were mechanically converted, 267 hand-conjugated across two rounds,
and 34 more are in a third round now. Every round has found real defects and every round has been an
improvement. What no round can promise is that it was the last one.

- [x] F1 , diagnose why the loop is not converging. verified: sibling detector run this session,
      441 candidates, dominated by false positives; list at `/tmp/claude/sibling_mismatch.txt`.
- [ ] F2 , **OWNER DECISION.** Pick one of the three closures above. My lean: option 1, a human read,
      scoped to the customer-visible surfaces rather than all 5,687 keys, because option 2 is a real
      build for a one-off job and option 3 leaves marketing copy uncertified on a pre-launch product.
      (Checked this round: this is explicitly the owner's call, not a coder's; nothing for me to
      execute here, and guessing an answer on the owner's behalf would be worse than leaving it open.
      Confirmed still correctly open.)

## Named cost of D6, stated once and not re-argued

Going formal changes 91% of German customer copy and 100% of Italian, and it is the harder register
to write warmly in. The mitigation is that the law C2 must carry warmth rules explicitly, because
"Sie" plus terse German reads institutional, which is the failure mode. The owner has decided; this
is recorded as the risk to design against, not as a reason to revisit.
