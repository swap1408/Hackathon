-- Add reporter_id to incidents and backfill from JSON if available
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS reporter_id UUID NULL REFERENCES users(id);

-- Optional: backfill from data JSON if present (PostgreSQL-specific)
UPDATE incidents
SET reporter_id = NULLIF((data->>'user_id'), '')::uuid
WHERE reporter_id IS NULL
  AND data IS NOT NULL
  AND jsonb_typeof(data) = 'object'
  AND (data ? 'user_id');

-- Index to speed up queries by reporter
CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
