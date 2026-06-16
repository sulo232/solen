import { redirect } from "next/navigation";

// Vouchers / Gutscheine (buy a gift card) HIDDEN from customers (owner, 2026-06-14).
// The gift-card surface is shelved in favour of a Solen-wide loyalty card. Reversible:
// restore the previous client page from git (`git show HEAD:app/\[locale\]/vouchers/page.tsx`)
// and un-hide the entry points. The gift_cards/vouchers backend + /api/gift-cards/* stay intact.
export default async function VouchersHidden({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
