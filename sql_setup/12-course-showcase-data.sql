-- Course Showcase Data - 4 Courses with 10 Lessons Each
-- Updated for new normalized lesson structure
SET search_path TO wellversed01dev;

-- Insert 4 showcase courses
INSERT INTO courses (course_id, user_id, name, description, thumbnail_url, is_public, created_at, updated_at) VALUES
(1, 1, 'Biblical Foundations', 'Master the fundamental concepts of Bible study including hermeneutics, context, and interpretation principles.', NULL, TRUE, NOW(), NOW()),
(2, 1, 'Scripture Memorization Mastery', 'Advanced techniques for memorizing and retaining Scripture using proven methods and memory aids.', NULL, TRUE, NOW(), NOW()),
(3, 1, 'New Testament Deep Dive', 'Comprehensive exploration of New Testament books, themes, and theological concepts.', NULL, TRUE, NOW(), NOW()),
(4, 1, 'Worship & Devotional Life', 'Develop a rich devotional life through prayer, worship, and spiritual disciplines.', NULL, TRUE, NOW(), NOW());

-- Course 1: Biblical Foundations (10 lessons)
-- Base lesson records
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, created_at) VALUES
(1, 1, 1, 'Introduction to Biblical Hermeneutics', 'Learn the basic principles of interpreting Scripture accurately and responsibly.', 'article', NOW()),
(2, 1, 2, 'Historical Context Matters', 'Understanding the historical background of biblical passages for proper interpretation.', 'video', NOW()),
(3, 1, 3, 'Literary Genres in Scripture', 'Explore different literary forms in the Bible and how they affect interpretation.', 'article', NOW()),
(4, 1, 4, 'Cultural Context Quiz', 'Test your understanding of how cultural context influences biblical interpretation.', 'quiz', NOW()),
(5, 1, 5, 'Word Studies and Etymology', 'Learn to conduct effective word studies using original languages and lexicons.', 'video', NOW()),
(6, 1, 6, 'Comparing Scripture with Scripture', 'Use the analogy of faith principle to interpret difficult passages.', 'article', NOW()),
(7, 1, 7, 'Modern Application Principles', 'Bridge the gap between ancient text and contemporary application.', 'video', NOW()),
(8, 1, 8, 'Common Interpretation Errors', 'Identify and avoid frequent mistakes in biblical interpretation.', 'article', NOW()),
(9, 1, 9, 'Hermeneutics Practice Exercise', 'Apply hermeneutical principles to challenging biblical passages.', 'quiz', NOW()),
(10, 1, 10, 'Building Your Study Library', 'Essential resources and tools for ongoing biblical study and interpretation.', 'external_link', NOW());

-- Course 1: Type-specific lesson data
INSERT INTO article_lessons (lesson_id, article_text, reading_time_minutes) VALUES
(1, 'Biblical hermeneutics is the science and art of interpreting Scripture. It involves understanding the original meaning of biblical texts within their historical, cultural, and literary contexts. The word "hermeneutics" comes from the Greek god Hermes, who served as a messenger between gods and humans. Similarly, hermeneutics helps us bridge the gap between the ancient biblical world and our modern context. Key principles include: 1) Understanding the historical context, 2) Analyzing the literary genre, 3) Examining the grammatical structure, 4) Considering the immediate and broader context, and 5) Applying the text appropriately to our modern situation. Without proper hermeneutical principles, we risk misinterpreting Scripture and missing God''s intended message.', 8),
(3, 'The Bible contains various literary genres including narrative, poetry, prophecy, wisdom literature, parables, and epistles. Each genre has its own interpretative principles. Narrative passages teach through story and example, while poetry uses figurative language and parallelism. Prophetic literature often contains both forth-telling and foretelling elements. Wisdom literature provides practical guidance for living, and parables teach spiritual truths through earthly stories. Epistles are letters addressing specific situations in early churches. Understanding the genre helps us interpret correctly - we don''t read poetry the same way we read historical narrative, and we don''t interpret parables the same way we interpret doctrinal epistles. The key is identifying the genre and applying appropriate interpretative methods.', 6),
(6, 'Scripture interprets Scripture - this fundamental principle means that unclear passages should be understood in light of clearer ones. The Bible is internally consistent, so apparent contradictions often resolve when we compare related passages. This principle, called the "analogy of faith," assumes that the Holy Spirit doesn''t contradict Himself in Scripture. When studying difficult passages, we should: 1) Look for parallel passages that address the same topic, 2) Consider how other biblical authors treat the same subject, 3) Let clear passages illuminate unclear ones, 4) Maintain consistency with major biblical themes, and 5) Avoid building doctrine on obscure texts alone. This approach helps us avoid eisegesis (reading our ideas into the text) and practice sound exegesis (drawing meaning from the text).', 7),
(8, 'Eisegesis vs Exegesis - understanding the difference is crucial for biblical interpretation. Eisegesis means reading our own ideas, biases, or preconceptions into the biblical text, while exegesis means drawing the meaning out of the text itself. Common interpretation errors include: 1) Proof-texting - taking verses out of context to support predetermined beliefs, 2) Allegorizing - finding hidden meanings that the author never intended, 3) Spiritualizing - making every detail symbolic when it should be taken literally, 4) Presentism - reading modern concepts back into ancient texts, and 5) Cherry-picking - selecting only verses that support our view while ignoring contradictory evidence. To avoid these errors, we must approach Scripture with humility, careful study, and willingness to let the text speak for itself rather than forcing it to say what we want it to say.', 9);

INSERT INTO video_lessons (lesson_id, youtube_url, duration_minutes) VALUES
(2, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 35),
(5, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 50),
(7, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 45);

INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions) VALUES
(4, 5, 80, TRUE),
(9, 5, 75, TRUE);

INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description) VALUES
(10, 'https://example.com/study-resources', 'Biblical Study Resources', 'Comprehensive guide to essential tools and resources for biblical study and interpretation.');

-- Course 2: Scripture Memorization Mastery (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, created_at) VALUES
(11, 2, 1, 'The Science of Memory', 'Understand how memory works and why Scripture memorization is beneficial.', 'video', NOW()),
(12, 2, 2, 'Choosing Verses to Memorize', 'Strategic selection of verses based on personal needs and spiritual growth.', 'article', NOW()),
(13, 2, 3, 'Memory Palace Technique', 'Learn the ancient method of loci for memorizing longer passages.', 'video', NOW()),
(14, 2, 4, 'Repetition and Review Systems', 'Implement spaced repetition for long-term Scripture retention.', 'article', NOW()),
(15, 2, 5, 'Memory Techniques Quiz', 'Test your knowledge of various memorization methods and principles.', 'quiz', NOW()),
(16, 2, 6, 'Visualization and Association', 'Use mental imagery and word associations to enhance verse retention.', 'video', NOW()),
(17, 2, 7, 'Group Memorization Strategies', 'Memorize Scripture in community settings and accountability partnerships.', 'article', NOW()),
(18, 2, 8, 'Overcoming Memory Blocks', 'Strategies for when memorization becomes difficult or frustrating.', 'video', NOW()),
(19, 2, 9, 'Advanced Memory Challenge', 'Put your memorization skills to the test with challenging passages.', 'quiz', NOW()),
(20, 2, 10, 'Creating Your Memory Plan', 'Develop a personalized, sustainable Scripture memorization program.', 'external_link', NOW());

-- Course 2: Type-specific data
INSERT INTO video_lessons (lesson_id, youtube_url, duration_minutes) VALUES
(11, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 40),
(13, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 55),
(16, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 42),
(18, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 38);

INSERT INTO article_lessons (lesson_id, article_text, reading_time_minutes) VALUES
(12, 'Not all verses are equal for memorization purposes. Strategic verse selection considers several factors: personal spiritual needs, life circumstances, theological importance, and memorization difficulty. Start with shorter, well-known verses like John 3:16 or Philippians 4:13. Consider verses that address your current struggles or growth areas. Choose verses that are theologically rich and practically applicable. Build systematic categories: salvation verses, comfort verses, guidance verses, worship verses, and character-building verses. Consider the context - memorize complete thoughts rather than partial verses. Quality trumps quantity - it''s better to deeply memorize and understand fewer verses than to superficially memorize many. Create a balanced diet of Old Testament and New Testament passages, various genres, and different themes.', 5),
(14, 'The forgetting curve shows us why spaced repetition is crucial for long-term memory retention. Hermann Ebbinghaus discovered that we forget most new information within hours unless we review it systematically. For Scripture memorization, implement these review intervals: Review new verses daily for one week, then every other day for two weeks, then weekly for a month, then monthly for six months, then quarterly for maintenance. Use the "overlearning" principle - continue practicing verses even after you think you know them perfectly. Create review systems using flashcards, apps, or written schedules. Mix old and new verses in each review session. The key is consistency rather than intensity - 15 minutes daily is better than 2 hours weekly. Track your progress and adjust intervals based on your retention rates.', 6),
(17, 'Iron sharpens iron - memorizing Scripture together multiplies the benefits and provides accountability. Group memorization strategies include: recitation circles where members take turns quoting verses, memory competitions with friendly challenges, group practice sessions with shared verses, accountability partnerships for mutual encouragement, and family memorization projects that build spiritual legacy. Choose verses that benefit the entire group and align with shared spiritual goals. Use call-and-response techniques where one person starts a verse and others complete it. Create group challenges with rewards for achievement. Share memory techniques and tips that work for different learning styles. Group memorization creates community, reduces isolation, and makes the process more enjoyable and sustainable.', 7);

INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions) VALUES
(15, 4, 85, TRUE),
(19, 5, 80, TRUE);

INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description) VALUES
(20, 'https://example.com/memory-planner', 'Scripture Memory Planner', 'Interactive tool for creating and tracking your personalized Scripture memorization program.');

-- Course 3: New Testament Deep Dive (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, created_at) VALUES
(21, 3, 1, 'The Gospels: Unity and Diversity', 'Explore the unique perspectives of Matthew, Mark, Luke, and John.', 'video', NOW()),
(22, 3, 2, 'Acts: The Early Church', 'Trace the spread of Christianity from Jerusalem to Rome.', 'article', NOW()),
(23, 3, 3, 'Pauline Epistles Overview', 'Survey the letters of Paul and their theological contributions.', 'video', NOW()),
(24, 3, 4, 'Romans: The Gospel Explained', 'Deep dive into Paul''s systematic presentation of the Gospel.', 'article', NOW()),
(25, 3, 5, 'Pauline Theology Quiz', 'Test your understanding of key Pauline theological concepts.', 'quiz', NOW()),
(26, 3, 6, 'General Epistles Study', 'Examine the letters of James, Peter, John, and Jude.', 'video', NOW()),
(27, 3, 7, 'Hebrews: Christ''s Supremacy', 'Understand the superiority of Christ over the Old Covenant.', 'article', NOW()),
(28, 3, 8, 'Revelation: Apocalyptic Literature', 'Navigate the symbolic language and prophetic visions of Revelation.', 'video', NOW()),
(29, 3, 9, 'New Testament Synthesis', 'Comprehensive review connecting all New Testament themes and books.', 'quiz', NOW()),
(30, 3, 10, 'NT Historical Timeline', 'Interactive exploration of New Testament chronology and historical context.', 'external_link', NOW());

-- Course 3: Type-specific data
INSERT INTO video_lessons (lesson_id, youtube_url, duration_minutes) VALUES
(21, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 75),
(23, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 85),
(26, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 65),
(28, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 90);

INSERT INTO article_lessons (lesson_id, article_text, reading_time_minutes) VALUES
(22, 'The book of Acts serves as a bridge between the Gospels and Epistles, showing how the early church lived out the Great Commission. Luke, the author, carefully documents the expansion of Christianity from a small Jewish sect to a worldwide movement. The book follows a geographic progression: Jerusalem (chapters 1-7), Judea and Samaria (chapters 8-12), and to the ends of the earth (chapters 13-28). Key themes include the Holy Spirit''s power, the inclusion of Gentiles, the importance of witness and testimony, and the unstoppable growth of God''s kingdom despite opposition. Major figures include Peter, Paul, Barnabas, and Philip. The book demonstrates how God fulfills His promises and shows the early church as our model for mission, community, and faithfulness under persecution.', 8),
(24, 'Romans has been called the constitution of Christianity because of Paul''s systematic presentation of the Gospel. The letter addresses the relationship between Jews and Gentiles in God''s plan of salvation. Key theological themes include: universal sinfulness (chapters 1-3), justification by faith (chapters 4-5), sanctification and the Christian life (chapters 6-8), God''s sovereignty and Israel''s future (chapters 9-11), and practical Christian living (chapters 12-16). Paul demonstrates that salvation is by faith alone, through grace alone, in Christ alone. The letter shows how the Gospel transforms individuals and communities, breaking down barriers between different ethnic groups and creating unity in the body of Christ. Romans provides the theological foundation for understanding salvation, sanctification, and service.', 10),
(27, 'The book of Hebrews presents Jesus as better than the angels, Moses, Aaron, and the Old Covenant system. Written to Jewish Christians considering returning to Judaism, the letter demonstrates Christ''s supremacy in every aspect. Jesus is the better mediator of a better covenant established on better promises. The author uses extensive Old Testament quotations and typology to show how Christ fulfills and surpasses everything in the old system. Key themes include Christ''s deity and humanity, His role as high priest, the superiority of the new covenant, and the call to persevering faith. The famous "faith hall of fame" in chapter 11 encourages believers to remain faithful despite trials. Hebrews calls us to "consider Jesus" and find in Him everything we need for salvation and spiritual growth.', 9);

INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions) VALUES
(25, 5, 75, TRUE),
(29, 6, 80, TRUE);

INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description) VALUES
(30, 'https://example.com/nt-timeline', 'New Testament Timeline', 'Interactive timeline exploring New Testament chronology and historical context.');

-- Course 4: Worship & Devotional Life (10 lessons)
INSERT INTO course_lessons (lesson_id, course_id, position, title, description, content_type, created_at) VALUES
(31, 4, 1, 'What is True Worship?', 'Biblical foundations of worship in spirit and truth.', 'article', NOW()),
(32, 4, 2, 'Developing a Prayer Life', 'Learn various forms of prayer and establish consistent prayer habits.', 'video', NOW()),
(33, 4, 3, 'Scripture Meditation Techniques', 'Go beyond reading to truly meditating on God''s Word.', 'article', NOW()),
(34, 4, 4, 'Fasting and Spiritual Discipline', 'Understanding the role of fasting in spiritual growth and worship.', 'video', NOW()),
(35, 4, 5, 'Spiritual Disciplines Quiz', 'Test your knowledge of various spiritual disciplines and practices.', 'quiz', NOW()),
(36, 4, 6, 'Worship Through Music', 'The role of music and singing in personal and corporate worship.', 'video', NOW()),
(37, 4, 7, 'Journaling Your Faith Journey', 'Use writing as a tool for spiritual reflection and growth.', 'article', NOW()),
(38, 4, 8, 'Sabbath Rest and Rhythms', 'Rediscover the importance of rest and rhythm in spiritual life.', 'video', NOW()),
(39, 4, 9, 'Building Worship Habits', 'Create sustainable practices for lifelong spiritual growth.', 'quiz', NOW()),
(40, 4, 10, 'Worship Resources Library', 'Access to hymns, prayers, and devotional resources for ongoing growth.', 'external_link', NOW());

-- Course 4: Type-specific data
INSERT INTO video_lessons (lesson_id, youtube_url, duration_minutes) VALUES
(32, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 50),
(34, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 45),
(36, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 40),
(38, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 55);

INSERT INTO article_lessons (lesson_id, article_text, reading_time_minutes) VALUES
(31, 'Jesus said true worshipers will worship the Father in spirit and truth (John 4:24). True worship is not primarily about external forms or locations, but about the condition of the heart and mind. Worship in spirit means worship that is enabled and empowered by the Holy Spirit, coming from a regenerated heart rather than mere ritual or tradition. Worship in truth means worship that aligns with God''s revelation of Himself in Scripture, based on accurate knowledge of who God is and what He has done. True worship involves our whole being - mind, emotions, and will. It includes both corporate gatherings and personal devotion, both formal liturgy and spontaneous praise. The goal is to honor God for who He is, express gratitude for what He has done, and align our hearts with His purposes. True worship transforms the worshiper and glorifies God.', 7),
(33, 'Meditation on Scripture is like a cow chewing cud - it involves repeatedly returning to the same passage to extract maximum spiritual nourishment. Biblical meditation differs from Eastern meditation; it''s not about emptying the mind but filling it with God''s truth. Techniques include: reading a passage slowly multiple times, asking questions about the text, personalizing the passage by inserting your name, memorizing key phrases, praying through the passage, and applying its truths to current circumstances. Choose shorter passages for deeper study rather than rushing through large sections. Meditate on God''s character, promises, commands, and works. Let the Holy Spirit illuminate the text and speak to your heart. The goal is not just information but transformation - allowing God''s Word to shape your thoughts, attitudes, and actions. Regular Scripture meditation develops spiritual maturity and intimacy with God.', 8),
(37, 'Many great saints throughout history kept spiritual journals to document their journey with God. Journaling helps process spiritual experiences, track growth, record prayers and answers, capture insights from Scripture study, and maintain accountability with God. Different types of spiritual journaling include: prayer journals for recording requests and answers, Scripture journals for insights from daily reading, gratitude journals for recognizing God''s blessings, struggle journals for processing difficulties, and growth journals for tracking spiritual development. Don''t worry about perfect grammar or eloquent expression - write honestly and from the heart. Include dates for tracking patterns over time. Write prayers, questions, doubts, celebrations, and commitments. Review past entries periodically to see how God has worked. Spiritual journaling becomes a valuable record of your relationship with God and a tool for continued spiritual growth.', 9);

INSERT INTO quiz_lessons (lesson_id, verse_count, pass_threshold, randomize_questions) VALUES
(35, 4, 80, TRUE),
(39, 3, 75, TRUE);

INSERT INTO external_lessons (lesson_id, external_url, external_title, external_description) VALUES
(40, 'https://example.com/worship-resources', 'Worship Resource Library', 'Comprehensive collection of hymns, prayers, and devotional resources for ongoing spiritual growth.');

-- Add some sample quiz flashcards
INSERT INTO quiz_flashcards (lesson_id, reference, verse_codes, position) VALUES
(4, 'Romans 3:23', ARRAY['45-3-23'], 0),
(4, 'John 1:14', ARRAY['43-1-14'], 1),
(4, '1 Peter 2:9', ARRAY['60-2-9'], 2),
(15, 'Psalm 119:11', ARRAY['19-119-11'], 0),
(15, 'Philippians 4:13', ARRAY['50-4-13'], 1),
(19, 'Matthew 4:4', ARRAY['40-4-4'], 0),
(19, 'Isaiah 40:8', ARRAY['23-40-8'], 1),
(25, 'Romans 1:16', ARRAY['45-1-16'], 0),
(25, 'Ephesians 2:8-9', ARRAY['49-2-8', '49-2-9'], 1),
(29, 'Revelation 21:5', ARRAY['66-21-5'], 0),
(35, 'Psalm 95:6', ARRAY['19-95-6'], 0),
(35, 'Romans 12:1', ARRAY['45-12-1'], 1),
(39, 'Psalm 46:10', ARRAY['19-46-10'], 0);

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
SELECT setval('courses_course_id_seq', (SELECT COALESCE(MAX(course_id), 1) FROM courses));
SELECT setval('course_lessons_lesson_id_seq', (SELECT COALESCE(MAX(lesson_id), 1) FROM course_lessons));
SELECT setval('quiz_flashcards_flashcard_id_seq', (SELECT COALESCE(MAX(flashcard_id), 1) FROM quiz_flashcards));