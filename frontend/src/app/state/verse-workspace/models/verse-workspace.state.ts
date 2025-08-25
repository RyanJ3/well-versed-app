import { WorkspaceVerse, ModalVerse } from '@features/verse-workspace/models/workspace.models';
import { BibleBook, BibleChapter } from '@models/bible';

export interface VerseWorkspaceState {
  // Current context
  currentBook: BibleBook | null;
  currentChapter: number;
  currentBibleChapter: BibleChapter | null;
  
  // Verses data
  verses: WorkspaceVerse[];
  filteredVerses: WorkspaceVerse[];
  
  // Cross-references
  crossReferences: {
    verses: WorkspaceVerse[];
    selectedVerse: CrossReferenceSelection | null;
    isLoading: boolean;
  };
  
  // Topical verses
  topical: {
    verses: WorkspaceVerse[];
    selectedTopic: Topic | null;
    availableTopics: Topic[];
    isLoading: boolean;
  };
  
  // Selection state
  selection: {
    selectedVerses: string[]; // verse codes
    lastClickedIndex: number | null;
    isDragging: boolean;
    dragStart: number | null;
    dragEnd: number | null;
  };
  
  // Memorization state
  memorization: {
    modalVerses: ModalVerse[];
    verseReviewData: Record<string, ReviewData>;
    isSaving: Record<string, boolean>; // verse code -> saving status
  };
  
  // UI state
  ui: {
    mode: 'memorization' | 'crossReferences' | 'topical';
    showFullText: boolean;
    fontSize: number;
    layoutMode: 'grid' | 'single';
    activeFilter: 'all' | 'unmemorized' | 'needsReview';
    showSettings: boolean;
    showModal: boolean;
    modalChapterName: string;
    contextMenu: ContextMenuState;
    targetVerseAfterLoad: number | null;
    showEncouragement: string;
    encouragementTimeout: number | null;
  };
  
  // Loading states
  loading: {
    verses: boolean;
    crossReferences: boolean;
    topicalVerses: boolean;
    saving: boolean;
  };
  
  // Error states
  errors: {
    loadVerses: string | null;
    loadCrossReferences: string | null;
    loadTopicalVerses: string | null;
    saveVerse: string | null;
  };
}

export interface CrossReferenceSelection {
  bookId: number;
  bookName: string;
  chapter: number;
  verse: number;
  verseCode: string;
  displayText: string;
}

export interface Topic {
  id: number;
  name: string;
  description?: string;
  verseCount?: number;
  category?: string;
}

export interface ReviewData {
  lastReviewed: number;
  strength: number;
  practiceCount?: number;
}

export interface ContextMenuState {
  show: boolean;
  x: number;
  y: number;
  verseId: string | null;
  selectedCount: number;
}

export const initialVerseWorkspaceState: VerseWorkspaceState = {
  currentBook: null,
  currentChapter: 1,
  currentBibleChapter: null,
  
  verses: [],
  filteredVerses: [],
  
  crossReferences: {
    verses: [],
    selectedVerse: null,
    isLoading: false
  },
  
  topical: {
    verses: [],
    selectedTopic: null,
    availableTopics: [],
    isLoading: false
  },
  
  selection: {
    selectedVerses: [],
    lastClickedIndex: null,
    isDragging: false,
    dragStart: null,
    dragEnd: null
  },
  
  memorization: {
    modalVerses: [],
    verseReviewData: {},
    isSaving: {}
  },
  
  ui: {
    mode: 'memorization',
    showFullText: false,
    fontSize: 16,
    layoutMode: 'grid',
    activeFilter: 'all',
    showSettings: false,
    showModal: false,
    modalChapterName: '',
    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      verseId: null,
      selectedCount: 0
    },
    targetVerseAfterLoad: null,
    showEncouragement: '',
    encouragementTimeout: null
  },
  
  loading: {
    verses: false,
    crossReferences: false,
    topicalVerses: false,
    saving: false
  },
  
  errors: {
    loadVerses: null,
    loadCrossReferences: null,
    loadTopicalVerses: null,
    saveVerse: null
  }
};