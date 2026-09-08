import type { Metadata } from "next";
import InspoPageClient from "./InspoPageClient";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";

interface InspoPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: InspoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const t = await getTranslations({ locale: loc, namespace: "discovery.meta" });
  const title = t("title");
  const description = t("description");
  const alternates = buildAlternates("inspo", loc);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://solen.ch/${loc}/inspo`,
      siteName: "solen.ch",
    },
    alternates,
  };
}

export default function InspoPage() {
  return <InspoPageClient />;
}
