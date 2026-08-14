# Should Solen take payment at the salon counter? An outside read.

**Asked because the owner said so, 2026-08-14:** *"show me n run through sub agents m llm council"*,
answering the question of whether Solen should handle in-person payment (a tip, a retail product, or
an extra service rung up at the end of an appointment) before launch.

## Who actually answered, and who did not

Two of three. Naming the gap rather than presenting two voices as a full panel:

- **Grok 4** answered in full.
- **Gemini 3.1 Pro** answered and was cut off after about 775 characters, mid-sentence. Its position
  was clear before it stopped; its reasoning was not complete.
- **Claude Opus** did not answer at all: the local `claude` CLI is missing or failing and there is no
  Anthropic API key set, so that seat was empty. The council script reported this honestly rather
  than silently returning two.

Also worth recording, because it is the same class of problem this whole night has been about: the
council script's default Gemini model, `gemini-3-pro-preview`, **does not exist for this API key**
and returns a 404. Listing the key's real models showed `gemini-3.1-pro-preview` and
`gemini-2.5-pro` among others. A default that 404s means anyone running this skill has been getting
a two-model council while believing they had three.

## What they said

**They agree, and neither was asked to.** Both independently landed on: counter payment is a
post-launch feature at best, and there is a serious argument it should never be Solen's business.

**Grok 4, in full:**

> In-person counter payment is a post-launch feature for a marketplace at Solen's stage. Comparable
> platforms (Booksy, Treatwell, Fresha, Schedulicity) launched with booking + online deposit or full
> prepayment and kept counter transactions on the salon's existing till for 12-36 months. [...] The
> "code is mostly written" argument is irrelevant; the risk is operational and regulatory, not
> engineering hours.

On the smallest honest version, asked whether tip-only would do:

> Tip-only is not meaningfully useful and is strictly worse than the status quo. A tip recorded in
> Solen but paid through the salon's till creates a reconciliation nightmare for the salon (they
> have to match two systems) while giving Solen no new revenue and no control.

The three things it says a founder would not see coming:

1. **Swiss VAT on retail.** If Solen processes the payment for a physical product, Solen is likely
   the merchant of record for VAT on that line, even though the salon hands over the shampoo. The
   `vat_amount` columns on `retail_purchases` assume booking VAT logic, and retail can carry
   different reporting and place-of-supply rules.
2. **Merchant of record for physical goods.** Money moving through Stripe Connect for a product
   makes Solen an intermediary in a sale of goods: product liability, returns, warranty, and salons
   expecting Solen to handle disputes about the shampoo.
3. **Commission on cash.** There is no defined flow for a cash retail sale or cash tip that still
   owes Solen commission. Either the salon reports it later (they will not, reliably) or Solen eats
   the commission on in-person revenue. The empty `sales` and `sale_line_items` tables show no sign
   this was designed.

And its answer to "attack the premise":

> Solen should never own counter payment. [...] That changes the sales conversation from "we bring
> you customers" to "we replace part of your existing till and take a cut on everything."

**Gemini 3.1 Pro**, before it was cut off, set up two opposed positions (a Marketplace Purist and a
SaaS Maximalist) and had the Purist arguing:

> It is absolutely a post-launch feature, bordering on a never-launch feature. You have 28 salons
> and zero customers. Your only job is liquidity. [...] Treatwell, Fresha, and early Mindbody did
> not win by replacing the cash register on Day 1

It stopped before the Maximalist got to answer, so **the strongest case FOR building it is missing
from this document**, and that should be held against the record rather than read as agreement.

## What is actually built, verified not assumed

- A finished 318-line checkout sheet on an unmerged branch (service + retail picker + tip presets +
  live total). Its own header says it replaces an inline cash-checkout panel that **already renders
  on the dashboard home today**.
- Live and empty: `sales`, `sale_line_items`, `retail_sales`, `retail_purchases`,
  `nail_retail_products`, `tips`.
- Live and working: `POST /api/bookings/[id]/checkout`, which already marks a booking paid and
  records a tip.

## My own read, which the owner should weigh separately from theirs

I agree with them, and the strongest reason is not in either answer: **TWINT is switched off pending
Stripe review.** In Switzerland a meaningful share of counter payment is TWINT, so shipping counter
payment today would ship it without the payment method a Swiss customer most expects at a counter.
That is not a reason to never do it; it is a reason it cannot be done properly right now.

The named cost of NOT doing it, so this is not a one-sided document: Solen only ever sees the
booking half of what a salon earns, so every revenue number shown to a salon understates them, and
the retail and tip data stays outside the product permanently.

**Nothing has been deleted.** The checkout sheet stays where it is, on its branch, until the owner
says otherwise.
