import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerEnv, getPublicEnv } from "@/lib/env";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { sendEmail, adminPartnerLeadNotification } from "@/lib/email";

const leadSchema = z.object({
  email: z.string().email(),
  salon_name: z.string().min(2),
});

export async function POST(request: NextRequest) {
  const rl = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rl) return rl;

  try {
    let supabaseUrl: string;
    let supabaseKey: string;
    try {
      // SUPABASE_SERVICE_ROLE_KEY is required by getServerEnv schema — throws if missing
      supabaseUrl = getPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
      supabaseKey = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
    } catch {
      console.warn("Missing Supabase credentials, skipping actual DB insert for lead capture");
      return NextResponse.json({ success: true, warning: 'mocked' }, { status: 200 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { email, salon_name } = result.data;

    // Insert into partner_leads table
    const { error: insertError } = await supabaseAdmin
      .from('partner_leads')
      .insert([
        { 
          email, 
          salon_name,
          source: 'partner_page'
        }
      ]);

    // Handle case where table might not exist yet during initial remediation
    if (insertError) {
      console.error('Error inserting partner lead:', insertError);
      if (insertError.code !== '42P01') { // 42P01 is "undefined_table"
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }
    }

    // Alert the team only after the lead row committed (not on the 42P01 fallthrough, where
    // nothing was stored). Recipient is the internal ADMIN_EMAIL, not the lead: an operational
    // alert with no customer preference to consult (same class as
    // app/api/admin/notify-new-salon). The lead's address is never emailed here. A failed
    // send is logged and never fails lead capture.
    const adminEmail = getServerEnv().ADMIN_EMAIL;
    if (!insertError && adminEmail) {
      try {
        await sendEmail(adminPartnerLeadNotification(adminEmail, { salon: salon_name, email }));
      } catch (err) {
        console.error('[partner/leads] admin lead alert email failed:', err);
      }
    } else if (!adminEmail) {
      console.warn('[partner/leads] ADMIN_EMAIL not configured, lead alert skipped');
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error in partner leads route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
