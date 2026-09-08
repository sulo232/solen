import StaffProfilePage from "@/components-legacy/staff/StaffProfilePage";
import { notFound } from "next/navigation";
import { loadSalonDetailWithAccess } from "@/lib/salon-detail";

export default async function StaffProfileRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string; staffId: string }>;
}) {
  const { slug, staffId } = await params;
  const result = await loadSalonDetailWithAccess(slug);
  if (!result || !result.salon.staff.some((staff) => staff.id === staffId)) {
    notFound();
  }

  return <StaffProfilePage staffId={staffId} salonSlug={slug} />;
}
