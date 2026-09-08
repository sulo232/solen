// tests/helpers/supabase-stub.ts
//
// Tiny hand-stub of the supabase-js query builder for pure-logic unit tests
// of the lib/bookings and lib/purchases money chokepoints (Ring 5). No
// network, no real Supabase client. The real chains used by these files are
// short (.from().select().eq()...single()/maybeSingle(), or .from().update()
// awaited directly), so a single chainable object that resolves to a scripted
// { data, error } on every terminal call/await is enough.

import { vi } from "vitest";

export interface StubResult<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

/** One chainable "table query" call. Every chain method returns itself; the
 *  chain resolves to `result` whether the caller ends on .single(),
 *  .maybeSingle(), or awaits the builder directly (thenable). */
export function makeQueryBuilder<T = unknown>(result: StubResult<T>) {
  const builder: any = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    or: vi.fn(() => builder),
    is: vi.fn(() => builder),
    in: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    lt: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

/**
 * A `db.from(table)` stub that returns one scripted builder per call, in
 * call order (a test scripts exactly the sequence of .from() calls the
 * function under test makes: fetch, claim, cas-update, ...). Throws loudly
 * if the function under test calls .from() more times than scripted, so a
 * test never silently falls through to `undefined`.
 */
export function makeFromSequence(results: StubResult[]) {
  let i = 0;
  const from = vi.fn(() => {
    if (i >= results.length) {
      throw new Error(
        `makeFromSequence: .from() called ${i + 1} times but only ${results.length} results scripted`,
      );
    }
    return makeQueryBuilder(results[i++]);
  });
  return from;
}

/** Build a minimal fake admin client. `rpc` defaults to a no-op success. */
export function makeDbStub(fromResults: StubResult[], rpc?: (...args: any[]) => Promise<StubResult>) {
  return {
    from: makeFromSequence(fromResults),
    rpc: vi.fn(rpc ?? (() => Promise.resolve({ data: null, error: null }))),
  } as any;
}
