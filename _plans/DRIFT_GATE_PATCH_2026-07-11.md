# Drift-gate literal-divergence patch (parked) , 2026-07-11 self-audit item D3

Target file (identical byte-for-byte in both trees, verified):
`.claude/skills/solen-drift-check/scripts/check.py`
- main checkout: `/Users/sulo/Documents/solen/.claude/skills/solen-drift-check/scripts/check.py`
- worktree (write-denied, read-only here): same relative path.

Apply from a **main-checkout session** (the worktree copy is write-denied). Match on the exact
line **content** below, not the line number alone: some edits shift later line numbers, and the
content match stays correct regardless. Line numbers are as of current HEAD (`3b53f7c84`) and the
two entries under "already applied" prove main == worktree for this region.

---

## Real divergence count: 3 remaining, not 5

The self-audit (`_plans/SELF_AUDIT_2026-07-11.md` §7) listed 5 literal divergences (D1..D5).
Two of them were **already applied** after the audit was written, by commit
`50abcd060 fix(gates): estate-audit Tier 0 live bugs , drift hex/token, blue-selected, fail-open`.
Do **NOT** re-apply D1/D2 , they are live in both trees today:

| audit id | claim | live state |
|---|---|---|
| D1 `s-pop` in RETIRED_TOKENS | should be removed (LOCKFILE un-retired V3-D424) | **ALREADY REMOVED** , `check.py:115` now reads `# s-pop removed 2026-07-11: LOCKFILE un-retired it (V3-D424); a live urgency-badge token, not drift.` |
| D2 transposed `#F5F5F4` | should be `#F4F4F5` | **ALREADY FIXED** , `check.py:69` now reads `"#F4F4F5",  # s-bg-sunken / s-bg-active (was transposed #F5F5F4; fixed 2026-07-11 ...)`. No `#F5F5F4` remains in the file. |

So the audit's "Applied this audit: none" is now stale for D1/D2. The three below are the genuine
still-open divergences confirmed against the live file + LOCKFILE.

---

## D4 (confirmed, safe) , remove reverted deep-green `#15803D` from ALLOWED_HEX

**Why:** LOCKFILE §1 line 70 + line 613: "Deep `#15803D` **REVERTED 2026-06-10**" , all green
(focal + inline) is now `#16A34A`. The gate still allowlists the reverted hex, so live use of a
dead value passes silently. Confirmed **unused** in product code (the only grep hit is a *comment*
in `app/[locale]/_components/homepage/SalonCard.tsx:126` noting the literal was already swept to a
token), so removing it introduces no new findings , it only closes the hole.

check.py line 50 , DELETE this whole line:
```
    "#15803D",  # availability badge text (V3-D126 deep green)
```
After: the line is gone; `#16A34A` (line 51) remains the single sanctioned green. No replacement.

---

## D5 (confirmed, safe, + a stale LOCKFILE line to fix) , remove unregistered `#9A3412`

**Why:** LOCKFILE §1's current token table uses `#C2410C` for `s-urgency` (line 76) and `#B45309`
for `s-warning.text` (line 72). `#9A3412` is **not** a current registered token in §1. The gate
allowlists it as "urgent badge text (V3-D173 burnt-sienna)" , a pre-V3-D424 value. Confirmed
**unused** in product code (zero grep hits). Removing it aligns the gate with the live token table.

check.py line 49 , DELETE this whole line:
```
    "#9A3412",  # urgent badge text (V3-D173 burnt-sienna)
```
After: the line is gone. No replacement.

**Stale-doc footnote (flag to owner, do NOT auto-edit LOCKFILE):** LOCKFILE line 1166 still says
"LOCKFILE has `s-urgency #9A3412` as urgency amber", which contradicts the §1 table at line 76
(`s-urgency = #C2410C`). That prose line is itself stale. Recommend the owner update line 1166 to
`#C2410C` in the same pass, but that is a LOCKFILE literal edit and needs the owner by name.

> NOTE if applying D4 **and** D5 together: after deleting line 49 (`#9A3412`), the old line 50
> (`#15803D`) becomes line 49. Match on content, not number, and both deletions are independent.

---

## D3 (owner-decision , recommended: fix the LOCKFILE, NOT the gate)

**The divergence:** gate canon includes `100`:
```
CANONICAL_DURATIONS_MS = {80, 100, 150, 200, 250, 300, 500}  # V3-D450: +100 (standard short transition)   (check.py:104)
```
but LOCKFILE §4 line 575 lists only:
```
80ms / 150ms / 200ms / 250ms / 300ms / 500ms
```

**Evidence resolves the ambiguity toward "the gate is right, the LOCKFILE is missing 100ms".**
`duration-100` / `duration-[100ms]` is in **live, sanctioned use** across at least 6 spots:
- `app/[locale]/booking/lookup/page.tsx:240` , `transition-transform duration-100 ease-snap` (primary CTA press)
- `app/[locale]/booking/resend-link/page.tsx:234` , same CTA press recipe
- `app/[locale]/_components/primitives/Sheet.tsx:47` , `motion-reduce:duration-100`
- `app/[locale]/_components/primitives/Modal.tsx:43` , `motion-reduce:duration-100`
- `app/[locale]/_components/primitives/Switch.tsx:98` , `active:duration-100 active:ease-thud`

A duration used by the CTA-press recipe and the reduced-motion fallbacks in the locked primitives
is canonical, not drift. So the correct resolution is **option A** (document it), not removing it
from the gate.

**Option A (RECOMMENDED) , owner-gated LOCKFILE edit.** Add `100ms` to §4 line 575:
```
BEFORE:  80ms / 150ms / 200ms / 250ms / 300ms / 500ms
AFTER:   80ms / 100ms / 150ms / 200ms / 250ms / 300ms / 500ms
```
This is a LOCKFILE frozen-literal change , needs the owner's explicit yes (cite V3-D450). No
change to check.py.

**Option B (only if the owner rules 100ms is NOT sanctioned).** Then the 6 live usages above are
themselves drift and must be re-timed first; only after that, edit check.py:104:
```
BEFORE:  CANONICAL_DURATIONS_MS = {80, 100, 150, 200, 250, 300, 500}  # V3-D450: +100 (standard short transition)
AFTER:   CANONICAL_DURATIONS_MS = {80, 150, 200, 250, 300, 500}
```
Do NOT pick option B without owner sign-off , it would flag shipped CTA-press + reduced-motion code.

---

## One-pass checklist for the applying session
- [ ] Confirm D1/D2 are already live (grep `check.py` for `s-pop` + `F5F5F4`); skip them.
- [ ] D4: delete the `#15803D` line from `ALLOWED_HEX`.
- [ ] D5: delete the `#9A3412` line from `ALLOWED_HEX`.
- [ ] D5-doc: flag LOCKFILE line 1166 (`s-urgency #9A3412` -> `#C2410C`) to the owner.
- [ ] D3: take the owner's call (recommend option A: add `100ms` to LOCKFILE §4 line 575).
- [ ] `python3 -m py_compile .claude/skills/solen-drift-check/scripts/check.py`
- [ ] Run the checker on a scratch file using `bg-s-pop` + inline `#F4F4F5` , both must PASS;
      `#F5F5F4` and (post-patch) `#15803D` / `#9A3412` must FLAG.
