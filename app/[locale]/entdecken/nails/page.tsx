import { permanentRedirect } from "next/navigation";

// V3-D159 (2026-05-25): German alias for /discover/nails. Mirrors the
// canonical redirect pattern (see app/[locale]/discover/nails/page.tsx)
// but lands on /entdecken?category=nails so the URL stays German rather
// than dropping the user onto the English /discover URL.

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NailsEntdeckenRedirect({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/entdecken?category=nails`);
}
