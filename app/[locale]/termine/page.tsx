import { redirect } from "next/navigation";

// Q9 lock 2026-04-22: /termine → /profile/bookings canonical
export default async function TermineRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/profile/bookings`);
}
