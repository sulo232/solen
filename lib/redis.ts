// lib/redis.ts
//
// Single bounded factory for the Upstash Redis SDK. Every `new Redis(...)` in
// this repo used to construct a client with no `signal`, so a stalled REST call
// could hang forever. RedisConfigNodejs.signal must be the FUNCTION form
// (() => AbortSignal), not a bare AbortSignal: the SDK creates the signal once
// per request() call, OUTSIDE its retry loop (node_modules/@upstash/redis/
// chunk-IH7W44G6.mjs:142-151, 167-190), so a bare signal would fire once and stay
// permanently aborted for every request after the first. The function form is
// invoked fresh per request and covers that request plus its internal retries.

import { Redis } from "@upstash/redis";

// 5000ms: Upstash REST calls normally answer in well under 100ms, so 5s is far
// past any healthy call and only ever fires on a real stall. Covers the request
// plus the client's internal retries (see note above).
export const REDIS_TIMEOUT_MS = 5000;

export function createBoundedRedis(url: string, token: string, timeoutMs?: number): Redis {
  return new Redis({ url, token, signal: () => AbortSignal.timeout(timeoutMs ?? REDIS_TIMEOUT_MS) });
}
