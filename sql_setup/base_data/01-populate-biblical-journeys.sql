-- =====================================================
-- 01-populate-biblical-journeys.sql
-- Base biblical journey data (not test data)
-- =====================================================
SET search_path TO wellversed01DEV;

-- Clear existing journey data
TRUNCATE TABLE journey_waypoints CASCADE;
TRUNCATE TABLE biblical_journeys CASCADE;

-- Insert biblical journeys

INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
VALUES ('Paul First Missionary Journey', 'New Testament', 'missionary', 4, 
        46, 48, 'Acts 13-14', 
        'Paul and Barnabas spread the Gospel through Cyprus and Asia Minor', '#4169E1');

INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
VALUES ('Paul Second Missionary Journey', 'New Testament', 'missionary', 5, 
        49, 52, 'Acts 15:36-18:22', 
        'Paul's journey through Asia Minor and into Europe, establishing churches', '#32CD32');

INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
VALUES ('Paul's Third Missionary Journey', 'New Testament', 'missionary', 6, 
        53, 57, 'Acts 18:23-21:17', 
        'Paul's extended ministry in Ephesus and final journey to Jerusalem', '#FF6347');

INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
VALUES ('Wilderness Wanderings', 'Old Testament', 'exodus', 1, 
        -1446, -1406, 'Exodus–Deuteronomy', 
        'The 40-year journey of the Israelites from Egypt to the Promised Land', '#8B4513');

INSERT INTO biblical_journeys (name, testament, journey_type, journey_order, start_year, end_year, scripture_refs, description, color)
VALUES ('Ministry of Jesus', 'New Testament', 'ministry', 3, 
        27, 30, 'Gospels', 
        'The earthly ministry of Jesus Christ from birth to resurrection', '#FFD700');

-- Insert waypoints for each journey

-- Waypoints for Paul's First Missionary Journey
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    1, 'Antioch (Syria)', 
    'Antakya, Turkey',
    36.2, 36.16, 
    'The starting point where Paul and Barnabas were commissioned by the church for their groundbreaking missionary journey.',
    '{"events": [{"title": "Commissioned by the Church", "description": "The Holy Spirit called Paul and Barnabas to missionary work while the church was worshiping and fasting.", "scriptures": ["Acts 13:1-3"]}]}'::jsonb,
    0
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    2, 'Seleucia', 
    'Port of Antioch',
    36.12, 35.93, 
    'The port city where they set sail for Cyprus, marking the beginning of their sea voyage.',
    NULL,
    16
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    3, 'Salamis', 
    'Near Famagusta, Cyprus',
    35.18, 33.9, 
    'First evangelistic stop where they proclaimed the word in Jewish synagogues.',
    '{"events": [{"title": "Preaching in Synagogues", "description": "Paul and Barnabas proclaimed the word of God in the Jewish synagogues with John Mark as their assistant.", "scriptures": ["Acts 13:5"]}]}'::jsonb,
    196
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    4, 'Paphos', 
    'Paphos, Cyprus',
    34.77, 32.42, 
    'Capital of Cyprus where they encountered both spiritual opposition and high-level conversion.',
    '{"events": [{"title": "Confronting Bar-Jesus", "description": "Paul struck the sorcerer Elymas blind, leading to Proconsul Sergius Paulus believing in the Lord.", "scriptures": ["Acts 13:6-12"], "visualEffect": "miracle"}]}'::jsonb,
    286
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    5, 'Perga', 
    'Near Antalya, Turkey',
    36.89, 30.85, 
    'First mainland stop in Asia Minor where John Mark departed from the team.',
    '{"events": [{"title": "John Mark Departs", "description": "John Mark left the missionary team and returned to Jerusalem.", "scriptures": ["Acts 13:13"]}]}'::jsonb,
    461
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    6, 'Pisidian Antioch', 
    'Yalvaç, Turkey',
    38.3, 31.2, 
    'Location of Paul''s first recorded sermon and the beginning of deliberate Gentile outreach.',
    '{"events": [{"title": "Paul's Synagogue Sermon", "description": "Paul delivered a powerful sermon tracing Israel's history to Jesus Christ.", "scriptures": ["Acts 13:16-41"]}, {"title": "Turning to the Gentiles", "description": "When the Jews rejected the message, Paul and Barnabas declared they would turn to the Gentiles.", "scriptures": ["Acts 13:46-48"]}]}'::jsonb,
    561
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    7, 'Iconium', 
    'Konya, Turkey',
    37.87, 32.49, 
    'Major city where they spent considerable time despite growing opposition.',
    '{"events": [{"title": "City Divided", "description": "The city was divided between those who sided with the Jews and those with the apostles.", "scriptures": ["Acts 14:1-7"]}]}'::jsonb,
    651
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    8, 'Lystra', 
    'Near Hatunsaray, Turkey',
    37.58, 32.45, 
    'City where Paul healed a lame man, was worshipped as a god, then nearly killed.',
    '{"events": [{"title": "Healing the Lame Man", "description": "Paul healed a man lame from birth, leading the crowd to think they were gods.", "scriptures": ["Acts 14:8-10"], "visualEffect": "miracle"}, {"title": "Stoned and Left for Dead", "description": "Jews from Antioch and Iconium turned the crowd against Paul, who was stoned and left for dead.", "scriptures": ["Acts 14:19-20"], "visualEffect": "conflict"}]}'::jsonb,
    671
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's First Missionary Journey'),
    9, 'Derbe', 
    'Near Karaman, Turkey',
    37.35, 33.25, 
    'Easternmost point where they made many disciples before beginning the return journey.',
    '{"events": [{"title": "Making Disciples", "description": "They preached the gospel and made many disciples without recorded opposition.", "scriptures": ["Acts 14:20-21"]}]}'::jsonb,
    731
);

-- Waypoints for Paul's Second Missionary Journey
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    1, 'Antioch (Syria)', 
    'Antakya, Turkey',
    36.2, 36.16, 
    'Starting point of the second journey after disagreement with Barnabas.',
    '{"events": [{"title": "Paul and Silas Depart", "description": "After disagreeing about John Mark, Paul chose Silas and departed.", "scriptures": ["Acts 15:36-40"]}]}'::jsonb,
    0
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    2, 'Derbe', 
    'Near Karaman, Turkey',
    37.35, 33.25, 
    'First stop to strengthen the churches from the first journey.',
    NULL,
    250
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    3, 'Lystra', 
    'Near Hatunsaray, Turkey',
    37.58, 32.45, 
    'Where Paul met Timothy and invited him to join the mission.',
    '{"events": [{"title": "Timothy Joins the Team", "description": "Paul met Timothy, a disciple well spoken of by the believers.", "scriptures": ["Acts 16:1-3"]}]}'::jsonb,
    290
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    4, 'Troas', 
    'Dalyan, Turkey',
    39.78, 26.58, 
    'Port city where Paul received the Macedonian vision.',
    '{"events": [{"title": "The Macedonian Call", "description": "Paul saw a vision of a man from Macedonia begging for help.", "scriptures": ["Acts 16:9-10"], "visualEffect": "divine-light"}]}'::jsonb,
    800
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    5, 'Philippi', 
    'Philippi, Greece',
    41.0, 24.0, 
    'First European city evangelized, where Lydia was converted.',
    '{"events": [{"title": "Lydia's Conversion", "description": "The Lord opened the heart of Lydia, a dealer in purple cloth.", "scriptures": ["Acts 16:14-15"]}, {"title": "Paul and Silas Imprisoned", "description": "After casting out a spirit, they were beaten and imprisoned.", "scriptures": ["Acts 16:16-24"], "visualEffect": "conflict"}, {"title": "Earthquake Frees Prisoners", "description": "An earthquake opened the prison doors, leading to the jailer's conversion.", "scriptures": ["Acts 16:25-34"], "visualEffect": "earthquake"}]}'::jsonb,
    950
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    6, 'Thessalonica', 
    'Thessaloniki, Greece',
    40.64, 22.94, 
    'Major city where Paul reasoned in the synagogue for three Sabbaths.',
    '{"events": [{"title": "Reasoning from Scripture", "description": "Paul explained that Christ had to suffer and rise from the dead.", "scriptures": ["Acts 17:1-3"]}, {"title": "Jason Attacked", "description": "A mob attacked Jason's house looking for Paul and Silas.", "scriptures": ["Acts 17:5-9"], "visualEffect": "conflict"}]}'::jsonb,
    1100
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    7, 'Berea', 
    'Veroia, Greece',
    40.53, 22.2, 
    'Where the noble Bereans examined the Scriptures daily.',
    '{"events": [{"title": "Noble Bereans", "description": "The Bereans received the message eagerly and examined the Scriptures daily.", "scriptures": ["Acts 17:10-12"]}]}'::jsonb,
    1150
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    8, 'Athens', 
    'Athens, Greece',
    37.98, 23.72, 
    'Center of Greek philosophy where Paul preached at the Areopagus.',
    '{"events": [{"title": "Sermon at the Areopagus", "description": "Paul preached about the \"Unknown God\" to the philosophers.", "scriptures": ["Acts 17:22-31"], "visualEffect": "teaching"}]}'::jsonb,
    1400
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    9, 'Corinth', 
    'Corinth, Greece',
    37.94, 22.93, 
    'Where Paul stayed 18 months and established a strong church.',
    '{"events": [{"title": "Meeting Aquila and Priscilla", "description": "Paul stayed with fellow tentmakers expelled from Rome.", "scriptures": ["Acts 18:1-3"]}, {"title": "Vision of Encouragement", "description": "The Lord told Paul in a vision not to be afraid but to keep speaking.", "scriptures": ["Acts 18:9-10"], "visualEffect": "divine-light"}]}'::jsonb,
    1460
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    10, 'Ephesus', 
    'Selçuk, Turkey',
    37.94, 27.34, 
    'Brief stop before returning to Jerusalem.',
    NULL,
    1710
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Second Missionary Journey'),
    11, 'Jerusalem', 
    'Jerusalem, Israel',
    31.78, 35.22, 
    'Paul greeted the church and reported on his journey.',
    '{"events": [{"title": "Reporting to the Church", "description": "Paul greeted the church and went up to Jerusalem.", "scriptures": ["Acts 18:22"]}]}'::jsonb,
    2100
);

-- Waypoints for Paul's Third Missionary Journey
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    1, 'Antioch (Syria)', 
    'Antakya, Turkey',
    36.2, 36.16, 
    'Starting point of the third journey.',
    NULL,
    0
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    2, 'Galatia and Phrygia', 
    'Central Turkey',
    38.5, 32.0, 
    'Strengthening all the disciples in the region.',
    '{"events": [{"title": "Strengthening Disciples", "description": "Paul traveled throughout the region strengthening the disciples.", "scriptures": ["Acts 18:23"]}]}'::jsonb,
    400
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    3, 'Ephesus', 
    'Selçuk, Turkey',
    37.94, 27.34, 
    'Where Paul spent over two years in extensive ministry.',
    '{"events": [{"title": "Baptism in the Holy Spirit", "description": "Paul laid hands on disciples who then received the Holy Spirit.", "scriptures": ["Acts 19:1-7"], "visualEffect": "divine-light"}, {"title": "School of Tyrannus", "description": "Paul taught daily for two years, reaching all of Asia.", "scriptures": ["Acts 19:8-10"], "visualEffect": "teaching"}, {"title": "Extraordinary Miracles", "description": "Even handkerchiefs touched by Paul healed the sick.", "scriptures": ["Acts 19:11-12"], "visualEffect": "miracle"}, {"title": "Riot of the Silversmiths", "description": "Demetrius stirred up a riot against Paul for hurting idol business.", "scriptures": ["Acts 19:23-41"], "visualEffect": "conflict"}]}'::jsonb,
    700
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    4, 'Macedonia', 
    'Northern Greece',
    40.5, 23.0, 
    'Paul traveled through Macedonia encouraging the churches.',
    NULL,
    1000
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    5, 'Greece (Achaia)', 
    'Southern Greece',
    38.0, 23.0, 
    'Three months in Greece, likely in Corinth.',
    '{"events": [{"title": "Plot Against Paul", "description": "Jews plotted against Paul as he was about to sail for Syria.", "scriptures": ["Acts 20:3"]}]}'::jsonb,
    1200
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    6, 'Troas', 
    'Dalyan, Turkey',
    39.78, 26.58, 
    'Where Eutychus fell from the window and was raised.',
    '{"events": [{"title": "Eutychus Raised from Death", "description": "Young Eutychus fell from a window during Paul's long sermon and was raised.", "scriptures": ["Acts 20:7-12"], "visualEffect": "miracle"}]}'::jsonb,
    1500
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    7, 'Miletus', 
    'Milet, Turkey',
    37.53, 27.28, 
    'Where Paul gave his farewell to the Ephesian elders.',
    '{"events": [{"title": "Farewell to Ephesian Elders", "description": "Paul gave an emotional farewell, warning of future wolves.", "scriptures": ["Acts 20:17-38"], "visualEffect": "teaching"}]}'::jsonb,
    1700
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    8, 'Tyre', 
    'Tyre, Lebanon',
    33.27, 35.2, 
    'Disciples urged Paul not to go to Jerusalem.',
    '{"events": [{"title": "Warning Not to Go", "description": "Through the Spirit, disciples urged Paul not to go to Jerusalem.", "scriptures": ["Acts 21:4"]}]}'::jsonb,
    2000
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    9, 'Caesarea', 
    'Caesarea Maritima, Israel',
    32.5, 34.75, 
    'Where Agabus prophesied Paul''s arrest.',
    '{"events": [{"title": "Agabus's Prophecy", "description": "Agabus bound his own hands and feet with Paul's belt as a prophecy.", "scriptures": ["Acts 21:10-11"], "visualEffect": "divine-light"}]}'::jsonb,
    2050
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Paul's Third Missionary Journey'),
    10, 'Jerusalem', 
    'Jerusalem, Israel',
    31.78, 35.22, 
    'Where Paul was arrested in the temple.',
    '{"events": [{"title": "Arrested in the Temple", "description": "Jews from Asia stirred up the crowd and Paul was arrested.", "scriptures": ["Acts 21:27-36"], "visualEffect": "conflict"}]}'::jsonb,
    2100
);

-- Waypoints for Wilderness Wanderings
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Wilderness Wanderings'),
    1, 'Rameses', 
    'Egypt',
    30.8, 31.9, 
    'Starting point of the Exodus from Egypt.',
    '{"events": [{"title": "The Exodus Begins", "description": "Israel departed Egypt after 430 years.", "scriptures": ["Exodus 12:37-42"]}]}'::jsonb,
    0
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Wilderness Wanderings'),
    2, 'Red Sea Crossing', 
    'Near Gulf of Suez',
    29.8, 32.5, 
    'Miraculous crossing through the parted waters.',
    '{"events": [{"title": "Parting of the Red Sea", "description": "God parted the waters for Israel to cross on dry ground.", "scriptures": ["Exodus 14:21-22"], "visualEffect": "divine-light"}]}'::jsonb,
    120
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Wilderness Wanderings'),
    3, 'Mount Sinai', 
    'Jabal Musa',
    28.54, 33.97, 
    'Where Moses received the Ten Commandments.',
    '{"events": [{"title": "Receiving the Law", "description": "Moses received the Ten Commandments from God.", "scriptures": ["Exodus 19-20"], "visualEffect": "divine-light"}]}'::jsonb,
    350
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Wilderness Wanderings'),
    4, 'Kadesh Barnea', 
    'Ain Qudeirat',
    30.33, 34.93, 
    'Where Israel rebelled and was sentenced to wander 40 years.',
    '{"events": [{"title": "The Twelve Spies", "description": "Israel refused to enter the Promised Land after the spies' report.", "scriptures": ["Numbers 13-14"]}]}'::jsonb,
    600
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Wilderness Wanderings'),
    5, 'Plains of Moab', 
    'Near Jericho',
    31.83, 35.47, 
    'Final stop before entering the Promised Land.',
    '{"events": [{"title": "Moses' Farewell", "description": "Moses gave his final speeches and blessing before his death.", "scriptures": ["Deuteronomy 31-34"]}]}'::jsonb,
    800
);

-- Waypoints for Ministry of Jesus
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    1, 'Bethlehem', 
    'Bethlehem, Israel',
    31.7, 35.2, 
    'Birthplace of Jesus Christ.',
    '{"events": [{"title": "Birth of Jesus", "description": "The Savior was born in the city of David.", "scriptures": ["Luke 2:1-20", "Matthew 2:1-12"], "visualEffect": "divine-light"}]}'::jsonb,
    0
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    2, 'Nazareth', 
    'Nazareth, Israel',
    32.7, 35.3, 
    'Where Jesus grew up and began His ministry.',
    '{"events": [{"title": "Rejection at Nazareth", "description": "Jesus declared His mission but was rejected by His hometown.", "scriptures": ["Luke 4:16-30"]}]}'::jsonb,
    70
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    3, 'Jordan River', 
    'Jordan River, Israel',
    32.31, 35.57, 
    'Where Jesus was baptized by John.',
    '{"events": [{"title": "Baptism of Jesus", "description": "The Spirit descended like a dove and the Father spoke.", "scriptures": ["Matthew 3:13-17"], "visualEffect": "divine-light"}]}'::jsonb,
    100
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    4, 'Capernaum', 
    'Kfar Nahum, Israel',
    32.88, 35.57, 
    'Jesus'' ministry headquarters in Galilee.',
    '{"events": [{"title": "Healing Peter's Mother-in-law", "description": "Jesus healed many in Capernaum, starting with Peter's mother-in-law.", "scriptures": ["Matthew 8:14-17"], "visualEffect": "miracle"}]}'::jsonb,
    140
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    5, 'Mount of Beatitudes', 
    'Near Sea of Galilee',
    32.88, 35.55, 
    'Traditional site of the Sermon on the Mount.',
    '{"events": [{"title": "Sermon on the Mount", "description": "Jesus taught the Beatitudes and the Lord's Prayer.", "scriptures": ["Matthew 5-7"], "visualEffect": "teaching"}]}'::jsonb,
    142
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    6, 'Caesarea Philippi', 
    'Banias, Israel',
    33.24, 35.69, 
    'Where Peter confessed Jesus as the Christ.',
    '{"events": [{"title": "Peter's Confession", "description": "Peter declared \"You are the Christ, the Son of the living God.\"", "scriptures": ["Matthew 16:13-20"]}]}'::jsonb,
    180
);
INSERT INTO journey_waypoints 
(journey_id, position, location_name, modern_name, latitude, longitude, description, events, distance_from_start)
VALUES (
    (SELECT journey_id FROM biblical_journeys WHERE name = 'Ministry of Jesus'),
    7, 'Jerusalem', 
    'Jerusalem, Israel',
    31.78, 35.22, 
    'Site of Jesus'' crucifixion and resurrection.',
    '{"events": [{"title": "Triumphal Entry", "description": "Jesus entered Jerusalem on a donkey as crowds shouted \"Hosanna!\"", "scriptures": ["Matthew 21:1-11"]}, {"title": "The Last Supper", "description": "Jesus instituted the Lord's Supper with His disciples.", "scriptures": ["Matthew 26:17-30"]}, {"title": "Crucifixion", "description": "Jesus was crucified at Golgotha for the sins of the world.", "scriptures": ["Matthew 27:32-56"]}, {"title": "Resurrection", "description": "Jesus rose from the dead on the third day.", "scriptures": ["Matthew 28:1-10"], "visualEffect": "divine-light"}]}'::jsonb,
    280
);
