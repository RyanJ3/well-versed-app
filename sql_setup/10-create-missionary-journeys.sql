-- =====================================================
-- 10-create-missionary-journeys.sql
-- Tables for Scripture Atlas missionary journeys
-- =====================================================
SET search_path TO wellversed01DEV;

CREATE TABLE missionary_journeys (
    journey_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    scripture_refs VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE missionary_journey_cities (
    city_id SERIAL PRIMARY KEY,
    journey_id INTEGER NOT NULL REFERENCES missionary_journeys(journey_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mj_cities_journey ON missionary_journey_cities(journey_id);

-- Insert journeys
INSERT INTO missionary_journeys (name, start_year, end_year, scripture_refs) VALUES
    ('Paul''s First Missionary Journey', 46, 48, 'Acts 13-14'),
    ('Paul''s Second Missionary Journey', 49, 52, 'Acts 15:36-18:22'),
    ('Paul''s Third Missionary Journey', 53, 57, 'Acts 18:23-21:17');

-- First journey cities
INSERT INTO missionary_journey_cities (journey_id, position, data) VALUES
(1,1,$${"id":"antioch-syria","name":"Antioch (Syria)","modern":"Antakya, Turkey","position":[36.2,36.16],"distance":0,"description":"The starting point where Paul and Barnabas were commissioned by the church for their groundbreaking missionary journey.","verses":["Acts 13:1-3"],"events":["Church fasted and prayed for guidance","Holy Spirit said \"Set apart Barnabas and Saul\"","Leaders laid hands and sent them off","First organized missionary expedition"],"keyFact":"Third largest city in the Roman Empire after Rome and Alexandria, with over 500,000 residents. Known as the \"Crown of the East.\"","scriptureText":""}$$),
(1,2,$${"id":"seleucia","name":"Seleucia","modern":"Port of Antioch","position":[36.12,35.93],"distance":16,"description":"The port city where they set sail for Cyprus, marking the beginning of their sea voyage.","verses":["Acts 13:4"],"events":["Departed by ship to Cyprus","Beginning of maritime mission"],"keyFact":"Located 16 miles from Antioch at the mouth of the Orontes River. Founded by Seleucus I, one of Alexander's generals.","scriptureText":""}$$),
(1,3,$${"id":"salamis","name":"Salamis","modern":"Near Famagusta, Cyprus","position":[35.18,33.9],"distance":196,"description":"First evangelistic stop where they proclaimed the word in Jewish synagogues.","verses":["Acts 13:5"],"events":["Proclaimed the word in Jewish synagogues","John Mark served as their assistant","Established pattern of synagogue preaching"],"keyFact":"Largest city and commercial center of Cyprus, home to a significant Jewish population with multiple synagogues.","scriptureText":""}$$),
(1,4,$${"id":"paphos","name":"Paphos","modern":"Paphos, Cyprus","position":[34.77,32.42],"distance":286,"description":"Capital of Cyprus where they encountered both spiritual opposition and high-level conversion.","verses":["Acts 13:6-12"],"events":["Met Bar-Jesus (Elymas) the sorcerer","Proconsul Sergius Paulus believed","Paul struck Elymas blind","Paul emerged as mission leader"],"keyFact":"First recorded conversion of a Roman government official to Christianity. The proconsul's conversion opened doors throughout the empire.","scriptureText":""}$$),
(1,5,$${"id":"perga","name":"Perga","modern":"Near Antalya, Turkey","position":[36.89,30.85],"distance":461,"description":"First mainland stop in Asia Minor where John Mark departed from the team.","verses":["Acts 13:13"],"events":["John Mark departed to Jerusalem","Team faced first major challenge","Continued inland despite setback"],"keyFact":"John Mark's departure later caused a sharp disagreement between Paul and Barnabas (Acts 15:37-39), leading to two missionary teams.","scriptureText":""}$$),
(1,6,$${"id":"pisidian-antioch","name":"Pisidian Antioch","modern":"Yalvaç, Turkey","position":[38.3,31.2],"distance":561,"description":"Location of Paul's first recorded sermon and the beginning of deliberate Gentile outreach.","verses":["Acts 13:14-52"],"events":["Paul's powerful synagogue sermon","Many Gentiles believed","Jewish leaders stirred persecution","Shook dust off their feet"],"keyFact":"Paul's longest recorded sermon in Acts established his pattern: preach to Jews first, then turn to Gentiles when rejected.","scriptureText":""}$$),
(1,7,$${"id":"iconium","name":"Iconium","modern":"Konya, Turkey","position":[37.87,32.49],"distance":651,"description":"Major city where they spent considerable time despite growing opposition.","verses":["Acts 14:1-7"],"events":["Great number of Jews and Greeks believed","City divided over the message","Performed signs and wonders","Fled from stoning attempt"],"keyFact":"Modern Konya is Turkey's 7th largest city. In Paul's time, it was a key stop on the Via Sebaste trade route.","scriptureText":""}$$),
(1,8,$${"id":"lystra","name":"Lystra","modern":"Near Hatunsaray, Turkey","position":[37.58,32.45],"distance":671,"description":"City where Paul healed a lame man, was worshipped as a god, then nearly killed.","verses":["Acts 14:8-20"],"events":["Healed man lame from birth","Mistaken for Zeus and Hermes","Paul stoned and left for dead","Miraculously recovered and continued"],"keyFact":"Timothy's hometown - Paul met him here on his second journey. The dramatic events here prepared Timothy for missionary hardships.","scriptureText":""}$$),
(1,9,$${"id":"derbe","name":"Derbe","modern":"Near Karaman, Turkey","position":[37.35,33.25],"distance":731,"description":"Easternmost point where they made many disciples before beginning the return journey.","verses":["Acts 14:20-21"],"events":["Preached the gospel successfully","Made many disciples","No recorded persecution","Began strengthening return journey"],"keyFact":"The only city without recorded opposition - a welcome respite. They could have returned via the Cilician Gates but chose to revisit and strengthen the churches.","scriptureText":""}$$);

-- Second journey (truncated sample)
INSERT INTO missionary_journey_cities (journey_id, position, data) VALUES
(2,1,$${"id":"antioch-syria","name":"Antioch (Syria)","modern":"Antakya, Turkey","position":[36.2,36.16],"distance":0}$$),
(2,2,$${"id":"tarsus","name":"Tarsus","modern":"Tarsus, Turkey","position":[37.0,35.0],"distance":80}$$),
(2,3,$${"id":"derbe","name":"Derbe","modern":"Near Karaman, Turkey","position":[37.35,33.25],"distance":300}$$),
(2,4,$${"id":"lystra","name":"Lystra","modern":"Near Hatunsaray, Turkey","position":[37.58,32.45],"distance":340}$$),
(2,5,$${"id":"troas","name":"Troas","modern":"Dalyan, Turkey","position":[39.78,26.58],"distance":800}$$),
(2,6,$${"id":"philippi","name":"Philippi","modern":"Philippi, Greece","position":[41.0,24.0],"distance":1000}$$),
(2,7,$${"id":"thessalonica","name":"Thessalonica","modern":"Thessaloniki, Greece","position":[40.64,22.94],"distance":1100}$$),
(2,8,$${"id":"berea","name":"Berea","modern":"Veroia, Greece","position":[40.53,22.2],"distance":1150}$$),
(2,9,$${"id":"athens","name":"Athens","modern":"Athens, Greece","position":[37.98,23.72],"distance":1400}$$),
(2,10,$${"id":"corinth","name":"Corinth","modern":"Corinth, Greece","position":[37.94,22.93],"distance":1460}$$),
(2,11,$${"id":"ephesus","name":"Ephesus","modern":"Selçuk, Turkey","position":[37.94,27.34],"distance":1710}$$),
(2,12,$${"id":"caesarea","name":"Caesarea","modern":"Caesarea Maritima, Israel","position":[32.5,34.75],"distance":2000}$$),
(2,13,$${"id":"antioch-return","name":"Antioch (Return)","modern":"Antakya, Turkey","position":[36.2,36.16],"distance":2200}$$);

-- Third journey (truncated sample)
INSERT INTO missionary_journey_cities (journey_id, position, data) VALUES
(3,1,$${"id":"antioch-syria","name":"Antioch (Syria)","modern":"Antakya, Turkey","position":[36.2,36.16],"distance":0}$$),
(3,2,$${"id":"tarsus","name":"Tarsus","modern":"Tarsus, Turkey","position":[37.0,35.0],"distance":70}$$),
(3,3,$${"id":"iconium","name":"Iconium","modern":"Konya, Turkey","position":[37.87,32.49],"distance":300}$$),
(3,4,$${"id":"ephesus","name":"Ephesus","modern":"Selçuk, Turkey","position":[37.94,27.34],"distance":700}$$),
(3,5,$${"id":"philippi","name":"Philippi","modern":"Philippi, Greece","position":[41.0,24.0],"distance":1000}$$),
(3,6,$${"id":"corinth","name":"Corinth","modern":"Corinth, Greece","position":[37.94,22.93],"distance":1300}$$),
(3,7,$${"id":"troas","name":"Troas","modern":"Dalyan, Turkey","position":[39.78,26.58],"distance":1600}$$),
(3,8,$${"id":"miletus","name":"Miletus","modern":"Milet, Turkey","position":[37.53,27.28],"distance":1700}$$),
(3,9,$${"id":"tyre","name":"Tyre","modern":"Tyre, Lebanon","position":[33.27,35.2],"distance":2000}$$),
(3,10,$${"id":"caesarea","name":"Caesarea","modern":"Caesarea Maritima, Israel","position":[32.5,34.75],"distance":2050}$$),
(3,11,$${"id":"jerusalem","name":"Jerusalem","modern":"Jerusalem, Israel","position":[31.78,35.22],"distance":2100}$$);
