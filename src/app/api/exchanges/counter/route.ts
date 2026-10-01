import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { counterExchangeRequest } from '@/lib/exchanges';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const sender_id = user.id;
    const { exchange_request_id, counter_price, message } = body;
    if (!exchange_request_id || counter_price === undefined || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await counterExchangeRequest(supabase, { exchange_request_id, sender_id, counter_price, message });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
