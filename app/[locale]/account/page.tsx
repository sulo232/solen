import { redirect } from "next/navigation";

export default async function AccountRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/profile`);
}
