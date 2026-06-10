import { getTranslations } from "next-intl/server";
import RecentlyViewedClient from "./RecentlyViewedClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recentlyViewed" });
  // Personal history — keep it out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default function RecentlyViewedPage() {
  return <RecentlyViewedClient />;
}
