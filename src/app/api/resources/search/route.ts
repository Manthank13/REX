import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { searchResources, expandNetworkSearch, SearchParams, ExpandNetworkParams } from '@/lib/resources';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    console.log("Search API Session:", sessionData.session ? "VALID" : "NULL");

    const { searchParams } = new URL(request.url);
    
    const isExpanded = searchParams.get('expand') === 'true';

    if (isExpanded) {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const params: ExpandNetworkParams = {
        requester_id: user.id,
        query: searchParams.get('q') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') || undefined,
        availability_start: searchParams.get('start') || undefined,
        availability_end: searchParams.get('end') || undefined,
      };

      const minPrice = searchParams.get('min_price');
      if (minPrice) params.min_price = parseFloat(minPrice);
      const maxPrice = searchParams.get('max_price');
      if (maxPrice) params.max_price = parseFloat(maxPrice);

      const results = await expandNetworkSearch(supabase, params);
      return NextResponse.json(results);
    }

    // Normal search
    const params: SearchParams = {
      query: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      institution_id: searchParams.get('institution_id') || undefined,
      status: searchParams.get('status') || undefined,
      availability_start: searchParams.get('start') || undefined,
      availability_end: searchParams.get('end') || undefined,
    };

    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    if (lat && lon) {
      params.latitude = parseFloat(lat);
      params.longitude = parseFloat(lon);
    }

    const maxDist = searchParams.get('max_distance');
    if (maxDist) {
      params.max_distance = parseFloat(maxDist);
    }

    const minPrice = searchParams.get('min_price');
    if (minPrice) params.min_price = parseFloat(minPrice);
    const maxPrice = searchParams.get('max_price');
    if (maxPrice) params.max_price = parseFloat(maxPrice);

    const results = await searchResources(supabase, params);
    return NextResponse.json({ search_level: 'STANDARD', expanded: false, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
