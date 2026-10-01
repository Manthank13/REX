import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const id = (await params).id;
    
    // Fetch request with messages
    const { data: exchangeReq, error } = await supabase
      .from('exchange_requests')
      .select(`
        *,
        resource:resources(id, title, price, owner_id, status, institution:institutions(name)),
        messages:exchange_messages(*),
        requester:profiles!requester_id(name)
      `)
      .eq('id', id)
      .order('created_at', { referencedTable: 'exchange_messages', ascending: true })
      .single();

    if (error) throw error;

    return NextResponse.json(exchangeReq);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
