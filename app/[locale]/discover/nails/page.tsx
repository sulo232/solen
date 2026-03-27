import { permanentRedirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function NailsDiscoverRedirect({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/discover?category=nails`);
}
