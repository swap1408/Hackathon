CREATE TABLE IF NOT EXISTS alert_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(alert_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_alert_reads_user ON alert_reads(user_id);