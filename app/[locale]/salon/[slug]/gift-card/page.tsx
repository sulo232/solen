import { redirect } from "next/navigation";

// Gift cards (Gutscheine) HIDDEN from customers (owner, 2026-06-14). The gift-card
// surface is being shelved in favour of a Solen-wide loyalty card. The nav + profile +
// salon-page entry points were removed; this route redirects too so a bookmarked URL
// can't reach the buy flow. Reversible: restore the previous client page from git
// (`git show HEAD:app/\[locale\]/salon/\[slug\]/gift-card/page.tsx`) and un-hide the
// entry points. The gift_cards backend, /api/gift-cards/*, and the salon-owner
// dashboard gift-card surfaces stay intact.
export default async function GiftCardHidden({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/salon/${slug}`);
}
