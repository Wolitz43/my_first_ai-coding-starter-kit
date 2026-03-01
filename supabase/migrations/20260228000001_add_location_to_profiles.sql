-- PROJ-2: Add location fields to profiles table
-- Applied: 2026-02-28

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_radius_km integer DEFAULT 10;

-- RLS policies on profiles (verified 2026-03-01):
-- SELECT: "Authenticated users can read all profiles"  → qual: true
-- INSERT: "Service can insert profiles"                → with_check: true (used by auth trigger)
-- UPDATE: "Users can update own profile"               → qual/with_check: auth.uid() = id
