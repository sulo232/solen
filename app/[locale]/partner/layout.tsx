import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface PartnerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PartnerLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partner" });

  const title = `${t("hero_title_1")} ${t("hero_title_accent")} ${t("hero_title_2")} | solen.ch`;
  const description = t("hero_subtitle");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://solen.ch/${locale}/partner`,
      siteName: "solen.ch",
      locale: locale === "de" ? "de_CH" : locale === "fr" ? "fr_CH" : locale === "it" ? "it_CH" : "en",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://solen.ch/${locale}/partner`,
      languages: {
        de: "https://solen.ch/de/partner",
        en: "https://solen.ch/en/partner",
        fr: "https://solen.ch/fr/partner",
        it: "https://solen.ch/it/partner",
      },
    },
  };
}

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  return <>{children}</>;
}
