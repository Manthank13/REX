-- REX — Bharat Agentic 2026 Supabase Schema
-- Run this in your Supabase SQL Editor if connecting a remote database.

-- 1. Institutions (AISHE Government of India directory)
CREATE TABLE IF NOT EXISTS public.institutions (
  id TEXT PRIMARY KEY,
  aishe_code TEXT NOT NULL,
  name TEXT NOT NULL,
  institution_type TEXT,
  state TEXT,
  district TEXT,
  city TEXT,
  address TEXT,
  website TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  source TEXT DEFAULT 'AISHE / Open Government Data',
  source_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles (Students verified by institutional email)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  institution_id TEXT REFERENCES public.institutions(id),
  department TEXT,
  year TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT TRUE,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Resources (Student-owned listings)
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.profiles(id),
  institution_id TEXT REFERENCES public.institutions(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  brand TEXT,
  condition TEXT NOT NULL,
  price NUMERIC NOT NULL,
  exchange_type TEXT NOT NULL,
  availability_start DATE,
  availability_end DATE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Exchange Requests (Autonomous negotiation & state)
CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id TEXT PRIMARY KEY,
  resource_id TEXT REFERENCES public.resources(id),
  requester_id TEXT REFERENCES public.profiles(id),
  owner_id TEXT REFERENCES public.profiles(id),
  offered_price NUMERIC NOT NULL,
  requested_duration TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  counter_price NUMERIC,
  meetup_location_name TEXT,
  meetup_time TEXT,
  requester_confirmed BOOLEAN DEFAULT FALSE,
  owner_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime replication for exchange_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
