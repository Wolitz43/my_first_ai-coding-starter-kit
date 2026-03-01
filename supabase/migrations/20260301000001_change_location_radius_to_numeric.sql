-- PROJ-2: Change location_radius_km from integer to numeric to support sub-km radii (100m, 250m, 500m)
-- Applied: 2026-03-01

ALTER TABLE public.profiles
  ALTER COLUMN location_radius_km TYPE numeric(6,3) USING location_radius_km::numeric(6,3);

ALTER TABLE public.profiles
  ALTER COLUMN location_radius_km SET DEFAULT 1;
