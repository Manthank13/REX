export type ExchangeType = 'SELL' | 'EXCHANGE' | 'LEND' | 'GIVE_AWAY';
export type ResourceCondition = 'Like New' | 'Excellent' | 'Good' | 'Fair';
export type ResourceStatus = 'ACTIVE' | 'RESERVED' | 'EXCHANGED' | 'UNAVAILABLE';
export type ExchangeStatus =
  | 'PENDING'
  | 'NEGOTIATING'
  | 'COUNTERED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'MEETUP_CONFIRMED'
  | 'COMPLETED';

export interface Institution {
  id: string;
  aishe_code: string;
  name: string;
  institution_type: string;
  state: string;
  district: string;
  city: string;
  address: string;
  website: string;
  latitude: number;
  longitude: number;
  source: string; // e.g. "AISHE / Open Government Data (data.gov.in)"
  source_updated_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  institution_id: string;
  department: string;
  year: string;
  avatar_url?: string;
  verified: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  owner_id: string;
  institution_id: string;
  title: string;
  description: string;
  category: string;
  brand?: string;
  condition: ResourceCondition;
  price: number;
  exchange_type: ExchangeType;
  availability_start: string;
  availability_end: string;
  latitude: number;
  longitude: number;
  image_url: string;
  status: ResourceStatus;
  is_demo: boolean;
  created_at: string;
}

export interface ExchangeRequest {
  id: string;
  resource_id: string;
  requester_id: string;
  owner_id: string;
  offered_price: number;
  requested_duration: string;
  status: ExchangeStatus;
  counter_price?: number;
  meetup_location_id?: string;
  meetup_location_name?: string;
  meetup_time?: string;
  requester_confirmed: boolean;
  owner_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeMessage {
  id: string;
  exchange_id: string;
  sender_id: string;
  sender_role: 'REX' | 'REQUESTER' | 'OWNER';
  content: string;
  created_at: string;
}

export interface MeetupLocation {
  id: string;
  institution_id: string;
  name: string;
  zone_type: 'CCTV_SAFETY_HUB' | 'CENTRAL_LIBRARY' | 'CAMPUS_GATE' | 'STUDENT_ACTIVITY_CENTER';
  latitude: number;
  longitude: number;
  description: string;
}

export interface AgentIntent {
  item?: string;
  category?: string;
  resource_type: string;
  keywords: string[];
  max_price?: number;
  condition?: string | null;
  purpose?: string | null;
  duration?: string;
  availability_start?: string;
  availability_end?: string;
  preferred_institution?: string;
  location_preference?: 'same_college' | 'nearby_colleges' | 'city' | 'state' | 'national' | string;
  search_expansion_allowed?: boolean;
  urgency?: 'urgent' | 'flexible' | null;
  availability?: string;
  raw_query: string;
}

export interface SearchCandidate {
  resource: Resource;
  institution: Institution;
  owner: Profile;
  distance_km: number;
  match_score: number;
  stage_found: 'USER_COLLEGE' | 'NEARBY_COLLEGES' | 'CITY' | 'STATE' | 'INDIA';
  rationale: string;
}

export interface DecisionTraceEvent {
  id: string;
  timestamp: string;
  action: string;
  detail: string;
  stage?: string;
  type: 'info' | 'expand' | 'success' | 'warn';
}
