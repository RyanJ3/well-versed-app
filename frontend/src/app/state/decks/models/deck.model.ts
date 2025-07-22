import { EntityState } from '@ngrx/entity';

// Core Entities
export interface Deck {
  id: number;
  name: string;
  description: string;
  category: DeckCategory;
  cardCount: number;
  newCardsCount: number;
  dueCardsCount: number;
  isPublic: boolean;
  isFavorite: boolean;
  lastStudied: Date | null;
  created: Date;
  updated: Date;
  masteryScore: number; // 0-100
  studyStreak: number;
  tags: string[];
}

export interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  hint?: string;
  verseReference?: string;
  audioUrl?: string;
  imageUrl?: string;
  
  // Spaced Repetition Fields
  easeFactor: number;      // 1.3 - 2.5
  interval: number;        // Days until next review
  repetitions: number;     // Number of successful reviews
  lapses: number;         // Number of times forgotten
  
  // Study Data
  lastReviewed: Date | null;
  nextReview: Date | null;
  studyCount: number;
  averageResponseTime: number; // seconds
  
  // State
  status: CardStatus;
  created: Date;
  updated: Date;
}

export enum DeckCategory {
  BIBLE_VERSES = 'bible_verses',
  THEOLOGY = 'theology',
  CATECHISM = 'catechism',
  HYMNS = 'hymns',
  CUSTOM = 'custom'
}

export enum CardStatus {
  NEW = 'new',
  LEARNING = 'learning',
  REVIEW = 'review',
  RELEARNING = 'relearning',
  SUSPENDED = 'suspended'
}

// State Interfaces
export interface DecksState {
  decks: EntityState<Deck>;
  cards: EntityState<Card>;
  filter: DeckFilter;
  sort: DeckSort;
  ui: DeckUIState;
  sync: SyncState;
}

export interface DeckFilter {
  searchTerm: string;
  categories: DeckCategory[];
  showOnlyDue: boolean;
  showOnlyFavorites: boolean;
  showPublic: boolean;
  tags: string[];
}

export interface DeckSort {
  field: 'name' | 'created' | 'updated' | 'dueCards' | 'mastery';
  direction: 'asc' | 'desc';
}

export interface DeckUIState {
  selectedDeckId: number | null;
  selectedCardIds: number[];
  viewMode: 'grid' | 'list' | 'compact';
  isCreating: boolean;
  isImporting: boolean;
}

export interface SyncState {
  isSyncing: boolean;
  lastSync: Date | null;
  pendingChanges: number;
  syncError: string | null;
}

// API Models
export interface CreateDeckRequest {
  name: string;
  description: string;
  category: DeckCategory;
  isPublic: boolean;
  tags: string[];
  initialCards?: CreateCardRequest[];
}

export interface CreateCardRequest {
  front: string;
  back: string;
  hint?: string;
  verseReference?: string;
}

export interface UpdateDeckRequest {
  name?: string;
  description?: string;
  category?: DeckCategory;
  isPublic?: boolean;
  tags?: string[];
}

export interface StudySessionResult {
  deckId: number;
  cardsStudied: number;
  correctCount: number;
  averageResponseTime: number;
  masteryChange: number;
  streakMaintained: boolean;
}

export interface ImportDeckRequest {
  format: 'csv' | 'anki' | 'json';
  data: string | File;
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    preserveSchedule: boolean;
  };
}
