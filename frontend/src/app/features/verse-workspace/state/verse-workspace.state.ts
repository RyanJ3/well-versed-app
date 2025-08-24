import { BibleBook, BibleChapter } from '@models/bible';

// Main state interface that consolidates all the previous services
export interface VerseWorkspaceState {
  // Core Data
  verses: VerseData[];
  currentBook: BibleBook | null;
  currentChapter: BibleChapter | null;
  
  // UI State
  ui: UIState;
  
  // Selection State
  selection: SelectionState;
  
  // Memorization State
  memorization: MemorizationState;
  
  // Settings
  settings: WorkspaceSettings;
  
  // Loading & Error States
  loading: LoadingState;
  errors: ErrorState;
}

export interface VerseData {
  id: string;
  verseCode: string;
  bookId: number;
  chapterNumber: number;
  verseNumber: number;
  text: string;
  isMemorized: boolean;
  confidence: number;
  practiceCount: number;
  lastPracticed: Date | null;
  isSelected: boolean;
  isHighlighted: boolean;
  crossReferences?: CrossReference[];
  topics?: string[];
}

export interface UIState {
  mode: 'chapter' | 'topical' | 'custom';
  viewType: 'grid' | 'list';
  isHeaderExpanded: boolean;
  showFilters: boolean;
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  activeModal: 'memorization' | 'settings' | 'deck' | null;
  sidebarCollapsed: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface SelectionState {
  selectedVerses: string[]; // verse IDs
  selectionMode: boolean;
  rangeStart: string | null;
  rangeEnd: string | null;
  lastSelectedIndex: number | null;
}

export interface MemorizationState {
  activeSession: MemorizationSession | null;
  history: MemorizationHistory[];
  streakDays: number;
  totalVersesMemorized: number;
  dailyGoal: number;
  dailyProgress: number;
}

export interface MemorizationSession {
  id: string;
  startTime: Date;
  verses: string[];
  currentIndex: number;
  mode: 'practice' | 'test' | 'review';
  difficulty: 'easy' | 'medium' | 'hard';
  mistakeCount: number;
  hintsUsed: number;
  completed: boolean;
}

export interface MemorizationHistory {
  sessionId: string;
  date: Date;
  versesStudied: number;
  accuracy: number;
  timeSpent: number;
}

export interface WorkspaceSettings {
  autoAdvance: boolean;
  showVerseNumbers: boolean;
  showProgressBar: boolean;
  highlightNewVerses: boolean;
  defaultDifficulty: 'easy' | 'medium' | 'hard';
  practiceMode: 'sequential' | 'random';
  hideMemorizedVerses: boolean;
  groupBySection: boolean;
}

export interface LoadingState {
  verses: boolean;
  saving: boolean;
  crossReferences: boolean;
  topics: boolean;
}

export interface ErrorState {
  message: string | null;
  code: string | null;
  timestamp: Date | null;
}

export interface CrossReference {
  verseCode: string;
  reference: string;
  text: string;
}

// Initial State
export const initialVerseWorkspaceState: VerseWorkspaceState = {
  verses: [],
  currentBook: null,
  currentChapter: null,
  
  ui: {
    mode: 'chapter',
    viewType: 'grid',
    isHeaderExpanded: false,
    showFilters: false,
    showContextMenu: false,
    contextMenuPosition: null,
    activeModal: null,
    sidebarCollapsed: false,
    fontSize: 'medium'
  },
  
  selection: {
    selectedVerses: [],
    selectionMode: false,
    rangeStart: null,
    rangeEnd: null,
    lastSelectedIndex: null
  },
  
  memorization: {
    activeSession: null,
    history: [],
    streakDays: 0,
    totalVersesMemorized: 0,
    dailyGoal: 5,
    dailyProgress: 0
  },
  
  settings: {
    autoAdvance: true,
    showVerseNumbers: true,
    showProgressBar: true,
    highlightNewVerses: true,
    defaultDifficulty: 'medium',
    practiceMode: 'sequential',
    hideMemorizedVerses: false,
    groupBySection: false
  },
  
  loading: {
    verses: false,
    saving: false,
    crossReferences: false,
    topics: false
  },
  
  errors: {
    message: null,
    code: null,
    timestamp: null
  }
};