-- Add auto-incrementing human-friendly incident number
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='incidents' AND column_name='incident_number'
    ) THEN
        ALTER TABLE incidents ADD COLUMN incident_number BIGSERIAL;
        CREATE UNIQUE INDEX IF NOT EXISTS ux_incidents_incident_number ON incidents(incident_number);
    END IF;
END $$;