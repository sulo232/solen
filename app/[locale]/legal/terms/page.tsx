import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("legal");
  return (
    <main className="min-h-screen bg-s-bg-base py-16 px-4">
      <article className="max-w-2xl mx-auto prose prose-sm">
        <h1 className="font-heading text-3xl text-s-ink mb-6">{t("terms.title")}</h1>
        <p className="text-s-ink/60 text-xs mb-8">{t("terms.lastUpdated")}</p>

        <h2>{t("terms.s1Title")}</h2>
        <p>{t("terms.s1Body")}</p>

        <h2>{t("terms.s2Title")}</h2>
        <p>{t("terms.s2Body")}</p>

        <h2>{t("terms.s3Title")}</h2>
        <p>{t("terms.s3Body")}</p>

        <h2>{t("terms.s4Title")}</h2>
        <p>{t("terms.s4Body")}</p>

        <h2>{t("terms.s5Title")}</h2>
        <p>{t("terms.s5Body")}</p>
      </article>
    </main>
  );
}
