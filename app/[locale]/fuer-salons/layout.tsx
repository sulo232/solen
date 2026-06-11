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
      url: `https://solen.ch/${locale}/fuer-salons`,
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
      canonical: `https://solen.ch/${locale}/fuer-salons`,
      languages: {
        de: "https://solen.ch/de/fuer-salons",
        en: "https://solen.ch/en/fuer-salons",
        fr: "https://solen.ch/fr/fuer-salons",
        it: "https://solen.ch/it/fuer-salons",
      },
    },
  };
}

export default function PartnerLayout({ children }: PartnerLayoutProps) {
  return <>{children}</>;
}
