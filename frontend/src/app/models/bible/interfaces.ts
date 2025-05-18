// src/app/models/bible/interfaces.ts
// API Interface Models

/**
 * Represents a verse as returned from the API
 */
export interface BibleVerse {
  verse_id: string;
  book_id: string;
  chapter_number: number;
  verse_number: number;
  isApocryphal: boolean; // Added field from database
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