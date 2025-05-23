-- /data/03_populate_apocrypha.sql
-- Define apocryphal content

INSERT INTO apocryphal_content (book_id, chapter_number, verse_start, verse_end, description) VALUES
-- Psalms
(19, 151, NULL, NULL, 'Psalm 151'),
-- Daniel additions
(27, 3, 24, 90, 'Prayer of Azariah and Song of the Three Holy Children'),
(27, 13, NULL, NULL, 'Susanna'),
(27, 14, NULL, NULL, 'Bel and the Dragon'),
-- Esther additions (Greek Esther)
(17, 10, 4, 16, 'Additions to Esther'),
(17, 11, NULL, NULL, 'Additions to Esther'),
(17, 12, NULL, NULL, 'Additions to Esther'),
(17, 13, NULL, NULL, 'Additions to Esther'),
(17, 14, NULL, NULL, 'Additions to Esther'),
(17, 15, NULL, NULL, 'Additions to Esther'),
(17, 16, NULL, NULL, 'Additions to Esther');