import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  return (
    <main className="min-h-screen bg-s-bg-base py-16 px-4">
      <article className="max-w-2xl mx-auto prose prose-sm">
        <h1 className="font-heading text-3xl text-s-ink mb-6">{t("privacy.title")}</h1>
        <p className="text-s-ink/60 text-xs mb-8">{t("privacy.lastUpdated")}</p>

        <h2>{t("privacy.s1Title")}</h2>
        <p>{t("privacy.s1Body")}</p>

        <h2>{t("privacy.s2Title")}</h2>
        <p>{t("privacy.s2Body")}</p>

        <h2>{t("privacy.s3Title")}</h2>
        <p>{t("privacy.s3Body")}</p>

        <h2>{t("privacy.s4Title")}</h2>
        <p>{t("privacy.s4Body")}</p>

        <h2>{t("privacy.s5Title")}</h2>
        <p>{t("privacy.s5Body")}</p>
      </article>
    </main>
  );
}
