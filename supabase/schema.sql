-- ==============================================================================
-- BAZAAR-OS Database Schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL Editor to initialize your database
-- ==============================================================================

-- 1. Bazaars Table
CREATE TABLE public.bazaars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    organizer_name TEXT NOT NULL,
    organizer_insta TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed'))
);

-- 2. Zones Table (Pricing tiers)
CREATE TABLE public.zones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bazaar_id UUID REFERENCES public.bazaars(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    price_egp INTEGER NOT NULL,
    UNIQUE(bazaar_id, key)
);

-- 3. Booths Table
CREATE TABLE public.booths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bazaar_id UUID REFERENCES public.bazaars(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES public.zones(id) ON DELETE RESTRICT,
    grid_row INTEGER,
    grid_col INTEGER,
    display_label TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    vendor_name TEXT,
    vendor_insta TEXT,
    vendor_logo TEXT,
    vendor_category TEXT,
    UNIQUE(bazaar_id, display_label)
);

-- 4. Bookings Table (The Money)
CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    bazaar_id UUID REFERENCES public.bazaars(id) ON DELETE CASCADE,
    booth_id UUID REFERENCES public.booths(id) ON DELETE RESTRICT,
    vendor_name TEXT NOT NULL,
    vendor_insta TEXT NOT NULL,
    vendor_phone TEXT NOT NULL,
    vendor_category TEXT NOT NULL,
    amount_egp INTEGER NOT NULL,
    status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'refunded')),
    paymob_order_id TEXT,
    paymob_transaction_id TEXT
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- For now, we allow read access to everyone for the public bazaar page
-- ==============================================================================

ALTER TABLE public.bazaars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active bazaars
CREATE POLICY "Public bazaars are viewable by everyone." 
ON public.bazaars FOR SELECT USING (status = 'published');

-- Allow public read access to zones and booths for published bazaars
CREATE POLICY "Zones are viewable by everyone." 
ON public.zones FOR SELECT USING (true);

CREATE POLICY "Booths are viewable by everyone." 
ON public.booths FOR SELECT USING (true);

-- Bookings should only be insertable publicly (via API) but not readable
CREATE POLICY "Anyone can create a booking request." 
ON public.bookings FOR INSERT WITH CHECK (true);
