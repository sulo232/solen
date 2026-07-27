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

---

## "ab CHF {amount}" ("from CHF X") price-line pattern

**Locked visually** in `_design-system/LOCKFILE.md` (lines ~377, ~798, ~836, ~919) and
`_rules/SOLEN_PATTERNS.md:23` as a typography/hierarchy pattern: meta text, "ab CHF"
amounts recede next to the entity name. That lock says nothing about WHEN "ab" may
legally prefix a price.

**The concern (copy-i18n-11, 2026-07-27, confidence: assume, not verified):** Swiss
price-display law (Preisbekanntgabeverordnung, PBV, enforced by the Preisüberwacher/SECO)
treats a "from" price as a genuine floor, not a marketing anchor. "Ab CHF 45" should mean
"the cheapest way to buy this is CHF 45, and some purchases of it cost more", not "this
costs CHF 45" dressed up to sound like a deal.

**What the data model actually supports (checked 2026-07-27, `lib/types.ts` `Service`):**
a `Service` row has ONE flat `price: number`, not a price-tier array (there is no
hair-length/product-addon variant structure on the row itself). Separately, `PricingRule`
rows (`weekend_surcharge`, `peak_hour_surcharge`, `holiday_surcharge`, `last_minute_discount`,
`off_peak_discount`) can move the FINAL charged price up or down from that base price.

- `components-legacy/SalonCard.tsx:106,338` uses `salon.min_price` (the cheapest of the
  salon's MANY services) for its "ab CHF" line. This is uncontroversially correct: a salon
  genuinely has multiple services at different prices, and the card shows the true floor.
- `app/[locale]/_components/search/SearchOverlay.tsx:667` shows "ab {price}" (`tCommon("fromPrice")`)
  for a SINGLE named service's flat `price` in the search-suggestion list, e.g. "Herrenschnitt,
  ab CHF 45" where CHF 45 is that one service's only listed price. Whether that is legally fine
  turns on a real interpretive question this codebase cannot answer by itself: do the salon's
  `PricingRule` surcharges/discounts on that exact service make CHF 45 the genuine floor (a
  discount can make it cheaper), or does labeling a single-priced service "ab" overstate its
  price flexibility when in practice surcharges only ever push it UP?

**Not fixed here, on purpose.** This is a legal-interpretation question (what PBV actually
requires for THIS specific pricing-rule shape), not a mechanical bug: unilaterally rewriting
customer-facing, revenue-visible price copy on a guess risks getting the compliance question
wrong in the opposite direction, and risks a visible copy regression (dropping "ab" from every
service search result) on a guess. Queued for the owner/legal review: does `SearchOverlay.tsx`'s
per-service "ab" need to be data-gated to "does this service have an applicable discount
PricingRule" (making a flat, un-discounted, un-surchargeable service just show "CHF 45", no
"ab"), or is the current uniform "ab" prefix fine because PricingRule-driven variance is close
enough to a price tier. Whichever way it's decided, add the rule here and cross-reference it
from the LOCKFILE "ab CHF" rows above.
