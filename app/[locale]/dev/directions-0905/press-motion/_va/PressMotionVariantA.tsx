// Grounded-in: app/[locale]/dev/_shared/seedSalon.ts (the real, live seed-salon loader this
// file calls, same server-fetch pattern app/[locale]/dev/directions-0905/home/_va/HomeVariantA.tsx
// already uses: an async server component fetches, then hands real data to a client child).
//
// Exists-check: `npm run exists getSeedSalon` -> the real, live loader (one real salon + up to
// 5 real services, is_active + listed_on_marketplace + is_test=false, same visibility filters as
// GET /api/salons). `npm run exists press-motion` -> 0, net-new surface.
//
// Depicts: this file's own output -> NET-NEW: it renders no UI itself, it only fetches the real
//   seed salon server-side and hands it to ./PressMotionSceneA.tsx (see that file's own Depicts
//   manifest for every real control it renders).

import PressMotionSceneA from "./PressMotionSceneA";
import { getSeedSalon } from "@/app/[locale]/dev/_shared/seedSalon";

export default async function PressMotionVariantA({ locale }: { locale: string }) {
  const salon = await getSeedSalon(locale);
  return <PressMotionSceneA salon={salon} />;
}
