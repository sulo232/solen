import os, re, io
ROOT = "/Users/sulo/Documents/solen/.claude/worktrees/stress-test-gates-hooks-6dc8e8"
DIRS = ["app", "components-legacy", "components"]
# German words that would only appear in German copy, matched inside alt= or aria-label=
# Both spellings of every word that has one. Missing the `ss` form is not a
# theoretical gap: the first version of this script matched only `Schließen`
# and walked straight past `aria-label="Schliessen"` at
# components-legacy/ui/PhotoLightbox.tsx:104, so it reported 31 when the real
# count was 32. Caught by a builder reading the file rather than by the script.
GERMAN = re.compile(
    r"(Foto|Bild|Zur(ü|ue)ck|Schlie(ß|ss)en|Weiter|Ausw(ä|ae)hlen|Anzeigen|Bewertung|Termin"
    r"|Suchen|Men(ü|ue)|(Ö|Oe)ffnen|Karte|Standort|Mehr|Zum|Alle|von |anzeigen|w(ä|ae)hlen)"
)
# A string inside a block comment or a JSDoc @example is never rendered, so it
# is not a customer-facing defect. Modal.tsx:101 is exactly that case and was
# being counted as real.
COMMENT_LINE = re.compile(r"^\s*(\*|//)|@example")
ATTR = re.compile(r'(alt|aria-label|title|placeholder)=\{?[`"\']([^`"\']{2,90})')
hits, files, dev = [], set(), 0
for d in DIRS:
    base = os.path.join(ROOT, d)
    if not os.path.isdir(base):
        continue
    for dirpath, _, names in os.walk(base):
        for n in names:
            if not n.endswith((".tsx", ".ts")):
                continue
            fp = os.path.join(dirpath, n)
            rel = os.path.relpath(fp, ROOT)
            try:
                text = io.open(fp, encoding="utf-8").read()
            except Exception as err:
                print("[german-a11y] could not read", rel, err)
                continue
            for i, line in enumerate(text.split("\n"), 1):
                if COMMENT_LINE.search(line):
                    continue
                for m in ATTR.finditer(line):
                    val = m.group(2)
                    if "{t(" in line[:m.start()] or val.startswith("$"):
                        continue
                    if GERMAN.search(val):
                        if "/dev/" in rel:
                            dev += 1
                            continue
                        hits.append((rel, i, m.group(1), val[:60]))
                        files.add(rel)
print("hardcoded German in alt / aria-label / title / placeholder")
print("  customer-facing hits:", len(hits), "across", len(files), "files")
print("  dev-route hits skipped:", dev)
print()
for h in sorted(hits)[:24]:
    print("  %-64s :%-4d %-11s %s" % (h[0], h[1], h[2], h[3]))
