export interface FlowVerse {
  verseCode: string;
  reference: string;
  text: string;
  firstLetters: string;
  isMemorized: boolean;
  isFifth: boolean;
  bookName: string;
  chapter: number;
  verse: number;
  isSaving?: boolean;
}

export interface ModalVerse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface FlowState {
  bookId?: number;
  chapter?: number;
  layoutMode: 'grid' | 'single';
  isTextMode: boolean;
  highlightFifthVerse: boolean;
  showVerseNumbers: boolean;
  fontSize: number;
}

export interface FlowViewSettings {
  layoutMode: 'grid' | 'single';
  isTextMode: boolean;
  highlightFifthVerse: boolean;
  showVerseNumbers: boolean;
  fontSize: number;
}
