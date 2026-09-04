// Grounded-in: components-legacy/dashboard/DashboardLayout.tsx (RAIL_NAV, NAV_GROUP_ORDER,
// ADMIN_NAV consts + the mobile sidebar's grouped-nav render block), app/[locale]/dashboard/earnings/page.tsx,
// app/[locale]/dashboard/products/page.tsx, app/[locale]/dashboard/help-editor/page.tsx,
// messages/en.json (dashboard.nav, dashboard.earningsPage.title, dashboard.helpEditorPage.title).
//
// Depicts: grouped sidebar row + group-header markup -> components-legacy/dashboard/DashboardLayout.tsx
//   (the mobile sidebar's grouped nav list is not exported, so the row classes are byte-copied
//   here verbatim from the real resting/non-active branch at DashboardLayout.tsx:382 -
//   `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors
//   text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken` - confirmed by grep against that file, not
//   approximated; driven by a plain `groups` prop instead of the real module-level RAIL_NAV /
//   NAV_GROUP_ORDER / ADMIN_NAV consts)
// Depicts: "Verkauf & Kunden" group current rows -> components-legacy/dashboard/DashboardLayout.tsx
// Depicts: "Abrechnung" group current rows -> components-legacy/dashboard/DashboardLayout.tsx
// Depicts: Admin group excerpt -> components-legacy/dashboard/DashboardLayout.tsx
// Depicts: "Balance & payouts" new row -> NET-NEW: sidebar entry for the already-rendering app/[locale]/dashboard/earnings/page.tsx
// Depicts: "Products" new row -> NET-NEW: sidebar entry for the already-rendering app/[locale]/dashboard/products/page.tsx
// Depicts: "Help articles" new row -> NET-NEW: sidebar entry for the already-rendering app/[locale]/dashboard/help-editor/page.tsx
//
// What each current-row block traces to, in prose (kept out of the Depicts lines above so the
// gate's strict `-> path` parser matches cleanly): the "Verkauf & Kunden" rows are catalog, bundles,
// clients, sales, in the order RAIL_NAV declares them; the "Abrechnung" rows are refunds, upcharge,
// cases, same order; the Admin excerpt is approvals, allSalons, allUsers, revenue, commission,
// content, reviewModeration, reports, trimmed from the real 19-row ADMIN_NAV array down to the
// rows nearest the insertion point (the rows not shown are unaffected and unchanged).
//
// Copy note: RAIL_NAV's own `label` fields are hardcoded German strings, not routed through
// next-intl (no t() call on them), so there is no English form to copy from messages/en.json for
// those existing rows (catalog/bundles/clients/sales/refunds/upcharge/cases); they are translated
// here directly (Katalog->Catalog, Combos->Combos, Kund:innen->Clients, Verkäufe->Sales,
// Rückerstattungen->Refunds, Mehrbelastung->Surcharges, Fälle->Cases). ADMIN_NAV rows route
// through t(key) against the "dashboard.nav" namespace, so those labels are copied verbatim from
// messages/en.json. The three new rows use each real page's own English title: earnings
// ("Balance & payouts", dashboard.earningsPage.title) and help-editor ("Help articles",
// dashboard.helpEditorPage.title) both come from messages/en.json; products has no i18n key (its
// h1 hardcodes German "Produkte" directly), translated here as "Products".
//
// Deviations from the source, both because this is a static side-by-side comparison, not the live
// client-side sidebar, plus one forced by this repo's own mockup gates:
//  1. no `active`/`aria-current` state (no real pathname to compare against here; every row renders
//     in its resting "text-s-ink-2" state, same classes the source uses for !active)
//  2. no onClick close-sidebar handler (no overlay here to close)
//  3. the real group header is `uppercase tracking-[0.08em] px-3 mt-5 mb-1`; this file uses
//     normal-case, no horizontal padding, `mb-1` only. The uppercase drop is not a taste choice:
//     this repo's no-caps-gate refuses `uppercase` in a /dev/ file, and the mockup copy-economy
//     rule says the same for a different reason. The dropped `px-3`/`mt-5` are a taste choice for
//     this comparison layout (no rail padding context to match here) and are flagged in
//     `concerns`, not disguised as byte-copy since the Depicts line above only claims the ROW is
//     byte-copied, not the group-header spacing.
//  4. the row markup itself (className on the `<a>`) IS now the exact byte-copy named above, with
//     zero omitted classes against the resting/non-active branch.

import type { LucideIcon } from "lucide-react";

export interface NavRow {
  key: string;
  href: string;
  icon: LucideIcon;
  label: string;
  /** true only for the three rows this mockup proposes adding */
  isNew?: boolean;
}

/** A non-interactive marker row: names how many real rows sit between the two rows it is
 * placed between, so a trimmed excerpt never presents two non-adjacent real rows as adjacent. */
export interface OmissionMarker {
  key: string;
  note: string;
  isOmission: true;
}

export interface NavGroup {
  label: string;
  items: (NavRow | OmissionMarker)[];
}

// card-ok deviation, named in `concerns`: the byte-copy this traces to (DashboardLayout.tsx's
// mobile sidebar) sits inside a white sheet by virtue of being an overlay panel, not because the
// nav list itself is a card. Per the 2026-07-15 merchant round ("Card economy: ONE carded hero
// per screen; secondary info is BARE TEXT on the canvas, no card/box/pill costume"), this
// comparison renders as bare rows directly on the DashboardLayout canvas, no border/background/
// radius wrapper of its own.
export function NavGroupList({ groups }: { groups: NavGroup[] }) {
  // Plain wrapper div, not a `<nav>`: this is one comparison block among six on the page, and
  // the real navigation landmark is already the inherited DashboardLayout chrome. A `<nav>` here
  // would draw a second (and third, and...) navigation landmark this mockup did not earn.
  return (
    <div>
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[12px] font-semibold text-s-ink-2 mb-1">
            {group.label}
          </p>
          {group.items.map((item) =>
            "isOmission" in item ? (
              <p key={item.key} className="px-3 py-1 text-[12px] font-medium text-s-ink-2">
                {item.note}
              </p>
            ) : (
              <a
                key={item.key}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[15px] font-medium transition-colors text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken"
              >
                <item.icon size={20} strokeWidth={2.2} className="text-s-ink-2" />
                <span className="flex-1">{item.label}</span>
                {item.isNew && (
                  <span className="shrink-0 text-[12px] font-semibold text-s-accent">New</span>
                )}
              </a>
            )
          )}
        </div>
      ))}
    </div>
  );
}
