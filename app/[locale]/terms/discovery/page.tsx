import { getTranslations } from "next-intl/server";

const SECTIONS = [
  "copyright",
  "license",
  "content_rules",
  "removal",
  "gdpr",
  "disclaimer",
] as const;

export default async function DiscoveryTermsPage() {
  const t = await getTranslations("discovery_tos");

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text mb-8">{t("title")}</h1>
        <div className="space-y-6">
          {SECTIONS.map((key) => (
            <div key={key}>
              <h2 className="text-base font-heading font-semibold text-s-ink dark:text-s-dm-text mb-2">
                {t(`${key}_heading`)}
              </h2>
              <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">
                {t(`${key}_text`)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 mt-12">
          © {new Date().getFullYear()} solen.ch — Basel, Switzerland
        </p>
      </div>
    </main>
  );
}
