import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ratelimit";
import { alertAdmin } from "@/lib/alert-admin";
import type { Json } from "@/lib/database.types";


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
    const { error } = await admin.from("audit_log").insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      // metadata is caller-supplied arbitrary JSON; cast to the generated Json column type.
      metadata: (metadata ?? {}) as Json,
      ip_address: getClientIp(req),
    });
    if (error) {
      // PostgREST returns { error } on a rejected insert instead of throwing, so the
      // catch block below never sees this case. Same redundant money-trail concern as
      // the catch block: surface it the same way.
      console.error("[audit] logAuditEvent failed:", error);
      void alertAdmin("audit_log write failed", {
        action,
        target_type: targetType,
        target_id: targetId ?? null,
        actor_id: actorId,
        error: error.message,
      });
    }
  } catch (e) {
    // Audit logging must never block the main operation — log instead of swallowing.
    // The dispute engine leans on this as the redundant money-trail, so a silent
    // failure here means a money move with no record. Surface it loudly + alert.
    console.error("[audit] logAuditEvent failed:", e);
    void alertAdmin("audit_log write failed", {
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      actor_id: actorId,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
