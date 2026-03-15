'use client';
import { CategoryPageTemplate } from '@/src/components/CategoryPageTemplate';
interface Props { params: Promise<{ locale: string }> }
export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <CategoryPageTemplate category="waxing" locale={locale} />;
}
