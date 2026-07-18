// lib/referral/storage.ts
//
// Shared localStorage key for the referral code stashed by the /referral/[code] landing
// page (app/[locale]/referral/[code]/page.tsx) and read back by the post-signup
// attribution hook (app/[locale]/onboarding/OnboardingFlow.tsx). One constant so the
// producer and the consumer can never drift out of sync (GAP #49).
export const REFERRAL_STORAGE_KEY = "solen_referral_code";
