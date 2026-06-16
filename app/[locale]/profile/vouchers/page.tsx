import { redirect } from "next/navigation";

// Vouchers / Gutscheine (the gift-card wallet) HIDDEN from customers (owner, 2026-06-14).
// Same feature as gift cards; shelved in favour of a Solen-wide loyalty card. Reversible:
// restore the previous client page from git (`git show HEAD:app/\[locale\]/profile/vouchers/page.tsx`)
// and un-hide the entry points. /api/profile/vouchers + the vouchers/gift_cards backend stay intact.
export default async function VouchersWalletHidden({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/profile`);
}
