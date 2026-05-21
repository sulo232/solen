import StaffProfilePage from "@/components-legacy/staff/StaffProfilePage";

export default async function StaffProfileRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string; staffId: string }>;
}) {
  const { slug, staffId } = await params;

  return <StaffProfilePage staffId={staffId} salonSlug={slug} />;
}
