export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const adminAuth = request.headers.get("Authorization");
    // VERY simple auth for cron jobs (ensure CRON_SECRET matches Vercel Cron Secret)
    if (adminAuth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminSupabaseClient();
    
    // Find profiles with deletion_requested_at > 30 days ago
    // Wait, the query is "deletion_requested_at < NOW() - 30 days"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: usersToDelete, error: fetchErr } = await admin
      .from("profiles")
      .select("id")
      .not("deletion_requested_at", "is", null)
      .lt("deletion_requested_at", thirtyDaysAgo.toISOString());
      
    if (fetchErr) throw fetchErr;
    
    if (!usersToDelete || usersToDelete.length === 0) {
      return NextResponse.json({ message: "No users to delete" });
    }
    
    // Delete them via Auth API (triggers will cascade data if set up correctly, or auth handles it)
    // Wait, admin.auth.admin.deleteUser handles the CASCADE to profiles via the DB?
    // Actually, destroying the auth user normally deletes the profile if it's CASCADE, 
    // but in Supabase, the user deletion might not cascade to `public.profiles` unless the foreign key is set to CASCADE.
    // However, calling admin.auth.admin.deleteUser(id) is the official way.
    
    const results = [];
    for (const user of usersToDelete) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        results.push({ id: user.id, success: false, error: error.message });
      } else {
        results.push({ id: user.id, success: true });
      }
    }

    return NextResponse.json({ message: `Processed ${usersToDelete.length} users`, results });
  } catch (err) {
    console.error("[api/cron/process-deletions] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
