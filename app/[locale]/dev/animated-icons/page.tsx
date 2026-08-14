/**
 * /dev/animated-icons , the animated icons, in the row they would actually live in.
 *
 * Owner 2026-08-10: "the Airbnb still animated icons are on [branch] claude/airbnb-animated-icons-ee4329".
 *
 * WHAT I FOUND, which is not what the message implies. That branch is MERGED, so nothing is
 * stranded on it, and the clips are already on disk in main at
 * `public/_pixel-refs/solen-icons/out/`. They were built over 43 rounds of his own feedback
 * (`_plans/AIRBNB_ANIMATED_ICONS_R2.md`, 99KB of it) and then wired into NOTHING: a grep for
 * `solen-icons` across `app/` and `lib/` returns zero hits. Finished work that never reached a
 * screen.
 *
 * THE REAL BLOCKER, and it is a counting problem rather than a design one:
 *
 *   category   mesh                clip
 *   Coiffeur   coiffeur-v1.glb     coiffeur-hero, set-dryer
 *   Barber     barber-v2.glb       barber-hero, barber-calm, set-barber, chair-twirl
 *   Nails      NONE                NONE
 *   Spa        NONE                NONE
 *   Inspo      NONE                NONE
 *
 * Two of the five pill categories can animate and three cannot. Shipping that straight into the
 * live row gives two moving icons beside three still ones, which is the one-thing-two-ways
 * inconsistency FLOORS LAW 8 exists to stop, and it is the same complaint he made about the
 * hamburger three messages ago.
 *
 * Making the missing three needs a MESH, and a mesh comes from the paid image-to-3D MCP he told me
 * by name to stop spending on (`_plans/AIRBNB_ANIMATED_ICONS_R2.md`: "CORRECTION: stop spending on
 * the generation MCP"). So it is his call, not mine to quietly make.
 *
 * exists-check: `npm run exists animated-icons` and `npm run exists "animated icon"` both return 0.
 * `_plans/AIRBNB_ANIMATED_ICONS.md` and `_plans/AIRBNB_ANIMATED_ICONS_R2.md` were read first; both
 * are workstream files that track the GENERATION of the clips, neither renders them anywhere.
 *
 * Dev-only, notFound() in production. Deliberately NOT wired into the live row.
 */
import { notFound } from "next/navigation";
import AnimatedIconRow from "./AnimatedIconRow";

export default function AnimatedIconsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        The animated icons
      </h1>
      <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink-2">
        They are real, they are finished, and nothing on the site renders them. Two of the five
        categories have a clip. Tap a pill to play it, which is what Airbnb does: their hover does
        nothing at all, and a click plays the clip once.
      </p>

      <AnimatedIconRow />

      <section className="mt-10 rounded-card bg-s-bg-sunken p-5">
        <h2 className="font-display text-[18px] font-semibold text-s-ink">
          Why this is not in the live row yet
        </h2>
        <p className="mt-2 max-w-[560px] font-body text-[15px] text-s-ink">
          Two of five would animate and three would not, in the same row. That is the same
          one-thing-two-ways problem you named on the hamburger.
        </p>
        <p className="mt-3 max-w-[560px] font-body text-[15px] text-s-ink">
          Making the other three needs a 3D mesh, and a mesh comes from the paid generation tool you
          told me to stop spending on. So it is your call: ship the mixed row, or pay for the three
          missing meshes first.
        </p>
      </section>
    </main>
  );
}
