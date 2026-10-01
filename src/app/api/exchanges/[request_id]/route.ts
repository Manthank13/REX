import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getExchangeByRequestId } from '@/lib/exchanges';

export async function GET(request: NextRequest, { params }: { params: Promise<{ request_id: string }> }) {
  try {
    const supabase = await createClient();
    const request_id = (await params).request_id;
    const { searchParams } = new URL(request.url);
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user_id = user.id;
    
    if (!request_id) {
      return NextResponse.json({ error: 'Missing request_id' }, { status: 400 });
    }

    const data = await getExchangeByRequestId(supabase, request_id, user_id);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
