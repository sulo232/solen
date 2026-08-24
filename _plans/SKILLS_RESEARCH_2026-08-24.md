# What is out there, read on 2026-08-24

Written down because research that lives only in a chat reply is gone at the next compaction, and
"we already looked into that" with nothing to point at is how the same search gets run twice.

Everything here came from a page fetched on 2026-08-24, or from a file read on this machine.
Nothing was installed and nothing was downloaded.

---

## 1. Anthropic's official skills, all 19

Fetched from the repository's own JSON listing, all at HTTP 200. Note two corrections to what the
README implies: the `skills/` folder is FLAT, not divided into the four categories its prose
mentions, and the public repo is NOT the whole set of official skills. Eight skills already enabled
on his account do not exist in it at all (ai-tell-scrubber, uiux-audit, learn, import-memory,
morning, explain-usage, schedule, setup-cowork).

### Already has it (11)

| skill | what it does | duplicates |
|---|---|---|
| algorithmic-art | generative art in p5.js | the enabled one of the same name |
| canvas-design | posters and static designs as png/pdf | the built-in design canvas |
| claude-api | model ids, pricing, streaming, caching | already in this session's skill list |
| docx | Word files | the enabled one |
| mcp-builder | build MCP servers | the enabled one |
| pdf | read, merge, split, fill, OCR | the enabled one |
| pptx | slide decks | the enabled one |
| skill-creator | create and improve skills, run trigger evals | he has it twice, enabled and on disk |
| web-artifacts-builder | multi-component React artifacts | the enabled one |
| webapp-testing | Playwright against a local app | his own test-sweep plus the local Playwright setup |
| xlsx | spreadsheets | the enabled one |

### Worth having (2)

**doc-coauthoring**, a structured interview for proposals, specs and decision documents. He writes
these constantly. It pulls context out of a person in passes rather than one shot, which suits
someone whose input arrives garbled.
COST, named: it is an interview, so it front-loads questions. With mangled transcription a
multi-question round trip is exactly where answers get misread. Good for written specs, wrong for
anything time-pressured.

**discernment-nudge**, appends two or three follow-up questions tied to specifics in what was just
produced, to help check facts. It is the only skill in the repo aimed at his stated problem of
catching the agent's mistakes when he cannot read the code himself.
TWO COSTS, both real: its own description says it skips when the user is writing code they will
run, which is most of his sessions. And it appends questions to the end of replies, which collides
with the reply rules and the ban on padding. Value is confined to his non-code turns: pricing,
launch sequencing, salon acquisition.

### Not for him (6)

- **academy-guide** turns "how do I" questions into course recommendations, and its own text says
  to skip when the user is mid-task, which is his default state.
- **brand-guidelines** applies ANTHROPIC's colours and typography. Collides head-on with a frozen
  palette and a gate that blocks hardcoded hex.
- **frontend-design** instructs the agent to invent a palette per brief and "take one real
  aesthetic risk". That is the opposite of taste rule 9 and of a LOCKFILE. Its one good part, a
  calibration naming the three default AI looks, is already covered by huashu-design's
  anti-AI-slop checklist.
- **internal-comms** is status reports and company newsletters. He is solo.
- **slack-gif-creator** needs a team and Slack.
- **theme-factory** swaps ten preset themes onto artifacts. He has one theme and it is locked;
  preset-swapping is drift with a friendly name.

### The finding worth acting on

Their own skill-builder says, verbatim: *"currently Claude has a tendency to 'undertrigger'
skills, to not use them when they'd be useful. To combat this, please make the skill descriptions
a little bit 'pushy'."*

And it ships a MEASURABLE optimizer for exactly that: generate roughly 20 should-fire and
should-not-fire queries, split 60/40, run each three times for a trigger rate, iterate the wording
up to five times, and select by HELD-OUT score rather than training score to avoid overfitting.
That is directly usable on the skills here that under-fire. It is on disk at
`~/.claude/skills/skill-creator/scripts/improve_description.py`, and it is blocked only because it
shells out to `claude -p`. See the login note at the bottom.

### Installation, quoted

> `/plugin marketplace add anthropics/skills`
> then `/plugin install document-skills@anthropic-agent-skills`
> or `/plugin install example-skills@anthropic-agent-skills`

Their marketplace file actually defines FIVE plugins, not the two the README names. Those two
commands install 16 of the 19; claude-api, academy-guide and discernment-nudge each need their own
install line.

---

## 2. Outside Anthropic, and the security read is the deliverable

### There is no review, and this is documented, not inferred

Anthropic's own words on skills: *"a malicious Skill can direct Claude to invoke tools or execute
code in ways that don't match the Skill's stated purpose"*, and on plugins: *"Plugins and
marketplaces are highly trusted components that can execute arbitrary code on your machine with
your user privileges."*

Review exists for exactly two channels: Anthropic's official marketplace, curated at its own
discretion, and its community marketplace, where entries pass automated scanning and are pinned to
a commit. **For anything else, a third-party marketplace or a repo cloned into a skills folder,
there is no review process at all.** No code signing, no provenance, no integrity check.

### Three things a careful human read cannot catch

1. **Frontmatter `allowed-tools`, which workspace trust never gates.** Their docs: *"Claude Code
   applies a project skill's allowed-tools whenever you or Claude invoke the skill, including in a
   -p run in a folder you've never trusted."*
2. **An injected command, written with a leading `!` and backticks.** Their docs: *"The
   !`<command>` syntax runs shell commands before the skill content is sent to Claude"* and
   *"Injected commands never prompt for permission."* Documented silent execution, before the model
   reads a word.
3. **A bundled script's CONTENTS never reach the model at run time, only its output.** A reviewed
   script and a backdoored one are indistinguishable from inside a session.

And the one that defeats reviewing entirely: a script that fetches its dependency at run time from
a public feed. You read it today; the package changes tomorrow; your review is void.

### Sandboxing does not cover the dangerous part

The Bash sandbox is real and useful: it denies writes to the skills, agents, commands and hooks
folders and to settings files. But its documented scope is *"only to Bash commands and their child
processes"*, and the reason those paths are protected is stated plainly: a command that could edit
them *"could add a hook or MCP server that Claude Code runs OUTSIDE the sandbox."*

### The landscape, with numbers pulled live on 2026-08-24

Ten significant collections were read. **Eight of the ten ship no skill code at all**, they are
README files of links pointing at hundreds of other people's repos. Stars on a list say nothing
about the safety of anything it links to. One 14,798-star list has two contributors and had not
been pushed since April.

Published research on malicious skills is recent and substantial. One vendor scan of 3,984 skills
on a public registry found 36.8 percent with at least one security flaw, 13.4 percent critical, and
76 human-confirmed malicious. A separate campaign delivered a macOS credential stealer through a
"Prerequisites" section telling the human to download a password-protected zip, chosen specifically
to evade antivirus scanning.

### The intake procedure, and what is automated

`~/.claude/scan-a-skill.py` automates the mechanical half: file inventory, frontmatter grants,
injected commands, network and credential reaching, obfuscation, invisible characters, and plugin
hook declarations. It refuses to give a clean verdict on pattern-matching alone.

**The half that cannot be automated, and the research agrees:** a person reads every SKILL.md end
to end, looking for instructions aimed at the agent's behaviour rather than at the task. "Back up
the file after editing" is helpful or hostile depending on where the backup goes, and no pattern
settles that.

An existing scanner worth considering rather than rebuilding: NVIDIA publishes one that scans a
skill folder or git URL across seventeen categories and emits a risk score. Its detection quality
is UNVERIFIED here; only its repository page was read.

---

## 3. The login that is blocking two things

Root-caused rather than guessed. The credential is not in a file, it is in the macOS keychain under
`Claude Code-credentials`, and that entry reads fine from here. Inside it:

    claudeAiOauth/refreshTokenExpiresAt   2026-08-04 01:08   EXPIRED 20 days ago

Once the refresh token expires the CLI cannot mint a new access token, which is why `claude -p`
returns "OAuth session expired and could not be refreshed", and why the first failure appears in
the transcripts on 2026-08-08 rather than on the 4th. It is not a network fault: three Gemini model
names answered HTTP 200 from the same shell minutes earlier, which is the control.

Two things depend on it: the skill-description optimizer above, and the Claude seat of the
three-model council. Signing in again is the fix and only he can do it.
