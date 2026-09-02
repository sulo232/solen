/**
 * AI nail art generation budget tracker.
 * Uses Upstash Redis to enforce monthly spend caps.
 * Key pattern: nail-ai-budget:{YYYY-MM}
 */

import type { Redis } from "@upstash/redis";
import { createBoundedRedis } from "@/lib/redis";
import { getServerEnv } from "@/lib/env";
import { createAdminSupabaseClient } from "@/lib/supabase";

const MONTHLY_BUDGET_CHF = 50; // CHF 50/month default cap
const COST_PER_GENERATION_CHF = 0.05; // ~$0.05 per fal.ai image
const WARN_THRESHOLD = 0.8; // 80%

// ─────────────────────────────────────────────────────────────────────────────
// Whether an exhausted budget blocks an admin is a stored, admin-editable setting
// (platform_settings.key='nail_ai_budget_blocks_admin', value.blocks_admin), edited via
// /api/admin/ai-limits + /dashboard/ai-limits-admin, same jsonb key/value shape and TTL-cache
// style as resolveAiDailyCap/resolveDailyCap in lib/ratelimit.ts: 60s TTL, only a clean read
// (no query error, a real boolean) is cached, a transient DB error re-checks on the very next
// call instead of trusting the failure for the rest of the window.
//
// Owner decision 2026-07-16 (_backend-system/QUESTIONS.md Q2, verbatim: "no and let admin
// choose in pannel"): default is false, do NOT block an admin. The previous code always
// bypassed the block for admins via a hardcoded `checkBudget(true)` call, this setting makes
// that bypass an explicit, visible, admin-editable choice instead of an implicit constant.
// ─────────────────────────────────────────────────────────────────────────────
export const NAIL_AI_BUDGET_BLOCKS_ADMIN_KEY = "nail_ai_budget_blocks_admin";
export const DEFAULT_NAIL_AI_BUDGET_BLOCKS_ADMIN = false;

type BlocksAdminCacheEntry = { blocksAdmin: boolean; expiresAt: number };
const BLOCKS_ADMIN_TTL_MS = 60 * 1000;
let blocksAdminCache: BlocksAdminCacheEntry | null = null;

async function resolveBlocksAdminSetting(): Promise<boolean> {
  const now = Date.now();
  if (blocksAdminCache && blocksAdminCache.expiresAt > now) {
    return blocksAdminCache.blocksAdmin;
  }
  try {
    const admin = createAdminSupabaseClient();
    const { data: setting, error } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", NAIL_AI_BUDGET_BLOCKS_ADMIN_KEY)
      .single();

    // Missing row / query error: fall back to the default, do NOT cache the failure, so
    // the next call re-checks the DB instead of trusting a transient blip for the rest of
    // the TTL window.
    if (error) return DEFAULT_NAIL_AI_BUDGET_BLOCKS_ADMIN;

    const value = setting?.value;
    const raw =
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as { blocks_admin?: unknown }).blocks_admin
        : undefined;
    const blocksAdmin = typeof raw === "boolean" ? raw : DEFAULT_NAIL_AI_BUDGET_BLOCKS_ADMIN;

    blocksAdminCache = { blocksAdmin, expiresAt: now + BLOCKS_ADMIN_TTL_MS };
    return blocksAdmin;
  } catch (err) {
    console.error("[nail-budget] failed to read nail_ai_budget_blocks_admin, falling back to default:", err);
    return DEFAULT_NAIL_AI_BUDGET_BLOCKS_ADMIN;
  }
}

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const env = getServerEnv();
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis = createBoundedRedis(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  return redis;
}

function budgetKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `nail-ai-budget:${yyyy}-${mm}`;
}

export interface BudgetStatus {
  spent: number;
  budget: number;
  remaining: number;
  percentUsed: number;
  blocked: boolean;
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const r = getRedis();
  if (!r) {
    return { spent: 0, budget: MONTHLY_BUDGET_CHF, remaining: MONTHLY_BUDGET_CHF, percentUsed: 0, blocked: false };
  }

  const spent = parseFloat((await r.get<string>(budgetKey())) || "0");
  const remaining = Math.max(0, MONTHLY_BUDGET_CHF - spent);
  const percentUsed = MONTHLY_BUDGET_CHF > 0 ? spent / MONTHLY_BUDGET_CHF : 0;

  return {
    spent: Math.round(spent * 100) / 100,
    budget: MONTHLY_BUDGET_CHF,
    remaining: Math.round(remaining * 100) / 100,
    percentUsed: Math.round(percentUsed * 100) / 100,
    blocked: percentUsed >= 1,
  };
}

/**
 * Check if generation is allowed. Returns null if OK, or an error message if blocked.
 *
 * No `isAdmin` parameter: the only caller (app/api/admin/nail/generate/route.ts) is already
 * gated to admin-only before it reaches this call, so a caller-supplied boolean could never
 * be anything but a hardcoded `true`, it was not a real branch, just a constant bypass in
 * disguise. Whether an exhausted budget still blocks that admin is instead read from the
 * stored, admin-editable setting resolved by resolveBlocksAdminSetting() above (default:
 * false, do not block), same as every other admin-tunable cap in this codebase
 * (resolveAiDailyCap in lib/ratelimit.ts).
 */
export async function checkBudget(): Promise<string | null> {
  const status = await getBudgetStatus();

  if (status.percentUsed >= WARN_THRESHOLD && status.percentUsed < 1) {
    console.warn(`[nail-budget] ${Math.round(status.percentUsed * 100)}% threshold reached, CHF ${status.spent}/${status.budget}`);
  }

  if (status.blocked) {
    const blocksAdmin = await resolveBlocksAdminSetting();
    if (blocksAdmin) {
      return `Monatliches AI-Budget erschöpft (CHF ${status.spent}/${status.budget}). Kontaktiere den Admin.`;
    }
  }

  return null;
}

/**
 * Record a generation cost. Call after successful image generation.
 */
export async function recordGeneration(cost: number = COST_PER_GENERATION_CHF): Promise<void> {
  const r = getRedis();
  if (!r) return;

  const key = budgetKey();
  await r.incrbyfloat(key, cost);

  // Expire at end of month + 7 days buffer
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 7);
  const ttlSeconds = Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
  await r.expire(key, ttlSeconds);
}
