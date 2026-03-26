import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      .select("owner_id, gallery_urls")
      .eq("id", slug)
      .single();

    if (salonError || !salon || salon.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
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

    return NextResponse.json({ url: publicUrl });
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

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Parse filename from public URL
    // Format: .../storage/v1/object/public/salon-gallery/{salonId}/{filename}
    try {
      const urlParts = url.split("/salon-gallery/");
      if (urlParts.length === 2) {
        const filePath = urlParts[1];
        
        // Remove from storage
        const { error: deleteError } = await getSupabase().storage
          .from("salon-gallery")
          .remove([filePath]);
          
        if (deleteError) console.error("Storage delete warning:", deleteError);
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { urls } = await req.json();
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
      .select("owner_id")
      .eq("id", slug)
      .single();

    if (salonError || !salon || salon.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!Array.isArray(urls)) {
      return NextResponse.json({ error: "Invalid URLs array" }, { status: 400 });
    }

    const { error: updateError } = await getSupabase()
      .from("salons")
      .update({ gallery_urls: urls })
      .eq("id", slug);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gallery reorder error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
