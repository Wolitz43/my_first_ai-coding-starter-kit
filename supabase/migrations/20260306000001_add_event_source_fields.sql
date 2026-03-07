-- Add source tracking to events table for external imports (Meetup, etc.)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text;

-- Prevent duplicate imports: one external_id per source
ALTER TABLE public.events
  ADD CONSTRAINT events_source_external_id_unique UNIQUE (source, external_id);

-- Index for fast upsert lookups
CREATE INDEX IF NOT EXISTS events_source_external_id_idx
  ON public.events (source, external_id)
  WHERE external_id IS NOT NULL;
