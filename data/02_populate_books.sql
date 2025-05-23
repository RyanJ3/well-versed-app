-- /data/02_populate_books.sql
-- Populate books and chapter verse counts

-- Books data
INSERT INTO books (book_id, book_code, book_name, testament, book_group, total_chapters, total_verses, canonical_affiliation, is_apocryphal_book, display_order) VALUES
(1, 'GEN', 'Genesis', 'Old Testament', 'Torah', 50, 1533, 'All', FALSE, 1),
(2, 'EXO', 'Exodus', 'Old Testament', 'Torah', 40, 1213, 'All', FALSE, 2),
(3, 'LEV', 'Leviticus', 'Old Testament', 'Torah', 27, 859, 'All', FALSE, 3),
(4, 'NUM', 'Numbers', 'Old Testament', 'Torah', 36, 1288, 'All', FALSE, 4),
(5, 'DEU', 'Deuteronomy', 'Old Testament', 'Torah', 34, 959, 'All', FALSE, 5),
(6, 'JOS', 'Joshua', 'Old Testament', 'Historical', 24, 658, 'All', FALSE, 6),
(7, 'JDG', 'Judges', 'Old Testament', 'Historical', 21, 618, 'All', FALSE, 7),
(8, 'RUT', 'Ruth', 'Old Testament', 'Historical', 4, 85, 'All', FALSE, 8),
(9, '1SA', '1 Samuel', 'Old Testament', 'Historical', 31, 810, 'All', FALSE, 9),
(10, '2SA', '2 Samuel', 'Old Testament', 'Historical', 24, 695, 'All', FALSE, 10),
(11, '1KI', '1 Kings', 'Old Testament', 'Historical', 22, 816, 'All', FALSE, 11),
(12, '2KI', '2 Kings', 'Old Testament', 'Historical', 25, 719, 'All', FALSE, 12),
(13, '1CH', '1 Chronicles', 'Old Testament', 'Historical', 29, 942, 'All', FALSE, 13),
(14, '2CH', '2 Chronicles', 'Old Testament', 'Historical', 36, 822, 'All', FALSE, 14),
(15, 'EZR', 'Ezra', 'Old Testament', 'Historical', 10, 280, 'All', FALSE, 15),
(16, 'NEH', 'Nehemiah', 'Old Testament', 'Historical', 13, 406, 'All', FALSE, 16),
(17, 'EST', 'Esther', 'Old Testament', 'Historical', 10, 167, 'All', FALSE, 17),
(18, 'JOB', 'Job', 'Old Testament', 'Wisdom', 42, 1070, 'All', FALSE, 18),
(19, 'PSA', 'Psalms', 'Old Testament', 'Wisdom', 150, 2461, 'All', FALSE, 19),
(20, 'PRO', 'Proverbs', 'Old Testament', 'Wisdom', 31, 915, 'All', FALSE, 20),
(21, 'ECC', 'Ecclesiastes', 'Old Testament', 'Wisdom', 12, 222, 'All', FALSE, 21),
(22, 'SOS', 'Song of Solomon', 'Old Testament', 'Wisdom', 8, 117, 'All', FALSE, 22),
(23, 'ISA', 'Isaiah', 'Old Testament', 'Major Prophets', 66, 1292, 'All', FALSE, 23),
(24, 'JER', 'Jeremiah', 'Old Testament', 'Major Prophets', 52, 1364, 'All', FALSE, 24),
(25, 'LAM', 'Lamentations', 'Old Testament', 'Major Prophets', 5, 154, 'All', FALSE, 25),
(26, 'EZK', 'Ezekiel', 'Old Testament', 'Major Prophets', 48, 1273, 'All', FALSE, 26),
(27, 'DAN', 'Daniel', 'Old Testament', 'Major Prophets', 12, 357, 'All', FALSE, 27),
(28, 'HOS', 'Hosea', 'Old Testament', 'Minor Prophets', 14, 197, 'All', FALSE, 28),
(29, 'JOL', 'Joel', 'Old Testament', 'Minor Prophets', 3, 73, 'All', FALSE, 29),
(30, 'AMO', 'Amos', 'Old Testament', 'Minor Prophets', 9, 146, 'All', FALSE, 30),
(31, 'OBA', 'Obadiah', 'Old Testament', 'Minor Prophets', 1, 21, 'All', FALSE, 31),
(32, 'JON', 'Jonah', 'Old Testament', 'Minor Prophets', 4, 48, 'All', FALSE, 32),
(33, 'MIC', 'Micah', 'Old Testament', 'Minor Prophets', 7, 105, 'All', FALSE, 33),
(34, 'NAH', 'Nahum', 'Old Testament', 'Minor Prophets', 3, 47, 'All', FALSE, 34),
(35, 'HAB', 'Habakkuk', 'Old Testament', 'Minor Prophets', 3, 56, 'All', FALSE, 35),
(36, 'ZEP', 'Zephaniah', 'Old Testament', 'Minor Prophets', 3, 53, 'All', FALSE, 36),
(37, 'HAG', 'Haggai', 'Old Testament', 'Minor Prophets', 2, 38, 'All', FALSE, 37),
(38, 'ZEC', 'Zechariah', 'Old Testament', 'Minor Prophets', 14, 211, 'All', FALSE, 38),
(39, 'MAL', 'Malachi', 'Old Testament', 'Minor Prophets', 4, 55, 'All', FALSE, 39),
-- New Testament
(40, 'MAT', 'Matthew', 'New Testament', 'Gospels', 28, 1071, 'All', FALSE, 40),
(41, 'MRK', 'Mark', 'New Testament', 'Gospels', 16, 678, 'All', FALSE, 41),
(42, 'LUK', 'Luke', 'New Testament', 'Gospels', 24, 1151, 'All', FALSE, 42),
(43, 'JHN', 'John', 'New Testament', 'Gospels', 21, 879, 'All', FALSE, 43),
(44, 'ACT', 'Acts', 'New Testament', 'Modern Historical', 28, 1007, 'All', FALSE, 44),
(45, 'ROM', 'Romans', 'New Testament', 'Pauline Epistles', 16, 433, 'All', FALSE, 45),
(46, '1CO', '1 Corinthians', 'New Testament', 'Pauline Epistles', 16, 437, 'All', FALSE, 46),
(47, '2CO', '2 Corinthians', 'New Testament', 'Pauline Epistles', 13, 257, 'All', FALSE, 47),
(48, 'GAL', 'Galatians', 'New Testament', 'Pauline Epistles', 6, 149, 'All', FALSE, 48),
(49, 'EPH', 'Ephesians', 'New Testament', 'Pauline Epistles', 6, 155, 'All', FALSE, 49),
(50, 'PHP', 'Philippians', 'New Testament', 'Pauline Epistles', 4, 104, 'All', FALSE, 50),
(51, 'COL', 'Colossians', 'New Testament', 'Pauline Epistles', 4, 95, 'All', FALSE, 51),
(52, '1TH', '1 Thessalonians', 'New Testament', 'Pauline Epistles', 5, 89, 'All', FALSE, 52),
(53, '2TH', '2 Thessalonians', 'New Testament', 'Pauline Epistles', 3, 47, 'All', FALSE, 53),
(54, '1TI', '1 Timothy', 'New Testament', 'Pauline Epistles', 6, 113, 'All', FALSE, 54),
(55, '2TI', '2 Timothy', 'New Testament', 'Pauline Epistles', 4, 83, 'All', FALSE, 55),
(56, 'TIT', 'Titus', 'New Testament', 'Pauline Epistles', 3, 46, 'All', FALSE, 56),
(57, 'PHM', 'Philemon', 'New Testament', 'Pauline Epistles', 1, 25, 'All', FALSE, 57),
(58, 'HEB', 'Hebrews', 'New Testament', 'Pauline Epistles', 13, 303, 'All', FALSE, 58),
(59, 'JAS', 'James', 'New Testament', 'General Epistles', 5, 108, 'All', FALSE, 59),
(60, '1PE', '1 Peter', 'New Testament', 'General Epistles', 5, 105, 'All', FALSE, 60),
(61, '2PE', '2 Peter', 'New Testament', 'General Epistles', 3, 61, 'All', FALSE, 61),
(62, '1JN', '1 John', 'New Testament', 'General Epistles', 5, 105, 'All', FALSE, 62),
(63, '2JN', '2 John', 'New Testament', 'General Epistles', 1, 13, 'All', FALSE, 63),
(64, '3JN', '3 John', 'New Testament', 'General Epistles', 1, 15, 'All', FALSE, 64),
(65, 'JDE', 'Jude', 'New Testament', 'General Epistles', 1, 25, 'All', FALSE, 65),
(66, 'REV', 'Revelation', 'New Testament', 'Apocalyptic', 22, 404, 'All', FALSE, 66),
-- Apocryphal books
(67, 'TOB', 'Tobit', 'Old Testament', 'Historical', 14, 244, 'Catholic', TRUE, 67),
(68, 'JDT', 'Judith', 'Old Testament', 'Historical', 16, 339, 'Catholic', TRUE, 68),
(69, 'WIS', 'Wisdom of Solomon', 'Old Testament', 'Wisdom', 19, 436, 'Catholic', TRUE, 69),
(70, 'SIR', 'Sirach', 'Old Testament', 'Wisdom', 51, 1424, 'Catholic', TRUE, 70),
(71, 'BAR', 'Baruch', 'Old Testament', 'Major Prophets', 6, 213, 'Catholic', TRUE, 71),
(72, '1MA', '1 Maccabees', 'Old Testament', 'Historical', 16, 924, 'Catholic', TRUE, 72),
(73, '2MA', '2 Maccabees', 'Old Testament', 'Historical', 15, 555, 'Catholic', TRUE, 73),
(74, '1ES', '1 Esdras', 'Old Testament', 'Historical', 9, 439, 'Eastern Orthodox', TRUE, 74),
(75, '3MA', '3 Maccabees', 'Old Testament', 'Historical', 7, 227, 'Eastern Orthodox', TRUE, 75),
(76, '4MA', '4 Maccabees', 'Old Testament', 'Historical', 18, 366, 'Eastern Orthodox', TRUE, 76),
(77, 'PAM', 'Prayer of Manasseh', 'Old Testament', 'Wisdom', 1, 15, 'Eastern Orthodox', TRUE, 77);

-- Psalm 151 is handled as chapter 151 of Psalms
UPDATE books SET total_chapters = 151 WHERE book_code = 'PSA';

-- Sample chapter verse counts (Genesis and Psalms for example)
INSERT INTO chapter_verse_counts (book_id, chapter_number, verse_count) VALUES
-- Genesis chapters
(1, 1, 31), (1, 2, 25), (1, 3, 24), (1, 4, 26), (1, 5, 32),
(1, 6, 22), (1, 7, 24), (1, 8, 22), (1, 9, 29), (1, 10, 32),
-- ... add all chapters
-- Psalms chapters (showing some)
(19, 1, 6), (19, 2, 12), (19, 3, 8), (19, 23, 6), (19, 119, 176), (19, 151, 7),
-- Daniel chapters
(27, 1, 21), (27, 2, 49), (27, 3, 100), (27, 4, 34), (27, 5, 30),
(27, 6, 29), (27, 7, 28), (27, 8, 27), (27, 9, 27), (27, 10, 21),
(27, 11, 45), (27, 12, 13), (27, 13, 64), (27, 14, 42);

-- Note: You'll need to populate all chapter_verse_counts from bible_base_data.json