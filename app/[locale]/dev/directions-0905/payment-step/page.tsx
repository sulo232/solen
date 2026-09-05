// Exists-check: `npm run exists payment` -> onboarding and terminal payment forms, the
// payment-mode lib, payment validations/schemas, the profile PaymentMethods component and
// payment settings page; no prior comparison entry for this surface (payment-step) existed
// before this file.
// Grounded-in: app/[locale]/profile/settings/payment/page.tsx (the real payment settings
// surface each direction below will treat).
//
// Depicts: switcher shell -> ../_shared/DirectionFrame.tsx (reused as-is).
// Depicts: direction a content -> ./_va/PaymentStepDirectionA.tsx (this builder, Fresha
//   review order, structure-only, Solen locks kept, see that file's own header comment).
// Depicts: direction b content -> ./_vb/PaymentStepDirectionB.tsx (this builder, Airbnb
//   checkout full strength, live order kept, see that file's own header comment).
// Depicts: direction c content -> ./_vc/PaymentStepDirectionC.tsx (this builder,
//   progressive with motion, Solen locks kept, see that file's own header comment).
//
// Shared switcher for the three /dev/directions-0905/payment-step directions (?v=a|b|c).
// Each builder owns ONLY their own payment-step/_v<letter>/ folder; this file just reads
// ?v= and renders the matching branch. Data fetching for each direction lives INSIDE that
// direction's own component so no builder's fetch logic collides with another's.
import { DirectionFrame } from "../_shared/DirectionFrame";
import PaymentStepDirectionA from "./_va/PaymentStepDirectionA";
import PaymentStepDirectionB from "./_vb/PaymentStepDirectionB";
import { getPaymentStepDataB } from "./_vb/getPaymentStepDataB";
import PaymentStepDirectionC from "./_vc/PaymentStepDirectionC";
import { getPaymentStepDataC } from "./_vc/getPaymentStepDataC";

const DIRECTIONS = [
  { value: "a", label: "Fresha review order" },
  { value: "b", label: "Airbnb checkout, full strength" },
  { value: "c", label: "Progressive, with motion" },
];

export default async function PaymentStepDirectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale } = await params;
  const { v } = await searchParams;
  const active = v === "a" || v === "b" || v === "c" ? v : "a";
  void locale;

  const dataB = active === "b" ? await getPaymentStepDataB() : null;
  const dataC = active === "c" ? await getPaymentStepDataC() : null;

  return (
    <DirectionFrame surface="payment-step" directions={DIRECTIONS} active={active}>
      {active === "a" ? (
        <PaymentStepDirectionA />
      ) : active === "b" ? (
        dataB ? (
          <PaymentStepDirectionB data={dataB} />
        ) : (
          <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
            Direction B: real data for muse-beauty-studio was not found.
          </div>
        )
      ) : active === "c" ? (
        dataC ? (
          <PaymentStepDirectionC data={dataC} />
        ) : (
          <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
            Direction C: real data for muse-beauty-studio was not found.
          </div>
        )
      ) : (
        <div className="px-4 py-16 text-center text-[13px] text-s-ink-2">
          Direction {String(active).toUpperCase()} not built in this pass.
        </div>
      )}
    </DirectionFrame>
  );
}
