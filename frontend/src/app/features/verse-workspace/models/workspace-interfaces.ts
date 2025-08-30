/**
 * Interfaces for strongly-typed verse workspace data
 */

/**
 * Represents a cross-reference verse selection
 */
export interface CrossReferenceVerse {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  verseCode: string;
  displayText: string;
  text?: string;
}

/**
 * Represents a topical study topic
 */
export interface Topic {
  topicId: number;
  topicName: string;
  description?: string;
  verseCount?: number;
  category?: string;
}

/**
 * Represents a flashcard deck
 */
export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  verseCount: number;
  lastStudied?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Context menu data structure
 */
export interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  verseId: string | null;
  selectedCount: number;
}

/**
 * Review data for memorization tracking
 */
export interface VerseReviewData {
  lastReviewed: number;
  strength: number;
  practiceCount?: number;
  lastScore?: number;
}

/**
 * Settings configuration
 */
export interface WorkspaceSettings {
  fontSize: number;
  layoutMode: string;
  showFullText: boolean;
  theme?: string;
}

/**
 * Navigation event payload
 */
export interface NavigationPayload {
  chapter?: number;
  previousChapter?: number;
  bookId?: number;
  previousBookId?: number;
}

/**
 * Study session configuration
 */
export interface StudySessionConfig {
  verseCodes: string[];
  mode: string;
  duration?: number;
  difficulty?: string;
}