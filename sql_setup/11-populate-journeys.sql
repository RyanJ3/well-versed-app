-- =====================================================
-- 11-populate-journeys.sql
-- Biblical journey data
-- =====================================================
SET search_path TO wellversed01DEV;

-- Insert biblical journeys
INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color) VALUES
('Wilderness Wanderings', 'Old Testament', 'exodus', 1, -1446, -1406, 'Exodus–Deuteronomy', 'The 40-year journey of the Israelites from Egypt to the Promised Land', '#8B4513'),
('Ministry of Jesus', 'New Testament', 'ministry', 2, 27, 30, 'Gospels', 'The earthly ministry of Jesus Christ from birth to resurrection', '#FFD700'),
('Paul''s First Missionary Journey', 'New Testament', 'missionary', 3, 46, 48, 'Acts 13-14', 'Paul and Barnabas spread the Gospel through Cyprus and Asia Minor', '#4169E1'),
('Paul''s Second Missionary Journey', 'New Testament', 'missionary', 4, 49, 52, 'Acts 15:36-18:22', 'Paul''s journey through Asia Minor and into Europe, establishing churches', '#4169E1'),
('Paul''s Third Missionary Journey', 'New Testament', 'missionary', 5, 53, 57, 'Acts 18:23-21:17', 'Paul''s extended ministry in Ephesus and final journey to Jerusalem', '#4169E1')
ON CONFLICT DO NOTHING;

-- Insert waypoints for Paul's First Missionary Journey (sample data)
WITH journey AS (
    SELECT journey_id FROM biblical_journeys WHERE name = 'Paul''s First Missionary Journey' LIMIT 1
)
INSERT INTO journey_waypoints (journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
SELECT 
    j.journey_id,
    position,
    location_name,
    modern_name,
    latitude,
    longitude,
    description,
    events::jsonb,
    distance_from_start
FROM journey j,
(VALUES
    (1, 'Antioch (Syria)', 'Antakya, Turkey', 36.2, 36.16, 'Starting point where Paul and Barnabas were commissioned', 
     '{"events": ["Church fasted and prayed", "Holy Spirit commissioned Paul and Barnabas", "First organized missionary expedition"]}', 0),
    (2, 'Seleucia', 'Port of Antioch', 36.12, 35.93, 'Port city where they set sail for Cyprus', 
     '{"events": ["Departed by ship to Cyprus"]}', 16),
    (3, 'Salamis', 'Near Famagusta, Cyprus', 35.18, 33.9, 'First evangelistic stop in Cyprus', 
     '{"events": ["Proclaimed in Jewish synagogues", "John Mark served as assistant"]}', 196),
    (4, 'Paphos', 'Paphos, Cyprus', 34.77, 32.42, 'Capital of Cyprus, encounter with proconsul', 
     '{"events": ["Met Bar-Jesus the sorcerer", "Proconsul Sergius Paulus believed", "Paul struck Elymas blind"]}', 286),
    (5, 'Perga', 'Near Antalya, Turkey', 36.89, 30.85, 'First mainland stop in Asia Minor', 
     '{"events": ["John Mark departed to Jerusalem"]}', 461),
    (6, 'Pisidian Antioch', 'Yalvaç, Turkey', 38.3, 31.2, 'Location of Paul''s first recorded sermon', 
     '{"events": ["Paul''s synagogue sermon", "Many Gentiles believed", "Jewish leaders stirred persecution"]}', 561),
    (7, 'Iconium', 'Konya, Turkey', 37.87, 32.49, 'Major city with divided response', 
     '{"events": ["Great number believed", "City divided", "Fled from stoning attempt"]}', 651),
    (8, 'Lystra', 'Near Hatunsaray, Turkey', 37.58, 32.45, 'City where Paul was stoned', 
     '{"events": ["Healed lame man", "Mistaken for gods", "Paul stoned and left for dead"]}', 671),
    (9, 'Derbe', 'Near Karaman, Turkey', 37.35, 33.25, 'Easternmost point of journey', 
     '{"events": ["Made many disciples", "No recorded persecution"]}', 731)
) AS waypoints(position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
ON CONFLICT DO NOTHING;

-- Insert waypoints for Ministry of Jesus (sample locations)
WITH journey AS (
    SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus' LIMIT 1
)
INSERT INTO journey_waypoints (journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
SELECT 
    j.journey_id,
    position,
    location_name,
    modern_name,
    latitude,
    longitude,
    description,
    events::jsonb,
    distance_from_start
FROM journey j,
(VALUES
    (1, 'Bethlehem', 'Bethlehem, Israel', 31.7, 35.2, 'Birthplace of Jesus', 
     '{"events": ["Birth of Jesus", "Visit of the Magi"]}', 0),
    (2, 'Nazareth', 'Nazareth, Israel', 32.7, 35.3, 'Childhood home of Jesus', 
     '{"events": ["Childhood and youth", "Rejection in synagogue"]}', 70),
    (3, 'Jordan River', 'Near Jericho', 31.83, 35.5, 'Site of Jesus'' baptism', 
     '{"events": ["Baptism by John", "Voice from heaven"]}', 100),
    (4, 'Capernaum', 'Kfar Nahum, Israel', 32.88, 35.57, 'Base of Galilean ministry', 
     '{"events": ["Many healings", "Called disciples", "Taught in synagogue"]}', 120),
    (5, 'Jerusalem', 'Jerusalem, Israel', 31.78, 35.22, 'Site of crucifixion and resurrection', 
     '{"events": ["Temple cleansing", "Last Supper", "Crucifixion", "Resurrection"]}', 220)
) AS waypoints(position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
ON CONFLICT DO NOTHING;
