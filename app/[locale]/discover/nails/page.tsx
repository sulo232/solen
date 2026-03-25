import { permanentRedirect } from "next/navigation";

interface Props {
  params: { locale: string };
}

export default function NailsDiscoverRedirect({ params }: Props) {
  permanentRedirect(`/${params.locale}/discover?category=nails`);
}
