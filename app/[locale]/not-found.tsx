import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-s-coral/10 mx-auto flex items-center justify-center mb-6">
          <FileQuestion size={40} className="text-s-coral" />
        </div>
        <p className="font-display text-7xl text-s-coral dark:text-s-coral mb-4">
          404
        </p>
        <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-2">
          {t("title")}
        </h2>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 font-body leading-relaxed mb-8">
          {t("description")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] shadow-warm-sm"
        >
          {t("homeButton")}
        </Link>
      </div>
    </main>
  );
}
