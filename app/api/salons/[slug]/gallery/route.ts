import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv, getPublicEnv } from "@/lib/env";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, salonPortfolioCategorySchema } from "@/lib/validations";
import { isValidPortfolioCategoryForSalon } from "@/lib/portfolio-categories";
import type { Database } from "@/lib/database.types";

const getSupabase = () => createClient<Database>(
  getPublicEnv().NEXT_PUBLIC_SUPABASE_URL,
  getServerEnv().SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/salons/[slug]/gallery: categorized salon photos (salon_portfolio_images, public-read
// RLS, same table both the dashboard and the PDP gallery read). Optional ?category=<key> filter,
// unfiltered when omitted. No auth: gallery photos are public marketing content, matching the
// services_select_active / staff_portfolio_images public-SELECT pattern this table's RLS mirrors.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;

    const { slug } = await params;
    const category = new URL(req.url).searchParams.get("category");

    // Filters before .order(): matches the codebase's own conditional-query pattern
    // (app/api/salons/route.ts). .order() narrows the builder type past .eq().
    let query = getSupabase()
      .from("salon_portfolio_images")
      .select("id, image_url, category, sort_order")
      .eq("salon_id", slug);

    if (category) query = query.eq("category", category);

    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error) {
      console.error("[gallery GET] query failed:", error);
      return NextResponse.json({ error: "Failed to load photos" }, { status: 500 });
    }

    return NextResponse.json({ photos: data ?? [], count: data?.length ?? 0 });
  } catch (error) {
    console.error("[gallery GET] unhandled error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionToken = req.headers.get("Authorization")?.split("Bearer ")[1];

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await getSupabase().auth.getUser(sessionToken);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auth validation - is this person the salon owner?
    const { data: salon, error: salonError } = await getSupabase()
      .from("salons")
      .select("owner_id, gallery_urls, categories")
      .eq("id", slug)
      .single();

    if (salonError || !salon || salon.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Optional category (fixed taxonomy, lib/portfolio-categories.ts), set at upload time.
    // Absent/empty = uncategorized (null); present = must be valid for THIS salon's own
    // category/categories, not just any global taxonomy value.
    const rawCategory = formData.get("category");
    let category: string | null = null;
    if (typeof rawCategory === "string" && rawCategory.trim() !== "") {
      if (!isValidPortfolioCategoryForSalon(rawCategory, salon.categories ?? [])) {
        return NextResponse.json({ error: "Invalid category for this salon" }, { status: 400 });
      }
      category = rawCategory;
    }

    // Verify constraints
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG and WEBP allowed." },
        { status: 400 }
      );
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File exceeds 5MB size limit." },
        { status: 400 }
      );
    }

    const maxPhotos = 20;
    const currentPhotos = salon.gallery_urls || [];
    if (currentPhotos.length >= maxPhotos) {
      return NextResponse.json(
        { error: `Maximum of ${maxPhotos} photos allowed.` },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${slug}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${slug}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await getSupabase().storage
      .from("salon-gallery")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Gallery upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = getSupabase().storage
      .from("salon-gallery")
      .getPublicUrl(filePath);

    // Append to existing array
    const updatedGallery = [...currentPhotos, publicUrl];

    const { error: updateError } = await getSupabase()
      .from("salons")
      .update({ gallery_urls: updatedGallery })
      .eq("id", slug);

    if (updateError) {
      console.error("DB update error:", updateError);
      return NextResponse.json({ error: "Failed to save photo record" }, { status: 500 });
    }

    // Dual-write into the categorized table. gallery_urls (updated above) stays the source
    // every other page still reads directly; this insert is what makes the photo show up,
    // with its category, in salon_portfolio_images (dashboard assign UI, PDP category pills).
    // Logged, not fatal: a failure here must not break the upload the owner is waiting on,
    // since gallery_urls already has the photo, it can be re-synced on the next write.
    const { data: portfolioRow, error: portfolioError } = await getSupabase()
      .from("salon_portfolio_images")
      .insert({
        salon_id: slug,
        image_url: publicUrl,
        category,
        sort_order: currentPhotos.length,
      })
      .select("id, image_url, category, sort_order")
      .single();

    if (portfolioError) {
      console.error("[gallery POST] salon_portfolio_images insert failed:", portfolioError);
    }

    return NextResponse.json({
      url: publicUrl,
      category,
      photo: portfolioRow ?? null,
    });
  } catch (error) {
    console.error("Gallery upload unhandled error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { url } = await req.json();
    const sessionToken = req.headers.get("Authorization")?.split("Bearer ")[1];

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await getSupabase().auth.getUser(sessionToken);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: salon, error: salonError } = await getSupabase()
      .from("salons")
      .select("owner_id, gallery_urls")
      .eq("id", slug)
      .single();

    if (salonError || !salon || salon.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Parse filename from public URL
    // Format: .../storage/v1/object/public/salon-gallery/{salonId}/{filename}
    try {
      const urlParts = url.split("/salon-gallery/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];

        // Only remove objects inside the caller's own salon folder. filePath is
        // derived from a client-supplied url and must not be trusted to point at
        // this salon's storage prefix without this check. The object shape written
        // by POST is exactly {slug}/{fileName}, so require exactly that: two
        // non-empty segments, first segment equal to slug, no ".." segment
        // anywhere (blocks traversal like "slug/../otherSalon/x.jpg").
        const segs = filePath.split("/");
        const isOwnSalonPath =
          segs.length === 2 && segs[0] === slug && !!segs[1] && !segs.includes("..");

        if (isOwnSalonPath) {
          // Remove from storage
          const { error: deleteError } = await getSupabase().storage
            .from("salon-gallery")
            .remove([filePath]);

          if (deleteError) console.error("Storage delete warning:", deleteError);
        } else {
          console.warn("Refused cross-salon storage delete for URL", url);
        }
      }
    } catch (e) {
      console.warn("Could not parse/delete storage object for URL", url);
    }

    // Update DB
    const updatedGallery = (salon.gallery_urls || []).filter((u: string) => u !== url);

    const { error: updateError } = await getSupabase()
      .from("salons")
      .update({ gallery_urls: updatedGallery })
      .eq("id", slug);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update DB" }, { status: 500 });
    }

    // Mirror the delete into the categorized table (scoped to salon_id + image_url, not
    // just image_url, so a URL string collision can never touch another salon's row).
    // Logged, not fatal: gallery_urls (the source every other page reads) is already
    // updated above, so the customer-visible delete already happened either way.
    const { error: portfolioDeleteError } = await getSupabase()
      .from("salon_portfolio_images")
      .delete()
      .eq("salon_id", slug)
      .eq("image_url", url);

    if (portfolioDeleteError) {
      console.error("[gallery DELETE] salon_portfolio_images delete failed:", portfolioDeleteError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/salons/[slug]/gallery: two body shapes on the one route (kept as ONE endpoint,
// branching on payload shape, rather than a new route, per the "extend the salon gallery route"
// task): { urls: string[] } reorders (existing behavior); { id, category } assigns/clears a
// single photo's category (new). Both require salon-owner auth, checked identically either way.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const sessionToken = req.headers.get("Authorization")?.split("Bearer ")[1];

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await getSupabase().auth.getUser(sessionToken);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: salon, error: salonError } = await getSupabase()
      .from("salons")
      .select("owner_id, categories")
      .eq("id", slug)
      .single();

    if (salonError || !salon || salon.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const banned = await checkUserBanned(user.id);
    if (banned) return banned;

    const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
    if (rateLimited) return rateLimited;

    // Shape 1: reorder (existing behavior, untouched) plus keep salon_portfolio_images.sort_order
    // in lockstep so a drag-reorder in the dashboard doesn't desync the categorized table.
    if (Array.isArray(body.urls)) {
      const urls: string[] = body.urls;

      const { error: updateError } = await getSupabase()
        .from("salons")
        .update({ gallery_urls: urls })
        .eq("id", slug);

      if (updateError) {
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
      }

      const results = await Promise.all(
        urls.map((u, i) =>
          getSupabase()
            .from("salon_portfolio_images")
            .update({ sort_order: i })
            .eq("salon_id", slug)
            .eq("image_url", u)
        )
      );
      const syncError = results.find((r) => r.error)?.error;
      if (syncError) {
        console.error("[gallery PATCH] salon_portfolio_images sort_order sync failed:", syncError);
      }

      return NextResponse.json({ success: true });
    }

    // Shape 2: assign/clear one photo's category.
    if (typeof body.id === "string" && "category" in body) {
      const { data: parsed, error: validationError } = validateBody(salonPortfolioCategorySchema, {
        id: body.id,
        category: body.category,
      });
      if (validationError) {
        return NextResponse.json({ error: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
      }

      if (parsed.category !== null && !isValidPortfolioCategoryForSalon(parsed.category, salon.categories ?? [])) {
        return NextResponse.json({ error: "Invalid category for this salon" }, { status: 400 });
      }

      const { data: updated, error: categoryError } = await getSupabase()
        .from("salon_portfolio_images")
        .update({ category: parsed.category })
        .eq("id", parsed.id)
        .eq("salon_id", slug)
        .select("id, image_url, category, sort_order")
        .maybeSingle();

      if (categoryError) {
        return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
      }
      if (!updated) {
        return NextResponse.json({ error: "Photo not found for this salon" }, { status: 404 });
      }

      return NextResponse.json({ success: true, photo: updated });
    }

    return NextResponse.json(
      { error: "Body must be either { urls: string[] } or { id, category }" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gallery reorder error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
