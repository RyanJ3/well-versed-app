-- =====================================================
-- 08-create-biblical-journeys.sql
-- Biblical journeys and Scripture atlas features
-- =====================================================
SET search_path TO wellversed01DEV;

-- Biblical journeys table
CREATE TABLE IF NOT EXISTS biblical_journeys (
    journey_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    testament VARCHAR(20) NOT NULL,
    journey_type VARCHAR(50),
    journey_order INTEGER,
    start_year INTEGER,
    end_year INTEGER,
    scripture_refs VARCHAR(200),
    description TEXT,
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Journey waypoints
CREATE TABLE IF NOT EXISTS journey_waypoints (
    waypoint_id SERIAL PRIMARY KEY,
    journey_id INTEGER NOT NULL REFERENCES biblical_journeys(journey_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    modern_name VARCHAR(100),
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    description TEXT,
    events JSONB,
    distance_from_start INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_biblical_journeys_testament ON biblical_journeys(testament);
CREATE INDEX IF NOT EXISTS idx_biblical_journeys_type ON biblical_journeys(journey_type);
CREATE INDEX IF NOT EXISTS idx_biblical_journeys_order ON biblical_journeys(journey_order);
CREATE INDEX IF NOT EXISTS idx_journey_waypoints_journey ON journey_waypoints(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_waypoints_position ON journey_waypoints(journey_id, position);

-- Triggers
DROP TRIGGER IF EXISTS update_biblical_journeys_updated_at ON biblical_journeys;
CREATE TRIGGER update_biblical_journeys_updated_at 
    BEFORE UPDATE ON biblical_journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
