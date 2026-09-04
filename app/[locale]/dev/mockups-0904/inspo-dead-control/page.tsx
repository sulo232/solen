// Grounded-in: app/[locale]/inspo/[id]/page.tsx, components-legacy/discovery/DetailPage.tsx
//
// Exists-check: `npm run exists inspo-dead-control` ran this turn, 0 hits (genuinely new route). A
// broader `npm run exists inspo` also ran this turn: routes hit /[locale]/inspo, /[locale]/inspo/[id]
// (the real item-detail surface this brief points at), /[locale]/inspo/saved, /[locale]/inspo/board/[id],
// /[locale]/inspo/nails. No REMOVED.md hit for a DM/store/message control on this surface. The one new
// thing on this route is the report block below; the "Current" block is the real, unmodified item-detail
// component fed real Supabase data, same as the production route.
//
// Depicts: Inspo item-detail surface -> components-legacy/discovery/DetailPage.tsx (real, unmodified import)
//
// Mockup-scope: section (the one control named in the brief, plus a written proof block; no full-page
// redesign, nothing else on the surface touched)
//
// BRIEF CONTRADICTION, surfaced per rule 18 before building anything (grep run this turn):
//   `grep -n -i "DM\b\|Discovery-store" _plans/reports-2026-09-04/OPEN_ITEMS.md` -> 0 hits, twice, with
//   two different patterns. The "DM" / "Discovery-store" entry the brief describes is NOT in
//   OPEN_ITEMS.md at all. It lives in the sibling file `_plans/reports-2026-09-04/INVENTORY.md`,
//   UI_CHANGES item 4, quoted verbatim below.
//
// FINDING, after reading the real surface end to end (app/[locale]/inspo/[id]/page.tsx plus
// components-legacy/discovery/DetailPage.tsx, all ~480 lines, not a partial read): that INVENTORY.md
// entry does not name an existing dead control. Its own text says so: "no /discover/[id] route exists
// yet, build the mockup against the existing Inspo detail surface, not a from-scratch page." It is a
// PROPOSAL for a control that has never been built here, not a control that renders and does nothing.
// I read every interactive element actually on this page (list below, file:line) and every single one
// is wired to a real action already: navigation, a real API call, or local UI state. There is no
// dead DM / store / message control on this surface to remove or re-wire.
//
// So per the brief's own stop clause ("if the control turns out to already be wired, stop, write a page
// that says so with the file:line proof, and return"), extended to the one case that clause did not
// name (the control turns out not to exist at all, rather than existing-and-wired): this page stops
// and reports, instead of inventing a dead control to build two fictional variants around.
//
// emphasis-ok: this is a text audit report, not a customer screen; weight marks the two section
// labels only (Current / Finding), every control-list row below stays font-normal (colon separates
// name from destination instead of a bold span, to hold the emphasis budget on a text-heavy report).

import { createServerSupabaseClient } from "@/lib/supabase";
import type { DiscoveryItem } from "@/lib/types";
import DetailPage, { type SalonLite } from "@/components-legacy/discovery/DetailPage";
import { DISCOVERY_TO_MARKETPLACE_CATEGORY } from "@/lib/discovery-categories";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// Same shape as app/[locale]/inspo/[id]/page.tsx's getItem() (not exported there, so re-read here
// verbatim: published + active, real row, no fabricated fields). Picks a row with a description
// already filled so the real component renders its full, wired control set (no on-demand AI call
// triggered from this report page).
async function getSampleItem(): Promise<DiscoveryItem | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("discovery_items")
    .select("*")
    .eq("status", "published")
    .eq("is_active", true)
    .not("description_en", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as DiscoveryItem | null;
}

// Same "book this look" salon match as app/[locale]/inspo/[id]/page.tsx:179-236 (not exported there,
// re-read verbatim here for the real data this report needs).
async function getSalonsFor(item: DiscoveryItem): Promise<{ salons: SalonLite[]; salonTotal: number }> {
  const supabase = await createServerSupabaseClient();
  const categoryRoute = DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] ?? "coiffeur";
  try {
    const { data: salonRows } = await supabase
      .from("salons")
      .select("id, name, slug, average_rating, review_count, services!inner(id, name_de, name_en, name_fr, name_it, price, category, is_active)")
      .eq("is_active", true)
      .eq("services.is_active", true)
      .eq("services.category", categoryRoute)
      .order("average_rating", { ascending: false })
      .limit(60);
    const rows = salonRows ?? [];
    const salons = rows.slice(0, 3).map((s: Record<string, unknown>) => {
      type Svc = { id: string; name_de: string | null; name_en: string | null; name_fr: string | null; name_it: string | null; price: number | null };
      const services = ((s.services as Svc[]) ?? []).filter((x) => typeof x.price === "number" && x.price > 0);
      const chosen = services.slice().sort((a, b) => (a.price ?? 0) - (b.price ?? 0))[0];
      const priceExact = services.length === 1;
      return {
        id: s.id as string,
        name: s.name as string,
        slug: s.slug as string,
        rating: (s.average_rating as number | null) ?? null,
        reviewCount: (s.review_count as number | null) ?? null,
        priceFrom: services.length ? Math.min(...services.map((x) => x.price as number)) : null,
        priceExact,
        exactServiceName: priceExact ? (chosen?.name_de || chosen?.name_en || null) : null,
        serviceId: chosen?.id ?? null,
      };
    });
    return { salons, salonTotal: rows.length };
  } catch (err) {
    console.error("[inspo-dead-control report] salon fetch failed:", err);
    return { salons: [], salonTotal: 0 };
  }
}

export default async function InspoDeadControlReport({ params }: PageProps) {
  const { locale } = await params;
  const item = await getSampleItem();
  const { salons, salonTotal } = item ? await getSalonsFor(item) : { salons: [], salonTotal: 0 };
  const categoryRoute = item ? (DISCOVERY_TO_MARKETPLACE_CATEGORY[item.category] ?? "coiffeur") : "coiffeur";

  return (
    <div className="mx-auto max-w-[480px] bg-white pb-16">
      <div className="px-[18px] pt-6">
        <p className="text-[13px] font-semibold text-s-ink">Current: the real Inspo item detail (unmodified)</p>
        <p className="mt-1 text-[12px] font-normal text-s-ink-2">
          Real fetched row, rendered through the real DetailPage component, same as production.
        </p>
      </div>

      {item ? (
        <DetailPage
          item={item}
          locale={locale}
          isAuthenticated={false}
          salons={salons}
          salonTotal={salonTotal}
          categoryRoute={categoryRoute}
        />
      ) : (
        <p className="px-[18px] py-8 text-[14px] font-normal text-s-ink-2">
          No published, active discovery_items row with a filled description was found live to render.
        </p>
      )}

      <div className="mt-2 border-t border-s-border px-[18px] pt-6">
        <p className="text-[13px] font-semibold text-s-ink">Finding: no dead DM / store control on this surface</p>

        <p className="mt-3 text-[14px] font-normal leading-[1.6] text-s-ink-2">
          The brief pointed at OPEN_ITEMS.md for a &quot;DM&quot; / &quot;Discovery-store&quot; dead
          control. Grepping that file for both terms returns zero hits. The entry actually lives in the
          sibling file INVENTORY.md, UI_CHANGES item 4, quoted verbatim:
        </p>
        <blockquote className="mt-2 border-l-2 border-s-border pl-3 text-[13px] font-normal leading-[1.55] text-s-ink-2">
          &quot;[Discovery-store DM] Surface: Inspo/discovery item detail. Mockup must show: a
          share-to-DM / book-from-inspo entry point linking a discovery item to a real booking or
          conversation action. Copy: the real Inspo item detail page (no /discover/[id] route exists
          yet, build the mockup against the existing Inspo detail surface, not a from-scratch page).&quot;
        </blockquote>
        <p className="mt-3 text-[14px] font-normal leading-[1.6] text-s-ink-2">
          That entry names a control that does not exist yet, not one that renders and does nothing.
          Every interactive element that actually exists on this page today is wired to a real action:
        </p>

        <ul className="mt-3 space-y-2 text-[13px] font-normal leading-[1.5] text-s-ink-2">
          <li>Back: router.push(/inspo), DetailPage.tsx:260</li>
          <li>Save heart: POST /api/discovery/save, DetailPage.tsx:120,265</li>
          <li>Play: loads the TikTok embed inline, DetailPage.tsx:240</li>
          <li>Creator pill: external link to the creator&apos;s TikTok, DetailPage.tsx:317</li>
          <li>Tags: Link to /inspo?search=, DetailPage.tsx:338</li>
          <li>Mehr lesen / Details: local expand state, DetailPage.tsx:353,367</li>
          <li>Book this look rows: Link into the real booking wizard with the matched service pre-selected, DetailPage.tsx:398</li>
          <li>See all N Stores: Link to the category search, DetailPage.tsx:432</li>
          <li>More like this / See all: Link into /inspo?search=, DetailPage.tsx:448</li>
          <li>Similar look cards: router.push into /inspo/[id], DetailPage.tsx:460,462</li>
        </ul>

        <p className="mt-4 text-[14px] font-normal leading-[1.6] text-s-ink-2">
          The nearest real dead thing anywhere in the codebase touching messaging is
          app/api/conversations/route.ts, per `_plans/DEAD_FEATURES_FOR_OWNER.md`
          (&quot;In-app messaging between salons and customers&quot;): a real, built API with zero
          callers anywhere in the app, product-level paused. It is not a control on this page or on any
          Inspo surface, it has no rendered entry point at all, on this page or anywhere else.
        </p>

        <p className="mt-4 text-[14px] font-normal leading-[1.6] text-s-ink-2">
          Stopping here per the brief&apos;s own instruction: nothing on the real Inspo item detail is a
          dead control, so no removed/wired variant pair was built. Building one would mean inventing a
          control that does not exist.
        </p>
      </div>
    </div>
  );
}
