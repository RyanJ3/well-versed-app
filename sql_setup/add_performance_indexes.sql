-- Add indexes to improve query performance based on common access patterns

-- Feature Requests indexes
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_request_voted ON feature_request_votes(request_id, voted_at);
CREATE INDEX IF NOT EXISTS idx_feature_request_votes_vote_type ON feature_request_votes(vote_type) WHERE vote_type = 'up';

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course ON course_enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_position ON course_lessons(course_id, position);
CREATE INDEX IF NOT EXISTS idx_course_tag_map_course ON course_tag_map(course_id);

-- Verses indexes
CREATE INDEX IF NOT EXISTS idx_user_verses_user_id ON user_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_code ON bible_verses(verse_code);
CREATE INDEX IF NOT EXISTS idx_bible_verses_book_chapter ON bible_verses(book_id, chapter_number);

-- Decks indexes
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_position ON deck_cards(deck_id, position);
CREATE INDEX IF NOT EXISTS idx_card_verses_card ON card_verses(card_id);

-- Analyze tables to update statistics
ANALYZE feature_requests;
ANALYZE feature_request_votes;
ANALYZE feature_request_comments;
ANALYZE courses;
ANALYZE course_enrollments;
ANALYZE course_lessons;
ANALYZE user_verses;
ANALYZE bible_verses;
ANALYZE decks;
ANALYZE deck_cards;
