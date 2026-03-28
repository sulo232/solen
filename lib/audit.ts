import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ratelimit";


export async function logAuditEvent(
  req: NextRequest,
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    const admin = createAdminSupabaseClient();
    await admin.from("audit_log").insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      metadata: metadata ?? {},
      ip_address: getClientIp(req),
    });
  } catch {
    // Audit logging must never block the main operation
  }
}
