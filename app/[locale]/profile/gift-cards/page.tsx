import { redirect } from "next/navigation";

// Gift cards HIDDEN from customers (owner, 2026-06-14). The wallet of purchased gift
// cards is shelved with the rest of the gift-card surface. Reversible: restore the
// previous client page from git (`git show HEAD:app/\[locale\]/profile/gift-cards/page.tsx`)
// and un-hide the entry points. gift_cards backend + /api/gift-cards/* stay intact.
export default async function GiftCardsWalletHidden({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/profile`);
}
