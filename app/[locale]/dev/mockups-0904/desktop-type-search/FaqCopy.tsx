// Grounded-in: app/[locale]/[city]/[category]/page.tsx (CityCategoryFaq, private/unexported)
//
// exists-check: net-new vs lib/min-price-service.ts, components-legacy/salon/SalonReviews.tsx,
// components/discovery/PriceRangeBadge.tsx, app/[locale]/dev/pdp/reviews-filter/page.tsx because
// none of those render the city/category FAQ block; this is a byte-copy of a private function.
//
// Depicts: city/category FAQ section -> app/[locale]/[city]/[category]/page.tsx (private
//   unexported CityCategoryFaq function, "en" entry of CITY_CATEGORY_FAQ_COPY, byte-copied
//   verbatim below since it cannot be imported)
//
// Byte-copy note: CityCategoryFaq in app/[locale]/[city]/[category]/page.tsx is a private,
// unexported function, so it cannot be imported directly. This is a verbatim copy of its JSX
// (classes copied as-is) restricted to the "en" entry of that file's CITY_CATEGORY_FAQ_COPY
// object, which is already hardcoded English literal in the real file (not a next-intl key),
// so no copy was invented here. Rendered twice below (Current unmodified, Proposed inside the
// scoped wrapper) so the h2/summary/p sizes shown are the real ones, not redrawn.

const FAQ_ITEMS = [
  {
    q: "How much does a visit to a Hair Salon in Basel cost?",
    a: "Prices vary by store and service. Use our filter to compare stores by price range.",
  },
  {
    q: "How do I find the best Hair Salon in Basel?",
    a: "Check the reviews, compare prices and read other customers' experiences.",
  },
  {
    q: "Can I book an appointment online?",
    a: "Yes. Every store on Solen supports online booking.",
  },
];

export function FaqCopy() {
  return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-border max-w-[800px] mx-auto">
      <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-6">
        Frequently asked questions
      </h2>
      {/* boxed-ok: byte-copy of the real, already-approved CityCategoryFaq markup
          (app/[locale]/[city]/[category]/page.tsx carries its own "mockup-ok: S1 fix ...
          approved public/_mockups/fixes-refined" comment on this exact container+hairline-row
          pattern). Not a new decision made here, unchanged from production. */}
      <div className="rounded-card border border-s-border bg-white overflow-hidden">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="border-t border-s-border p-4 cursor-pointer first:border-t-0">
            <summary className="font-body font-semibold text-base text-s-ink">{item.q}</summary>
            <p className="font-body text-sm text-s-ink-2 mt-3">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
