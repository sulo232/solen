/**
 * /dev/flows: dev-only FLOW HARNESS hub. Walk each user flow end to end,
 * login-free, driving the REAL routes/components (not static copies),
 * reachable over the cloudflare tunnel on a phone. Owner ask (voice,
 * 2026-07-08): "I want each FLOW... click and see all the animations, go
 * back and stuff... test out everything on the front end, see if it works
 * right now." Reference build: this hub plus BOOKING wired fully. Every
 * other flow lists as a visibly-disabled "coming" card, the owner approves
 * this pattern before the rest get wired. Full brief: _plans/FLOW_HARNESS.md.
 *
 * Exists-check (`npm run exists flows` / `dev-flows`, 2026-07-08), two hits,
 * both accounted for:
 *   1. app/[locale]/dev/mockups/page.tsx already runs a "single stable index,
 *      tap through cards" pattern, but for STATIC design mockups/comparison
 *      boards. This page reuses that card-list convention (grouped cards,
 *      truncated label + desc, trailing affordance) except the destination
 *      is the REAL running app, not a mockup screenshot.
 *   2. REMOVED.md: "audit-fixes dev before-after fabrication mockup flow"
 *      (the /dev/audit-fixes before/after panel, owner-rejected 2026-07-08,
 *      deleted this same turn). This harness is its replacement, not a
 *      re-proposal of the deleted thing.
 * Net-new: a login-free deep link straight into the real booking wizard
 * (guest-first, verified logged-out 200 on 2026-07-08) plus the dev-only
 * FlowBar (layout.tsx) for walking a flow and returning to the hub.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  CreditCard,
  UserPlus,
  LogIn,
  Gift,
  Share2,
  HandCoins,
  Star,
  Stamp,
  Bookmark,
  Search,
  type LucideIcon,
} from "lucide-react";
import { ComingSoon } from "@/app/[locale]/_components/primitives/ComingSoon";

// Verified live 2026-07-08 via `curl /api/salons?limit=5` + `/api/salons/muse-beauty-studio`:
// is_active salon, 15 active services, 3 active staff, so the wizard renders past step 1
// and exercises the Staff step too (0/1-staff salons skip it).
const TEST_SALON_SLUG = "muse-beauty-studio";
const TEST_SALON_NAME = "Muse Beauty Studio";

type FlowStatus = "wired" | "coming";

interface FlowCard {
  key: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  status: FlowStatus;
  /** Path appended after /{locale}, wired flows only. */
  entry?: string;
  /** How a wired flow is entered: straight into the real route, or via the dev-login bypass. */
  via?: "direct" | "dev-login";
  /** Extra one-line note shown under a wired card (e.g. a payment boundary). */
  boundary?: string;
}

const FLOWS: FlowCard[] = [
  {
    key: "booking",
    name: "Booking",
    icon: Calendar,
    desc: `Services -> Staff -> Zeit -> Bezahlen, live wizard for ${TEST_SALON_NAME}`,
    status: "wired",
    entry: `/salon/${TEST_SALON_SLUG}/booking`,
    via: "direct",
    boundary: "Lands on the real Stripe pay step. This harness does not submit a live charge.",
  },
  { key: "walkin", name: "Walk-in", icon: Clock, desc: "Queue number, pay upfront, show up", status: "coming" },
  { key: "checkout", name: "Checkout / Pay", icon: CreditCard, desc: "Cart through to a Stripe confirmation", status: "coming" },
  { key: "onboarding", name: "Onboarding", icon: UserPlus, desc: "Customer and salon setup", status: "coming" },
  { key: "auth", name: "Auth", icon: LogIn, desc: "Login, register, reset", status: "coming" },
  { key: "gift-card", name: "Gift card", icon: Gift, desc: "Buy and redeem a gift card", status: "coming" },
  { key: "referral", name: "Referral", icon: Share2, desc: "Invite link to reward", status: "coming" },
  { key: "tip", name: "Tip", icon: HandCoins, desc: "Post-visit tip flow", status: "coming" },
  { key: "reviews", name: "Reviews", icon: Star, desc: "Leave a review after a visit", status: "coming" },
  { key: "loyalty", name: "Loyalty / Stamps", icon: Stamp, desc: "Solen Status rank and stamp card", status: "coming" },
  { key: "inspo-save", name: "Inspo save", icon: Bookmark, desc: "Save a look from the discovery feed", status: "coming" },
  { key: "search", name: "Search", icon: Search, desc: "Find and filter a salon", status: "coming" },
];

export default async function DevFlowsHub({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="mx-auto max-w-[560px] px-5 pb-16 pt-8">
        <p className="text-[12px] font-semibold text-s-ink-2">Solen, dev flow harness</p>
        <h1 className="mt-1 font-heading text-[22px] font-bold text-s-ink">Walk a flow</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          No login needed. Every wired card opens the real route and the real
          component, so walking it doubles as a test of whether the flow works
          right now. A flow behind auth would open through the dev-login
          bypass ({"/api/dev/login?to=<path>"}); Booking is guest-first and
          needs neither.
        </p>

        <section className="mt-7">
          <h2 className="text-[14px] font-bold text-s-ink">Flows</h2>
          <p className="mb-3 text-[12.5px] text-s-ink-2">
            This reference build wires Booking only. The rest are listed so
            the pattern is visible end to end; they open once approved.
          </p>
          <div className="space-y-2">
            {FLOWS.map((flow) => {
              const Icon = flow.icon;
              const iconBadge = (
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-s-bg-sunken text-s-ink-2">
                  <Icon size={18} strokeWidth={2} aria-hidden />
                </span>
              );
              const label = (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-s-ink">{flow.name}</span>
                  <span className="block truncate text-[12.5px] text-s-ink-2">{flow.desc}</span>
                  {flow.status === "wired" && flow.boundary ? (
                    <span className="mt-0.5 block text-[12px] text-s-ink-2">{flow.boundary}</span>
                  ) : null}
                </span>
              );

              if (flow.status === "wired" && flow.entry) {
                const href =
                  flow.via === "dev-login"
                    ? `/api/dev/login?to=/${locale}${flow.entry}`
                    : `/${locale}${flow.entry}`;
                return (
                  <Link
                    key={flow.key}
                    href={href}
                    className="flex items-center gap-3 rounded-card border border-s-border bg-white px-4 py-3.5 active:scale-[0.99]"
                  >
                    {iconBadge}
                    {label}
                    <span className="shrink-0 rounded-full bg-s-success-bg px-2.5 py-1 text-[12px] font-semibold text-s-success">
                      Live
                    </span>
                  </Link>
                );
              }

              return (
                <ComingSoon
                  key={flow.key}
                  label={flow.name}
                  toastTitle={`${flow.name}: not wired yet`}
                  toastDescription="Reference build wires Booking only, for now."
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-card border border-s-border bg-white px-4 py-3.5 text-left"
                  >
                    {iconBadge}
                    {label}
                    <span className="shrink-0 rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink-2">
                      Coming
                    </span>
                  </button>
                </ComingSoon>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
