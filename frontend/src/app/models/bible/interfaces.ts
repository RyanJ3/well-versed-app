/**
 * Represents a verse as returned from the API
 */
export interface BibleVerse {
  verse_id: string;     // Format: "bookId-chapter-verse" (e.g., "1-1-1" for Genesis 1:1)
  book_id: number;      // Changed to number (e.g., 1 for Genesis, 40 for Matthew)
  chapter_number: number;
  verse_number: number;
  isApocryphal: boolean;
}

/**
 * Represents a user's interaction with a verse
 */
export interface UserVerse {
  user_id: number;
  verse_id: string;
  practice_count: number;
  last_practiced?: Date;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Represents detailed information about a user's verse including the verse data
 */
export interface UserVerseDetail {
  verse: BibleVerse;
  practice_count: number;
  last_practiced?: Date;
  created_at: Date;
  updated_at?: Date;
}

/**
 * Represents a user's progress memorizing a specific passage
 */
export interface MemorizationProgress {
  reference: string;
  progress: number;
  lastPracticed?: Date;
}