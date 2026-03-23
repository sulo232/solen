// lib/discovery-moderation.ts — Re-exports content-flags for discovery context
// The core logic lives in content-flags.ts. This module adds discovery-specific helpers.

import { checkContentFlags, checkCommentFlags } from "./content-flags";
import type { FlagResult } from "./content-flags";

export { checkContentFlags, checkCommentFlags };
export type { FlagResult };

/**
 * Moderate a discovery comment: blocked words + spam + length.
 * Returns flagged=true if content should be hidden pending admin review.
 */
export function moderateComment(text: string): FlagResult {
  if (text.length > 500) {
    return { flagged: true, reasons: ["comment_too_long"] };
  }
  return checkCommentFlags(text);
}

/**
 * Moderate a discovery post: blocked words + tags + image + gender + rate.
 */
export function moderatePost(opts: {
  text?: string | null;
  tags?: string[];
  imageWidth?: number;
  imageHeight?: number;
  gender?: string | null;
  dailyPostCount?: number;
}): FlagResult {
  return checkContentFlags(opts);
}
