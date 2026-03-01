-- PROJ-2: Add CHECK constraints to validate location data ranges
-- Applied: 2026-03-01

-- Valid coordinate ranges
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_location_lat_range
    CHECK (location_lat IS NULL OR (location_lat >= -90 AND location_lat <= 90));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_location_lng_range
    CHECK (location_lng IS NULL OR (location_lng >= -180 AND location_lng <= 180));

-- Valid radius: must be positive and at most 1000 km
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_location_radius_range
    CHECK (location_radius_km IS NULL OR (location_radius_km > 0 AND location_radius_km <= 1000));
