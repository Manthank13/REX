import { distanceKm } from './haversine';
import { SupabaseClient } from '@supabase/supabase-js';

export interface SearchParams {
  query?: string;
  category?: string;
  institution_id?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  max_distance?: number;
  min_price?: number;
  max_price?: number;
  availability_start?: string;
  availability_end?: string;
  status?: string;
}

export async function searchResources(supabase: SupabaseClient, params: SearchParams) {
  let query = supabase.from('resources').select(`
    id,
    title,
    description,
    category,
    brand,
    condition,
    price,
    exchange_type,
    status,
    availability_start,
    availability_end,
    latitude,
    longitude,
    institution_id,
    source_type,
    institution:institutions!inner(id, name, city, state, latitude, longitude),
    owner:profiles!inner(name, avatar_url)
  `);

  if (params.status) {
    query = query.eq('status', params.status);
  } else {
    query = query.eq('status', 'ACTIVE');
  }

  if (params.institution_id) {
    query = query.eq('institution_id', params.institution_id);
  }

  if (params.city) {
    query = query.eq('institution.city', params.city);
  }

  if (params.state) {
    query = query.eq('institution.state', params.state);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.min_price !== undefined) {
    query = query.gte('price', params.min_price);
  }
  
  if (params.max_price !== undefined) {
    query = query.lte('price', params.max_price);
  }

  if (params.availability_start) {
    query = query.or(`availability_start.is.null,availability_start.lte.${params.availability_start}`);
  }

  if (params.availability_end) {
    query = query.or(`availability_end.is.null,availability_end.gte.${params.availability_end}`);
  }

  if (params.query) {
    const q = `%${params.query}%`;
    query = query.or(`title.ilike.${q},description.ilike.${q},category.ilike.${q},brand.ilike.${q}`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error("Supabase Search Error:", error);
    throw new Error(error.message);
  }

  let results = data || [];

  if (params.latitude !== undefined && params.longitude !== undefined) {
    results = results.map(resource => {
      let rLat = resource.latitude;
      let rLon = resource.longitude;
      
      if (rLat === null && resource.institution) {
        // @ts-ignore
        rLat = resource.institution.latitude;
        // @ts-ignore
        rLon = resource.institution.longitude;
      }

      let d = null;
      if (rLat !== null && rLon !== null) {
        d = distanceKm(params.latitude!, params.longitude!, rLat, rLon);
      }
      
      return { ...resource, distance_km: d };
    });

    if (params.max_distance !== undefined) {
      // @ts-ignore
      results = results.filter(r => r.distance_km !== null && r.distance_km <= params.max_distance!);
    }
  }

  return results;
}

export async function getResourceDetails(supabase: SupabaseClient, resourceId: string) {
  const { data, error } = await supabase.from('resources').select(`
    id,
    title,
    description,
    category,
    brand,
    condition,
    price,
    exchange_type,
    status,
    availability_start,
    availability_end,
    latitude,
    longitude,
    created_at,
    updated_at,
    source_type,
    institution:institutions!institution_id(id, name, city, state, latitude, longitude),
    owner:profiles!owner_id(id, name, avatar_url, verified)
  `).eq('id', resourceId).single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function checkAvailability(supabase: SupabaseClient, resourceId: string) {
  const { data, error } = await supabase.from('resources')
    .select('status, availability_start, availability_end')
    .eq('id', resourceId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const isStatusActive = data.status === 'ACTIVE';
  
  const now = new Date();
  
  let isWithinTimeframe = true;
  if (data.availability_start && new Date(data.availability_start) > now) {
    isWithinTimeframe = false;
  }
  if (data.availability_end && new Date(data.availability_end) < now) {
    isWithinTimeframe = false;
  }

  return {
    is_available: isStatusActive && isWithinTimeframe,
    status: data.status,
    availability_start: data.availability_start,
    availability_end: data.availability_end
  };
}

export interface ExpandNetworkParams extends Omit<SearchParams, 'institution_id' | 'city' | 'state' | 'latitude' | 'longitude' | 'max_distance'> {
  requester_id: string;
}

export type SearchLevel = 'MY_COLLEGE' | 'NEARBY_COLLEGES' | 'CITY' | 'STATE' | 'INDIA';

export async function expandNetworkSearch(supabase: SupabaseClient, params: ExpandNetworkParams) {
  // 1. Fetch user's profile and institution info
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('institution:institutions!institution_id(id, name, city, state, latitude, longitude)').eq('id', params.requester_id).single();
  
  if (profileErr || !profile || !profile.institution) {
    console.error('expandNetworkSearch Error:', profileErr, 'Profile:', profile);
    throw new Error("Could not find requester institution");
  }

  // @ts-ignore
  const userInst = Array.isArray(profile.institution) ? profile.institution[0] : profile.institution;
  const userInstId = userInst.id;
  const userCity = userInst.city;
  const userState = userInst.state;
  const userLat = userInst.latitude;
  const userLon = userInst.longitude;

  let expanded = false;

  // Level 1: MY_COLLEGE
  let results = await searchResources(supabase, {
    ...params,
    institution_id: userInstId,
    latitude: userLat,
    longitude: userLon
  });
  if (results.length > 0) {
    return { search_level: 'MY_COLLEGE' as SearchLevel, searched_institution: userInst.name, expanded, results };
  }

  // Level 2: NEARBY_COLLEGES
  expanded = true;
  results = await searchResources(supabase, {
    ...params,
    latitude: userLat,
    longitude: userLon,
    max_distance: 50 // e.g. 50 km radius
  });
  // Filter out MY_COLLEGE results (which we already know are empty, but theoretically)
  results = results.filter(r => r.institution_id !== userInstId);
  if (results.length > 0) {
    return { search_level: 'NEARBY_COLLEGES' as SearchLevel, searched_institution: userInst.name, expanded, results };
  }

  // Level 3: CITY
  results = await searchResources(supabase, {
    ...params,
    city: userCity,
    latitude: userLat,
    longitude: userLon
  });
  // Avoid duplicating previous levels
  // Filter out those within 50km since they were caught in NEARBY_COLLEGES
  // @ts-ignore
  results = results.filter(r => r.institution_id !== userInstId && (r.distance_km === null || r.distance_km > 50));
  if (results.length > 0) {
    return { search_level: 'CITY' as SearchLevel, searched_institution: userInst.name, expanded, results };
  }

  // Level 4: STATE
  results = await searchResources(supabase, {
    ...params,
    state: userState,
    latitude: userLat,
    longitude: userLon
  });
  // Avoid duplicating CITY
  // @ts-ignore
  results = results.filter(r => r.institution?.city !== userCity);
  if (results.length > 0) {
    return { search_level: 'STATE' as SearchLevel, searched_institution: userInst.name, expanded, results };
  }

  // Level 5: INDIA
  results = await searchResources(supabase, {
    ...params,
    latitude: userLat,
    longitude: userLon
  });
  // Avoid duplicating STATE
  // @ts-ignore
  results = results.filter(r => r.institution?.state !== userState);
  
  return { search_level: 'INDIA' as SearchLevel, searched_institution: userInst.name, expanded, results };
}

export async function getNearbyInstitutions(supabase: SupabaseClient, institutionId: string, radiusKm: number = 50) {
  // 1. Get base institution coordinates
  const { data: baseInst, error: baseErr } = await supabase.from('institutions').select('latitude, longitude, name').eq('id', institutionId).single();
  if (baseErr || !baseInst) throw new Error("Base institution not found");
  
  if (baseInst.latitude === null || baseInst.longitude === null) return [];

  // 2. Get all other institutions
  const { data: allInsts, error: allErr } = await supabase.from('institutions').select('*').neq('id', institutionId);
  if (allErr || !allInsts) return [];

  // 3. Calculate distance and filter
  let nearby = allInsts.map(inst => {
    if (inst.latitude === null || inst.longitude === null) return { ...inst, distance_km: null };
    const dist = distanceKm(baseInst.latitude, baseInst.longitude, inst.latitude, inst.longitude);
    return { ...inst, distance_km: dist };
  });

  nearby = nearby.filter(inst => inst.distance_km !== null && inst.distance_km <= radiusKm);

  // 4. Sort by distance
  nearby.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

  return nearby;
}
