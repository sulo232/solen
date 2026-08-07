# REPLY_LAW.md , the shape of a reply to the owner

From decision Q9/Q10, `_plans/SYSTEM_DECISIONS_2026-08-07.md`. Owner verbatim: *"you just tell me a
lot of before and after numbers, block names for untouched file three out of three, passes three out
of the... I don't understand any of that. Also, like, which files you touched? I don't care at all.
There's, like, a lot of text and unorganized texting. It's, like, visually, it's, like, unpleasing.
So research that."*

Parent: LAW_SYSTEM.md. This file owns the SHAPE of a reply. REPORT_SYSTEM.md keeps what a report must
contain and where it is filed. Where the two disagree about shape, this file wins.

## 1. The research, ours first

Measured over every Solen transcript on disk, 7,574 session files, by
`scratchpad/scan2.py`: 55 owner messages complain about the shape of a reply, 88 praise one.
Comparing the reply that came immediately before each:

| in the reply | before a complaint (55) | before praise (88) |
|---|---|---|
| median length | 960 characters | 651 |
| named 3 or more files | 33% | 6% |
| carried an "N out of N" score | 31% | 18% |
| named a gate or a hook | 15% | 10% |
| carried a table | 5% | 6% |

The file list is the sharpest split, five times more common ahead of a complaint. Length separates
them far less than this estate assumed, which is decision Q10 in one number. A table separates them
not at all, so the ban list below does not ban tables.

Outside, all sourced:

- People scan, they do not read. 79% of users always scanned a new page, 16% read word by word.
  Concise text measured 58% better usability, a scannable layout 47%, all three changes 124%
  ([NN/g, How Users Read on the Web, 1997](https://www.nngroup.com/articles/how-users-read-on-the-web/)).
- A reader sees about two words of a line before deciding to keep going
  ([NN/g, First 2 Words](https://www.nngroup.com/articles/first-2-words-a-signal-for-scanning/)).
- Eyes land on headings and skip the prose between them, the layer-cake pattern
  ([NN/g](https://www.nngroup.com/articles/layer-cake-pattern-scanning/)).
- On a phone, hard material costs about 30 milliseconds more per word and readers re-read to keep up.
  Brevity and prioritising are the named fix
  ([NN/g, Reading Content on Mobile Devices](https://www.nngroup.com/articles/mobile-content/)).
- Answer first is doctrine, not taste: US Army correspondence regulation AR 25-50, "bottom line up
  front" ([summary](https://mattstromawn.com/writing/bluf/)), descended from the newsroom inverted
  pyramid born of telegraph lines that cut out mid-story ([Poynter](https://www.poynter.org/reporting-editing/2003/birth-of-the-inverted-pyramid-a-child-of-technology-commerce-and-history/)).
  Sources disagree on the year the phrase entered AR 25-50, so no date is claimed.
- Short sentences, active voice, one idea per paragraph, a list for anything complex
  ([Federal Plain Language Guidelines](https://plainlanguage.gov/guidelines/)).
- A percentage or a ratio is the worst way to hand a number to a non-specialist. Counts of real
  things are understood where percentages are not, and a less numerate reader trusts a worded
  statement more than a numeric one ([Gigerenzer, What are natural frequencies?, BMJ
  2011](https://pure.mpg.de/rest/items/item_2099208_9/component/file_3562683/content)).

## 2. The shape

Every reply, in this order, and nothing else:

1. **The thing itself.** The link, the yes or no, or what is now true. One sentence.
2. **Up to three lines of what changed.** One idea per line, each starting with its own subject.
3. **Your call.** Only if a decision is really his. Name the fork, give the recommendation.
4. **Next.** One line, only if work is still open.

Parts 3 and 4 are usually absent. Under 8 lines of text is the target.

## 3. The rules

One wrong reply, one right reply, one sentence, the format he approved in the taste book
(`public/_mockups/taste-book/index.html`).

**1. The answer is the first thing on the screen.**
WRONG: *"I started by reading the settings files, then mapped the wiring, and after confirming the
write path I found it. The header is fixed now."*
RIGHT: *"The header is fixed. [Open it](https://x.trycloudflare.com/de) The logo had no width set,
so it stretched."*
He decides whether to read the rest from the first line, so the first line is the answer.

**2. No scores.**
WRONG: *"Self-test 5/5, and 3 of 3 runs passed."*
RIGHT: *"I tested it. It catches the bad case and lets the good one through."*
A score is my homework, not his news, and he has said he does not know what "three out of three" counts.

**3. No file list.**
WRONG: *"Touched SalonCard.tsx, globals.css, LOCKFILE.md and settings.json."*
RIGHT: *"The salon card changed, and the search page picks it up automatically."*
He said he does not care at all. The plan page holds the trail, and the reply links the page.

**4. No machinery.**
WRONG: *"mockup-first-gate.py blocked the write, so I touched the skip flag and retried."*
RIGHT: *"A check stopped me saving it until I had shown you the before and after. I did, then saved."*
The gates shape what I do. They are never what he reads.

**5. A number only when the number is the point.**
WRONG: *"86% of visible text is weight 600 or more and the anchor is 1.57x body at 390x844."*
RIGHT: *"Almost every word on that screen is bold, so nothing stands out. On the new one, one line
is clearly the biggest."*
Say what he would notice, or count real things. A percentage he cannot see means nothing.

**6. One idea per line, subject first.**
WRONG: *"The card now uses the shared component and I fixed the spacing and the photo fallback and
moved the price, plus search inherits all of it."*
RIGHT, each on its own line: *"Card: the same one search already uses. / Photo: a fallback instead
of a grey box. / Price: now under the name."*
He scans down the left edge, so the subject goes there.

**7. Say it once.**
WRONG: the same point in the opening line, again mid-reply, again in a closing recap.
RIGHT: it appears once, where it belongs.
Two paragraphs saying one thing is a paragraph he reads twice for nothing.

**8. After a block, send only what changed.**
WRONG: the whole message again with a branch name added.
RIGHT: the branch name.
He has read the rest. Re-sending it makes him hunt six new words inside four identical paragraphs.

## 4. On a phone

- Blank line between blocks. A wall with no gaps is the "unorganized texting" he named.
- Bold only the lead words of a line. Bold everywhere is bold nowhere.
- A heading only when there are three or more blocks. A heading over two lines is furniture.
- One link, near the top, as a tappable label, never a bare URL, never a LAN address.
- At most one table, never before the answer, never instead of the answer.

## 5. What a machine can check, and what it cannot

Already armed in `~/.claude/settings.json`, no new gate needed:
`no-plumbing-in-reply-gate.py` covers rule 4 · `no-emdash-reply-gate.py` covers the dash ban ·
`reply-length-gate.py` covers the wall and the leading table · `reply-repeat-gate.py` covers rule 8.

Objective and cheap, so legal under decision Q1, and both belong INSIDE the already-armed
`no-plumbing-in-reply-gate.py` rather than in two new files: the score pattern (rule 2) and three or
more code file paths (rule 3). The Stop list already runs 64 checks, so a new file is the wrong move
twice over, by Q1 and by LAW_SYSTEM 6.2.

Judgment, and never a gate: whether sentence one is actually the answer, whether a number earns its
place, whether a line holds one idea, whether a word is jargon to him.

One real hole. `plain-english-gate.py` sits on disk and is wired in NO settings file (checked all
four). He asked for it by name on 2026-07-31, "harden the gate so u acc only give me plain ver", and
it has never enforced anything. Arming it is one line in a file a sandboxed session cannot write.

## 6. What this retires

`report-summary-gate.py` requires the exact thing rule 3 bans: a turn that edited 3 or more files is
blocked unless the closing message names 60% of them (`report-summary-gate.py:26-27`, `:153`), and
REPORT_SYSTEM.md section 4 item 2 demands "EVERY file created/edited/deleted this turn, as clickable
links, one line of WHY each". His dated 2026-08-07 answer is that he does not care at all, so the
decision wins and the gate goes. Its real concern, no silent edits, survives in the plan page, which
lists every file and which the reply links.

REPORT_SYSTEM.md section 4.5 moves here as rule 8 and becomes a pointer, per decision Q8.