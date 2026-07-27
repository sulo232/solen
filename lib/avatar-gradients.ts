// Deterministic per-person avatar gradient (consistent colour per name), used by the
// dashboard "no photo" avatar fallback. This exact 5-color array was hand-typed
// identically in app/[locale]/dashboard/{page,clients/page,bookings/page,staff/page}.tsx
// (color-tokens-07, 2026-07-27) -- four independent copies that would have guaranteed
// the next rebrand missed at least one. Single source now; import AV_GRADS / avGrad
// instead of redefining them.
//
// These are deliberately NOT LOCKFILE §1 semantic tokens: they are a fixed
// avatar-initial palette (the same category of thing as GitHub/Slack per-user avatar
// colors), picked for hue spread, not for brand meaning. Do not swap them for s-*
// tokens without an explicit owner call -- that would be a visible design change to
// every dashboard avatar, not a dedup.
export const AV_GRADS = [
  "from-[#276EF1] to-[#1B4DCB]",
  "from-[#F0A868] to-[#C0524A]",
  "from-[#16A34A] to-[#0E7A37]",
  "from-[#8B5CF6] to-[#6D28D9]",
  "from-[#EC4899] to-[#BE185D]",
] as const;

/** Deterministic gradient class for a name/id: same input always maps to the same gradient. */
export function avGrad(s: string): string {
  const key = s || "";
  const sum = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV_GRADS[sum % AV_GRADS.length];
}
