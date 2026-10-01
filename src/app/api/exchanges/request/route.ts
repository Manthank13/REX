import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createExchangeRequest } from '@/lib/exchanges';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { resource_id, offer_price, message } = body;
    if (!resource_id || offer_price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const reqData = await createExchangeRequest(supabase, { resource_id, requester_id: user.id, offer_price, message });
    return NextResponse.json(reqData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
