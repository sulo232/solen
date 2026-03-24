import { Suspense } from "react";
import SplitView from "@/components/search/SplitView";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      <Suspense>
        <SplitView locale={locale} initialFilters={sp} />
      </Suspense>
    </main>
  );
}
