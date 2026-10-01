-- 1. institutions
CREATE TABLE public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aishe_code TEXT,
    name TEXT NOT NULL,
    institution_type TEXT,
    state TEXT,
    district TEXT,
    city TEXT,
    address TEXT,
    website TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source TEXT,
    source_updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. profiles (linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    department TEXT,
    year TEXT,
    avatar_url TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. resources
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    brand TEXT,
    condition TEXT,
    price DECIMAL(10,2),
    exchange_type TEXT NOT NULL CHECK (exchange_type IN ('SELL', 'BORROW', 'EXCHANGE', 'FREE')),
    availability_start TIMESTAMP WITH TIME ZONE,
    availability_end TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESERVED', 'EXCHANGED', 'UNAVAILABLE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. exchange_requests
CREATE TABLE public.exchange_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    offer_price DECIMAL(10,2),
    message TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'COUNTERED', 'DECLINED', 'CANCELLED', 'COMPLETED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. exchange_messages
CREATE TABLE public.exchange_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. meetup_locations (Doing this before exchanges because exchanges references it)
CREATE TABLE public.meetup_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. exchanges
CREATE TABLE public.exchanges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_request_id UUID NOT NULL REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    final_price DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'MEETUP_PENDING', 'COMPLETED', 'CANCELLED')),
    meetup_location_id UUID REFERENCES public.meetup_locations(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Automatic Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Automatic updated_at triggers
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

CREATE TRIGGER set_exchange_requests_updated_at
  BEFORE UPDATE ON public.exchange_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_current_timestamp_updated_at();

-- Enable Row Level Security
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Institutions: Authenticated users can read
CREATE POLICY "Institutions are viewable by authenticated users" 
ON public.institutions FOR SELECT 
TO authenticated USING (true);

-- Profiles: Users can view and update their own profile. Other users can view public parts (we will allow viewing all profiles for now to allow resource listing, or maybe just allow viewing all).
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
TO authenticated USING (auth.uid() = id);

-- Resources: Authenticated users can read public resources.
CREATE POLICY "Resources are viewable by authenticated users" 
ON public.resources FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Users can insert their own resources" 
ON public.resources FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own resources" 
ON public.resources FOR UPDATE 
TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own resources" 
ON public.resources FOR DELETE 
TO authenticated USING (auth.uid() = owner_id);

-- Exchange requests: Only resource owner and requester can view/manage
CREATE POLICY "Users can view exchange requests they are involved in" 
ON public.exchange_requests FOR SELECT 
TO authenticated USING (auth.uid() = requester_id OR auth.uid() IN (SELECT owner_id FROM public.resources WHERE id = resource_id));

CREATE POLICY "Requesters can insert exchange requests" 
ON public.exchange_requests FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Involved users can update exchange requests" 
ON public.exchange_requests FOR UPDATE 
TO authenticated USING (auth.uid() = requester_id OR auth.uid() IN (SELECT owner_id FROM public.resources WHERE id = resource_id));

-- Exchange messages: Only involved users can read/insert
CREATE POLICY "Users can view exchange messages for their requests" 
ON public.exchange_messages FOR SELECT 
TO authenticated USING (
    auth.uid() IN (
        SELECT requester_id FROM public.exchange_requests WHERE id = exchange_request_id
        UNION
        SELECT r.owner_id FROM public.exchange_requests er JOIN public.resources r ON er.resource_id = r.id WHERE er.id = exchange_request_id
    )
);

CREATE POLICY "Involved users can insert exchange messages" 
ON public.exchange_messages FOR INSERT 
TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
        SELECT requester_id FROM public.exchange_requests WHERE id = exchange_request_id
        UNION
        SELECT r.owner_id FROM public.exchange_requests er JOIN public.resources r ON er.resource_id = r.id WHERE er.id = exchange_request_id
    )
);

-- Exchanges: Only involved users can access
CREATE POLICY "Users can view their exchanges" 
ON public.exchanges FOR SELECT 
TO authenticated USING (auth.uid() = owner_id OR auth.uid() = requester_id);

CREATE POLICY "Users can update their exchanges" 
ON public.exchanges FOR UPDATE 
TO authenticated USING (auth.uid() = owner_id OR auth.uid() = requester_id);

-- Meetup locations: viewable by all authenticated
CREATE POLICY "Meetup locations viewable by authenticated users" 
ON public.meetup_locations FOR SELECT 
TO authenticated USING (true);
