import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const institution_id = searchParams.get('institution_id');
    
    let query = supabase.from('meetup_locations').select('*');
    if (institution_id) {
      query = query.eq('institution_id', institution_id);
    }
    
    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
