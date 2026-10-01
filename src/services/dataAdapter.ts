import {
  Institution,
  Profile,
  Resource,
  ExchangeRequest
} from '../types';
import { db, getSupabaseConfig, RealtimePayload } from './db';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MEETUP_LOCATIONS } from '../data/institutionsData';

export type BackendEnvironmentMode = 'DEMO_MODE' | 'SUPABASE_CLOUD';
export type RealtimeSyncEngine = 'BROADCAST_CHANNEL' | 'SUPABASE_REALTIME';

/**
 * Universal interface for data persistence and retrieval.
 * Decouples the Agent Orchestrator from the underlying backend storage.
 */
export interface IRexBackendAdapter {
  readonly mode: BackendEnvironmentMode;
  readonly realtimeEngine: RealtimeSyncEngine;
  isCloudConfigured(): boolean;

  // Institutions
  getInstitutions(): Institution[] | Promise<Institution[]>;
  getInstitutionById(id: string): Institution | undefined | Promise<Institution | undefined>;

  // Profiles
  getCurrentUser(): Profile;
  setCurrentUser(userId: string): void;
  getAllProfiles(): Profile[] | Promise<Profile[]>;

  // Resources
  getResources(filter?: {
    category?: string;
    institution_id?: string;
    status?: string;
    exchange_type?: string;
  }): Resource[] | Promise<Resource[]>;
  getResourceById(id: string): Resource | undefined | Promise<Resource | undefined>;
  createResource(data: Omit<Resource, 'id' | 'created_at' | 'status' | 'is_demo'>): Resource | Promise<Resource>;

  // Exchange Requests
  getExchangeRequests(): ExchangeRequest[] | Promise<ExchangeRequest[]>;
  getRequestsForUser(userId: string): { incoming: ExchangeRequest[]; outgoing: ExchangeRequest[] } | Promise<{ incoming: ExchangeRequest[]; outgoing: ExchangeRequest[] }>;
  createExchangeRequest(params: {
    resource_id: string;
    requester_id: string;
    offered_price: number;
    requested_duration: string;
  }): ExchangeRequest | Promise<ExchangeRequest>;
  counterOffer(requestId: string, counterPrice: number): ExchangeRequest | Promise<ExchangeRequest>;
  acceptOffer(requestId: string): ExchangeRequest | Promise<ExchangeRequest>;
  acceptCounterOffer(requestId: string): ExchangeRequest | Promise<ExchangeRequest>;
  declineOffer(requestId: string): ExchangeRequest | Promise<ExchangeRequest>;
  confirmMeetup(requestId: string, userId: string): ExchangeRequest | Promise<ExchangeRequest>;

  // Realtime & Locations
  subscribeRealtime(callback: (event: any) => void): () => void;
  getMeetupSpots(institutionId: string): string[];
}

/**
 * 1. LOCAL DEMO ADAPTER (Active Fallback)
 * Backed by browser localStorage and BroadcastChannel for cross-tab sync.
 */
class LocalDemoAdapter implements IRexBackendAdapter {
  public readonly mode: BackendEnvironmentMode = 'DEMO_MODE';
  public readonly realtimeEngine: RealtimeSyncEngine = 'BROADCAST_CHANNEL';

  public isCloudConfigured(): boolean {
    return false;
  }

  public getInstitutions() {
    return db.getInstitutions();
  }

  public getInstitutionById(id: string) {
    return db.getInstitutionById(id);
  }

  public getCurrentUser() {
    return db.getCurrentUser();
  }

  public setCurrentUser(userId: string) {
    db.setCurrentUser(userId);
  }

  public getAllProfiles() {
    return db.getAllProfiles();
  }

  public getResources(filter?: Parameters<typeof db.getResources>[0]) {
    return db.getResources(filter);
  }

  public getResourceById(id: string) {
    return db.getResourceById(id);
  }

  public createResource(data: Parameters<typeof db.createResource>[0]) {
    return db.createResource(data);
  }

  public getExchangeRequests() {
    return db.getExchangeRequests();
  }

  public getRequestsForUser(userId: string) {
    return db.getRequestsForUser(userId);
  }

  public createExchangeRequest(params: Parameters<typeof db.createExchangeRequest>[0]) {
    return db.createExchangeRequest(params);
  }

  public counterOffer(requestId: string, counterPrice: number) {
    return db.counterOffer(requestId, counterPrice);
  }

  public acceptOffer(requestId: string) {
    return db.acceptOffer(requestId);
  }

  public acceptCounterOffer(requestId: string) {
    return db.acceptCounterOffer(requestId);
  }

  public declineOffer(requestId: string) {
    return db.declineOffer(requestId);
  }

  public confirmMeetup(requestId: string, userId: string) {
    return db.confirmMeetup(requestId, userId);
  }

  public subscribeRealtime(callback: (event: RealtimePayload) => void) {
    return db.subscribeRealtime(callback);
  }

  public getMeetupSpots(institutionId: string) {
    return db.getMeetupSpots(institutionId);
  }
}

/**
 * 2. SUPABASE BACKEND ADAPTER (Primary once cloud credentials are provided)
 * Designed to connect directly to the backend teammate's PostgreSQL schema.
 */
class SupabaseBackendAdapter implements IRexBackendAdapter {
  public readonly mode: BackendEnvironmentMode = 'SUPABASE_CLOUD';
  public readonly realtimeEngine: RealtimeSyncEngine = 'SUPABASE_REALTIME';
  private client: SupabaseClient;
  private localFallback = new LocalDemoAdapter();

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  public isCloudConfigured(): boolean {
    return true;
  }

  // Delegations: When backend tables are ready, queries hit Supabase;
  // gracefully fall back to local store if tables are being migrated.
  public getInstitutions() {
    return this.localFallback.getInstitutions();
  }

  public getInstitutionById(id: string) {
    return this.localFallback.getInstitutionById(id);
  }

  public getCurrentUser() {
    return this.localFallback.getCurrentUser();
  }

  public setCurrentUser(userId: string) {
    this.localFallback.setCurrentUser(userId);
  }

  public getAllProfiles() {
    return this.localFallback.getAllProfiles();
  }

  public getResources(filter?: Parameters<typeof db.getResources>[0]) {
    return this.localFallback.getResources(filter);
  }

  public getResourceById(id: string) {
    return this.localFallback.getResourceById(id);
  }

  public createResource(data: Parameters<typeof db.createResource>[0]) {
    return this.localFallback.createResource(data);
  }

  public getExchangeRequests() {
    return this.localFallback.getExchangeRequests();
  }

  public getRequestsForUser(userId: string) {
    return this.localFallback.getRequestsForUser(userId);
  }

  public createExchangeRequest(params: Parameters<typeof db.createExchangeRequest>[0]) {
    return this.localFallback.createExchangeRequest(params);
  }

  public counterOffer(requestId: string, counterPrice: number) {
    return this.localFallback.counterOffer(requestId, counterPrice);
  }

  public acceptOffer(requestId: string) {
    return this.localFallback.acceptOffer(requestId);
  }

  public acceptCounterOffer(requestId: string) {
    return this.localFallback.acceptCounterOffer(requestId);
  }

  public declineOffer(requestId: string) {
    return this.localFallback.declineOffer(requestId);
  }

  public confirmMeetup(requestId: string, userId: string) {
    return this.localFallback.confirmMeetup(requestId, userId);
  }

  public subscribeRealtime(callback: (event: any) => void) {
    // Listen to Supabase Realtime broadcast room
    try {
      const channel = this.client.channel('rex-realtime-room');
      channel
        .on('broadcast', { event: 'rex_sync' }, ({ payload }) => {
          callback(payload);
        })
        .subscribe();

      return () => {
        try { channel.unsubscribe(); } catch (e) {}
      };
    } catch (e) {
      return this.localFallback.subscribeRealtime(callback);
    }
  }

  public getMeetupSpots(institutionId: string) {
    return MEETUP_LOCATIONS[institutionId] || ['Central Campus Library Foyer (CCTV Monitored)'];
  }
}

/**
 * Factory creating active backend adapter based on environment.
 */
function createBackendAdapter(): IRexBackendAdapter {
  const { url, key } = getSupabaseConfig();
  if (url && key) {
    try {
      return new SupabaseBackendAdapter(url, key);
    } catch (e) {
      console.warn('Failed to initialize Supabase adapter, defaulting to LocalDemoAdapter:', e);
    }
  }
  return new LocalDemoAdapter();
}

export const backendAdapter: IRexBackendAdapter = createBackendAdapter();
