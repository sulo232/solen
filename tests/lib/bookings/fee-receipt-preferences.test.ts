import { beforeEach, expect, test, vi } from 'vitest';
const h = vi.hoisted(() => ({ email: vi.fn(), profile: null as any, error: null as any, rows: [] as any[], db: {} as any }));
vi.mock('@/lib/supabase', () => ({ createAdminSupabaseClient: () => h.db }));
vi.mock('@/lib/email', async importOriginal => ({ ...await importOriginal<any>(), sendEmail: h.email }));
import { notifyNoShowFee } from '@/lib/bookings/notify-no-show-fee';
const args = { userId: 'user_receipt', serviceName: 'Cut', salonName: 'Test Store', feeCents: 2000, date: '2026-09-08T10:00:00Z', logPrefix: 'fee-test' };
beforeEach(() => {
  h.email.mockReset(); h.email.mockResolvedValue(undefined); h.rows = []; h.error = null;
  h.profile = { locale: 'en', notification_email: true };
  h.db = {
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'fixture@example.invalid' } } }) } },
    from: (table: string) => {
      if (table === 'notifications') return { insert: async (row: any) => { h.rows.push(row); return { error: null }; } };
      if (table !== 'profiles') throw new Error('Unexpected table ' + table);
      const q: any = { select: () => q, eq: () => q, single: async () => ({ data: h.profile, error: h.error }) };
      return q;
    },
  };
});
test.each(['no_show', 'cancellation'] as const)('actual %s receipt sender honors opt-in and inserts one in-app event', async kind => {
  await notifyNoShowFee({ ...args, kind, admin: h.db });
  expect(h.email).toHaveBeenCalledTimes(1); expect(h.rows).toHaveLength(1);
  expect(h.rows[0].type).toBe(kind === 'no_show' ? 'no_show_charge' : 'late_cancellation_fee');
});
test.each(['opt-out', 'lookup-error', 'missing-profile'])('actual receipt %s preserves in-app without sending email', async state => {
  if (state === 'opt-out') h.profile.notification_email = false;
  else { h.profile = null; if (state === 'lookup-error') h.error = { message: 'preference unavailable' }; }
  await notifyNoShowFee({ ...args, admin: h.db });
  expect(h.email).not.toHaveBeenCalled(); expect(h.rows).toHaveLength(1);
});
test('guest with no address completes receipt handling without inventing a delivery channel', async () => {
  await notifyNoShowFee({ ...args, admin: h.db, userId: null, guestEmail: null });
  expect(h.email).not.toHaveBeenCalled(); expect(h.rows).toHaveLength(0);
});
test('guest with an address retains the actual receipt send path', async () => {
  await notifyNoShowFee({ ...args, admin: h.db, userId: null, guestEmail: 'guest@example.invalid' });
  expect(h.email).toHaveBeenCalledTimes(1); expect(h.rows).toHaveLength(0);
});
