export interface SalonRouteRow {
  owner_id: string | null;
  is_active: boolean | null;
  listed_on_marketplace: boolean | null;
  is_test: boolean | null;
}

export function shouldBlockUnknownCity(
  citySlugs: Set<string> | null,
  citySeg: string,
): boolean {
  if (citySlugs === null) return false;
  return !citySlugs.has(citySeg);
}

export function isPublicSalonRouteRow(row: SalonRouteRow | null): boolean {
  return Boolean(
    row?.is_active === true &&
    row.listed_on_marketplace !== false &&
    row.is_test !== true,
  );
}

export function shouldBlockSalonRoute({
  row,
  salonLookupFailed,
  viewerId,
  viewerLookupFailed,
  isAdmin,
}: {
  row: SalonRouteRow | null;
  salonLookupFailed: boolean;
  viewerId: string | null;
  viewerLookupFailed: boolean;
  isAdmin: boolean;
}): boolean {
  if (salonLookupFailed || viewerLookupFailed) return false;
  if (isPublicSalonRouteRow(row)) return false;
  if (row && viewerId && row.owner_id === viewerId) return false;
  if (isAdmin) return false;
  return true;
}
