import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { completeExchange } from '@/lib/exchanges';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const completing_user_id = user.id;
    const { exchange_id } = body;
    if (!exchange_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const data = await completeExchange(supabase, { exchange_id, completing_user_id });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
