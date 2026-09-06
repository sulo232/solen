// Exists-check: `npm run exists payment-step` -> 13 hits, all under
// app/[locale]/dev/directions-0905/payment-step/ (round-1's switcher + its three directions,
// _va/_vb/_vc, a different route: /dev/directions-0905/payment-step, no ?s= param, no round-2
// kit). No round-2 payment-step route exists yet under directions-0905-r2. This file is net-new,
// created per the task brief's "if it does not exist yet, create it as a thin switch on the ?s=
// query" instruction; it does not exist, so it is created fresh here, minimally.
//
// Depicts: the thin-switcher shell pattern -> app/[locale]/dev/directions-0905-r2/kit-preview/page.tsx
//   (a real-data server component reading ?s=, no scaffolding, no direction-switcher UI in the
//   fold per the cross-system "no scaffolding" rule).
//
// Shared switcher for the three /dev/directions-0905-r2/payment-step look systems (?s=). Each
// system's builder owns ONLY their own payment-step/_<system>/ folder; this file just reads ?s=
// and renders the matching branch. Add a new branch here only for a system that does not exist
// yet, never restructure this file for one branch.
import { SYSTEMS, type SystemKey } from "../_kit/systems";
import PaymentStepLift from "./_lift/PaymentStepLift";
import PaymentStepTray from "./_tray/PaymentStepTray";
import PaymentStepRule from "./_rule/PaymentStepRule";

function isSystemKey(v: string | undefined): v is SystemKey {
  return v === "lift" || v === "rule" || v === "tray";
}

export default async function PaymentStepR2Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  await params;
  const { s } = await searchParams;
  const key = isSystemKey(s) ? s : undefined;

  if (key === "lift") {
    return <PaymentStepLift />;
  }

  if (key === "tray") {
    return <PaymentStepTray />;
  }

  if (key === "rule") {
    return <PaymentStepRule />;
  }

  if (key && SYSTEMS[key]) {
    return (
      <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
        System &quot;{key}&quot; not built yet for this surface.
      </div>
    );
  }

  return (
    <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
      Unknown system. Use ?s=lift, ?s=rule or ?s=tray.
    </div>
  );
}
