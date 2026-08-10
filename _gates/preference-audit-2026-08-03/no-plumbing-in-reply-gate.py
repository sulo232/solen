#!/usr/bin/env python3
"""Stop gate: keep my own enforcement machinery out of the owner's reply.

Owner, 2026-07-26, verbatim: "why do you keep drifting about stuff that doesn't
even have to do anything from what I'm fucking telling you to do?"

Root cause it encodes: Stop hooks fire on almost every turn, and I had been
RELAYING them. A gate complains about an unfinished queue, so I tell the owner
about the queue. A gate complains about uncommitted files, so I tell the owner
whose files they are. A gate suggests /harden, so I offer it. None of that was
asked for. The reply stops being an answer and becomes a status report about my
own plumbing, which reads exactly like drifting off the question, because it is.

Gates are internal. They shape what I DO, never what the owner READS. The owner
asked about a button; the reply should be about the button.

Escape hatch: if the owner's own last message is about hooks, gates, plans,
workstreams or commits, the subject is legitimately the machinery and the gate
stands down. That check is what keeps this from blocking real answers.
"""
import json
import os
import re
import sys

# Phrases that only ever come from my enforcement layer, never from the work.
PLUMBING = [
    (r'~/\.claude/hooks/', 'a hook path'),
    (r'\b[a-z0-9-]+-gate\.py\b', 'a gate filename'),
    (r'\bskip[- ]valve\b', 'the skip-valve wording'),
    (r'\bskip\.flag\b|\b[a-z-]+-skip\.flag\b', 'a skip-flag file'),
    (r'\b(?:a|the|another) gate (?:fired|complains?|blocks?|wants?|keeps? firing)', 'a gate firing'),
    (r'\bStop hook\b|\bPostToolUse\b|\bUserPromptSubmit\b|\bPreToolUse\b', 'a hook event name'),
    (r'\bunfinished-batch\b|\bbatch-items\b|\bfinish-autonomously\b', 'a gate name'),
    (r'\bMOCKUP_QUEUE\b', 'the mockup queue'),
    (r'\bopen (?:check)?boxes?\b|\bunticked\b', 'plan-box bookkeeping'),
    (r'\bI (?:have been |keep )?(?:marking|skipping) (?:it|this|that) ', 'my own skip bookkeeping'),
]

# If the owner is ASKING about the machinery, it is the subject, not a detour.
OWNER_INVITED = re.compile(
    r'\b(hook|gate|harden|plan|workstream|_plans|commit|checkbox|queue|skip|memory|settings\.json)\b',
    re.I,
)


def last_messages(path):
    """Returns (last assistant text, last user text) from the transcript."""
    assistant, user = '', ''
    try:
        with open(path, encoding='utf-8') as fh:
            lines = fh.readlines()
    except OSError:
        return assistant, user

    for line in reversed(lines):
        try:
            rec = json.loads(line)
        except (ValueError, TypeError):
            continue
        msg = rec.get('message') or {}
        if not isinstance(msg, dict):
            continue
        role = msg.get('role')
        content = msg.get('content')
        text = ''
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = ' '.join(
                b.get('text', '') for b in content
                if isinstance(b, dict) and b.get('type') == 'text'
            )
        if role == 'assistant' and not assistant and text.strip():
            assistant = text
        elif role == 'user' and not user and text.strip():
            user = text
        if assistant and user:
            break
    return assistant, user


def verdict(reply, ask):
    """The hits this gate would block on. Pure, so the self-test drives it directly.

    Extracted 2026-08-03 (preference audit) without changing behaviour: this gate had no
    --selftest, which is why it sat orphan for eight days , nothing may be armed unproven
    (rule 12.5). Same three conditions main() always applied, in the same order.
    """
    if not reply:
        return []
    if OWNER_INVITED.search(ask or ''):
        return []
    hits = []
    for pattern, label in PLUMBING:
        m = re.search(pattern, reply, re.I)
        if m:
            hits.append((label, m.group(0)[:60]))
    return hits


def main():
    try:
        payload = json.load(sys.stdin)
    except (ValueError, TypeError):
        sys.exit(0)

    transcript = payload.get('transcript_path') or ''
    if not transcript or not os.path.exists(transcript):
        sys.exit(0)

    reply, ask = last_messages(transcript)
    hits = verdict(reply, ask)
    if not hits:
        sys.exit(0)

    detail = '\n'.join(f'  - {label}: "{found}"' for label, found in hits)
    sys.stderr.write(
        'PLUMBING IN THE REPLY (owner 2026-07-26: "why do you keep drifting about stuff '
        'that doesn\'t even have to do anything from what I\'m telling you to do?").\n'
        'Your closing message surfaces MY enforcement machinery, and the owner did not ask '
        'about it:\n' + detail + '\n'
        'A gate firing is an instruction to ME about what to DO. It is not news, and relaying '
        'it turns the reply into a status report on my own plumbing instead of an answer to '
        'the question. Cut those lines and answer what was actually asked. If a gate is '
        'pointing at real work, DO the work or name the blocker inside that work , do not '
        'narrate the gate.\n'
    )
    sys.exit(2)


if __name__ == '__main__':
    if '--selftest' in sys.argv:
        ANSWER = ('The search bar opens in place now and the categories collapse on scroll. '
                  'Nothing else on the homepage moved.')
        NARRATED = ('The search bar opens in place now. A gate fired about the unfinished-batch '
                    'queue so I left the rest for the next turn.')
        SKIPTALK = ('Done. I touched the mockup-preflight-skip.flag to get past it, so the '
                    'preview is up.')
        HOOKNAME = 'Fixed. This was a Stop hook complaining about the plan boxes, not a real issue.'
        CASES = [
            ('1  a plain answer -> PASS', False, ANSWER, 'why doesnt the search bar open'),
            ('2  relaying a gate firing -> BLOCK', True, NARRATED, 'why doesnt the search bar open'),
            ('3  narrating a skip flag -> BLOCK', True, SKIPTALK, 'show me the homepage'),
            ('4  naming a hook event -> BLOCK', True, HOOKNAME, 'fix the profile page'),
            ('5  owner ASKED about gates -> PASS (it is the topic)',
             False, NARRATED, 'harden the gate abt u stopping w every checkpoint'),
            ('6  owner asked about hooks -> PASS', False, SKIPTALK, 'is there like a hook for this'),
            ('7  empty reply -> PASS', False, '', 'show me the homepage'),
        ]
        ok = bad = 0
        for label, expect, reply, ask in CASES:
            got = bool(verdict(reply, ask))
            good = got == expect
            ok += good
            bad += (not good)
            print(('  PASS  ' if good else '  FAIL  ') + label
                  + ('' if good else '   expected block=%s got %s' % (expect, got)))
        print('\n%d/%d passed' % (ok, ok + bad))
        sys.exit(1 if bad else 0)
    main()
