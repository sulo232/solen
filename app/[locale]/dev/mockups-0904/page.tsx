// Grounded-in: app/[locale]/dev/mockups/page.tsx (the existing dev-mockups index; this route is
// the same kind of surface, a plain links-and-status nav index, not a UI comparison mockup, so it
// carries no visual-comparison rules, same as that file's own header).
//
// Exists-check: `npm run exists mockups-0904` ran this turn. Its many hits are all sibling
// component/page files inside app/[locale]/dev/mockups-0904/<slug>/ built tonight. None of them is
// an index page for this folder other than this file itself. A separate, older index
// (`npm run exists mockups-index`) already exists at app/[locale]/dev/mockups/page.tsx, listing a
// different, earlier batch of routes directly under /dev/<slug> (not under /dev/mockups-0904/). No
// REMOVED.md hit for either keyword. The one new thing here: a plain-English index for the full
// 28-row batch of tonight's /dev/mockups-0904/<slug> work, written for the owner to open on his
// phone, replacing the earlier partial 22-row version of this same file.
//
// Mockup-scope: whole-page (this route IS the whole decision: a list of links + status).
//
// This page renders no real product component itself (it is a links-and-text index, not a UI
// comparison); it sits inside app/[locale]/ so the site's real header/bottom nav render around it
// automatically, and it draws none of its own. Each row below links to, or describes the status
// of, a sibling mockup built tonight under this same app/[locale]/dev/mockups-0904/ folder (or
// describes why nothing was built). The index invents no feature of its own.
// Depicts: home-anchor row -> app/[locale]/dev/mockups-0904/home-anchor/page.tsx (built)
// Depicts: inspo-anchor row -> app/[locale]/dev/mockups-0904/inspo-anchor/page.tsx (built)
// Depicts: rebooking-toggle row -> app/[locale]/dev/mockups-0904/rebooking-toggle/page.tsx (built; a
// come-back-and-rebook nudge toggle on the already-live notification_preferences.rebooking_enabled
// column; see that page's own header comment for the note on how this differs from the graveyard's
// dead cron sender, a different layer entirely)
// Depicts: kiosk-link row -> app/[locale]/dev/mockups-0904/kiosk-link/page.tsx (built)
// Depicts: desktop-type-home row -> app/[locale]/dev/mockups-0904/desktop-type-home/page.tsx (built)
// Depicts: desktop-type-salon row -> app/[locale]/dev/mockups-0904/desktop-type-salon/page.tsx (built)
// Depicts: desktop-type-search row -> app/[locale]/dev/mockups-0904/desktop-type-search/page.tsx (built)
// Depicts: dashboard-type-collapse row -> app/[locale]/dev/mockups-0904/dashboard-type-collapse/page.tsx (built)
// Depicts: profile-type-collapse row -> app/[locale]/dev/mockups-0904/profile-type-collapse/page.tsx (built)
// Depicts: pdp-type-collapse row -> app/[locale]/dev/mockups-0904/pdp-type-collapse/page.tsx (built)
// Depicts: search-type-collapse row -> app/[locale]/dev/mockups-0904/search-type-collapse/page.tsx (built)
// Depicts: welcome-email-de row -> app/[locale]/dev/mockups-0904/welcome-email-de/page.tsx (built)
// Depicts: dashboard-filter-pill-gray row -> app/[locale]/dev/mockups-0904/dashboard-filter-pill-gray/page.tsx (built)
// Depicts: directory-cards row -> app/[locale]/dev/mockups-0904/directory-cards/page.tsx (built)
// Depicts: notifications-link row -> app/[locale]/dev/mockups-0904/notifications-link/page.tsx (built)
// Depicts: see-all-button row -> app/[locale]/dev/mockups-0904/see-all-button/page.tsx (built)
// Depicts: where-step-height row -> app/[locale]/dev/mockups-0904/where-step-height/page.tsx (built)
// Depicts: warning-icon-contrast row -> app/[locale]/dev/mockups-0904/warning-icon-contrast/page.tsx (built)
// Depicts: dashboard-nav-entries row -> app/[locale]/dev/mockups-0904/dashboard-nav-entries/page.tsx (built)
// Depicts: small-visual-fixes row -> app/[locale]/dev/mockups-0904/small-visual-fixes/page.tsx (built)
// Depicts: queue-done-tip row -> app/[locale]/dev/mockups-0904/queue-done-tip/page.tsx (built)
// Depicts: confirm-tip row -> app/[locale]/dev/mockups-0904/confirm-tip/page.tsx (built)
// Depicts: search-anchor row -> app/[locale]/dev/mockups-0904/search-anchor/page.tsx (built, known difference, see note)
// Depicts: staff-per-service row -> app/[locale]/dev/mockups-0904/staff-per-service/page.tsx (built, known difference, see note)
// Depicts: stamps-redeem row -> app/[locale]/dev/mockups-0904/stamps-redeem/page.tsx (built, known difference, see note)
// Depicts: slot-radius row -> app/[locale]/dev/mockups-0904/slot-radius/page.tsx (built, known difference, see note)
// Depicts: profile-tabs-sticky row -> NET-NEW: no page built, describes only why it was not built (component was removed on purpose)
// Depicts: inspo-dead-control row -> app/[locale]/dev/mockups-0904/inspo-dead-control/page.tsx (built, but describes only why the reported control was never actually dead)

type MockupRow = {
  slug: string;
  title: string;
  status: "ready" | "built, known difference" | "not built";
  href: string | null;
  login: string | null;
  note: string;
  desktop: boolean;
};

const rows: MockupRow[] = [
  {
    slug: "home-anchor",
    title: "A display anchor on the home first screen",
    status: "ready",
    href: "/en/dev/mockups-0904/home-anchor",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "inspo-anchor",
    title: "A real heading on Inspo",
    status: "ready",
    href: "/en/dev/mockups-0904/inspo-anchor",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "rebooking-toggle",
    title: "A come-back-and-rebook nudge switch in settings",
    status: "ready",
    href: "/en/dev/mockups-0904/rebooking-toggle",
    login: "/api/dev/login?to=",
    note: "",
    desktop: false,
  },
  {
    slug: "kiosk-link",
    title: "A way to open the queue display",
    status: "ready",
    href: "/en/dev/mockups-0904/kiosk-link",
    login: "/api/dev/login?to=",
    note: "",
    desktop: true,
  },
  {
    slug: "desktop-type-home",
    title: "Desktop home: ten font sizes to four",
    status: "ready",
    href: "/en/dev/mockups-0904/desktop-type-home",
    login: null,
    note: "",
    desktop: true,
  },
  {
    slug: "desktop-type-salon",
    title: "Desktop salon page: eleven font sizes to four",
    status: "ready",
    href: "/en/dev/mockups-0904/desktop-type-salon",
    login: null,
    note: "",
    desktop: true,
  },
  {
    slug: "desktop-type-search",
    title: "Desktop search results: six font sizes to four",
    status: "ready",
    href: "/en/dev/mockups-0904/desktop-type-search",
    login: null,
    note: "",
    desktop: true,
  },
  {
    slug: "dashboard-type-collapse",
    title: "Four font sizes on the dashboard home",
    status: "ready",
    href: "/en/dev/mockups-0904/dashboard-type-collapse",
    login: "/api/dev/login?to=",
    note: "",
    desktop: false,
  },
  {
    slug: "profile-type-collapse",
    title: "Four font sizes on the profile hub",
    status: "ready",
    href: "/en/dev/mockups-0904/profile-type-collapse",
    login: "/api/dev/login?to=",
    note: "",
    desktop: false,
  },
  {
    slug: "pdp-type-collapse",
    title: "Four font sizes on the salon page",
    status: "ready",
    href: "/en/dev/mockups-0904/pdp-type-collapse",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "search-type-collapse",
    title: "Four font sizes on the search screen",
    status: "ready",
    href: "/en/dev/mockups-0904/search-type-collapse",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "welcome-email-de",
    title: "German welcome email in the formal register",
    status: "ready",
    href: "/en/dev/mockups-0904/welcome-email-de",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "dashboard-filter-pill-gray",
    title: "Gray selected filter pills on the dashboard",
    status: "ready",
    href: "/en/dev/mockups-0904/dashboard-filter-pill-gray",
    login: "/api/dev/login?to=",
    note: "",
    desktop: false,
  },
  {
    slug: "directory-cards",
    title: "Listings you cannot book yet, in the results",
    status: "ready",
    href: "/en/dev/mockups-0904/directory-cards",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "notifications-link",
    title: "Notifications reachable from the profile hub",
    status: "ready",
    href: "/en/dev/mockups-0904/notifications-link",
    login: "/api/dev/login?email=kunde@solen.ch&to=", // german-ok: real seed account email, not UI copy
    note: "",
    desktop: false,
  },
  {
    slug: "see-all-button",
    title: "One see-all button everywhere",
    status: "ready",
    href: "/en/dev/mockups-0904/see-all-button",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "where-step-height",
    title: "The Where step hugs its content",
    status: "ready",
    href: "/en/dev/mockups-0904/where-step-height",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "warning-icon-contrast",
    title: "The amber clock icon nobody can see",
    status: "ready",
    href: "/en/dev/mockups-0904/warning-icon-contrast",
    login: "/api/dev/login?to=",
    note: "",
    desktop: false,
  },
  {
    slug: "dashboard-nav-entries",
    title: "Three built dashboard pages get a menu entry",
    status: "ready",
    href: "/en/dev/mockups-0904/dashboard-nav-entries",
    login: "/api/dev/login?email=habobi1238@proton.me&to=",
    note: "",
    desktop: false,
  },
  {
    slug: "small-visual-fixes",
    title: "Three small fixes: cookie buttons, wait time colour, review card edge",
    status: "ready",
    href: "/en/dev/mockups-0904/small-visual-fixes",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "queue-done-tip",
    title: "Tip after a walk-in visit",
    status: "ready",
    href: "/en/dev/mockups-0904/queue-done-tip",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "confirm-tip",
    title: "Tip link on the booking confirmation",
    status: "ready",
    href: "/en/dev/mockups-0904/confirm-tip",
    login: null,
    note: "",
    desktop: false,
  },
  {
    slug: "search-anchor",
    title: "A display anchor on the search first screen",
    status: "built, known difference",
    href: "/en/dev/mockups-0904/search-anchor",
    login: null,
    note: `Built and viewable. Adding the big heading makes five text sizes on a screen whose result cards already use four; the law allows four. Your call: merge two small sizes on the result card, or allow five here.`,
    desktop: false,
  },
  {
    slug: "staff-per-service",
    title: "A stylist per service in the booking flow",
    status: "built, known difference",
    href: "/en/dev/mockups-0904/staff-per-service",
    login: null,
    note: `Built and viewable. Both blocks are missing the booking flow's top bar (back arrow, step title, close), so the screen looks barer than the real step.`,
    desktop: false,
  },
  {
    slug: "stamps-redeem",
    title: "Redeem button on a completed stamp card",
    status: "built, known difference",
    href: "/en/dev/mockups-0904/stamps-redeem",
    login: "/api/dev/login?email=seiju3865@gmail.com&to=",
    note: `Built and viewable. The stamp cards render 280px wide instead of the real 370px, so the stamps wrap differently, and the "Reward available" badge lost its capital letters because a writing check refuses them.`,
    desktop: false,
  },
  {
    slug: "slot-radius",
    title: "Time slot corners: 12px rectangle or pill",
    status: "built, known difference",
    href: "/en/dev/mockups-0904/slot-radius",
    login: null,
    note: `Built and viewable. The Proposed block is not an exact copy of the real time picker: it leaves out the loading and empty states and the "more dates" sheet, and drops the keyboard focus outline. The corner comparison itself is real.`,
    desktop: false,
  },
  {
    slug: "profile-tabs-sticky",
    title: "Sticky tab bar on the profile tabs",
    status: "not built",
    href: null,
    login: null,
    note: `Not built. The tab bar it would stick was removed on purpose on 2026-08-27 (the Konto hub replaced it).`,
    desktop: false,
  },
  {
    slug: "inspo-dead-control",
    title: "The Inspo control that does nothing",
    status: "not built",
    href: "/en/dev/mockups-0904/inspo-dead-control",
    login: null,
    note: `Not built. There is no dead control on the Inspo detail page, every control there is wired. The item was a proposal for a control that was never built.`,
    desktop: false,
  },
];

function buildHref(row: MockupRow, locale: string): string | null {
  if (!row.href) return null;
  const target = row.href.match(/^\/(en|de|fr|it)\//) ? row.href : `/${locale}${row.href}`;
  return row.login ? `${row.login}${target}` : target;
}

function RowList({ list, locale }: { list: MockupRow[]; locale: string }) {
  return (
    <ul className="flex flex-col">
      {list.map((row) => {
        const href = buildHref(row, locale);
        const inner = (
          <div className="flex min-h-11 flex-col justify-center gap-1 py-2">
            <span className="text-[15px] font-semibold text-s-ink">{row.title}</span>
            {row.note ? (
              <span className="text-[13px] font-normal text-s-ink-2">{row.note}</span>
            ) : null}
            {row.desktop ? (
              <span className="text-[13px] font-normal text-s-ink-2">desktop</span>
            ) : null}
          </div>
        );
        return (
          <li key={row.slug} className="border-b border-s-border last:border-b-0">
            {href ? (
              <a href={href} className="block">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default async function MockupsIndex0904({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const ready = rows.filter((row) => row.status === "ready");
  const knownDifference = rows.filter((row) => row.status === "built, known difference");
  const notBuilt = rows.filter((row) => row.status === "not built");

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6">
      <h1 className="text-[20px] font-semibold text-s-ink">Mockups built 2026-09-04</h1>
      <p className="mt-2 text-[13px] font-normal text-s-ink-2">
        22 ready to look at, 4 built with a known difference from the real screen, 2 not built. Tap
        a row, judge it on your phone. Every one is a copy of the real screen with only the
        proposed change applied; nothing here is live.
      </p>

      <h2 className="mt-6 text-[15px] font-semibold text-s-ink">Ready to look at</h2>
      <RowList list={ready} locale={locale} />

      <h2 className="mt-6 text-[15px] font-semibold text-s-ink">Built, with a known difference</h2>
      <RowList list={knownDifference} locale={locale} />

      <h2 className="mt-6 text-[15px] font-semibold text-s-ink">Not built</h2>
      <RowList list={notBuilt} locale={locale} />
    </div>
  );
}
