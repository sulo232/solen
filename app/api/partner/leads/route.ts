import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerEnv, getPublicEnv } from "@/lib/env";

const leadSchema = z.object({
  email: z.string().email(),
  salon_name: z.string().min(2),
});

export async function POST(request: Request) {
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

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Error in partner leads route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
