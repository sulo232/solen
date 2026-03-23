import { redirect } from "next/navigation";

export default async function TOSPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/terms`);
}
