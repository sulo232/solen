# Trust + Safety Mechanics — Pet-Grooming Platform Audit

**Phase:** 0.21 of Solen → dog-grooming pivot research
**Date:** 2026-05-13
**Scope:** Groomer verification, insurance, vaccination enforcement, dispute resolution, CH legal context, MVP spec for Solen.

All quoted strings are verbatim from cited sources. Anything not in quotes is summary or inferred — inferences are flagged `[INFERRED]`.

---

## 1. Per-Platform Trust Mechanism Inventory

| Platform | Verification | Insurance | Vaccination | Dispute Resolution |
|---|---|---|---|---|
| **Groomit** (US mobile marketplace) | Third-party identity + criminal + sex-offender background check (Checkr); internal skills/credentials check; SSN verification; 7-year address trace | Platform-level coverage — Groomers carry Pet Groomer's Professional Liability ≥ $1M aggregate annual; pet owners responsible for their own property insurance | Rabies + Distemper + Parvovirus required; proof shown to groomer "upon request" (not pre-booked upload); puppies/kittens unvaccinated cannot be serviced | Arbitration per ToS; fees generally non-refundable; "100% Satisfaction Guarantee" — contact within 24h for re-groom / credit / refund "if eligible" |
| **PetSmart** (US chain, employed groomers) | Internal training — 800h "Academy" instruction + 200-dog hands-on; apprentices 33h + 125 dogs; annual safety re-certification | Corporate (employer) liability; not a marketplace | Rabies (paper proof) required pre-service; vaccinations must be ≥24h old (48h if local law requires more); 8-week to 4-month puppies exception (3-month in IN); flea/tick-free | Internal store-level complaint; corporate escalation; no public arbitration ToS for groom-specific |
| **Scenthound** (US franchise, membership) | Franchise-level (FDD-disclosed) training; internal "S.C.E.N.T. Check" wellness assessment by technicians; specific training requirements not on public site | Franchisor-required commercial liability for franchisees `[INFERRED]` | Not publicly disclosed on marketing site | Not publicly disclosed |
| **Fresha** (UK/global booking platform) | Self-attestation — "we cannot verify the information which Partners provide to us" | None platform-side; partner liability disclaimed: "The contract for the Partner Services is directly between you and the relevant Partner" | Not enforced by platform (general beauty platform, not pet-specific) | Contact partner direct → leave review → email `hello@fresha.com` → Fresha refund "at our sole discretion and always as a last resort" |
| **Rover** (US pet-sitter marketplace; reference) | Third-party "basic" or "enhanced" criminal background check; SSN + national criminal DB + sex-offender + terror watchlist | "Rover Guarantee" reimbursement program (NOT insurance) up to limit; sitters not required to carry own coverage | Not enforced; recommended sitters request proof | Internal "Rover Guarantee" reimbursement claim process |
| **Wag** (US pet-sitter; reference) | "National background check and digs deeper at a local level, if necessary" | Platform-side coverage `[INFERRED]` | Not enforced | Internal claim process |

**Pattern:** The deeper into pet-specific the platform goes, the harder the verification + vaccination requirements. Beauty-platform Fresha verifies nothing. Pet-sitting platforms verify identity but not skills. Mobile-grooming Groomit (closest analog to Solen) does identity + criminal + skills + carries platform-level insurance. Brick-and-mortar PetSmart trains in-house.

---

## 2. Groomer Verification Process Patterns

Three patterns, by source.

### 2a. Manual hand-verified (high-trust, low-scale)

Founder/ops manager inspects credentials, visits the salon, conducts interview, vouches personally. No automation. Used by early-stage marketplaces that need quality signal at launch. **Solen Basel MVP fits here.**

### 2b. Automated identity + criminal background (Rover / Wag / Groomit)

Third-party agency (Checkr, GoodHire, Sterling) runs SSN-based identity trace + criminal records + sex-offender registry. Cost: ~$25–$60/groomer in US `[INFERRED — typical Checkr pricing range]`. Result returns within minutes-to-days. CH equivalent: there is no SSN; identity verification works off AHV-Nummer + Pass/ID. Strafregisterauszug (criminal-record extract) is requestable from `strafregister.admin.ch` for CHF 20, valid 3 months `[INFERRED — public-knowledge pricing, verify before launch]`.

### 2c. Hybrid — automated identity + manual skills review (Groomit closest match)

Groomit ToS: "Groomit engages third parties for background checks" plus "internal investigation to ascertain a Groomer's skill and credentials." This is the standard a credible marketplace needs to claim trust without taking on training cost.

**Hands-on skill testing:** Groomit description suggests skills are reviewed via portfolio / credentials / customer-rating retention, NOT a hands-on test. PetSmart is the only model with an actual hands-on test (800h academy / 200-dog requirement) — but PetSmart employs groomers; that's training, not vetting. **No marketplace in the audit set runs a hands-on practical exam at intake.** [INFERRED — could be done by partnering with SVBT for Solen if differentiation is wanted]

---

## 3. Insurance Requirements

### 3a. Who carries what — by platform

- **Groomit (US, mobile marketplace):** Platform requires groomers to maintain "commercial liability with Pet Groomer's Professional Liability coverage for all Groomer's on its marketplace with a single aggregate annual limit of at least $1,000,000." Plus Groomit itself carries "platform-level insurance" on top. Pet owners are explicitly responsible for their own property insurance. **Two-tier coverage** is the gold standard here.

- **Rover (US, pet-sitter):** "Insurance isn't required by Rover" for sitters; Rover Guarantee is reimbursement, not insurance. Sitters advised to get their own. This is the WEAK end of the spectrum.

- **PetSmart:** Corporate. Groomers are W-2 employees covered under the company's commercial general liability. Not a marketplace pattern.

- **Fresha:** Zero. Liability fully disclaimed onto partners.

### 3b. Industry standard coverage limits (US data — reference only)

- General liability: $1M–$2M per occurrence, $2M–$3M aggregate (typical for grooming businesses)
- Animal bailee: separate policy covering pets-in-care for injury/loss/death; covers vet bills, legal costs, replacement
- National Dog Groomers Association offers member discounts for bundled GL + bailee

### 3c. CH-specific (the actual rule for Solen)

In Switzerland, Berufshaftpflichtversicherung (professional liability) is **not legally mandatory for dog groomers** in the same way it is for regulated professions (lawyers, doctors, fiduciaries). HOWEVER:

- For self-employed individuals, damages caused during work can be covered under Privathaftpflicht **only if annual income ≤ CHF 40,000**. Above that, separate Berufshaftpflicht is required.
- Recommended Deckungssumme for personal + property + financial damages: **mindestens fünf Millionen Franken** (search result quote: "Für Sach- und Personenschäden sollte die Deckungssumme mindestens fünf Millionen Franken betragen").
- Industry-specific Tierhalterhaftpflicht for groomers: covers schuldhaft verursachte Schäden an Hunden in Obhut up to €20,000 per animal per case (German cross-border carrier data — `dogvers.de` is German but markets to Switzerland; CH carriers Helvetia, Mobiliar, Allianz CH offer similar products).

**Bottom line for Solen:** Even though there is no CH-wide legal mandate for grooming-business liability, every credible groomer earning > CHF 40k/yr needs it. Requiring proof at intake is reasonable, defensible, and aligns Solen with industry norms.

---

## 4. Vaccination Enforcement — How Platforms Actually Do It

Three enforcement levels, ranked by strictness:

### Level 1 — Mandatory upload with verification (strictest)

No platform in the audit set does this. Closest: PetSmart requires paper proof shown at check-in, but it's not uploaded to a system. NYC Department of Health requires rabies + distemper + bordetella for grooming and audits salons, but that's regulatory, not platform-driven.

### Level 2 — Mandatory attestation + show-on-request (Groomit pattern)

Groomit: "Pets must be vaccinated against Rabies, Distemper, and Parvovirus" + "Upon request, pet owners must provide proof of vaccination and current veterinarian information to the assigned groomer." Customers confirm compliance at booking. No upload UI — confidence is via attestation + groomer can request paper at appointment.

### Level 3 — Best-practice recommendation, no enforcement (Rover / Wag / Fresha)

Not enforced by platform; left to individual sitter/partner to verify. "If you want to ensure a dog staying with you is healthy, you must require the owner to provide proof of vaccination" — left to the sitter.

### Industry vaccine list (what to require)

- **Rabies** (universally required, including by NYC DOH-style regulations)
- **Bordetella** (kennel-cough; "almost universally required by groomers, boarding facilities, and daycares")
- **DHPP** (distemper + hepatitis + parvo + parainfluenza — Groomit's "Distemper + Parvovirus" is the core subset)
- **Timing:** Groomers typically refuse pets vaccinated within the prior 48 hours (immune response); PetSmart enforces 24h minimum (48h with local law)

### CH-specific: rabies is the legal one

Switzerland is officially rabies-free (terrestrial-rabies status maintained since 1999). Rabies vaccination for dogs is **not mandatory by federal law for domestic dogs that stay in Switzerland**, but is required for cross-border travel + some cantons. Bordetella, DHPP follow vet-recommended schedules but are not legally mandatory. **Practical Solen MVP framing:** "Impfungen aktuell" attestation is the realistic ask — pet owners self-declare; groomer can request to see proof at appointment. Mandatory upload is overkill for MVP and friction-heavy. [INFERRED legal nuance — confirm with BLV / cantonal Veterinäramt before publishing copy]

---

## 5. Dispute Resolution Channels

### 5a. Channel patterns

| Channel | Used by | Strength |
|---|---|---|
| In-app chat (sitter ↔ owner) | Rover, BusyPaws, Tuft, MoeGo | Soft — pre-empts disputes; no escalation path |
| Email support | Fresha (`hello@fresha.com`), Groomit | Slow; Fresha reviews complain about response times; standard fallback |
| Phone | PetSmart store-level | High-touch; brick-and-mortar pattern, not marketplace |
| Claims portal / structured form | Rover ("Rover Guarantee" claims) | Best UX for high-stakes complaints; structured intake → adjudication |
| Arbitration clause (ToS) | Groomit | Legal final-resort; binding |

### 5b. Refund/re-groom mechanics

- **Groomit:** "100% Satisfaction Guarantee. If you're unhappy, contact us within 24 hours — we'll review and offer a re-groom, credit, or refund if eligible." But ToS also says: "all fees paid via the Groomit Marketplace are non-refundable once paid." The 24h satisfaction clause is the carve-out.
- **Fresha:** "we may, at our sole discretion and always as a last resort, elect to give you a refund." No SLA. User reviews complain this is unreliable.
- **Rover:** Reimbursement claim under Rover Guarantee, capped by limits per claim.

### 5c. Pattern recommendation

The **24-hour-window re-groom-or-refund satisfaction guarantee** (Groomit) is the strongest UX pattern in the audit. It tells the user "you have recourse" without exposing the platform to infinite liability. Couple it with email channel for escalation. In-app chat between groomer and owner is the dispute *prevention* tool, not the resolution tool. [INFERRED but well-supported]

---

## 6. Background Check Standards

### 6a. What gets checked (US baseline)

- **Identity verification** — name, address, SSN, 7-year address trace (Checkr / Sterling)
- **Criminal records** — national criminal DB + state-level supplements
- **Sex offender registry** — every-state search
- **Terror watchlist** — Rover/Wag-style
- **Driver's license** (for mobile-van or in-home groomers) — Groomit applies for mobile

### 6b. What does NOT get checked

- **Professional license** — most US states do not license dog groomers (only NJ + a couple others have moved toward licensing as of 2026). Background checks do NOT verify grooming skill.
- **Hands-on grooming test** — no marketplace in this audit set runs one at intake.
- **Reference checks** — sometimes done internally (Groomit "internal investigation") but not formalized.

### 6c. CH baseline

- **Strafregisterauszug** (criminal record extract) — CHF 20, valid 3 months, self-requestable
- **AHV-Nummer + Pass/ID** — identity verification, no centralized fraud-detection equivalent to Checkr [INFERRED]
- **Tierpfleger EFZ** — federal apprenticeship credential (3 years; Hundecoiffeur specialization possible); verifiable via SBFI records
- **SVBT Hundecoiffeur certification** — voluntary professional body certification
- **No mandatory professional license for dog groomers** — operating a Hundesalon does require commercial-animal-care permit ("Commercial handling of animals belonging to others requires a permit" — BLV / cantonal Veterinäramt, threshold > 5 animals) but no individual practitioner license.

### 6d. Recommendation for Solen Basel MVP

Hand-verify each groomer with: (1) Strafregisterauszug check, (2) verify Tierpfleger EFZ or SVBT certification if claimed, (3) confirm Berufshaftpflicht policy + Deckungssumme, (4) confirm cantonal Bewilligung for commercial animal care if salon has > 5 animals, (5) site visit by Solen ops, (6) reference check with 2 prior clients. Document each in a Notion/Airtable groomer dossier. **No automated background-check vendor at MVP** — manual scales to ~50 groomers, automation needed beyond that.

---

## 7. Liability Disclaimer Language — UX Placement Patterns

### 7a. Quote bank — what successful platforms say

- **Groomit (ToS):** "TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL GROOMIT BE LIABLE FOR ANY DAMAGES WHATSOEVER, WHETHER DIRECT, INDIRECT, GENERAL, SPECIAL, COMPENSATORY, OR CONSEQUENTIAL, ARISING OUT OF OR RELATING TO THE CONDUCT OF YOU OR ANYONE ELSE IN CONNECTION WITH THE GROOMIT MARKETPLACE."
- **Groomit (FAQ user-facing):** "Safety is built into Groomit's system. All professionals pass background and identity checks before joining. Every booking is protected by Groomit's platform-level insurance."
- **Fresha (ToS):** "We are not liable to you for the provision or non-provision of the Partner Services and / or Products" + "The contract for the Partner Services is directly between you and the relevant Partner."

### 7b. UX placement pattern

Two layers, every time:
1. **Reassurance-forward (homepage, salon-card, checkout):** "Geprüfte Coiffeure, Versichert, Tierfreundlich" — short, positive, sells trust.
2. **Disclaimer-forward (ToS, AGB, fine print):** Full "we are a marketplace, contract is between you and groomer" disclaimer — protects the platform legally.

The trick is keeping (1) close to truth without overstating in a way that contradicts (2). Groomit walks this line by using platform-level insurance as the bridge — they CAN say "every booking is protected by Groomit's platform-level insurance" because they actually carry it. Fresha doesn't, so they don't say it.

### 7c. Where to place in Solen flow

- **Homepage:** "Solen Versprechen" badge — top-of-page or in trust strip
- **Salon detail page:** "Versichert" badge on groomer profile (only if verified)
- **Checkout — explicit consent step:** Mandatory checkbox "Ich verstehe, dass Solen ein Vermittler ist und Verantwortung beim Hundesalon liegt. Ich bestätige, dass mein Hund geimpft und gesund ist." `[INFERRED copy — verify with CH lawyer]`
- **Terms / AGB page:** Full legal disclaimer in German, including marketplace-not-provider language
- **Booking confirmation email:** Soft reminder of dispute channel (email + 24h re-groom window)

---

## 8. CH-Specific Regulatory Context

### 8a. Federal layer — Tierschutzgesetz + Tierschutzverordnung (TSchV)

- The TSchG + TSchV set minimum standards for animal handling, including grooming.
- "Commercial handling of animals belonging to others requires a permit" (BLV) — applies to dog salons, day cares, kennels. Threshold for permit: > 5 fremden Tiere.
- Animal-care professionals must "undertake further training of at least 4 days within 4 years" per Tierschutzverordnung — applies to certified Tierpfleger.
- "Fachinformation 12.4 — Anforderungen für die Betreuung fremder Heimtiere" (BLV) is the operative reference document for commercial pet-care standards.

### 8b. Cantonal layer

- "Switzerland has no unified nationwide dog law; instead, legislation is a 'patchwork' of cantonal regulations that are created and enforced by the respective cantonal veterinary offices."
- Each Kanton's Veterinäramt issues the commercial-pet-care Bewilligung.
- **Basel-Stadt** (Solen MVP launch canton): regulations administered by Veterinäramt Basel-Stadt; need to verify Bewilligung is in place for each partner salon. [INFERRED — confirm specific Basel-Stadt rules pre-launch]
- Some cantons require Sachkundenachweis (proof of competence) for handling certain breeds (Listenhunde) — does NOT apply to grooming generally, but if a groomer handles a Listenhund, the owner's competence is what's regulated, not the groomer's.

### 8c. Education / certification

- **Tierpfleger EFZ** — 3-year federal apprenticeship; specialization in Heimtiere can include dog-salon practice.
- **Hundecoiffeur SVBT** — voluntary professional body certification administered by `tierpfleger.ch / SVBT-ASFSA`; can be done during EFZ apprenticeship or as continuing education.
- **No legal certification mandate** — anyone can hang a shingle and call themselves a Hundecoiffeur. The Bewilligung is for the BUSINESS (commercial animal care > 5 animals), not the practitioner.
- This creates a real opening for Solen: by featuring only EFZ/SVBT-certified groomers, Solen elevates baseline quality above what the legal floor requires.

### 8d. Insurance / liability

- Berufshaftpflicht obligatory above CHF 40k/yr earnings (Privathaftpflicht insufficient).
- Recommended Deckungssumme ≥ CHF 5M for personal/property damages.
- Tierhalterhaftpflicht-in-Obhut sub-products cover injuries to animals in care up to ~€20k per animal per case (typical German cross-border carrier limit).
- **There is no CH-specific legal mandate that dog-grooming salons carry Tierhalterhaftpflicht-in-Obhut** — but it is the de-facto industry standard and no credible salon operates without it.

### 8e. Hygiene / facility standards

TSchV sets minimum housing/space/cleanliness standards. Salon-specific hygiene rules (instrument sterilization, surface disinfection, ventilation) are not federally codified at salon-trade-specific level but fall under general TSchV "appropriate care" obligations. [INFERRED — there is no federal "Hundesalon-Hygieneverordnung" specifically.]

---

## 9. Solen MVP Trust Spec (Recommendations — Decisions Pending User Lock)

### 9.1 Verification — hand-verified manual at launch, automated v2

**MVP (Basel, ~15–50 groomers):**
- Solen-ops site visit per salon
- Document collection: Strafregisterauszug, ID, Tierpfleger EFZ / SVBT cert (if claimed), Berufshaftpflichtversicherung policy, cantonal Bewilligung (if > 5 animals)
- 2 customer references contacted by Solen team
- Stored in internal dossier (Notion / Airtable)
- "Verified by Solen" badge on profile only after sign-off

**v2 (~50+ groomers, scaling):**
- Automated identity verification via Onfido or similar (CH-compatible) [INFERRED vendor — confirm]
- Self-serve document upload + Solen-ops queue review (24h SLA)
- Automated Strafregister-check renewal annual
- Cert verification via SBFI / SVBT API if available, else manual on yearly cadence

### 9.2 Insurance — require + surface as badge

- **Requirement:** Groomers must carry Berufshaftpflichtversicherung with Deckungssumme ≥ CHF 1M (relaxed from industry recommendation of CHF 5M — appropriate for small-salon scale).
- **Surface:** "Versichert" badge on groomer profile when policy doc is on file + not expired. Re-verify annually.
- **Disclaimer language:** "Solen verlangt von allen Partnersalons eine gültige Berufshaftpflichtversicherung." (Bridge between Solen claim + actual fact.)
- **Solen ITSELF should carry platform-level marketplace liability** [INFERRED — small but smart spend, $500–$2000/year CH carrier estimate]

### 9.3 Vaccination — optional MVP, structured v2

**MVP:**
- Free-text field in customer profile: "Impfungen aktuell: Ja / Nein" (toggle)
- Soft message in booking flow: "Bitte stelle sicher, dass dein Hund geimpft ist. Der Salon kann Nachweis vor Ort verlangen."
- No upload UI

**v2:**
- Structured upload (PDF / photo) of vet record on dog profile
- Expiry-date tracking with reminders
- Optional but unlocks "Impfungen aktuell" verified badge
- Salon can flag dog as needs-proof if not previously uploaded

**Note:** CH legal nuance — rabies is not federally mandatory for domestic-only dogs. Solen should NOT claim "rabies required" if that's not legally enforceable; should claim "Impfungen gemäss Empfehlung des Tierarztes." [INFERRED]

### 9.4 Dispute resolution — email MVP, in-app chat v2

**MVP:**
- Channel: `support@solen.ch` email
- 24-hour re-groom-or-refund satisfaction guarantee (Groomit pattern, proven)
- Solen-ops triages → contacts salon → adjudicates → issues refund / credit
- SLA: response within 24h, resolution within 5 working days
- No formal arbitration clause — small-scale, Schweizer Recht / Gerichtsstand Basel in AGB

**v2:**
- In-app chat (customer ↔ salon)
- In-app dispute ticket with structured intake form
- Photo upload for damage / injury
- Escalation queue with Solen-ops claims adjudicator

### 9.5 Liability disclaimer — terms-page + checkout-step

- **Terms / AGB:** Full legal disclaimer ("Solen ist ein Vermittler. Die Dienstleistung wird vom Salon erbracht. Solen haftet nicht für Schäden aus der Ausführung der Dienstleistung."). Drafted with CH lawyer pre-launch.
- **Checkout consent:** Mandatory checkbox: "Ich verstehe, dass Solen Buchungen vermittelt und der gewählte Salon Verantwortlicher für die Dienstleistung ist. Ich bestätige, dass mein Hund gesund und geimpft ist." [INFERRED copy — lawyer review required]
- **Salon page reassurance:** "Versichert · Geprüft · Tierfreundlich" badges visible — short, positive, true.

### 9.6 "Solen Versprechen" branded promise — 5 items recommended

**Recommended 5-promise set (pick 5 from these or close variants):**

1. **Geprüfte Hygiene** — every salon meets Solen's Hygiene-Checkliste (sterilisierte Werkzeuge, saubere Räume)
2. **Tierfreundlich** — kein Zwang, kein Stress; Solen-Partner verpflichten sich zu schonender Handhabung
3. **Versichert** — alle Partnersalons tragen Berufshaftpflichtversicherung
4. **Faire Preise** — kein versteckter Aufpreis; Preis im Voraus
5. **100% kostenlose Stornierung bis 24h vorher** — kein Stress, kein Risiko

**Solen-recommendation (top pick):** Use all five — they cover the three axes (safety, transparency, flexibility) without overlap. Place as a homepage trust strip + a re-stated module in checkout. [INFERRED priority order]

Alternates / nice-to-haves if scope allows:
- Geld-zurück-Garantie (24h-Zufriedenheits-Garantie)
- Schweizer Support (Email, DE/FR/IT/EN)
- Bewertung verifiziert (nur echte Kunden bewerten)

**Don't include** in Solen Versprechen:
- "100% rabies-vaccinated" — not legally enforceable in CH and risks contradiction with AGB
- "Best Price Guarantee" — without B2B-side commercial backing, can't deliver
- "24/7 support" — false for small ops team at MVP

---

## 10. Decisions Surfaced for User Lock

These are the calls that need an explicit "ok" before they go into spec / product / AGB.

1. **Groomer verification — manual hand-verified at MVP?** Recommend YES; ~15–50 groomers in Basel handled by Solen-ops via Notion dossier; site visit + doc collection + 2 references. Automated check vendor (Onfido / similar) deferred to v2.
2. **Insurance requirement — required or preferred?** Recommend REQUIRED with ≥ CHF 1M Deckungssumme. Surface as "Versichert" badge. Belt-and-suspenders: Solen carries its own marketplace-level liability policy.
3. **Vaccination enforcement — optional MVP, structured upload v2?** Recommend YES — free-text attestation MVP, structured upload v2. Avoid claiming "rabies required" since not legally mandatory in CH; use "Impfungen gemäss Empfehlung des Tierarztes."
4. **"Solen Versprechen" — which 5 promises?** Recommend: Geprüfte Hygiene · Tierfreundlich · Versichert · Faire Preise · 100% kostenlose Stornierung 24h. User pick from list or propose alternates.
5. **Liability disclaimer placement — terms + checkout?** Recommend BOTH — full AGB language on terms-page (lawyer-drafted) + mandatory consent checkbox in checkout. Salon page surfaces the positive ("Versichert" badge) only.
6. **Dispute resolution MVP — email + 24h satisfaction window?** Recommend YES — `support@solen.ch` + Groomit-style 24h re-groom-or-refund clause in AGB. In-app chat + claims portal in v2.
7. **Background check vendor for v2?** Recommend Onfido or AU10TIX (both CH-active) — but defer decision until v2 scope is locked. [INFERRED options]
8. **Hands-on skill test at intake?** Recommend NO at MVP — no marketplace in audit set does this, and Solen leverages existing EFZ/SVBT credentials. Differentiation opportunity for v3 if competitor pressure rises.

---

## 11. Legal Risks Identified (CH context — pre-launch lawyer review required)

These are flagged because they could expose Solen to fines, license issues, or civil liability. Not exhaustive — definitive list needs CH legal counsel.

1. **AGB marketplace-vs-provider language** — if Solen's AGB is unclear about Solen-as-Vermittler vs Solen-as-Provider, Solen could be deemed contractually responsible for the grooming service itself under Swiss OR (Obligationenrecht). Lawyer must draft AGB with clear marketplace framing + safe-harbor language.

2. **Datenschutz (FADP / nFADP)** — collecting groomer Strafregisterauszug + AHV-Nummer triggers FADP compliance (data-minimization, purpose-limitation, retention-limits, data-processing-agreement with any vendor). Need: privacy policy, internal data-handling SOP, DSGVO-compatible flows if EU customers are in scope.

3. **Trust-claim overstatement risk** — saying "Versichert" on a salon profile when the policy lapses, or claiming "Geprüft" without consistent verification, could be misleading commercial communication (UWG Art. 3). Need: automatic badge-removal when policy expires, documented verification SOP.

4. **Tierschutz (TSchG / TSchV)** — Solen as platform listing commercial-animal-care services could face platform-liability questions if a listed salon operates without Bewilligung or violates TSchV (e.g. cruelty case). Need: groomer attestation in onboarding ToS that they hold cantonal Bewilligung if required, plus de-listing process if violation reported.

5. **Bewilligungspflicht enforcement gap** — the > 5-animals Bewilligung threshold is cantonal; if a salon takes a 6th dog and lacks Bewilligung, that's a TSchG violation. Solen has no good way to enforce this at booking-time. Need: lawyer + Veterinäramt Basel guidance on platform's duty-of-care.

6. **Refund-policy + CH consumer-protection law** — Swiss consumer protection is lighter than EU, but the 24h satisfaction guarantee should be drafted to avoid being read as a blanket consumer-rights-equivalent guarantee with unbounded liability. Need: AGB cap on refund liability per booking.

7. **Vaccination disclaimer asymmetry** — if Solen claims "Impfungen erforderlich" but doesn't enforce it, and a dog transmits kennel cough at a Solen-partner salon, the affected owner might sue Solen for misrepresentation. Need: align stated policy with what's actually enforced; use "empfohlen" not "erforderlich" if upload isn't required.

8. **Mehrsprachigkeit (DE/FR/IT) of legal docs** — CH consumer-facing platforms typically need AGB + privacy policy in at least DE + FR; IT optional for Tessin. Basel MVP could launch DE-only but EU/Romandie expansion needs FR. Need: translation budget + version-control across locales.

9. **Salon employment status** — if a groomer at a partner salon turns out to be an Auftragnehmer-vs-Arbeitnehmer ambiguity, Solen could face Scheinselbständigkeit (false self-employment) questions in audits. Solen is the marketplace, not the employer, but the salon's internal employment compliance matters for Solen's reputation. Need: salon-side SOP / attestation in onboarding.

10. **Stripe Connect / financial-services licensing** — if Solen holds funds before payout to salons, that may trigger FINMA's payment-services rules. Stripe Connect Express typically routes around this, but lawyer review needed. Already on Solen radar for separate B2B/Stripe audit but flagging here for completeness.

---

## Sources

- [Groomit Marketplace](https://www.groomit.me) — homepage FAQ block
- [Groomit Terms of Service](https://www.groomit.me/terms)
- [Groomit Required Vaccinations](https://www.groomit.me/help/article/booking-process/what-are-the-required-vaccinations)
- [Fresha Terms of Service](https://terms.fresha.com/terms-service)
- [PetSmart grooming search context](https://services.petsmart.com/content/grooming-faq)
- [Scenthound](https://www.scenthound.com)
- [SVBT — Hundecoiffeuse/-coiffeur](https://www.tierpfleger.ch/svbt/hundecoiffeuse-coiffeur/)
- [berufsberatung.ch — Tierpfleger EFZ](https://www.berufsberatung.ch/dyn/show/1900?id=3975)
- [Comparis — Hundehalter Pflichtversicherung CH](https://en.comparis.ch/tierversicherung/hunde/hundehalter-pflichtversicherung)
- [Mobiliar — Haftpflicht Hund Katze CH](https://www.mobiliar.ch/ratgeber/haftpflichtversicherung-hund)
- [Allianz CH — Haftpflicht Hunde 2026](https://www.allianz.ch/de/privatkunden/ratgeber/wohnen/haftpflichtversicherung-hunde.html)
- [Selbstständig Schweiz — Berufshaftpflicht 2026](https://www.xn--selbstndig-schweiz-qtb.ch/artikel/berufshaftpflicht-schweiz)
- [dogvers.de — Betriebshaftpflicht Hundefriseure](https://dogvers.de/betriebshaftpflicht-hundefriseure/)
- [Schweizer Tierschutz STS — Hundehaltung](https://tierschutz.com/tierhaltung/heimtierhaltung/hundehaltung/)
- [TIR — Hunderecht Schweiz](https://www.tierimrecht.org/de/recht/hunderecht/)
- [BLV — Fachinformation 12.4 Anforderungen Betreuung fremder Heimtiere](https://www.blv.admin.ch/dam/blv/de/dokumente/tiere/heim-und-wildtierhaltung/fi-anforderungen-betreuung-fremder-tiere.pdf.download.pdf/D_Fachinformation_12.4_Anforderungen_f%C3%BCr_die_Betreuung_fremder_Heimtiere.pdf)
- [Progressive Commercial — Dog Pet Groomer Insurance](https://www.progressivecommercial.com/business-insurance/professions/dog-pet-groomer-insurance/)
- [PCI — Pet Dog Grooming Insurance](https://www.petcareins.com/pet-groomer-insurance)
- [MoneyGeek — Dog Grooming Business Insurance 2026](https://www.moneygeek.com/insurance/business/pet/dog-grooming/)
- [Rover Background Checks](https://www.rover.com/background-checks/)
- [Wagbar — Vaccination Verification](https://www.wagbar.com/vaccination-verification-at-a-pet-bar-franchise-rabies-bordetella-and-distemper)
- [Forever Vets — Vaccines for Grooming](https://forevervets.com/blog/vaccines-needed-for-dog-grooming-be-prepared/)
- [Golden Pawps — Vaccines Required by Groomers](https://goldenpawps.com/what-vaccines-do-dogs-need-for-grooming/)
