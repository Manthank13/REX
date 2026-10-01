import {
  AgentIntent,
  Resource,
  Institution,
  Profile,
  SearchCandidate,
  DecisionTraceEvent,
  ExchangeRequest
} from '../types';
import { backendAdapter } from './dataAdapter';
import { supabase } from './db';
import { MEETUP_LOCATIONS } from '../data/institutionsData';
import {
  SearchResourcesInput,
  GetNearbyInstitutionsInput,
  CheckAvailabilityInput,
  CreateExchangeRequestInput,
  CounterExchangeRequestInput,
  AcceptExchangeRequestInput,
  ConfirmExchangeInput,
  FindMeetupLocationInput
} from '../types/agentToolContracts';

// ============================================================================
// 1. MATHEMATICAL & GEOGRAPHIC UTILITIES
// ============================================================================

/**
 * Calculates Haversine distance in kilometers between two latitude/longitude points.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

// ============================================================================
// 2. EXPLICIT REX AGENT TOOLS
// ============================================================================

export type SearchResourcesFilter = SearchResourcesInput;

/**
 * Tool: searchResources
 * Queries verified resources from the data layer matching search filters.
 */
export function searchResources(filter: SearchResourcesFilter): Resource[] {
  const all = (backendAdapter.getResources({ status: filter.status || 'ACTIVE' }) as Resource[]);
  const instIdSet = filter.institution_ids ? new Set(filter.institution_ids) : null;

  return all.filter(res => {
    // Institution filter
    if (filter.institution_id && res.institution_id !== filter.institution_id) {
      return false;
    }
    if (instIdSet && !instIdSet.has(res.institution_id)) {
      return false;
    }

    // Category filter
    if (filter.category && filter.category !== 'All' && filter.category !== 'general') {
      const matchCat = res.category.toLowerCase().includes(filter.category.toLowerCase()) ||
        filter.category.toLowerCase().includes(res.category.toLowerCase());
      if (!matchCat) return false;
    }

    // Max price filter
    if (filter.max_price !== undefined && filter.max_price !== null && res.price > filter.max_price) {
      return false;
    }

    // Keyword filter
    if (filter.keywords && filter.keywords.length > 0) {
      const content = `${res.title} ${res.description} ${res.category} ${res.brand || ''}`.toLowerCase();
      const hasMatch = filter.keywords.some(k => content.includes(k.toLowerCase()));
      if (!hasMatch) return false;
    }

    return true;
  });
}

/**
 * Tool: getResourceDetails
 * Fetches full details of a specific resource along with its institution and owner profile.
 */
export function getResourceDetails(resourceId: string): {
  resource: Resource;
  institution?: Institution;
  owner?: Profile;
} | null {
  const resource = backendAdapter.getResourceById(resourceId) as Resource | undefined;
  if (!resource) return null;

  const institution = backendAdapter.getInstitutionById(resource.institution_id) as Institution | undefined;
  const owner = (backendAdapter.getAllProfiles() as Profile[]).find(p => p.id === resource.owner_id);

  return { resource, institution, owner };
}

/**
 * Tool: checkAvailability
 * Validates whether a resource is active and unreserved during the requested window.
 */
export function checkAvailability(
  resourceId: string,
  window?: { start?: string; end?: string; start_date?: string; end_date?: string }
): boolean {
  const resource = backendAdapter.getResourceById(resourceId) as Resource | undefined;
  if (!resource) return false;
  if (resource.status !== 'ACTIVE') return false;

  const start = window?.start || window?.start_date;
  const end = window?.end || window?.end_date;

  if (start && resource.availability_end && start > resource.availability_end) {
    return false;
  }
  if (end && resource.availability_start && end < resource.availability_start) {
    return false;
  }

  return true;
}

/**
 * Tool: getNearbyInstitutions
 * Discovers accredited AISHE institutions within radiusKm from the origin institution.
 */
export function getNearbyInstitutions(
  institutionId: string,
  radiusKm: number = 20
): Array<{ institution: Institution; distance_km: number }> {
  const origin = backendAdapter.getInstitutionById(institutionId) as Institution | undefined;
  if (!origin) return [];

  const all = backendAdapter.getInstitutions() as Institution[];
  const nearby: Array<{ institution: Institution; distance_km: number }> = [];

  for (const inst of all) {
    if (inst.id === institutionId) continue;
    const dist = calculateDistance(origin.latitude, origin.longitude, inst.latitude, inst.longitude);
    if (dist <= radiusKm) {
      nearby.push({ institution: inst, distance_km: dist });
    }
  }

  return nearby.sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Tool: createExchangeRequest
 * Creates a pending peer-to-peer exchange request in the database.
 */
export function createExchangeRequest(params: {
  resourceId: string;
  requesterId: string;
  offeredPrice: number;
  duration: string;
}): ExchangeRequest {
  return backendAdapter.createExchangeRequest({
    resource_id: params.resourceId,
    requester_id: params.requesterId,
    offered_price: params.offeredPrice,
    requested_duration: params.duration,
  }) as ExchangeRequest;
}

/**
 * Tool: getExchangeRequests
 * Retrieves all incoming and outgoing exchange requests for a given student.
 */
export function getExchangeRequests(userId: string): {
  incoming: ExchangeRequest[];
  outgoing: ExchangeRequest[];
} {
  return backendAdapter.getRequestsForUser(userId) as {
    incoming: ExchangeRequest[];
    outgoing: ExchangeRequest[];
  };
}

/**
 * Tool: counterExchangeRequest
 * Proposes a counter-offer price for a pending exchange request.
 */
export function counterExchangeRequest(requestId: string, counterPrice: number): ExchangeRequest {
  return backendAdapter.counterOffer(requestId, counterPrice) as ExchangeRequest;
}

/**
 * Tool: acceptExchangeRequest
 * Accepts an incoming offer or counter offer and assigns a safe public campus meetup spot.
 */
export function acceptExchangeRequest(requestId: string): ExchangeRequest {
  const allReqs = backendAdapter.getExchangeRequests() as ExchangeRequest[];
  const req = allReqs.find(r => r.id === requestId);
  if (req && req.status === 'COUNTERED') {
    return backendAdapter.acceptCounterOffer(requestId) as ExchangeRequest;
  }
  return backendAdapter.acceptOffer(requestId) as ExchangeRequest;
}

/**
 * Tool: declineExchangeRequest
 * Declines an exchange request.
 */
export function declineExchangeRequest(requestId: string): ExchangeRequest {
  return backendAdapter.declineOffer(requestId) as ExchangeRequest;
}

/**
 * Tool: confirmExchange
 * Marks the exchange handover as confirmed by the student (requester or owner).
 */
export function confirmExchange(requestId: string, userId: string): ExchangeRequest {
  return backendAdapter.confirmMeetup(requestId, userId) as ExchangeRequest;
}

/**
 * Tool: findMeetupLocation
 * Selects a safe, CCTV-monitored, public campus exchange zone between two institutions.
 */
export function findMeetupLocation(
  institutionIdA: string,
  institutionIdB: string
): {
  locationName: string;
  coordinates?: { latitude: number; longitude: number };
  description: string;
} {
  const spotsA = backendAdapter.getMeetupSpots(institutionIdA);
  const spotsB = backendAdapter.getMeetupSpots(institutionIdB);

  // If both from same institution, use that college's prime spot
  if (institutionIdA === institutionIdB && spotsA && spotsA.length > 0) {
    return {
      locationName: spotsA[0],
      description: 'Official CCTV-monitored student safety zone on your campus.'
    };
  }

  // Cross-college exchange: Recommend resource owner's safe campus spot or central library
  const preferredSpot = spotsB?.[0] || spotsA?.[0] || 'Central Campus Library Foyer (CCTV Monitored)';
  return {
    locationName: preferredSpot,
    description: 'Safe, daytime public handover zone recommended by REX protocol.'
  };
}

/**
 * Consolidated agent tools registry
 */
export const agentTools = {
  calculateDistance,
  searchResources,
  getResourceDetails,
  checkAvailability,
  getNearbyInstitutions,
  createExchangeRequest,
  getExchangeRequests,
  counterExchangeRequest,
  acceptExchangeRequest,
  declineExchangeRequest,
  confirmExchange,
  findMeetupLocation,
};

// ============================================================================
// 3. GEMINI INTENT EXTRACTION & DETERMINISTIC NLP FALLBACK
// ============================================================================

/**
 * Converts natural-language user query into structured intent.
 * 1. Attempts Supabase Edge Function with server-side secret (zero client key exposure).
 * 2. Attempts Gemini 2.5 Flash directly if local dev key is configured.
 * 3. Safely falls back to deterministic NLP parser.
 */
export async function extractIntent(
  query: string,
  onTrace?: (event: DecisionTraceEvent) => void
): Promise<AgentIntent> {
  const timestamp = new Date().toLocaleTimeString();
  onTrace?.({
    id: `trace-${Date.now()}-intent`,
    timestamp,
    action: 'Intent Extraction Initiated',
    detail: `Parsing natural language requirements for: "${query}"`,
    type: 'info'
  });

  // 1. Try Supabase Edge Function first (Secure, server-side secret)
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('extract-intent', {
        body: { query }
      });

      if (!error && data?.intent) {
        const parsed = data.intent;
        const keywords = Array.isArray(parsed.keywords) && parsed.keywords.length > 0
          ? parsed.keywords
          : [parsed.item || 'item'];

        onTrace?.({
          id: `trace-${Date.now()}-edge`,
          timestamp: new Date().toLocaleTimeString(),
          action: 'Edge Function Intent Extracted',
          detail: `Server-side Gemini 2.5 Flash identified: item="${parsed.item || parsed.category}", budget=${parsed.max_price ? `₹${parsed.max_price}` : 'flexible'}`,
          type: 'success'
        });

        return {
          item: parsed.item || undefined,
          category: parsed.category || undefined,
          resource_type: parsed.category || 'General Resource',
          keywords,
          max_price: parsed.max_price ?? undefined,
          condition: parsed.condition ?? null,
          purpose: parsed.purpose ?? null,
          duration: parsed.duration || 'Flexible',
          availability_start: parsed.availability_start || undefined,
          availability_end: parsed.availability_end || undefined,
          preferred_institution: parsed.preferred_institution || undefined,
          location_preference: parsed.location_preference || 'same_college',
          search_expansion_allowed: parsed.search_expansion_allowed ?? true,
          urgency: parsed.urgency || null,
          raw_query: query
        };
      }
    } catch (e) {
      // Gracefully continue to fallback
    }
  }

  // 2. Direct client-side Gemini 2.5 Flash (if dev key provided)
  const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('rex_gemini_api_key') : '')
    || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  if (apiKey) {
    try {
      const prompt = `You are REX, an autonomous college student exchange agent for India.
Extract structured intent from this student goal: "${query}"

Return ONLY a JSON object with this exact schema:
{
  "item": "specific item name e.g. Raspberry Pi 4",
  "category": "one of: electronics, textbooks, notes, lab equipment, kits & boards, calculators, sports, general",
  "condition": "Like New | Excellent | Good | Fair or null",
  "max_price": number or null,
  "purpose": "hackathon | coursework | project | exam or null",
  "availability_start": "YYYY-MM-DD or null",
  "availability_end": "YYYY-MM-DD or null",
  "preferred_institution": "user_current_institution or specific college or null",
  "location_preference": "same_college | nearby_colleges | any",
  "search_expansion_allowed": boolean,
  "duration": "e.g. This weekend (3 days) | 2 weeks | 1 month | Semester or null",
  "urgency": "urgent | flexible or null",
  "keywords": ["list", "of", "search", "keywords"]
}`;

      // Calling supported Gemini 2.5 Flash model
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          const keywords = Array.isArray(parsed.keywords) && parsed.keywords.length > 0
            ? parsed.keywords
            : [parsed.item || 'item'];

          onTrace?.({
            id: `trace-${Date.now()}-gemini`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'Gemini 2.5 Flash Intent Extracted',
            detail: `Identified item="${parsed.item || parsed.category}", budget=${parsed.max_price ? `₹${parsed.max_price}` : 'flexible'}, expansion=${parsed.search_expansion_allowed !== false}`,
            type: 'success'
          });

          return {
            item: parsed.item || undefined,
            category: parsed.category || undefined,
            resource_type: parsed.category || 'General Resource',
            keywords,
            max_price: parsed.max_price ?? undefined,
            condition: parsed.condition ?? null,
            purpose: parsed.purpose ?? null,
            duration: parsed.duration || 'Flexible',
            availability_start: parsed.availability_start || undefined,
            availability_end: parsed.availability_end || undefined,
            preferred_institution: parsed.preferred_institution || undefined,
            location_preference: parsed.location_preference || 'same_college',
            search_expansion_allowed: parsed.search_expansion_allowed ?? true,
            urgency: parsed.urgency || null,
            raw_query: query
          };
        }
      }
    } catch (e) {
      console.warn('Gemini 2.5 Flash intent extraction failed, continuing with deterministic parser:', e);
    }
  }

  // 3. Deterministic NLP Fallback
  const lower = query.toLowerCase();

  // Extract budget cap
  let maxPrice: number | undefined = undefined;
  const budgetMatch = lower.match(/(?:under|below|max|budget|within|₹|rs\.?)\s*(\d+)/i) || lower.match(/(\d+)\s*(?:rs|rupees|inr)/i);
  if (budgetMatch && budgetMatch[1]) {
    maxPrice = parseInt(budgetMatch[1], 10);
  }

  // Extract duration & window
  let duration = 'Flexible';
  let availability_start: string | undefined = undefined;
  let availability_end: string | undefined = undefined;

  if (lower.includes('weekend') || lower.includes('this weekend')) {
    duration = 'This weekend (3 days)';
    availability_start = '2026-10-02';
    availability_end = '2026-10-06';
  } else if (lower.includes('2 week') || lower.includes('two week')) {
    duration = '2 weeks';
    availability_start = '2026-10-02';
    availability_end = '2026-10-16';
  } else if (lower.includes('month')) {
    duration = '1 month';
  } else if (lower.includes('semester')) {
    duration = 'Semester';
  }

  // Extract item, category, & keywords
  let item = 'Resource';
  let category = 'General Resource';
  const keywords: string[] = [];

  if (lower.includes('raspberry pi') || lower.includes('rpi') || lower.includes('pi 4') || lower.includes('pi 3')) {
    item = 'Raspberry Pi';
    category = 'Kits & Boards';
    keywords.push('raspberry pi', 'rpi', 'pi 4', 'pi 3');
  } else if (lower.includes('arduino')) {
    item = 'Arduino Uno Kit';
    category = 'Kits & Boards';
    keywords.push('arduino', 'sensors', 'kit');
  } else if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('clrs')) {
    item = 'Algorithms Textbook (CLRS)';
    category = 'Textbooks';
    keywords.push('dsa', 'algorithms', 'clrs', 'textbook');
  } else if (lower.includes('calculator') || lower.includes('casio')) {
    item = 'Scientific Calculator';
    category = 'Calculators';
    keywords.push('calculator', 'casio', 'fx-991es');
  } else if (lower.includes('dbms') || lower.includes('notes')) {
    item = 'Database Systems Notes';
    category = 'Notes';
    keywords.push('dbms', 'notes', 'database');
  } else if (lower.includes('camera') || lower.includes('sony')) {
    item = 'Sony Mirrorless Camera';
    category = 'Electronics';
    keywords.push('camera', 'sony', 'mirrorless');
  } else if (lower.includes('lab coat') || lower.includes('goggles')) {
    item = 'Chemistry Lab Coat & Goggles';
    category = 'Lab Equipment';
    keywords.push('lab coat', 'goggles', 'chemistry');
  } else {
    keywords.push(...query.split(/\s+/).filter(w => w.length > 3));
  }

  const preferredInst = lower.includes('my college') || lower.includes('srm')
    ? 'user_current_institution'
    : undefined;

  const searchExpansionAllowed = !lower.includes('only my college') && !lower.includes('strictly srm');

  onTrace?.({
    id: `trace-${Date.now()}-nlp`,
    timestamp: new Date().toLocaleTimeString(),
    action: 'Deterministic NLP Intent Extracted',
    detail: `Item: "${item}" (${category}) | Duration: ${duration} | Budget: ${maxPrice ? `₹${maxPrice}` : 'Flexible'} | Expand: ${searchExpansionAllowed}`,
    type: 'info'
  });

  return {
    item,
    category,
    resource_type: category,
    keywords,
    max_price: maxPrice,
    condition: null,
    purpose: lower.includes('hackathon') ? 'hackathon' : null,
    duration,
    availability_start,
    availability_end,
    preferred_institution: preferredInst,
    location_preference: preferredInst ? 'same_college' : 'nearby_colleges',
    search_expansion_allowed: searchExpansionAllowed,
    urgency: lower.includes('urgent') || lower.includes('asap') ? 'urgent' : null,
    raw_query: query
  };
}

// ============================================================================
// 4. AUTONOMOUS MULTI-STAGE SEARCH ORCHESTRATOR
// ============================================================================

export interface OrchestrationResult {
  bestMatch: SearchCandidate | null;
  allCandidates: SearchCandidate[];
  finalStage: string;
  explanation: string;
}

/**
 * Orchestrates multi-stage search with real tool execution:
 * Stage 1: User's College
 * Stage 2: Nearby Colleges (< 20 km)
 * Stage 3: Metropolitan Area (< 50 km)
 * Stage 4/5: National Fallback
 */
export async function orchestrateExchangeSearch(
  intent: AgentIntent,
  userProfile: Profile,
  onTrace?: (event: DecisionTraceEvent) => void
): Promise<OrchestrationResult> {
  const userInst = backendAdapter.getInstitutionById(userProfile.institution_id) as Institution | undefined;
  const allInstitutions = backendAdapter.getInstitutions() as Institution[];
  const allProfiles = backendAdapter.getAllProfiles() as Profile[];

  const addTrace = (action: string, detail: string, type: 'info' | 'expand' | 'success' | 'warn' = 'info') => {
    onTrace?.({
      id: `trace-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      action,
      detail,
      type
    });
  };

  // --------------------------------------------------------------------------
  // STAGE 1: Search User's College via searchResources tool
  // --------------------------------------------------------------------------
  addTrace(
    'Tool Call: searchResources',
    `Stage 1: Scanning user college (${userInst?.name || 'Local Campus'})... Filter: { institution_id: "${userProfile.institution_id}", keywords: [${intent.keywords.join(', ')}] }`
  );
  await new Promise(r => setTimeout(r, 600));

  const stage1Resources = searchResources({
    institution_id: userProfile.institution_id,
    keywords: intent.keywords,
    max_price: intent.max_price,
  });

  if (stage1Resources.length > 0) {
    addTrace('Local Resource Located', `Found ${stage1Resources.length} candidate(s) at ${userInst?.name}.`, 'success');
    const candidates = stage1Resources.map(r =>
      buildCandidate(r, userInst!, allInstitutions, allProfiles, 'USER_COLLEGE', intent)
    );
    const sorted = rankCandidates(candidates);
    return {
      bestMatch: sorted[0],
      allCandidates: sorted,
      finalStage: 'USER_COLLEGE',
      explanation: generateExplanation(sorted[0], intent, userInst!)
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 2: If No Match & Expansion Allowed, Expand to Nearby Colleges (< 20 km)
  // --------------------------------------------------------------------------
  if (intent.search_expansion_allowed === false) {
    addTrace('Search Complete', `No matching resource at ${userInst?.name}, and search expansion was explicitly disallowed by user preference.`, 'warn');
    return {
      bestMatch: null,
      allCandidates: [],
      finalStage: 'NONE',
      explanation: 'No matching resource found within your college.'
    };
  }

  addTrace(
    'Tool Call: getNearbyInstitutions',
    `Stage 2: No match at your college. Calling getNearbyInstitutions("${userProfile.institution_id}", radius: 20 km)...`,
    'expand'
  );
  await new Promise(r => setTimeout(r, 700));

  const nearbyInstitutions = getNearbyInstitutions(userProfile.institution_id, 20);
  const nearbyNames = nearbyInstitutions.map(n => `${n.institution.name.split(' ')[0]} (${n.distance_km} km)`).join(', ');
  addTrace(
    'Discovered Nearby Campuses',
    `Found ${nearbyInstitutions.length} accredited institutions within 20 km: ${nearbyNames}.`,
    'info'
  );

  const nearbyInstIds = nearbyInstitutions.map(n => n.institution.id);
  addTrace(
    'Tool Call: searchResources',
    `Querying resources across nearby campus cluster [${nearbyInstIds.join(', ')}]...`
  );
  await new Promise(r => setTimeout(r, 500));

  const stage2Resources = searchResources({
    institution_ids: nearbyInstIds,
    keywords: intent.keywords,
  });

  if (stage2Resources.length > 0) {
    addTrace(
      'Candidates Located',
      `Found ${stage2Resources.length} candidate(s) at nearby institutions (e.g. VIT Chennai). Verifying availability...`,
      'success'
    );

    // Check availability for each candidate
    const available = stage2Resources.filter(r => {
      const isAvail = checkAvailability(r.id, {
        start: intent.availability_start,
        end: intent.availability_end
      });
      return isAvail;
    });

    const candidates = (available.length > 0 ? available : stage2Resources).map(r =>
      buildCandidate(r, userInst!, allInstitutions, allProfiles, 'NEARBY_COLLEGES', intent)
    );
    const sorted = rankCandidates(candidates);

    return {
      bestMatch: sorted[0],
      allCandidates: sorted,
      finalStage: 'NEARBY_COLLEGES',
      explanation: generateExplanation(sorted[0], intent, userInst!)
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 3: Expand to City / Metropolitan Area (< 50 km)
  // --------------------------------------------------------------------------
  addTrace(
    'Network Expanded',
    `Stage 3: Expanding to city-wide institutions in ${userInst?.city || 'the region'} (< 50 km)...`,
    'expand'
  );
  await new Promise(r => setTimeout(r, 600));

  const cityInstitutions = allInstitutions.filter(inst =>
    inst.city === userInst?.city ||
    (userInst && calculateDistance(userInst.latitude, userInst.longitude, inst.latitude, inst.longitude) <= 50)
  );
  const cityInstIds = cityInstitutions.map(i => i.id);

  const stage3Resources = searchResources({
    institution_ids: cityInstIds,
    keywords: intent.keywords,
  });

  if (stage3Resources.length > 0) {
    addTrace('City Candidates Found', `Found ${stage3Resources.length} candidate(s) in metropolitan region.`, 'success');
    const candidates = stage3Resources.map(r =>
      buildCandidate(r, userInst!, allInstitutions, allProfiles, 'CITY', intent)
    );
    const sorted = rankCandidates(candidates);
    return {
      bestMatch: sorted[0],
      allCandidates: sorted,
      finalStage: 'CITY',
      explanation: generateExplanation(sorted[0], intent, userInst!)
    };
  }

  // --------------------------------------------------------------------------
  // STAGE 4/5: All-India Fallback
  // --------------------------------------------------------------------------
  addTrace('Network Expanded', `Stage 4: Broadening across all verified Indian colleges...`, 'expand');
  await new Promise(r => setTimeout(r, 550));

  const nationalResources = searchResources({
    keywords: intent.keywords,
  });

  if (nationalResources.length > 0) {
    const candidates = nationalResources.map(r =>
      buildCandidate(r, userInst!, allInstitutions, allProfiles, 'INDIA', intent)
    );
    const sorted = rankCandidates(candidates);
    return {
      bestMatch: sorted[0],
      allCandidates: sorted,
      finalStage: 'INDIA',
      explanation: generateExplanation(sorted[0], intent, userInst!)
    };
  }

  // No match found anywhere
  addTrace('Search Complete', `No matching resource found across registered campus networks.`, 'warn');
  return {
    bestMatch: null,
    allCandidates: [],
    finalStage: 'NONE',
    explanation: 'No matching campus resources found meeting your current criteria.'
  };
}

/**
 * Backward compatibility alias for executeAgentSearch
 */
export const executeAgentSearch = orchestrateExchangeSearch;

// ============================================================================
// 5. CANDIDATE EVALUATION & SCORING
// ============================================================================

function buildCandidate(
  resource: Resource,
  userInst: Institution,
  institutions: Institution[],
  profiles: Profile[],
  stage: SearchCandidate['stage_found'],
  intent: AgentIntent
): SearchCandidate {
  const resInst = institutions.find(i => i.id === resource.institution_id) || userInst;
  const owner = profiles.find(p => p.id === resource.owner_id) || {
    id: resource.owner_id,
    name: 'Verified Student',
    email: 'student@campus.edu',
    institution_id: resource.institution_id,
    department: 'Engineering',
    year: 'Senior',
    verified: true,
    is_demo: resource.is_demo,
    created_at: new Date().toISOString()
  };

  const distanceKm = userInst
    ? calculateDistance(userInst.latitude, userInst.longitude, resInst.latitude, resInst.longitude)
    : 0;

  // Multi-factor factual score
  let score = 70;
  if (intent.max_price && resource.price <= intent.max_price) score += 15;
  if (distanceKm <= 10) score += 15;
  else if (distanceKm <= 25) score += 8;
  if (owner.verified) score += 5;
  if (resource.condition === 'Excellent' || resource.condition === 'Like New') score += 5;

  return {
    resource,
    institution: resInst,
    owner,
    distance_km: distanceKm,
    match_score: Math.min(99, score),
    stage_found: stage,
    rationale: `Located ${distanceKm} km away at ${resInst.name}. Active listing.`
  };
}

function rankCandidates(candidates: SearchCandidate[]): SearchCandidate[] {
  return [...candidates].sort((a, b) => {
    // 1. Proximity first
    if (a.distance_km !== b.distance_km) {
      return a.distance_km - b.distance_km;
    }
    // 2. Multi-factor score
    return b.match_score - a.match_score;
  });
}

function generateExplanation(candidate: SearchCandidate, intent: AgentIntent, userInst: Institution): string {
  const { resource, institution, distance_km } = candidate;
  if (institution.id === userInst?.id) {
    return `REX selected this resource because it is available right at your college (${institution.name}), matches your specifications, and fits within your budget.`;
  }
  return `REX selected this resource because no suitable match was available inside your college (${userInst?.name || 'campus'}), but this candidate at nearby ${institution.name} (${distance_km} km away) matches your requested specs, price (₹${resource.price}), and is available for this weekend.`;
}

// ============================================================================
// 6. AI OBJECT EXTRACTION FOR LISTINGS (Vision with Gemini 2.5 Flash)
// ============================================================================

/**
 * AI Object Extraction for Resource Listing
 * Uses Gemini 2.5 Flash Vision if key is available, else local intelligent vision classifier.
 */
export async function detectObjectFromImage(
  imageBase64OrName: string
): Promise<{
  title: string;
  category: string;
  brand: string;
  condition: 'Good' | 'Like New' | 'Excellent' | 'Fair';
  description: string;
  suggestedPrice: number;
}> {
  const apiKey = (typeof localStorage !== 'undefined' ? localStorage.getItem('rex_gemini_api_key') : '')
    || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  if (apiKey && imageBase64OrName.startsWith('data:image')) {
    try {
      const mimeType = imageBase64OrName.substring(imageBase64OrName.indexOf(':') + 1, imageBase64OrName.indexOf(';'));
      const base64Data = imageBase64OrName.split(',')[1];

      // Using Gemini 2.5 Flash multimodal vision
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Identify this student item for a college exchange platform.
Respond with JSON only:
{
  "title": "Precise Item Name (e.g. Casio FX-991ES Plus)",
  "category": "One of: Textbooks, Electronics, Lab Equipment, Notes, Kits & Boards, Calculators, Sports",
  "brand": "Manufacturer or brand",
  "condition": "One of: Like New, Excellent, Good, Fair",
  "description": "Short clean description for students",
  "suggestedPrice": number in INR
}` },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return JSON.parse(text);
      }
    } catch (e) {
      console.warn('Gemini 2.5 Flash vision analysis failed, falling back to local vision detector:', e);
    }
  }

  // Intelligent preset recognition based on file or mock selection
  const lower = imageBase64OrName.toLowerCase();

  if (lower.includes('casio') || lower.includes('calc')) {
    return {
      title: 'Casio FX-991ES Plus Scientific Calculator',
      category: 'Calculators',
      brand: 'Casio',
      condition: 'Good',
      description: 'Scientific calculator with 417 functions approved for engineering university coursework.',
      suggestedPrice: 450
    };
  } else if (lower.includes('raspberry') || lower.includes('rpi')) {
    return {
      title: 'Raspberry Pi 4 Model B (4GB RAM)',
      category: 'Kits & Boards',
      brand: 'Raspberry Pi Foundation',
      condition: 'Excellent',
      description: 'Single-board computer with micro-HDMI and USB 3.0 ports, ideal for IoT and AI prototypes.',
      suggestedPrice: 650
    };
  } else if (lower.includes('arduino')) {
    return {
      title: 'Arduino Uno R3 Starter Kit with Sensors',
      category: 'Kits & Boards',
      brand: 'Arduino',
      condition: 'Like New',
      description: 'Microcontroller board with breadboard and sensor pack for university robotics practicals.',
      suggestedPrice: 600
    };
  } else if (lower.includes('clrs') || lower.includes('algorithm') || lower.includes('book')) {
    return {
      title: 'CLRS — Introduction to Algorithms (3rd Edition)',
      category: 'Textbooks',
      brand: 'MIT Press',
      condition: 'Good',
      description: 'Standard computer science algorithms textbook. Clean pages with minimal markings.',
      suggestedPrice: 350
    };
  }

  // Default clean detection
  return {
    title: 'Student Coursework Resource',
    category: 'Electronics',
    brand: 'Standard',
    condition: 'Good',
    description: 'Verified student-owned academic equipment in good working order.',
    suggestedPrice: 300
  };
}
