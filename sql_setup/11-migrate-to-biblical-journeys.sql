-- =====================================================
-- 11-migrate-to-biblical-journeys.sql
-- Migrate from missionary_journeys to biblical_journeys
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create new tables with better naming
CREATE TABLE biblical_journeys (
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

CREATE TABLE journey_waypoints (
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

-- Create indexes
CREATE INDEX idx_biblical_journeys_testament ON biblical_journeys(testament);
CREATE INDEX idx_biblical_journeys_type ON biblical_journeys(journey_type);
CREATE INDEX idx_biblical_journeys_order ON biblical_journeys(journey_order);
CREATE INDEX idx_journey_waypoints_journey ON journey_waypoints(journey_id);
CREATE INDEX idx_journey_waypoints_position ON journey_waypoints(journey_id, position);

-- Migrate data from old tables
INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
SELECT 
    name,
    CASE 
        WHEN name LIKE '%Paul%' OR name = 'Ministry of Jesus' THEN 'New Testament'
        ELSE 'Old Testament'
    END as testament,
    CASE 
        WHEN name LIKE '%Paul%' THEN 'missionary'
        WHEN name = 'Ministry of Jesus' THEN 'ministry'
        WHEN name = 'Wilderness Wanderings' THEN 'exodus'
        WHEN name = 'Timeline of Kingdoms' THEN 'timeline'
        ELSE 'other'
    END as journey_type,
    CASE 
        WHEN name = 'Wilderness Wanderings' THEN 1
        WHEN name = 'Timeline of Kingdoms' THEN 2
        WHEN name = 'Ministry of Jesus' THEN 3
        WHEN name = 'Paul''s First Missionary Journey' THEN 4
        WHEN name = 'Paul''s Second Missionary Journey' THEN 5
        WHEN name = 'Paul''s Third Missionary Journey' THEN 6
        ELSE 99
    END as journey_order,
    start_year,
    end_year,
    scripture_refs,
    CASE
        WHEN name = 'Wilderness Wanderings' THEN 'The 40-year journey of the Israelites from Egypt to the Promised Land'
        WHEN name = 'Paul''s First Missionary Journey' THEN 'Paul and Barnabas spread the Gospel through Cyprus and Asia Minor'
        WHEN name = 'Paul''s Second Missionary Journey' THEN 'Paul''s journey through Asia Minor and into Europe, establishing churches'
        WHEN name = 'Paul''s Third Missionary Journey' THEN 'Paul''s extended ministry in Ephesus and final journey to Jerusalem'
        WHEN name = 'Ministry of Jesus' THEN 'The earthly ministry of Jesus Christ from birth to resurrection'
        WHEN name = 'Timeline of Kingdoms' THEN 'Major empires and kingdoms throughout biblical history'
        ELSE NULL
    END as description,
    CASE
        WHEN name LIKE '%Paul%' THEN '#4169E1'
        WHEN name = 'Ministry of Jesus' THEN '#FFD700'
        WHEN name = 'Wilderness Wanderings' THEN '#8B4513'
        WHEN name = 'Timeline of Kingdoms' THEN '#800080'
        ELSE '#666666'
    END as color
FROM missionary_journeys;

-- Migrate waypoint data
INSERT INTO journey_waypoints (journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
SELECT 
    j2.journey_id,
    mjc.position,
    (mjc.data->>'name')::VARCHAR(100) as location_name,
    (mjc.data->>'modern')::VARCHAR(100) as modern_name,
    ((mjc.data->'position'->1)::TEXT)::DECIMAL(10, 6) as latitude,
    ((mjc.data->'position'->0)::TEXT)::DECIMAL(10, 6) as longitude,
    (mjc.data->>'description')::TEXT as description,
    CASE 
        WHEN mjc.data ? 'events' THEN 
            jsonb_build_object('events', mjc.data->'events')
        ELSE NULL
    END as events,
    (mjc.data->>'distance')::INTEGER as distance_from_start
FROM missionary_journey_cities mjc
JOIN missionary_journeys j1 ON mjc.journey_id = j1.journey_id
JOIN biblical_journeys j2 ON j1.name = j2.name;

-- Add update trigger
CREATE TRIGGER update_biblical_journeys_updated_at BEFORE UPDATE ON biblical_journeys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop old tables (comment out if you want to keep them as backup)
DROP TABLE missionary_journey_cities;
DROP TABLE missionary_journeys;

-- Verify migration
SELECT 
    'Biblical Journeys:' as item,
    COUNT(*) as count 
FROM biblical_journeys
UNION ALL
SELECT 
    'Journey Waypoints:' as item,
    COUNT(*) as count 
FROM journey_waypoints;