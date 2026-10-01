import { 
  Institution, 
  Profile, 
  Resource, 
  ExchangeRequest, 
  ExchangeMessage, 
  ExchangeStatus,
  ExchangeType,
  ResourceCondition
} from '../types';
import { AISHE_INSTITUTIONS, MEETUP_LOCATIONS } from '../data/institutionsData';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration accessor
const getSupabaseConfig = () => {
  const url = localStorage.getItem('rex_supabase_url') || (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('rex_supabase_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return { url, key };
};

let supabase: SupabaseClient | null = null;
const { url: initialUrl, key: initialKey } = getSupabaseConfig();
if (initialUrl && initialKey) {
  try {
    supabase = createClient(initialUrl, initialKey);
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
  }
}

// Cross-tab real-time broadcast channel
const realtimeChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('rex_realtime_events')
  : null;

export type RealtimeEventType = 
  | 'NEW_EXCHANGE_REQUEST'
  | 'OFFER_ACCEPTED'
  | 'OFFER_COUNTERED'
  | 'OFFER_DECLINED'
  | 'MEETUP_CONFIRMED'
  | 'RESOURCE_CREATED'
  | 'USER_SWITCHED';

export interface RealtimePayload {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
}

// Demo Profiles (Clearly marked Demo Mode)
export const DEMO_PROFILES: Profile[] = [
  {
    id: 'user-aarav-srm',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@srmist.edu.in',
    institution_id: 'inst-srm-ktr',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    verified: true,
    is_demo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-vikram-vit',
    name: 'Vikram Patel',
    email: 'vikram.patel@vit.ac.in',
    institution_id: 'inst-vit-chennai',
    department: 'Electronics & Communication',
    year: '4th Year',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
    verified: true,
    is_demo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-ananya-iitm',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@iitm.ac.in',
    institution_id: 'inst-iit-madras',
    department: 'Data Science & AI',
    year: '2nd Year',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    verified: true,
    is_demo: true,
    created_at: new Date().toISOString(),
  }
];

// Initial realistic demo resources (all explicitly flagged as is_demo: true)
export const INITIAL_DEMO_RESOURCES: Resource[] = [
  // VIT Chennai: Target match for Raspberry Pi request (6.8 km from SRM)
  {
    id: 'res-rpi4-vit',
    owner_id: 'user-vikram-vit',
    institution_id: 'inst-vit-chennai',
    title: 'Raspberry Pi 4 Model B (4GB RAM) + 32GB SD & Case',
    description: 'Quad-core 64-bit SoC, dual micro-HDMI 4K, USB 3.0 ports. Ideal for computer vision, robotics, or weekend hackathon builds.',
    category: 'Kits & Boards',
    brand: 'Raspberry Pi Foundation',
    condition: 'Good',
    price: 650,
    exchange_type: 'LEND',
    availability_start: '2026-10-02',
    availability_end: '2026-10-06',
    latitude: 12.8406,
    longitude: 80.1534,
    image_url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  // SSN College: Alternative Raspberry Pi
  {
    id: 'res-rpi3-ssn',
    owner_id: 'user-vikram-vit',
    institution_id: 'inst-ssn-chennai',
    title: 'Raspberry Pi 3 Model B+ with Sensor Hat',
    description: 'Pre-flashed Raspberry Pi OS with Sense HAT for environmental telemetry and IoT coursework.',
    category: 'Kits & Boards',
    brand: 'Raspberry Pi',
    condition: 'Excellent',
    price: 750,
    exchange_type: 'LEND',
    availability_start: '2026-10-02',
    availability_end: '2026-10-08',
    latitude: 12.7509,
    longitude: 80.1970,
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  // IIT Madras: Another alternative Raspberry Pi
  {
    id: 'res-rpi4-iitm',
    owner_id: 'user-ananya-iitm',
    institution_id: 'inst-iit-madras',
    title: 'Raspberry Pi 4 (8GB) with Google Coral AI Accelerator',
    description: 'High-RAM single-board computer with Coral edge TPU for real-time edge machine learning inference.',
    category: 'Kits & Boards',
    brand: 'Raspberry Pi Foundation',
    condition: 'Like New',
    price: 1100,
    exchange_type: 'LEND',
    availability_start: '2026-10-01',
    availability_end: '2026-10-15',
    latitude: 12.9915,
    longitude: 80.2337,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  // SRMIST Local Resources (Notice: No Raspberry Pi, forcing agent to intelligently expand to nearby VIT Chennai!)
  {
    id: 'res-casio-srm',
    owner_id: 'user-aarav-srm',
    institution_id: 'inst-srm-ktr',
    title: 'Casio FX-991ES Plus Scientific Calculator',
    description: '417 functions with natural textbook display. Approved for university semester mathematics and electrical circuits exams.',
    category: 'Calculators',
    brand: 'Casio',
    condition: 'Good',
    price: 450,
    exchange_type: 'SELL',
    availability_start: '2026-10-01',
    availability_end: '2026-10-30',
    latitude: 12.8230,
    longitude: 80.0444,
    image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'res-clrs-srm',
    owner_id: 'user-aarav-srm',
    institution_id: 'inst-srm-ktr',
    title: 'CLRS — Introduction to Algorithms (3rd Edition)',
    description: 'The standard algorithms bible. Clean interior pages with dynamic programming bookmarks intact.',
    category: 'Textbooks',
    brand: 'MIT Press',
    condition: 'Good',
    price: 350,
    exchange_type: 'LEND',
    availability_start: '2026-10-01',
    availability_end: '2026-10-25',
    latitude: 12.8230,
    longitude: 80.0444,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'res-ard-srm',
    owner_id: 'user-aarav-srm',
    institution_id: 'inst-srm-ktr',
    title: 'Arduino Uno R3 Starter Kit with 37 Sensors',
    description: 'Includes micro-servo, breadboard, LCD 1602 I2C module, ultrasonic distance sensors, and jumper wires.',
    category: 'Kits & Boards',
    brand: 'Arduino',
    condition: 'Excellent',
    price: 600,
    exchange_type: 'EXCHANGE',
    availability_start: '2026-10-01',
    availability_end: '2026-10-20',
    latitude: 12.8230,
    longitude: 80.0444,
    image_url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'res-coat-srm',
    owner_id: 'user-aarav-srm',
    institution_id: 'inst-srm-ktr',
    title: 'Chemistry Lab Coat (Size L) & Safety Goggles',
    description: '100% white cotton standard lab coat with splash-resistant goggles, mandatory for organic chemistry practicals.',
    category: 'Lab Equipment',
    condition: 'Good',
    price: 180,
    exchange_type: 'SELL',
    availability_start: '2026-10-01',
    availability_end: '2026-11-30',
    latitude: 12.8230,
    longitude: 80.0444,
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  // VIT Chennai: Other realistic resources
  {
    id: 'res-cam-vit',
    owner_id: 'user-vikram-vit',
    institution_id: 'inst-vit-chennai',
    title: 'Sony Alpha A6400 Mirrorless Camera Body',
    description: '4K recording, 24.2 MP APS-C sensor. Available for weekend cultural fest or campus documentary filming.',
    category: 'Electronics',
    brand: 'Sony',
    condition: 'Like New',
    price: 1500,
    exchange_type: 'LEND',
    availability_start: '2026-10-02',
    availability_end: '2026-10-05',
    latitude: 12.8406,
    longitude: 80.1534,
    image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    status: 'ACTIVE',
    is_demo: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

class RexDatabase {
  private resources: Resource[] = [];
  private institutions: Institution[] = AISHE_INSTITUTIONS;
  private profiles: Profile[] = DEMO_PROFILES;
  private exchangeRequests: ExchangeRequest[] = [];
  private currentUserId: string = 'user-aarav-srm'; // Default to Demo Student A at SRM
  private subscribers: Array<(event: RealtimePayload) => void> = [];

  constructor() {
    this.loadFromStorage();
    this.initRealtimeListener();
  }

  private loadFromStorage() {
    try {
      const storedRes = localStorage.getItem('rex_resources_db');
      if (storedRes) {
        this.resources = JSON.parse(storedRes);
      } else {
        this.resources = [...INITIAL_DEMO_RESOURCES];
        this.saveResources();
      }

      const storedReq = localStorage.getItem('rex_exchanges_db');
      if (storedReq) {
        this.exchangeRequests = JSON.parse(storedReq);
      }

      const storedUser = localStorage.getItem('rex_current_user_id');
      if (storedUser) {
        this.currentUserId = storedUser;
      }
    } catch (e) {
      console.error('Failed to load local DB storage:', e);
      this.resources = [...INITIAL_DEMO_RESOURCES];
    }
  }

  private saveResources() {
    localStorage.setItem('rex_resources_db', JSON.stringify(this.resources));
  }

  private saveExchanges() {
    localStorage.setItem('rex_exchanges_db', JSON.stringify(this.exchangeRequests));
  }

  private initRealtimeListener() {
    if (realtimeChannel) {
      realtimeChannel.onmessage = (event: MessageEvent<RealtimePayload>) => {
        // Sync local storage state on receiving foreign tab message
        this.loadFromStorage();
        this.notifySubscribers(event.data);
      };
    }

    if (supabase) {
      try {
        const sbChannel = supabase.channel('rex-realtime-room');
        sbChannel
          .on('broadcast', { event: 'rex_sync' }, ({ payload }) => {
            this.loadFromStorage();
            this.notifySubscribers(payload);
          })
          .subscribe();
      } catch (err) {
        console.warn('Supabase Realtime subscription note:', err);
      }
    }
  }

  public subscribeRealtime(callback: (event: RealtimePayload) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notifySubscribers(event: RealtimePayload) {
    this.subscribers.forEach(cb => {
      try { cb(event); } catch (e) { console.error('Error in subscriber:', e); }
    });
  }

  private broadcast(type: RealtimeEventType, payload: any) {
    const event: RealtimePayload = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    if (realtimeChannel) {
      realtimeChannel.postMessage(event);
    }
    if (supabase) {
      try {
        supabase.channel('rex-realtime-room').send({
          type: 'broadcast',
          event: 'rex_sync',
          payload: event
        });
      } catch (e) {}
    }
    this.notifySubscribers(event);
  }

  // Seeding
  public seedDemoDataset() {
    this.resources = [...INITIAL_DEMO_RESOURCES];
    this.saveResources();
    this.broadcast('RESOURCE_CREATED', { message: 'Demo dataset initialized' });
  }

  // Current User / Auth
  public getCurrentUser(): Profile {
    return this.profiles.find(p => p.id === this.currentUserId) || this.profiles[0];
  }

  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    localStorage.setItem('rex_current_user_id', userId);
    this.broadcast('USER_SWITCHED', { userId });
  }

  public getAllProfiles(): Profile[] {
    return this.profiles;
  }

  // Institutions
  public getInstitutions(): Institution[] {
    return this.institutions;
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.institutions.find(i => i.id === id);
  }

  // Resources
  public getResources(filter?: {
    category?: string;
    institution_id?: string;
    status?: string;
    exchange_type?: string;
  }): Resource[] {
    return this.resources.filter(r => {
      if (filter?.category && filter.category !== 'All' && r.category !== filter.category) return false;
      if (filter?.institution_id && r.institution_id !== filter.institution_id) return false;
      if (filter?.status && r.status !== filter.status) return false;
      if (filter?.exchange_type && filter.exchange_type !== 'All' && r.exchange_type !== filter.exchange_type) return false;
      return true;
    });
  }

  public getResourceById(id: string): Resource | undefined {
    return this.resources.find(r => r.id === id);
  }

  public createResource(data: Omit<Resource, 'id' | 'created_at' | 'status' | 'is_demo'>): Resource {
    const newRes: Resource = {
      ...data,
      id: `res-${Date.now()}`,
      status: 'ACTIVE',
      is_demo: false, // User created!
      created_at: new Date().toISOString()
    };

    this.resources.unshift(newRes);
    this.saveResources();
    this.broadcast('RESOURCE_CREATED', newRes);
    return newRes;
  }

  // Exchanges & Requests
  public getExchangeRequests(): ExchangeRequest[] {
    return this.exchangeRequests;
  }

  public getRequestsForUser(userId: string): { incoming: ExchangeRequest[]; outgoing: ExchangeRequest[] } {
    return {
      incoming: this.exchangeRequests.filter(r => r.owner_id === userId),
      outgoing: this.exchangeRequests.filter(r => r.requester_id === userId)
    };
  }

  public createExchangeRequest(params: {
    resource_id: string;
    requester_id: string;
    offered_price: number;
    requested_duration: string;
  }): ExchangeRequest {
    const resource = this.getResourceById(params.resource_id);
    if (!resource) throw new Error('Resource not found');

    const newReq: ExchangeRequest = {
      id: `exc-${Date.now()}`,
      resource_id: params.resource_id,
      requester_id: params.requester_id,
      owner_id: resource.owner_id,
      offered_price: params.offered_price,
      requested_duration: params.requested_duration,
      status: 'PENDING',
      requester_confirmed: false,
      owner_confirmed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.exchangeRequests.unshift(newReq);
    this.saveExchanges();
    this.broadcast('NEW_EXCHANGE_REQUEST', newReq);
    return newReq;
  }

  public acceptOffer(requestId: string): ExchangeRequest {
    const req = this.exchangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = 'ACCEPTED';
    req.updated_at = new Date().toISOString();

    // Assign safe meetup location between institutions
    const resource = this.getResourceById(req.resource_id);
    if (resource) {
      const locations = MEETUP_LOCATIONS[resource.institution_id] || ['Central Campus Library Foyer'];
      req.meetup_location_name = locations[0];
      req.meetup_time = '5:30 PM (Handover Window)';
    }

    this.saveExchanges();
    this.broadcast('OFFER_ACCEPTED', req);
    return req;
  }

  public counterOffer(requestId: string, counterPrice: number): ExchangeRequest {
    const req = this.exchangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = 'COUNTERED';
    req.counter_price = counterPrice;
    req.updated_at = new Date().toISOString();

    this.saveExchanges();
    this.broadcast('OFFER_COUNTERED', req);
    return req;
  }

  public acceptCounterOffer(requestId: string): ExchangeRequest {
    const req = this.exchangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = 'ACCEPTED';
    if (req.counter_price) {
      req.offered_price = req.counter_price;
    }
    req.requester_confirmed = true;
    req.updated_at = new Date().toISOString();

    const resource = this.getResourceById(req.resource_id);
    if (resource) {
      const locations = MEETUP_LOCATIONS[resource.institution_id] || ['Central Campus Library Foyer'];
      req.meetup_location_name = locations[0];
      req.meetup_time = '5:30 PM (Handover Window)';
    }

    this.saveExchanges();
    this.broadcast('OFFER_ACCEPTED', req);
    return req;
  }

  public declineOffer(requestId: string): ExchangeRequest {
    const req = this.exchangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    req.status = 'DECLINED';
    req.updated_at = new Date().toISOString();

    this.saveExchanges();
    this.broadcast('OFFER_DECLINED', req);
    return req;
  }

  public confirmMeetup(requestId: string, userId: string): ExchangeRequest {
    const req = this.exchangeRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Request not found');

    if (userId === req.requester_id) req.requester_confirmed = true;
    if (userId === req.owner_id) req.owner_confirmed = true;

    if (req.requester_confirmed && req.owner_confirmed) {
      req.status = 'MEETUP_CONFIRMED';
      // Mark resource as reserved
      const res = this.getResourceById(req.resource_id);
      if (res) {
        res.status = 'RESERVED';
        this.saveResources();
      }
    }

    req.updated_at = new Date().toISOString();
    this.saveExchanges();
    this.broadcast('MEETUP_CONFIRMED', req);
    return req;
  }

  public getMeetupSpots(institutionId: string): string[] {
    return MEETUP_LOCATIONS[institutionId] || ['Central Campus Library Foyer (CCTV Monitored)'];
  }
}

export const db = new RexDatabase();
