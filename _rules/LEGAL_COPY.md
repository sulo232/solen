# Legal / regulatory copy rules

<!-- exists-check: net-new vs _rules/UI_RULES.md, SOLEN_PATTERNS.md, STRUCTURAL_RULES.md,
     I18N_ROUTING.md, _design-system/LOCKFILE.md. Grepped all for "Preisbekanntgabe",
     "preisuberwach", "pbv", "price.*legal", "ab CHF.*legal": zero hits. LOCKFILE has the
     "ab CHF" pattern as a TYPOGRAPHY lock (SOLEN_PATTERNS.md:23) but nothing about WHEN
     "ab" may legally prefix a price, which is the net-new content here (copy-i18n-11). -->

Copy patterns that carry real Swiss legal exposure once salons enter their own live
data (pre-launch today, real exposure once live). Distinct from `_rules/I18N_ROUTING.md`
(translation correctness) and `_design-system/LOCKFILE.md` (visual/typography lock):
this file is about what a price/claim/label is legally allowed to say, not how it looks.

These are STATUTORY FLOORS, tier 2 of the precedence chain in `CLAUDE.md`. A taste
decision cannot outrank one. Where a floor and a taste lock collide, surface the collision
and propose a treatment that satisfies both, never silently drop either.

---

## "ab CHF {amount}" ("from CHF X") , ANSWERED 2026-07-27, previously open

The owner asked (2026-07-27): "2 research whats legal". Researched against the primary
sources. The previous version of this section stated the question and marked its own
confidence as "assume". That guess is now replaced by the law.

### The rule, in one line

**On the OFFER, "ab CHF X" is NOT permitted for anything Solen sells.** In pure
ADVERTISING it is tolerated only if the copy names exactly which concrete offer the
from-price buys.

### Why, with sources

**Art. 10 Abs. 1 PBV (SR 942.211, Stand 1. Januar 2025)** requires, for services offered
to consumers, that "mit dem Angebot stets der tatsächlich zu bezahlende Preis in
Schweizerfranken" be disclosed, and it names the sectors:

- **lit. a Coiffeurgewerbe** , hairdressers and barbers
- **lit. d Kosmetische Institute und Körperpflege** , nail salons, body care, spa
- **lit. e Fitnessinstitute, Schwimmbäder …** , wellness-adjacent facilities

Solen's entire catalogue sits inside that list. There is no category we sell that escapes it.

**SECO's sector information sheet for hairdressers, barbershops, cosmetic institutes and
body care (01.04.2025)** states the consequence in the exact words, in all three national
languages: the indicated prices are FIXED prices, and entries such as "Bart schneiden: ab
Fr. 30.-" or "Epilation: ab Fr. 20.- bis Fr. 50.-" are **nicht zulässig** (FR: "ne sont pas
admises"; IT: "non sono ammesse").

**SECO's PBV FAQ** answers the hairdressing case directly. Asked whether "Brushing, ab CHF
43.-" is allowed, the answer is no, because offers must be specified, and it gives the
legal alternative: split the position into tiers. "Brushing , Kurzhaar: CHF 45.- /
Mittellanghaar: CHF 50.- / Langhaar: CHF 55.-"

**Art. 11 Abs. 2 PBV** is the mechanism behind that: the disclosure must make clear which
*Art und Einheit der Dienstleistung*, or which *Verrechnungssätze*, the price refers to.
So genuinely variable work is expressed as TIERS or as a STATED RATE, never as "from".

### Two further PBV rules that bind Solen specifically

**Art. 10 Abs. 1, the words "mit dem Angebot stets".** Those words were INSERTED by the
amendment of 25 May 2022, in force 1 July 2022 (AS 2022 343), deliberately reversing BGer
4A_235/2020 (1 Dec 2020) and 4A_314/2021 (27 Oct 2021), where the Federal Supreme Court had
held that disclosure shortly before contract conclusion was enough. The Federal Council
closed that gap by ordinance. **Consequence: the price must be on the offer surface, not
only at the final checkout step.** Revealing the real price only after a slot is picked
does not satisfy Art. 10 as it now reads.

**Art. 10 Abs. 2, all-in pricing.** "Überwälzte öffentliche Abgaben … sowie weitere nicht
frei wählbare Zuschläge jeglicher Art, namentlich für Reservation, Service oder
Bearbeitung, müssen im Preis enthalten sein." Reservation, service, processing , that is
literally a booking fee, a service fee and a processing fee. **If Solen ever charges the
consumer a non-optional booking fee, it must be INSIDE the displayed CHF figure, not added
at checkout.** Only genuinely optional extras may be shown separately. This one is not a
copy rule, it is a pricing-architecture constraint, and it should be checked before any
consumer-side fee is introduced.

### Advertising is a separate regime, and it is narrower than it looks

**Art. 13 Abs. 1 PBV** covers "bezifferte Hinweise auf Preisrahmen oder Preisgrenzen" in
advertising, which is exactly what a from-price is. SECO's Wegleitung für die Praxis 2025
(p. 17) sets the condition: when advertising states a minimum price, "muss genau beschrieben
werden, auf welches konkrete Angebot sich der Ab-Preis bezieht". Their worked example is an
olive tree advertised "ab CHF 59.-": legal only once the copy says WHAT you get for 59.

So a from-price in advertising is not a free pass. It is allowed only when the reader can
tell which exact thing costs that.

### What this means for each Solen surface

| Surface | Regime | Verdict |
|---|---|---|
| A named service with one price ("Herrenschnitt, ab CHF 45") on the PDP or in search | OFFER (Art. 10/11) | **NOT ALLOWED.** Show the fixed price. If the work genuinely varies, the salon splits it into tiers. |
| SalonCard "ab CHF 45" = the cheapest of that salon's MANY services | closer to Art. 13 advertising | Allowed ONLY if the copy names which service is at 45. Today it does not. **Needs an owner decision** (see below). |
| Marketing pages (`/warum-solen` and similar) with illustrative "ab CHF 45" | Art. 13 advertising | Same condition: name the concrete offer, or drop the figure. |
| The final price at checkout | Art. 10 Abs. 1 + Abs. 2 | Must equal the offer price, with every non-optional fee already inside it. |

### The one open owner decision

The SalonCard from-price is a genuine floor across many services, so it is not a fabricated
anchor. But it does not say WHICH service costs that, which is the condition SECO attaches
to advertising from-prices. Two ways to satisfy it, and this is a visible design change, so
it is the owner's call, not mine:

- **(a) Name the service.** "Herrenschnitt ab CHF 45" instead of "ab CHF 45". Costs one
  string on the card and makes the claim self-evidently compliant.
- **(b) Drop the price from the card** and let the price live on the PDP service list,
  where it is a fixed per-service figure.

### Verification

There is no bypass marker or automatic price-law blocker. For a changed customer-facing price
surface or localized price string, run the explicitly targeted, report-only `security-static`
check: its `S16_LEGAL_PRICE` finding identifies from-price syntax for review. Then verify the
rendered offer against the rules above, including the named concrete offer where advertising is
claimed. The report does not determine whether a surface is an offer or advertising.

---

## Sources

- PBV, SR 942.211, consolidated Stand 1. Januar 2025: <https://www.fedlex.admin.ch/eli/cc/1978/2081_2081_2081/de>
- SECO, Preisbekanntgabe im Coiffeurgewerbe / kosmetische Institute, sheet dated 01.04.2025
- SECO, PBV FAQ (the "Brushing, ab CHF 43.-" and olive-tree answers)
- SECO, Wegleitung für die Praxis 2025, p. 17
- Statutory basis: UWG Art. 16 Abs. 1, 16a, 17, 18, 20
- BGer 4A_235/2020 (1 Dec 2020) and 4A_314/2021 (27 Oct 2021), reversed by AS 2022 343

Full research with verbatim quotes: `_design-system/research/owner-answers-2026-07-27/swiss-price-law.md`

**This is engineering research, not legal advice.** Before launch, a Swiss lawyer should
confirm the OFFER-vs-ADVERTISING line for the SalonCard case specifically, because that is
the one surface where the classification is genuinely arguable.
