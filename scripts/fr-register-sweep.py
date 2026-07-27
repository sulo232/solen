#!/usr/bin/env python3
"""fr-register-sweep , DRY-RUN ONLY, and the dry run IS the deliverable.

Written 2026-07-27 for L7, the French vous -> tu sweep. It works. Its output is exactly why
the sweep was NOT applied: a regex cannot do French register. Run it before anyone proposes
this again , the evidence is in the diff it prints.

MEASURED FIRST, and the earlier numbers in this repo were BOTH wrong. "rendez-vous" is the
French word for APPOINTMENT and contains "vous" , the single most common noun in a booking
product. Counting it inflated the formal total to 611 (my count) and 436 (the research
agent's). The real figure, with rendez-vous excluded: 391 formal strings against 55 informal,
and ZERO strings mix both registers.

WHAT THE DRY RUN PRODUCES: 388 rewrites, at least 103 of them visibly broken French.
  "pres de chez vous"    -> "pres de chez tu"      (needs: toi)
  "Que cherchez-vous?"   -> "Que cherchez-tu?"     (needs: cherches-tu)
  "Detendez-vous"        -> "Detendez-tu"          (needs: Detends-toi)
  "Vous pourrez"         -> "Tu pourrez"           (needs: pourras)
  "Trouvez et reservez"  -> "Trouves et reserves"  (imperative: Trouve et reserve)
Not a tuning problem. Tonic pronouns after a preposition, inversion in questions, reflexive
imperatives, and future/conditional stems each need grammar rather than substitution, and a
French customer reads the result as machine output , which is worse than being addressed
formally.

THE REAL PATH: a per-string translation pass with review. This script is kept because it
produces the exact worklist and the counter-evidence.

  python3 scripts/fr-register-sweep.py            dry run, prints what WOULD break
  python3 scripts/fr-register-sweep.py --apply    still available on purpose, but never
                                                  without a human French review afterwards
"""
import json, re, collections, sys, pathlib

p = pathlib.Path("messages/fr.json")
raw = p.read_text(encoding="utf-8")
d = json.loads(raw, object_pairs_hook=collections.OrderedDict)

# Ordered longest-first so "vous-meme" / "votre" never get half-matched by a shorter rule.
# Every rule is a WHOLE-WORD substitution that preserves the leading capital.
RULES = [
    (r"\bvous-mêmes?\b",   "toi-même"),
    (r"\bVous-mêmes?\b",   "Toi-même"),
    (r"\bvos\b",           "tes"),
    (r"\bVos\b",           "Tes"),
    (r"\bvotre\b",         "ton"),      # gender fixed below
    (r"\bVotre\b",         "Ton"),
    (r"\bvous\b",          "tu"),       # verb agreement fixed below
    (r"\bVous\b",          "Tu"),
]

# "rendez-vous" is the word for APPOINTMENT. Protect it before anything else runs.
RDV = "\x00RDV\x00"
def protect(s):   return re.sub(r"[Rr]endez[- ]vous", lambda m: RDV + ("U" if m.group(0)[0]=="R" else "l"), s)
def unprotect(s): return s.replace(RDV + "U", "Rendez-vous").replace(RDV + "l", "rendez-vous")

# Verb agreement: 2nd person plural -ez -> 2nd person singular -es/-s, for the forms that
# actually appear in this catalogue. Anything not in this table is left alone and REPORTED,
# because a wrong conjugation reads worse than a formal one.
VERBS = {
    "trouvez":"trouves","réservez":"réserves","choisissez":"choisis","découvrez":"découvres",
    "profitez":"profites","gagnez":"gagnes","économisez":"économises","recevez":"reçois",
    "consultez":"consultes","gérez":"gères","modifiez":"modifies","annulez":"annules",
    "cliquez":"clique","entrez":"entre","saisissez":"saisis","vérifiez":"vérifie",
    "essayez":"essaie","contactez":"contacte","complétez":"complète","confirmez":"confirme",
    "sélectionnez":"sélectionne","ajoutez":"ajoute","créez":"crée","commencez":"commence",
    "continuez":"continue","enregistrez":"enregistre","partagez":"partage","laissez":"laisse",
    "indiquez":"indique","remplissez":"remplis","téléchargez":"télécharge","envoyez":"envoie",
    "réessayez":"réessaie","patientez":"patiente","scannez":"scanne","payez":"paie",
    "êtes":"es","avez":"as","pouvez":"peux","voulez":"veux","devez":"dois","savez":"sais",
    "allez":"vas","faites":"fais","voyez":"vois","souhaitez":"souhaites","aimez":"aimes",
}
def fix_verbs(s):
    def repl(m):
        w = m.group(0); low = w.lower()
        if low not in VERBS: return w
        out = VERBS[low]
        return out[0].upper() + out[1:] if w[0].isupper() else out
    return re.sub(r"\b\w+(?:ez|êtes|aites)\b", repl, s)

# "ton/ta" agree with the NOUN's gender, "votre" does not. Feminine nouns that follow it here.
FEM = r"(?:réservation|adresse|photo|carte|note|date|heure|langue|ville|question|demande|page|séance|coupe|couleur|équipe|boîte|liste|position|sélection|confirmation|annulation|facture|commande|préférence|expérience|évaluation|recherche)"
def fix_gender(s):
    s = re.sub(rf"\bton ({FEM})\b", r"ta \1", s)
    s = re.sub(rf"\bTon ({FEM})\b", r"Ta \1", s)
    # elision: ton/ta before a vowel -> ton (masc form) is correct in French
    s = re.sub(r"\bta ([aeiouâêîôûéèh])", r"ton \1", s)
    s = re.sub(r"\bTa ([aeiouâêîôûéèh])", r"Ton \1", s)
    return s

FORMAL = re.compile(r"\b(vous|votre|vos)\b", re.I)
LEFTOVER_EZ = re.compile(r"\b\w+ez\b", re.I)

changed, unresolved = 0, []
def walk(node):
    global changed
    if isinstance(node, dict):
        for k, v in node.items():
            if isinstance(v, str):
                prot = protect(v)
                if not FORMAL.search(prot): continue
                out = prot
                for pat, rep in RULES: out = re.sub(pat, rep, out)
                out = fix_verbs(out); out = fix_gender(out); out = unprotect(out)
                if out != v:
                    node[k] = out; changed += 1
                    if LEFTOVER_EZ.search(protect(out)):
                        unresolved.append((k, v, out))
            else:
                walk(v)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str):
                prot = protect(v)
                if not FORMAL.search(prot): continue
                out = prot
                for pat, rep in RULES: out = re.sub(pat, rep, out)
                out = fix_verbs(out); out = fix_gender(out); out = unprotect(out)
                if out != v:
                    node[i] = out; changed += 1
                    if LEFTOVER_EZ.search(protect(out)): unresolved.append((f"[{i}]", v, out))
            else:
                walk(v)

walk(d)
if "--apply" in sys.argv:
    with open(p, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, indent=2); f.write("\n")
print(f"strings rewritten: {changed}")
print(f"left with an -ez verb my table does not cover: {len(unresolved)}")
for k, before, after in unresolved[:25]:
    print(f"  {k[:40]:40} {before[:52]!r}\n  {'':40} -> {after[:52]!r}")
