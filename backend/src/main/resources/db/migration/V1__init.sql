CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    location TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_to UUID NULL REFERENCES users(id),
    data JSONB
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_at ON incidents(reported_at);

CREATE TABLE IF NOT EXISTS incident_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    time TIMESTAMPTZ NOT NULL,
    actor VARCHAR(255) NOT NULL,
    text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_timeline_incident ON incident_timeline(incident_id);

CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(64) NOT NULL,
    label VARCHAR(255) NOT NULL,
    zone VARCHAR(64),
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    status VARCHAR(32),
    last_reported_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sensor_timeseries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    time TIMESTAMPTZ NOT NULL,
    data JSONB
);
CREATE INDEX IF NOT EXISTS idx_timeseries_sensor_time ON sensor_timeseries(sensor_id, time);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
