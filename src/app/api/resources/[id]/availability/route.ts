import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkAvailability } from '@/lib/resources';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const id = (await params).id;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const availability = await checkAvailability(supabase, id);
    return NextResponse.json(availability);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
