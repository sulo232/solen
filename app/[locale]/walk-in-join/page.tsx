import { redirect } from "next/navigation";

// Orphaned route (audit #12): nothing links here — SalonResultCard intentionally bypasses
// it, and the walk-in entry now flows salon page → /walk-in-pay → /queue/[token]. The old
// screen also rendered broken (undefined s-ink-1/4/5 tokens, audit #11). Rather than keep a
// dead-end, bounce any stray /walk-in-join hit to the homepage.
export default async function WalkInJoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
