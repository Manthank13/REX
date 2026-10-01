import {
  Resource,
  Institution,
  ExchangeRequest,
  Profile
} from './index';

/**
 * ============================================================================
 * REX AGENT TOOL CONTRACTS
 * ============================================================================
 * These TypeScript interfaces define the formal contract between the REX
 * Intelligence / Orchestration Layer and the underlying Data Access Layer
 * (Local Demo Database or Supabase PostgreSQL backend).
 */

// ----------------------------------------------------------------------------
// 1. searchResources
// ----------------------------------------------------------------------------
export interface SearchResourcesInput {
  /** Target institution ID to search within (e.g. user's own college) */
  institution_id?: string;
  /** Array of institution IDs (e.g. discovered nearby colleges) */
  institution_ids?: string[];
  /** Category filter (e.g. 'Textbooks', 'Kits & Boards', 'Calculators') */
  category?: string;
  /** Keyword tokens extracted from user goal */
  keywords?: string[];
  /** Maximum price ceiling in INR */
  max_price?: number;
  /** Resource listing status (defaults to 'ACTIVE') */
  status?: string;
}

export type SearchResourcesOutput = Resource[];

// ----------------------------------------------------------------------------
// 2. getNearbyInstitutions
// ----------------------------------------------------------------------------
export interface GetNearbyInstitutionsInput {
  /** The AISHE institution ID of the origin campus */
  origin_institution_id: string;
  /** Maximum radius in kilometers to scan (e.g. 20 km) */
  radius_km: number;
}

export interface NearbyInstitutionResult {
  /** Accredited institution record with GPS coordinates */
  institution: Institution;
  /** Factual Haversine distance from origin in kilometers */
  distance_km: number;
}

export type GetNearbyInstitutionsOutput = NearbyInstitutionResult[];

// ----------------------------------------------------------------------------
// 3. checkAvailability
// ----------------------------------------------------------------------------
export interface CheckAvailabilityInput {
  /** Unique ID of the candidate resource */
  resource_id: string;
  /** Requested rental or borrowing time window */
  requested_window?: {
    start_date?: string; // YYYY-MM-DD
    end_date?: string;   // YYYY-MM-DD
  };
}

export interface CheckAvailabilityOutput {
  /** True if the resource is currently unreserved and within date range */
  is_available: boolean;
  /** Status explanation or reservation conflict note */
  reason?: string;
}

// ----------------------------------------------------------------------------
// 4. createExchangeRequest
// ----------------------------------------------------------------------------
export interface CreateExchangeRequestInput {
  /** The target resource ID being requested */
  resource_id: string;
  /** The authenticated student requester ID */
  requester_id: string;
  /** Proposed offer price in INR */
  offered_price: number;
  /** Human-readable or date-bound duration (e.g. 'This weekend (3 days)') */
  requested_duration: string;
}

export type CreateExchangeRequestOutput = ExchangeRequest;

// ----------------------------------------------------------------------------
// 5. counterExchangeRequest
// ----------------------------------------------------------------------------
export interface CounterExchangeRequestInput {
  /** Unique ID of the existing exchange request */
  request_id: string;
  /** Proposed counter price in INR by the resource owner */
  counter_price: number;
}

export type CounterExchangeRequestOutput = ExchangeRequest;

// ----------------------------------------------------------------------------
// 6. acceptExchangeRequest
// ----------------------------------------------------------------------------
export interface AcceptExchangeRequestInput {
  /** Unique ID of the exchange request being accepted */
  request_id: string;
}

export type AcceptExchangeRequestOutput = ExchangeRequest;

// ----------------------------------------------------------------------------
// 7. confirmExchange
// ----------------------------------------------------------------------------
export interface ConfirmExchangeInput {
  /** Unique ID of the exchange request */
  request_id: string;
  /** Authenticated user confirming the handover (requester or owner) */
  confirming_user_id: string;
}

export type ConfirmExchangeOutput = ExchangeRequest;

// ----------------------------------------------------------------------------
// 8. findMeetupLocation
// ----------------------------------------------------------------------------
export interface FindMeetupLocationInput {
  /** Institution ID of the requester's campus */
  requester_institution_id: string;
  /** Institution ID of the owner's campus */
  owner_institution_id: string;
}

export interface FindMeetupLocationOutput {
  /** Selected public, CCTV-monitored campus spot name */
  location_name: string;
  /** GPS coordinates if available */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /** Safe handover window and safety recommendations */
  description: string;
}
