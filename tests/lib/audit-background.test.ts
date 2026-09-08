import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
const h=vi.hoisted(()=>({insert:vi.fn(async()=>({error:null})),getClientIp:vi.fn((req:NextRequest)=>req.headers.get('x-real-ip'))}));
vi.mock('@/lib/supabase',()=>({createAdminSupabaseClient:()=>({from:()=>({insert:h.insert})})}));
vi.mock('@/lib/ratelimit',()=>({getClientIp:h.getClientIp}));
vi.mock('@/lib/alert-admin',()=>({alertAdmin:vi.fn()}));
import { logAuditEvent } from '@/lib/audit';
beforeEach(()=>vi.clearAllMocks());
test('background audit records a real null IP without manufacturing a request',async()=>{
  await logAuditEvent(null,null,'fee_charged','booking','booking');
  expect(h.getClientIp).not.toHaveBeenCalled();expect(h.insert.mock.calls[0][0]).toMatchObject({ip_address:null,actor_id:null});
});
test('request-bearing audit still delegates the same request to getClientIp',async()=>{
  const req=new NextRequest('https://solen.invalid',{headers:{'x-real-ip':'192.0.2.10'}});
  await logAuditEvent(req,'22222222-2222-4222-8222-222222222222','fee_charged','booking','booking');
  expect(h.getClientIp).toHaveBeenCalledWith(req);expect(h.insert.mock.calls[0][0]).toMatchObject({ip_address:'192.0.2.10'});
});
