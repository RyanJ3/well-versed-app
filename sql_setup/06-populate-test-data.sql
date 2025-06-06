-- =====================================================
-- 06-populate-test-data.sql
-- Insert test data (run after all tables created)
-- =====================================================
SET search_path TO wellversed01DEV;

-- Create test decks
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false)
ON CONFLICT DO NOTHING;

-- Add sample saved deck
INSERT INTO saved_decks (user_id, deck_id)
SELECT 1, deck_id FROM decks WHERE name = 'Psalms of Praise' AND is_public = true
ON CONFLICT DO NOTHING;

-- -------------------------------------------------
-- Sample workflows and tags for development
-- -------------------------------------------------

-- Basic workflows
INSERT INTO workflows (user_id, name, description, is_public)
VALUES
  (1, 'Introduction to Biblical Hebrew', 'Master the basics of Hebrew language to better understand scripture in its original form', true),
  (1, 'The Parables of Jesus', 'Deep dive into the teachings of Jesus through His parables', true),
  (1, 'Women of the Bible', 'Explore the powerful stories and lessons from biblical women', true),
  (1, 'Understanding Revelation', 'A comprehensive study of the book of Revelation and end times prophecy', true),
  (1, 'Prayer & Meditation', 'Develop a deeper prayer life through biblical meditation practices', true),
  (1, 'Old Testament History', 'Journey through the historical books of the Old Testament', true)
ON CONFLICT DO NOTHING;

-- Tags used by sample workflows
INSERT INTO workflow_tags (tag_name) VALUES
  ('hebrew'),
  ('languages'),
  ('beginner'),
  ('new-testament'),
  ('jesus'),
  ('parables'),
  ('women'),
  ('old-testament'),
  ('stories'),
  ('prophecy'),
  ('revelation'),
  ('advanced'),
  ('prayer'),
  ('spiritual-growth'),
  ('history'),
  ('intermediate')
ON CONFLICT DO NOTHING;

-- Map tags to workflows
-- Introduction to Biblical Hebrew
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Introduction to Biblical Hebrew' AND t.tag_name = 'hebrew'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Introduction to Biblical Hebrew' AND t.tag_name = 'languages'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Introduction to Biblical Hebrew' AND t.tag_name = 'beginner'
ON CONFLICT DO NOTHING;

-- The Parables of Jesus
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'The Parables of Jesus' AND t.tag_name = 'new-testament'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'The Parables of Jesus' AND t.tag_name = 'jesus'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'The Parables of Jesus' AND t.tag_name = 'parables'
ON CONFLICT DO NOTHING;

-- Women of the Bible
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Women of the Bible' AND t.tag_name = 'women'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Women of the Bible' AND t.tag_name = 'old-testament'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Women of the Bible' AND t.tag_name = 'stories'
ON CONFLICT DO NOTHING;

-- Understanding Revelation
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Understanding Revelation' AND t.tag_name = 'prophecy'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Understanding Revelation' AND t.tag_name = 'revelation'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Understanding Revelation' AND t.tag_name = 'advanced'
ON CONFLICT DO NOTHING;

-- Prayer & Meditation
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Prayer & Meditation' AND t.tag_name = 'prayer'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Prayer & Meditation' AND t.tag_name = 'spiritual-growth'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Prayer & Meditation' AND t.tag_name = 'beginner'
ON CONFLICT DO NOTHING;

-- Old Testament History
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Old Testament History' AND t.tag_name = 'old-testament'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Old Testament History' AND t.tag_name = 'history'
ON CONFLICT DO NOTHING;
INSERT INTO workflow_tag_map (workflow_id, tag_id)
SELECT w.workflow_id, t.tag_id FROM workflows w, workflow_tags t
WHERE w.name = 'Old Testament History' AND t.tag_name = 'intermediate'
ON CONFLICT DO NOTHING;
