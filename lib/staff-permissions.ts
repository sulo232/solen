// Lifted verbatim from branch claude/nice-hugle-c0b706 (2026-08-30). The owner decided
// "eight separate areas" for staff logins on 2026-08-14; this model was written to match
// but the branch it landed on was never merged, so it sat stranded until this pass brought
// it across unchanged. Only change made here: two em-dashes below became colons, this
// project bans the character everywhere.

// Staff access permission model: shared by the team-access UI, the invite API,
// and (later) the dashboard middleware/route gating. One source of truth so a
// "role" is just a named default over the same permission grant set.

export type PermissionKey =
  | "calendar"   // calendar & bookings (view + manage appointments)
  | "schedule"   // edit rota / staff working hours
  | "clients"    // clients & CRM
  | "catalog"    // services & pricing
  | "marketing"  // campaigns, promos, loyalty
  | "finance"    // earnings, payouts, reports
  | "team"       // invite teammates + change their access
  | "settings";  // business settings

export interface PermissionArea {
  key: PermissionKey;
  label: string;
  desc?: string;
}

// Display order in the invite/edit modal.
export const PERMISSION_AREAS: PermissionArea[] = [
  { key: "calendar",  label: "Calendar & bookings" },
  { key: "schedule",  label: "Edit rota / schedules", desc: "Set anyone's working hours" },
  { key: "clients",   label: "Clients & CRM" },
  { key: "catalog",   label: "Catalog & services" },
  { key: "marketing", label: "Marketing" },
  { key: "finance",   label: "Finance & reports" },
  { key: "team",      label: "Team & access", desc: "Invite others, change permissions" },
  { key: "settings",  label: "Settings" },
];

export type StaffPermissions = Partial<Record<PermissionKey, boolean>>;

// Preset roles. "custom" has no preset: the owner sets the toggles themselves.
export type AccessRole = "owner" | "manager" | "front_desk" | "staff" | "custom";

export const ROLE_LABELS: Record<AccessRole, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front desk",
  staff: "Staff",
  custom: "Custom",
};

const ALL_TRUE: StaffPermissions = Object.fromEntries(PERMISSION_AREAS.map((a) => [a.key, true]));

// Default grant set per preset. Owner is always full (and immutable in the UI).
export const ROLE_PRESETS: Record<Exclude<AccessRole, "custom">, StaffPermissions> = {
  owner: { ...ALL_TRUE },
  manager: { ...ALL_TRUE },
  front_desk: { calendar: true, schedule: true, clients: true },
  staff: { calendar: true },
};

export function presetPermissions(role: AccessRole): StaffPermissions {
  if (role === "custom") return {};
  return { ...ROLE_PRESETS[role] };
}

// Owner always passes; otherwise check the explicit grant.
export function hasPermission(
  perms: StaffPermissions | null | undefined,
  key: PermissionKey,
  isOwner = false,
): boolean {
  if (isOwner) return true;
  return !!perms?.[key];
}

// Given a grant set, infer which preset it matches (for displaying a role badge),
// else "custom".
export function inferRole(perms: StaffPermissions): AccessRole {
  const norm = (p: StaffPermissions) => PERMISSION_AREAS.map((a) => (p[a.key] ? 1 : 0)).join("");
  const target = norm(perms);
  for (const role of ["manager", "front_desk", "staff"] as const) {
    if (norm(ROLE_PRESETS[role]) === target) return role;
  }
  return "custom";
}
