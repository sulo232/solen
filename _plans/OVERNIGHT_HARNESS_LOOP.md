# OVERNIGHT HARNESS LOOP , standing order 2026-08-22

**His words, before going to sleep:** *"ok keep maiking fixes n these subagents sh as a loop till
its all improved ur harness n ask alot of times to llm council too im goong to sleep dont stop im
telling u keep trying to find stuff and output n also research alot n ye ask subagents council alot
if u think ur finishd ur not okay?"*

**Standing rules for this loop, until he says otherwise:**
- Do not stop. If I think I am finished, I am not. Find more.
- Run councils repeatedly, not once. Fan out wide, adversarially.
- Research, do not guess.
- Fix what is safe, park what needs him (his earlier instruction: "Fix the safe ones, ask on the rest").
- Never push. Never edit any settings.json. Never write to the database.
- Every closing message ends with FIXED and NOT FIXED lists (his instruction tonight).

## Round log

- [x] ROUND 2 (verified: commits 62ad4a7, a5552e0, 16be327, d8c997d in ~/.claude; e5a1a015e, abdc27b97 in the product repo) , the readback defect confirmed and closed (a numbered answer list buried under 19
      lines counted as one he could see at a glance; its suite said 18/18 because every buried case
      it had used a prompt with no numbers, which switched the new counter off). The plain-English
      miss closed: a message about my own mockup CHECKS counted as being about his mockups, and
      over 6,027 replies the flag count is 3,837 before and after, so no new false alarm. Two more
      stuck states added to the health report, 35 confirmed-but-past bookings and 2 walk-in rows
      in the chair since 3 June, both matching an independent count. The loop rule stopped
      demanding questions after he hands the work over, with its own limit recorded.
- [x] ROUND 1 (verified: commits 9e3f6e7, caf1286, 91f82d3, 929326f, dee92db, f83474c, 7b339ea, cb13052, b951861 in ~/.claude; b899a914b, 69ae5392c, 388031545, 24c99fefa in the product repo) , the nine-reader scan. Acted on: the "said" false alarm (205 to 133 refusals over
      4,279 link-free replies), plain-English calling his own walk-in queue irrelevant, the
      armed-check claim counting files nothing runs (69 to 59), the walk-in in-chair sweep (built,
      graded PASS on all ten items by a second reader), the decision-file contradiction, the repeat
      check refusing 6 real messages, "never landed" not counting as a reason, the pre-launch
      premise, the mistake-detector reading filenames I typed, and the promised-visual arm folded
      back behind its structural trigger once its own cap was spent.

## Carried into the next rounds, from the nine readers. None of these are done.

- [ ] FIVE OF TODAY'S FIXES HAVE TESTS THAT PASS WITH THE FIX REMOVED. A reader undid each change
      and every suite reported the same pass count. Find which five, and give each a case that
      fails when the change is reverted.
- [ ] THE READBACK CHANGE IS WRONG, not merely untested: a numbered answer list buried far down a
      long reply now satisfies it, which is the failure that file says it exists to catch.
- [ ] 1,720 of 5,853 pieces of customer text in messages/en.json render nowhere (roots scanned:
      app, components, components-legacy, lib). Three make promises: a 14-day window to file again
      with NO withdraw action anywhere in the code or on any branch, a 30-day retention line, and
      the customer's rights to see, correct and delete their data.
- [ ] 35 bookings marked confirmed whose appointment time has already passed, oldest 80 days.
- [ ] 64 files wired to nothing, RE-DERIVED MYSELF and the reader's 87 was wrong. Roots scanned:
      ~/.claude/hooks (243 files, 51 orphaned), the project's scripts/hooks (16 files, 10) and its
      .claude/hooks (36 files, 3). Registered set = 241 names from three settings files plus three
      dispatchers; underscore-prefixed shared libraries excluded because imports keep them alive.
      HOW THE READER GOT 87: its own leftover scratch files are still on disk and registered_all.txt
      is 0 bytes, so its registered list was empty and every file counted as orphaned. The later
      corrected run landed at 87, still high. Includes the no-dash, plain-English and
      bullets-when-you-promise-a-count rules, whose text was retyped into the pre-write reminder.
- [ ] mockup-diagnosis-gate.py fails its own test and has since 7 August. pushback-gate scores 21/22.
- [ ] Three separate answers to "is there open work in the plan file" disagree; one interrupts real
      work demanding a box be ticked that he parked himself.
- [ ] The 07:03 promise: move the checks that only read my words to before I write. THE LIST NOW
      EXISTS, delivered 2026-08-23 by a reader that counted real fires in this session rather than
      guessing. Roster: 62 registered Stop checks, three of which dispatch others, so 77 individual
      checks, 34 of which fired at least once. SEVEN read nothing but my own words AND fired more
      than five times, together 99 of the 254 individual fires, 39 percent of every interruption:
        missing-needs-a-reason 27, say-whats-next 23, no-regression-by-fix 14,
        fix-needs-before-after 12, measurement-needs-scope 9, repeat-mistake-detector 8, readback 6.
      Four more are movable but quieter: visual-promised-needs-link 4, prelaunch-reality 3,
      pushback 2, no-permission-question 1.
      The reader wrote the exact before-you-write sentence for each of the seven. MOVING them is a
      wiring change and arming is HIS call, so the sentences get prepared and the switch is left to
      him.
      Caveat it flagged itself: the transcript grew from 15,482 to 15,598 lines while it worked, so
      the counts come from a frozen snapshot rather than the whole session.
- [ ] gate-eval reports NOT READY or UNPROVEN on all four of the batch marked finished, and the log
      recording three consecutive failing grades is uncommitted.

## Needs him, do not do these

- The customer-severity ladder, parked by him pending research into how other marketplaces handle
  an account that keeps causing problems.
- Anything that changes the WORDS a customer reads.
- Arming or disarming anything.
