import { redirect } from "next/navigation";

// Customer messaging surface turned OFF for now (owner, 2026-06-13). The chat inbox
// was only reachable via email-notification links and had no in-app entry point.
// Redirect to the account hub instead of showing an orphan inbox. Reversible: restore
// the previous client page from git history to re-enable. The conversations backend,
// ChatWindow component, and the salon-side /dashboard/messages stay intact.
export default async function MessagesRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/profile`);
}
