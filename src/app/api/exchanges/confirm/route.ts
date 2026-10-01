import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { confirmExchange } from '@/lib/exchanges';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const confirming_user_id = user.id;
    const { exchange_request_id, meetup_location_id } = body;
    if (!exchange_request_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await confirmExchange(supabase, { exchange_request_id, confirming_user_id, meetup_location_id });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
