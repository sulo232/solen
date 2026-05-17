import { PostHog } from 'posthog-node';
import { getPublicEnv } from "@/lib/env";

// Singleton instance
let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  const key = getPublicEnv().NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) {
    return null;
  }

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: 'https://eu.i.posthog.com',
      // Send events immediately so they don't get lost in serverless environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Safely track an event from the server side.
 * Catches any errors to prevent crashing the main API flow.
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, any>
) {
  try {
    const client = getPostHogClient();
    if (client) {
      client.capture({
        distinctId,
        event,
        properties,
      });
    }
  } catch (error) {
    console.error(`PostHog Server Error [capture ${event}]:`, error);
  }
}

/**
 * Link a user's static ID (Supabase Auth ID) to their events.
 */
export function identifyServerUser(
  distinctId: string,
  properties?: Record<string, any>
) {
  try {
    const client = getPostHogClient();
    if (client) {
      client.identify({
        distinctId,
        properties,
      });
    }
  } catch (error) {
    console.error("PostHog Server Error [identify]:", error);
  }
}

/**
 * Flush any pending events (useful before a lambda exits).
 */
export async function flushPostHog() {
  try {
    const client = getPostHogClient();
    if (client) {
      await client.shutdown();
    }
  } catch (error) {
    // Ignore internal shutdown errors
  }
}
