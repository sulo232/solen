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

### D. The sweep (blocked on C2, deliberately)
- [ ] D1 , convert the 332 German informal strings to Sie, against the written law rather than ad hoc.
- [ ] D2 , convert the 237 Italian informal strings to Lei.
- [ ] D3 , reconcile the 40 French informal stragglers to vous.
- [ ] D4 , the branch collision: `claude/principles-security-audit-0ae738` flipped 18 German business
      strings the OTHER way, Sie to du. If that branch merges after the sweep it silently reverts part
      of this decision. Must be handled at merge time.

## Named cost of D6, stated once and not re-argued

Going formal changes 91% of German customer copy and 100% of Italian, and it is the harder register
to write warmly in. The mitigation is that the law C2 must carry warmth rules explicitly, because
"Sie" plus terse German reads institutional, which is the failure mode. The owner has decided; this
is recorded as the risk to design against, not as a reason to revisit.
