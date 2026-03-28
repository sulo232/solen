import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ratelimit";

type AuditAction =
  | "salon.approve" | "salon.reject" | "salon.freeze" | "salon.warn"
  | "user.ban" | "user.unban"
  | "feature_flag.toggle"
  | "account.delete"
  | "account.delete_requested"
  | "account.data_export"
  | "account.tos_accepted"
  | "review.delete"
  | "payment.refund"
  | "help_article.create" | "help_article.update" | "help_article.delete"
  | "discovery.import" | "discovery.moderate" | "discovery.flag_remove"
  | "discovery.archive" | "discovery.reject" | "discovery.publish";

export async function logAuditEvent(
  req: NextRequest,
  actorId: string,
  action: AuditAction,
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
