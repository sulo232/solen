/**
 * AI nail art generation budget tracker.
 * Uses Upstash Redis to enforce monthly spend caps.
 * Key pattern: nail-ai-budget:{YYYY-MM}
 */

import { Redis } from "@upstash/redis";

const MONTHLY_BUDGET_CHF = 50; // CHF 50/month default cap
const COST_PER_GENERATION_CHF = 0.05; // ~$0.05 per fal.ai image
const WARN_THRESHOLD = 0.8; // 80%

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
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
 * isAdmin bypasses the budget cap (admins can always generate).
 */
export async function checkBudget(isAdmin: boolean): Promise<string | null> {
  const status = await getBudgetStatus();

  if (status.percentUsed >= WARN_THRESHOLD && status.percentUsed < 1) {
    console.warn(`[nail-budget] ${Math.round(status.percentUsed * 100)}% threshold reached — CHF ${status.spent}/${status.budget}`);
  }

  if (status.blocked && !isAdmin) {
    return `Monatliches AI-Budget erschöpft (CHF ${status.spent}/${status.budget}). Kontaktiere den Admin.`;
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
