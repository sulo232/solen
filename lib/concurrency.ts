// lib/concurrency.ts (RING 3a). Tiny bounded-concurrency pool for cron email
// sends: caps how many async tasks run at once instead of an unbounded
// Promise.all (floods the provider) or a fully serial loop (slow). One
// rejecting task is captured (not thrown) and never stops the others, so a
// single bad recipient can't kill the batch. Results preserve input order.
export async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function runNext(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await worker(items[i], i) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => runNext()));
  return results;
}
