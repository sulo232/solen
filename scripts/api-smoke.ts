// scripts/api-smoke.ts
//
// Ring 5 (test + CI floor): API smoke harness. LIVE DB reads only, no
// mutations. Hits the underlying query/logic of the top ~10 GET endpoints
// the same way the prior ring kill-tests do (function-level, since the
// sandboxed shell blocks outbound localhost fetches, see ring1b/ring1c/ring2b
// header notes for the same constraint): imports the REAL production
// functions/constants where they exist (loadSalonDetail, runHealthProbes,
// SALON_PUBLIC_COLS) rather than reimplementing them, then zod-parses a
// MINIMAL shape against the live response. This is the mobile-contract
// tripwire: PostgREST silently swallows a `.select()` on a renamed/missing
// column (returns null, not an error), so this catches that drift before a
// mobile client does.
//
// Usage: npx tsx scripts/api-smoke.ts

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { z } from "zod";

type CaseResult = { name: string; pass: boolean; detail: string };
const results: CaseResult[] = [];

function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  ${detail}`);
}

async function main() {
  const { createServerSupabaseClient, createAdminSupabaseClient } = await import("@/lib/supabase");
  const { SALON_PUBLIC_COLS } = await import("@/lib/salons/public-columns");
  const { loadSalonDetail } = await import("@/lib/salon-detail");
  const { runHealthProbes } = await import("@/lib/health");
  const { DISCOVERY_CATEGORIES } = await import("@/lib/discovery-categories");
  const { SALON_CATEGORY_SLUGS } = await import("@/lib/validations");

  const admin = createAdminSupabaseClient();
  const supabase = await createServerSupabaseClient(); // anonymous (no request-scoped cookies here)

  // ─── 1. GET /api/salons (default listing shape) ─────────────────────────
  {
    const SalonListItem = z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      average_rating: z.number().nullable(),
      review_count: z.number().nullable(),
      opening_hours: z.unknown(),
      city_id: z.string().nullable(),
    });
    const { data, error } = await supabase
      .from("salons")
      .select(SALON_PUBLIC_COLS)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .order("solen_score", { ascending: false })
      .limit(5);
    if (error) {
      record("GET /api/salons (default)", false, `query error: ${error.message}`);
    } else {
      const parsed = z.array(SalonListItem).safeParse(data);
      record(
        "GET /api/salons (default)",
        parsed.success && (data?.length ?? 0) > 0,
        parsed.success ? `${data?.length} rows, shape OK` : `zod: ${parsed.success ? "" : parsed.error.issues[0]?.message}`,
      );
    }
  }

  // ─── 2. GET /api/salons?with_slots=1 (top-services embed shape) ─────────
  {
    const ServiceItem = z.object({
      id: z.string(),
      name_de: z.string().nullable(),
      name_en: z.string().nullable(),
      duration_minutes: z.number().nullable(),
      price: z.number().nullable(),
      category: z.string().nullable(),
    });
    const { data, error } = await supabase
      .from("salons")
      .select(`${SALON_PUBLIC_COLS}, services(id, name_de, name_en, duration_minutes, price, category)`)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .limit(5);
    if (error) {
      record("GET /api/salons?with_slots=1 (services embed)", false, `query error: ${error.message}`);
    } else {
      const rows = (data ?? []) as unknown as Array<{ services: unknown[] }>;
      const allServices = rows.flatMap((r) => r.services ?? []);
      const parsed = z.array(ServiceItem).safeParse(allServices);
      record(
        "GET /api/salons?with_slots=1 (services embed)",
        parsed.success,
        parsed.success ? `${allServices.length} embedded services, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
      );
    }
  }

  // ─── 3. GET /api/salons/[slug] (PDP detail shape) ────────────────────────
  {
    const { data: anySlug } = await supabase.from("salons").select("slug").eq("is_active", true).limit(1).maybeSingle();
    if (!anySlug?.slug) {
      record("GET /api/salons/[slug] (PDP)", false, "no active salon found to probe");
    } else {
      const SalonDetailShape = z.object({
        id: z.string(),
        slug: z.string(),
        name: z.string(),
        opening_hours: z.unknown(),
        services: z.array(z.unknown()),
        staff: z.array(z.unknown()),
        reviews: z.array(z.unknown()),
      });
      const detail = await loadSalonDetail(anySlug.slug);
      const parsed = SalonDetailShape.safeParse(detail);
      record(
        "GET /api/salons/[slug] (PDP)",
        parsed.success,
        parsed.success
          ? `slug=${anySlug.slug}, ${(detail as any)?.services?.length ?? 0} services, shape OK`
          : `zod: ${parsed.error?.issues[0]?.message}`,
      );
    }
  }

  // ─── 4. GET /api/availability/[salon_id] (slot + lookup-map shape) ──────
  {
    const { data: anySalon } = await supabase.from("salons").select("id").eq("is_active", true).limit(1).maybeSingle();
    if (!anySalon?.id) {
      record("GET /api/availability/[salon_id]", false, "no active salon found to probe");
    } else {
      const Slot = z.object({
        id: z.string(),
        starts_at: z.string(),
        ends_at: z.string(),
        service_id: z.string().nullable(),
        staff_member_id: z.string().nullable(),
        status: z.string(),
        price_override: z.number().nullable(),
      });
      const dateFrom = new Date().toISOString();
      const dateTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const [{ data: slots, error: slotsErr }, { data: services, error: servicesErr }, { data: staff, error: staffErr }] =
        await Promise.all([
          supabase
            .from("availability_slots")
            .select("id, starts_at, ends_at, service_id, staff_member_id, status, price_override")
            .eq("salon_id", anySalon.id)
            .gte("starts_at", dateFrom)
            .lte("starts_at", dateTo)
            .order("starts_at", { ascending: true })
            .limit(20),
          supabase.from("services").select("id, name_de, name_en, duration_minutes, price").eq("salon_id", anySalon.id),
          supabase.from("staff_members").select("id, name, avatar_url").eq("salon_id", anySalon.id),
        ]);
      const err = slotsErr || servicesErr || staffErr;
      if (err) {
        record("GET /api/availability/[salon_id]", false, `query error: ${err.message}`);
      } else {
        const parsed = z.array(Slot).safeParse(slots);
        record(
          "GET /api/availability/[salon_id]",
          parsed.success,
          parsed.success
            ? `${slots?.length ?? 0} slots, ${services?.length ?? 0} services, ${staff?.length ?? 0} staff, shape OK`
            : `zod: ${parsed.error?.issues[0]?.message}`,
        );
      }
    }
  }

  // ─── 5. GET /api/discovery/feed (neutral feed RPC shape) ────────────────
  {
    const DiscoveryItem = z.object({
      id: z.string(),
      category: z.string().nullable().optional(),
      media_type: z.unknown().optional(),
    });
    const { data, error } = await admin.rpc("discovery_feed", {
      p_category: null,
      p_gender: null,
      p_texture: null,
      p_style: null,
      p_creator: null,
      p_user_gender: null,
      p_limit: 5,
      p_offset: 0,
      p_tags_any: null,
    });
    if (error) {
      record("GET /api/discovery/feed", false, `rpc error: ${error.message}`);
    } else {
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      const items = rows.map(({ total_count, tiktok_embed_html, ...rest }: any) => rest);
      const parsed = z.array(DiscoveryItem).safeParse(items);
      record(
        "GET /api/discovery/feed",
        parsed.success,
        parsed.success ? `${items.length} items, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
      );
    }
  }

  // ─── 6. GET /api/discovery/category-meta (per-category aggregate shape) ─
  {
    const firstCat = DISCOVERY_CATEGORIES.map((c) => c.key).find((k) => k !== "all");
    if (!firstCat) {
      record("GET /api/discovery/category-meta", false, "no non-'all' category configured");
    } else {
      const { data, count, error } = await admin
        .from("discovery_items")
        .select("id, tiktok_url, image_url, tiktok_thumbnail_url", { count: "exact" })
        .eq("status", "published")
        .eq("is_active", true)
        .eq("category", firstCat)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) {
        record("GET /api/discovery/category-meta", false, `query error: ${error.message}`);
      } else {
        const MetaEntry = z.object({ count: z.number(), cover: z.string().nullable() });
        const top = data?.[0] ?? null;
        const cover: string | null = top
          ? top.tiktok_url
            ? `/api/discovery/thumb/${top.id}`
            : top.image_url || top.tiktok_thumbnail_url || null
          : null;
        const parsed = MetaEntry.safeParse({ count: count ?? 0, cover });
        record(
          "GET /api/discovery/category-meta",
          parsed.success,
          parsed.success ? `category=${firstCat}, count=${count ?? 0}, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
        );
      }
    }
  }

  // ─── 7. GET /api/reviews/salon/[salon_id] (pagination shape) ────────────
  {
    const { data: salonWithReviews } = await supabase
      .from("reviews")
      .select("salon_id")
      .eq("is_hidden", false)
      .limit(1)
      .maybeSingle();
    if (!salonWithReviews?.salon_id) {
      record("GET /api/reviews/salon/[salon_id]", false, "no reviewed salon found to probe");
    } else {
      const ReviewItem = z.object({
        id: z.string(),
        rating: z.number(),
        comment: z.string().nullable(),
        created_at: z.string(),
        is_verified: z.boolean(),
      });
      const { data, error, count } = await supabase
        .from("reviews")
        .select(
          "id, rating, comment, created_at, booking_id, profiles!user_id(display_name, avatar_url), staff_members(name), review_replies(reply_text, is_public)",
          { count: "exact" },
        )
        .eq("salon_id", salonWithReviews.salon_id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false })
        .range(0, 19);
      if (error) {
        record("GET /api/reviews/salon/[salon_id]", false, `query error: ${error.message}`);
      } else {
        const items = (data ?? []).map((rev: any) => {
          const { booking_id, ...rest } = rev;
          return { ...rest, is_verified: !!booking_id };
        });
        const parsed = z.array(ReviewItem).safeParse(items);
        record(
          "GET /api/reviews/salon/[salon_id]",
          parsed.success,
          parsed.success ? `${items.length}/${count ?? 0} reviews, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
        );
      }
    }
  }

  // ─── 8. GET /api/salons/trending (widget shape) ──────────────────────────
  {
    const TRENDING_FIELDS = ["id", "name", "slug", "cover_photo_url", "city_id", "average_rating", "review_count", "is_top_pick"];
    const PUBLIC_COLS_SET = new Set(SALON_PUBLIC_COLS.split(",").map((c) => c.trim()));
    const TRENDING_COLS = TRENDING_FIELDS.filter((f) => PUBLIC_COLS_SET.has(f)).join(", ");
    const TrendingItem = z.object({ id: z.string(), name: z.string(), slug: z.string() });
    const { data, error } = await admin
      .from("salons")
      .select(TRENDING_COLS)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .limit(10);
    if (error) {
      record("GET /api/salons/trending", false, `query error: ${error.message}`);
    } else {
      const parsed = z.array(TrendingItem).safeParse(data);
      record(
        "GET /api/salons/trending",
        parsed.success,
        parsed.success ? `${data?.length ?? 0} items, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
      );
    }
  }

  // ─── 9. GET /api/health (dependency probe shape) ─────────────────────────
  {
    const HealthShape = z.object({
      ok: z.boolean(),
      deps: z.object({
        db: z.object({ status: z.enum(["ok", "fail", "unconfigured"]) }),
        redis: z.object({ status: z.enum(["ok", "fail", "unconfigured"]) }),
        env: z.object({ status: z.enum(["ok", "fail", "unconfigured"]) }),
      }),
      time: z.number(),
    });
    const report = await runHealthProbes(admin);
    const parsed = HealthShape.safeParse(report);
    record(
      "GET /api/health",
      parsed.success && report.deps.db.status === "ok",
      parsed.success ? `db=${report.deps.db.status}, shape OK` : `zod: ${parsed.error?.issues[0]?.message}`,
    );
  }

  // ─── 10. GET /api/salons?category=<slug> (category filter discriminates) ─
  {
    const cat = SALON_CATEGORY_SLUGS[0];
    const SalonListItem = z.object({ id: z.string(), categories: z.array(z.string()).nullable() });
    const { data, error } = await supabase
      .from("salons")
      .select(SALON_PUBLIC_COLS)
      .eq("is_active", true)
      .contains("categories", [cat])
      .limit(5);
    if (error) {
      record("GET /api/salons?category=<slug>", false, `query error: ${error.message}`);
    } else {
      const parsed = z.array(SalonListItem).safeParse(data);
      const discriminates = parsed.success && (data ?? []).every((s: any) => (s.categories ?? []).includes(cat));
      record(
        "GET /api/salons?category=<slug>",
        discriminates,
        parsed.success
          ? `category=${cat}: ${data?.length ?? 0} rows, every row carries the filter category`
          : `zod: ${parsed.error?.issues[0]?.message}`,
      );
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} smoke cases passed`);
  if (failed.length > 0) {
    console.error(`FAILED: ${failed.map((f) => f.name).join(", ")}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[api-smoke] threw:", e);
  process.exit(1);
});
