import { redirect } from "next/navigation";

// Salon messaging turned OFF for now (owner, 2026-06-13). The customer inbox was
// turned off + this dashboard inbox's nav entries removed; redirect the page too so
// a bookmarked URL doesn't reach a dead surface. Reversible: restore the previous
// client page from git history + un-hide the nav entries + flip MESSAGING_EMAILS_ENABLED.
// Conversations backend + ChatWindow stay intact.
export default async function DashboardMessagesRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard`);
}
