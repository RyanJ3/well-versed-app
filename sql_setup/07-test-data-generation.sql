SET search_path TO wellversed01DEV;

-- Create a few decks if none exist
INSERT INTO decks (user_id, name, description, is_public) VALUES 
(1, 'Psalms of Praise', 'Popular psalms for memorization', true),
(1, 'Gospel Essentials', 'Key verses from the Gospels', true),
(1, 'Romans Road', 'Salvation verses from Romans', false);

-- Add verses to Psalms deck (Psalm 23:1-6)
INSERT INTO deck_verses (deck_id, verse_id, position)
SELECT 
    (SELECT deck_id FROM decks WHERE name = 'Psalms of Praise'),
    id,
    ROW_NUMBER() OVER (ORDER BY verse_number)
FROM bible_verses
WHERE book_id = 19 AND chapter_number = 23 AND verse_number <= 6;

-- Add verses to Gospel deck (John 3:16, John 14:6, Matthew 28:19-20)
INSERT INTO deck_verses (deck_id, verse_id, position)
SELECT 
    (SELECT deck_id FROM decks WHERE name = 'Gospel Essentials'),
    id,
    ROW_NUMBER() OVER (ORDER BY book_id, chapter_number, verse_number)
FROM bible_verses
WHERE 
    (book_id = 43 AND chapter_number = 3 AND verse_number = 16) OR
    (book_id = 43 AND chapter_number = 14 AND verse_number = 6) OR
    (book_id = 40 AND chapter_number = 28 AND verse_number IN (19, 20));

-- Add verses to Romans Road (Romans 3:23, 6:23, 5:8, 10:9-10, 10:13)
INSERT INTO deck_verses (deck_id, verse_id, position)
SELECT 
    (SELECT deck_id FROM decks WHERE name = 'Romans Road'),
    id,
    ROW_NUMBER() OVER (ORDER BY chapter_number, verse_number)
FROM bible_verses
WHERE book_id = 45 AND (
    (chapter_number = 3 AND verse_number = 23) OR
    (chapter_number = 6 AND verse_number = 23) OR
    (chapter_number = 5 AND verse_number = 8) OR
    (chapter_number = 10 AND verse_number IN (9, 10, 13))
);

-- Verify what was added
SELECT 
    d.name as deck_name,
    COUNT(dv.verse_id) as verse_count
FROM decks d
LEFT JOIN deck_verses dv ON d.deck_id = dv.deck_id
GROUP BY d.deck_id, d.name;