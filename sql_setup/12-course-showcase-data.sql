-- Course Showcase Data - 4 Courses with 10 Lessons Each
-- This SQL creates sample courses to demonstrate the courses component
SET search_path TO wellversed01dev;

-- Insert 4 showcase courses
INSERT INTO courses (course_id, user_id, name, description, thumbnail_url, is_public, created_at, updated_at) VALUES
(1, 1, 'Biblical Foundations', 'Master the fundamental concepts of Bible study including hermeneutics, context, and interpretation principles.', NULL, TRUE, NOW(), NOW()),
(2, 1, 'Scripture Memorization Mastery', 'Advanced techniques for memorizing and retaining Scripture using proven methods and memory aids.', NULL, TRUE, NOW(), NOW()),
(3, 1, 'New Testament Deep Dive', 'Comprehensive exploration of New Testament books, themes, and theological concepts.', NULL, TRUE, NOW(), NOW()),
(4, 1, 'Worship & Devotional Life', 'Develop a rich devotional life through prayer, worship, and spiritual disciplines.', NULL, TRUE, NOW(), NOW());

-- Course 1: Biblical Foundations (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, content_data, created_at) VALUES
(1, 1, 1, 'Introduction to Biblical Hermeneutics', 'Learn the basic principles of interpreting Scripture accurately and responsibly.', 'article', '{"article_content": "Biblical hermeneutics is the science and art of interpreting Scripture..."}', NOW()),
(2, 1, 2, 'Historical Context Matters', 'Understanding the historical background of biblical passages for proper interpretation.', 'video', '{"video_url": "https://example.com/historical-context", "duration": 35}', NOW()),
(3, 1, 3, 'Literary Genres in Scripture', 'Explore different literary forms in the Bible and how they affect interpretation.', 'article', '{"article_content": "The Bible contains various literary genres including narrative, poetry, prophecy..."}', NOW()),
(4, 1, 4, 'Cultural Context Quiz', 'Test your understanding of how cultural context influences biblical interpretation.', 'quiz', '{"quiz_config": {"verse_count": 15, "pass_threshold": 80}}', NOW()),
(5, 1, 5, 'Word Studies and Etymology', 'Learn to conduct effective word studies using original languages and lexicons.', 'video', '{"video_url": "https://example.com/word-studies", "duration": 50}', NOW()),
(6, 1, 6, 'Comparing Scripture with Scripture', 'Use the analogy of faith principle to interpret difficult passages.', 'article', '{"article_content": "Scripture interprets Scripture - this fundamental principle..."}', NOW()),
(7, 1, 7, 'Modern Application Principles', 'Bridge the gap between ancient text and contemporary application.', 'video', '{"video_url": "https://example.com/application", "duration": 45}', NOW()),
(8, 1, 8, 'Common Interpretation Errors', 'Identify and avoid frequent mistakes in biblical interpretation.', 'article', '{"article_content": "Eisegesis vs Exegesis - understanding the difference..."}', NOW()),
(9, 1, 9, 'Hermeneutics Practice Exercise', 'Apply hermeneutical principles to challenging biblical passages.', 'quiz', '{"quiz_config": {"verse_count": 20, "pass_threshold": 75}}', NOW()),
(10, 1, 10, 'Building Your Study Library', 'Essential resources and tools for ongoing biblical study and interpretation.', 'external', '{"external_url": "https://example.com/study-resources", "description": "Comprehensive guide to study tools"}', NOW());

-- Course 2: Scripture Memorization Mastery (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, content_data, created_at) VALUES
(11, 2, 1, 'The Science of Memory', 'Understand how memory works and why Scripture memorization is beneficial.', 'video', '{"video_url": "https://example.com/memory-science", "duration": 40}', NOW()),
(12, 2, 2, 'Choosing Verses to Memorize', 'Strategic selection of verses based on personal needs and spiritual growth.', 'article', '{"article_content": "Not all verses are equal for memorization purposes..."}', NOW()),
(13, 2, 3, 'Memory Palace Technique', 'Learn the ancient method of loci for memorizing longer passages.', 'video', '{"video_url": "https://example.com/memory-palace", "duration": 55}', NOW()),
(14, 2, 4, 'Repetition and Review Systems', 'Implement spaced repetition for long-term Scripture retention.', 'article', '{"article_content": "The forgetting curve shows us why spaced repetition is crucial..."}', NOW()),
(15, 2, 5, 'Memory Techniques Quiz', 'Test your knowledge of various memorization methods and principles.', 'quiz', '{"quiz_config": {"verse_count": 12, "pass_threshold": 85}}', NOW()),
(16, 2, 6, 'Visualization and Association', 'Use mental imagery and word associations to enhance verse retention.', 'video', '{"video_url": "https://example.com/visualization", "duration": 42}', NOW()),
(17, 2, 7, 'Group Memorization Strategies', 'Memorize Scripture in community settings and accountability partnerships.', 'article', '{"article_content": "Iron sharpens iron - memorizing Scripture together..."}', NOW()),
(18, 2, 8, 'Overcoming Memory Blocks', 'Strategies for when memorization becomes difficult or frustrating.', 'video', '{"video_url": "https://example.com/memory-blocks", "duration": 38}', NOW()),
(19, 2, 9, 'Advanced Memory Challenge', 'Put your memorization skills to the test with challenging passages.', 'quiz', '{"quiz_config": {"verse_count": 25, "pass_threshold": 80}}', NOW()),
(20, 2, 10, 'Creating Your Memory Plan', 'Develop a personalized, sustainable Scripture memorization program.', 'external', '{"external_url": "https://example.com/memory-planner", "description": "Interactive memorization planning tool"}', NOW());

-- Course 3: New Testament Deep Dive (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, content_data, created_at) VALUES
(21, 3, 1, 'The Gospels: Unity and Diversity', 'Explore the unique perspectives of Matthew, Mark, Luke, and John.', 'video', '{"video_url": "https://example.com/gospels-overview", "duration": 75}', NOW()),
(22, 3, 2, 'Acts: The Early Church', 'Trace the spread of Christianity from Jerusalem to Rome.', 'article', '{"article_content": "The book of Acts serves as a bridge between the Gospels and Epistles..."}', NOW()),
(23, 3, 3, 'Pauline Epistles Overview', 'Survey the letters of Paul and their theological contributions.', 'video', '{"video_url": "https://example.com/paul-letters", "duration": 85}', NOW()),
(24, 3, 4, 'Romans: The Gospel Explained', 'Deep dive into Paul''s systematic presentation of the Gospel.', 'article', '{"article_content": "Romans has been called the constitution of Christianity..."}', NOW()),
(25, 3, 5, 'Pauline Theology Quiz', 'Test your understanding of key Pauline theological concepts.', 'quiz', '{"quiz_config": {"verse_count": 30, "pass_threshold": 75}}', NOW()),
(26, 3, 6, 'General Epistles Study', 'Examine the letters of James, Peter, John, and Jude.', 'video', '{"video_url": "https://example.com/general-epistles", "duration": 65}', NOW()),
(27, 3, 7, 'Hebrews: Christ''s Supremacy', 'Understand the superiority of Christ over the Old Covenant.', 'article', '{"article_content": "The book of Hebrews presents Jesus as better than..."}', NOW()),
(28, 3, 8, 'Revelation: Apocalyptic Literature', 'Navigate the symbolic language and prophetic visions of Revelation.', 'video', '{"video_url": "https://example.com/revelation", "duration": 90}', NOW()),
(29, 3, 9, 'New Testament Synthesis', 'Comprehensive review connecting all New Testament themes and books.', 'quiz', '{"quiz_config": {"verse_count": 40, "pass_threshold": 80}}', NOW()),
(30, 3, 10, 'NT Historical Timeline', 'Interactive exploration of New Testament chronology and historical context.', 'external', '{"external_url": "https://example.com/nt-timeline", "description": "Interactive New Testament timeline"}', NOW());

-- Course 4: Worship & Devotional Life (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, content_data, created_at) VALUES
(31, 4, 1, 'What is True Worship?', 'Biblical foundations of worship in spirit and truth.', 'article', '{"article_content": "Jesus said true worshipers will worship the Father in spirit and truth..."}', NOW()),
(32, 4, 2, 'Developing a Prayer Life', 'Learn various forms of prayer and establish consistent prayer habits.', 'video', '{"video_url": "https://example.com/prayer-life", "duration": 50}', NOW()),
(33, 4, 3, 'Scripture Meditation Techniques', 'Go beyond reading to truly meditating on God''s Word.', 'article', '{"article_content": "Meditation on Scripture is like a cow chewing cud..."}', NOW()),
(34, 4, 4, 'Fasting and Spiritual Discipline', 'Understanding the role of fasting in spiritual growth and worship.', 'video', '{"video_url": "https://example.com/fasting", "duration": 45}', NOW()),
(35, 4, 5, 'Spiritual Disciplines Quiz', 'Test your knowledge of various spiritual disciplines and practices.', 'quiz', '{"quiz_config": {"verse_count": 18, "pass_threshold": 80}}', NOW()),
(36, 4, 6, 'Worship Through Music', 'The role of music and singing in personal and corporate worship.', 'video', '{"video_url": "https://example.com/worship-music", "duration": 40}', NOW()),
(37, 4, 7, 'Journaling Your Faith Journey', 'Use writing as a tool for spiritual reflection and growth.', 'article', '{"article_content": "Many great saints throughout history kept spiritual journals..."}', NOW()),
(38, 4, 8, 'Sabbath Rest and Rhythms', 'Rediscover the importance of rest and rhythm in spiritual life.', 'video', '{"video_url": "https://example.com/sabbath", "duration": 55}', NOW()),
(39, 4, 9, 'Building Worship Habits', 'Create sustainable practices for lifelong spiritual growth.', 'quiz', '{"quiz_config": {"verse_count": 15, "pass_threshold": 75}}', NOW()),
(40, 4, 10, 'Worship Resources Library', 'Access to hymns, prayers, and devotional resources for ongoing growth.', 'external', '{"external_url": "https://example.com/worship-resources", "description": "Comprehensive worship and devotional resource library"}', NOW());

-- Insert sample lesson progress for demonstration
INSERT INTO lesson_progress (user_id, lesson_id, course_id, started_at, completed_at, quiz_attempts, best_score, last_attempt) VALUES
(1, 1, 1, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 0, NULL, NULL),
(1, 2, 1, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 0, NULL, NULL),
(1, 3, 1, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 0, NULL, NULL),
(1, 4, 1, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 1, 85, NOW() - INTERVAL '2 days'),
(1, 5, 1, NOW() - INTERVAL '1 day', NULL, 0, NULL, NULL),
(1, 11, 2, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 0, NULL, NULL),
(1, 12, 2, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 0, NULL, NULL);

-- Insert course enrollment for demonstration
INSERT INTO course_enrollments (user_id, course_id, current_lesson_id, current_lesson_position, lessons_completed, enrolled_at, last_accessed) VALUES
(1, 1, 5, 5, 4, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
(1, 2, 12, 2, 2, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
(1, 3, NULL, 1, 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(1, 4, NULL, 1, 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Fix sequence values after manual inserts
SELECT setval('courses_course_id_seq', (SELECT MAX(course_id) FROM courses));
SELECT setval('course_lessons_lesson_id_seq', (SELECT MAX(lesson_id) FROM course_lessons));