"use client";

// V3-D344 (2026-05-28): V3 is the salon PDP. Analytics (track-view POST + posthog
// + trackSalonView recently-viewed) + JSON-LD structured data are wired directly
// into SalonDetailV3 — full parity with the retired legacy stack. The `?v3=0`
// legacy escape hatch and its render path were removed once V3 was verified
// end-to-end (booking flow handoff confirmed). SalonDetailV3 reads its own
// route params + searchParams internally, so this is a thin wrapper.
// History: V3-D202 Phase B introduced the opt-in `?v3=1` gate; V3-D344 promoted
// V3 to default; the legacy tree was retired in full afterwards.
import { SalonDetailV3 } from "@/app/[locale]/_components/salon/SalonDetailV3";

export default function SalonProfilePage() {
  return <SalonDetailV3 />;
}
