# REPLY_TEMPLATES.md, replacement draft

**Proposed replacement for `~/.claude/REPLY_TEMPLATES.md`. The original is untouched; this is the
draft for the owner to accept or reject.** Evidence throughout is the 22 real pairs in
`_plans/reply_pairs.json` from the session that produced the complaint.

---

## The one root cause

**Every message opens with news from inside my workshop instead of the answer to what he asked, so
before he can find his own thread he has to read a bulletin about tools he has never seen and cannot
open.**

What it costs him: he re-asks the most basic possible question. Half his replies in this session are
him hunting for his own thread again ("huh so what now is ths session finishd or", "ok n next?",
"so", "alr", "bru"), and five separate times he asked why I had stopped when I had not stopped.

**The control pair proves it, and it is the only one of its kind in the 22.** He asked "huh so what
now is ths session finishd or". My next message opened *"Session is finished on my side."* That is
the single message whose first three words answer his literal question. His reply is the only
itemised work order in the whole set: *"for 1 from fix it 2 fix 3 cant we make it so it stays in ur
head... 4 wdym"*. When his question was the first sentence, he stopped asking where he was and
started giving instructions.

---

## Why the file this replaces did not work

It was in force for the entire session that produced "i dont understand what ur talking abt ths
output it always cobfuses me". Three of its central rules are measurably not the lever:

- **Line-count shapes are not it.** The single shortest substantive message in the set is template 1
  executed perfectly: 290 characters, 3 lines, no bullets, no table, no code. He pasted it straight
  back and wrote *"i dont understand"*. The message that produced the complaint itself is template
  6b executed correctly.
- **Length is not it.** Already measured: messages he moved on from averaged 1036 characters, ones
  he pushed back on averaged 1113. Nearly identical.
- **The mandatory "Next:" line is worse than not it.** It appears in 13 of the 20 real messages,
  including every single "why do you keep stopping". Rule 4 below reverses it.

The old file's IN/OUT list (branch, files, commits, hook names, scores stay out) stays. It was
right, it just was not the lever, and treating it as the lever is how the real defect survived a
whole session with nine rules pointed at it.

---

## The four rules

One rule per half of what he said he wants: is it done and what do I do now, what changed in my
product, whether to trust it.

### 1. The first sentence answers his last message

The grammatical subject of the first sentence is a thing HE named. When his last message named
nothing ("so", "alr", "why did you stop omfg"), the subject is the item on **his** list that this
turn moved.

**Never the subject of a first sentence: check, gate, box, batch, run, report, fix, false alarm,
session, or I.**

BEFORE (drew the complaint, after he said "why did you stop omfg"):

> Both older false alarms are fixed, and the fix broke something on its first pass.

AFTER:

> Two more off your fix-em-all list are working, and the rest are running now.

BEFORE (290 characters, plain English, drew "i dont understand"):

> Fixed. A check caught two boxes where I had written the evidence as prose instead of something you
> can look up, so both now carry the commit you can open.

AFTER:

> Nothing off your list yet, still working through it. What I just cleaned up was my own
> record-keeping, one minute.

The trap this rule has: echoing his word without answering him passes the eye test and fails him.
*"You asked why I stopped. Here is what the check does."* is the defect wearing his vocabulary.

### 2. The second line is what is different on Solen, in something he can look at

One line, naming a screen, a price, a customer, or the literal words on a page. When nothing
customer-visible changed, say so plainly and immediately say what the invisible work buys him, in
his product's terms.

**The strongest evidence in the file is one pair, same question asked twice.**

BEFORE (drew *"whats two swap etc i dont understand"*):

> should the Inspo cards link toward real pricing the way every salon card already does, or is two
> taps acceptable since the booking flow shows the full breakdown before you commit

AFTER (this is the real next message, and it drew *"ok n next?"*):

> **[Inspo, the real page](link)** Tap any look: the card says **ab 500 CHF**, and the page it opens
> says **ab CHF 45**.

Same subject, same vocabulary, one message apart. The first asks him to rebuild a path in his head;
the second hands him the thing and quotes what is on it.

Four of the 22 messages carry something he can open. Their replies: an itemised work order, "ok n
next?", "fix em all", "so". The three he could not understand carry nothing openable. Four out of
four against zero out of three.

Do not freeze the wording of the nothing-changed line. A fixed sentence repeated every turn of a
machinery week becomes furniture, and this estate has already produced that failure once.

### 3. Everything still moving goes in one block at the bottom, labelled

`Not settled:` is the last block before rule 4's line. My corrections, my dead ends, my second
theory, and any claim that could be wrong tomorrow live there and nowhere else. **Every sentence
above that label is one he can still act on tomorrow.**

BEFORE:

> Both older false alarms are fixed, and the fix broke something on its first pass.

The verdict and the thing undermining it are in one sentence, before he has been told what was
fixed. AFTER, the same content, relocated:

> Not settled: my first attempt at this broke the way you excuse a real exception. Its own tests
> caught it in a minute and it never left my desk.

**This is a position rule, not a deletion rule, and the difference matters.** Three messages open on
a self-correction and none of them drew a comprehension complaint; they drew "so", "alr", and a stop
complaint. Owning an error is not what confuses him. Making the history of my own belief the first
thing he reads is.

It is a block, not a line. Two unsettled things get two lines. Compressing an honest dead end and a
minor footnote onto one line is how the dead end becomes the thing he skims past.

### 4. The last line is his move, or there is no last line

Never the work I am about to start.

**Measured on all 22 pairs, and this is new: every one of the five "you stopped" complaints follows
a message whose last line announced my own next task.** Five out of five.

- *"Now doing the injection gate"* → "Why did you not finish"
- *"Remaining: the batch gate..."* → "why do you keep stopping"
- *"Next I'm going through the 13 one at a time"* → "hardedn u keeo stopping"
- *"Next I'm back on the 13 broken repairs"* → "again u stopped"
- *"Next I'm driving the remaining seven the same way"* → "why did you stop omfg"

Announcing what I am about to do reads to him as an announcement that I have not done it.

The honest limit, checked rather than assumed: five other messages end the same way and drew "alr",
"bru", "fix em all", "so", "ok". So that ending is present in every complaint but does not guarantee
one. It is a reliable smell, not a proven cause.

AFTER, on the message that produced the complaint:

> Your move: the refund pages, the ones a customer opens when money went wrong, are English for a
> German customer. Translate them, or leave them until launch?

If there is nothing for him to do, the message ends on the Not settled block. An invented decision
is worse than a short message. He located the one real question I asked him all session, pasted it
back word for word, and still could not answer it, because it sat four paragraphs down inside prose.

---

## Kept from the old file, in one line each

- **Never a promise about my future behaviour.** Say what exists now that did not exist before.
- **What goes in and what never does:** in are what is true now, a link, the plain why when it
  changes what he does, what he must decide. Out are the branch, files and paths, hook and gate
  names, scores and run counts, and the order I did things in.
- **A blocked message sends only the corrected sentence,** never the whole message again. He already
  read it.
- **If a sentence announces a count, it is a list.** Demoted from law to formatting, because bullets
  in the three messages he could not understand were 0, 3 and 0, and the two messages carrying
  tables drew the two calmest replies in the set. It is his instruction from 2026-08-09 and it
  stands; it is simply not the thing that was going wrong.

## Deleted, with the reason

- **The seven-template index and every fixed line count.** Selecting a shape from his last message
  was the right instinct and the shapes were the wrong output of it. Rules 1 and 4 keep the instinct
  and drop the shapes.
- **The mandatory "Next:" line in 6b.** Reversed by rule 4.
- **The three-group "Left:" block at the end of every reply.** Two of its three groups are my own
  work, which by the file's own IN/OUT list has no business in his message. Rule 4 replaces it with
  the one group that is his.
- **The rule about my machinery not owning three replies in a row is NOT deleted here.** It is armed,
  and he overruled my argument against it by name. Not mine to remove in a draft.

---

## Honest limits

**A machine could check these, if he ever wants that. No new hook is proposed here; he chose
"replace, don't stack" on 2026-08-08 and it stands.**

- Rule 4 is fully checkable: does the last line match "Next I", "Now doing", "Remaining:".
- Rule 2 is checkable in the weak sense: does the message contain a link or a quoted string of real
  screen text.
- Rule 1 is checkable only as word overlap with his last message, which is exactly the form that can
  be satisfied by ceremony.
- Rule 3 is checkable for position: if "Not settled:" appears, it is in the last third.

**These are judgment and no check reaches them:** whether the first sentence answers him or merely
echoes him, whether the Solen line carries real news or is furniture, and whether a claim belongs
above the Not settled label or below it. Those three are where the whole thing actually lives.

**There is already a delivery channel for reply rules, and it is not a new hook.**
`reply-shape-preflight.py` injects reply rules when his message arrives, before a word of mine
exists, so it costs zero extra messages. If these are ever armed, that is the only place they can
work. His call, not mine.

**What he stops hearing if this is adopted:**

1. **Machinery that broke in a way he never asked about loses the opening of a message,** and some
   of it will not survive to the bottom at all.
2. **My own next task, every time.** The risk is real and worth naming: a message with no "Next I"
   line could read as me having stopped. Against that, all five of his stop complaints arrived
   underneath exactly that line, so it was not buying the reassurance it was written to buy.
3. **The detail of how a fix nearly went wrong,** compressed to one line in the Not settled block.
4. **Nothing on length.** Length is not the lever and shortening is not the fix. The shortest
   message in the set is one of the two he could not understand.
