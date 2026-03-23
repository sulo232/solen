import { redirect } from "next/navigation";

export default function DatenschutzPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/privacy`);
}
