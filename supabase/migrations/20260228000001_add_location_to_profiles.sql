-- PROJ-2: Add location fields to profiles table
-- Applied: 2026-02-28

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_radius_km integer DEFAULT 10;
