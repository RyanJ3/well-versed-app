export interface WorkspaceVerse {
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
  // Cross-reference specific fields
  fullReference?: string;
  verseNumber?: number;
  index?: number;
  practiceCount?: number;
  confidenceScore?: number;
  crossRefConfidence?: number;
  direction?: 'from' | 'to';
  // Topical verses specific fields
  topicRelevance?: number;
  topicName?: string;
  // Additional fields for unified interface
  verseId?: number;
  displayText?: string;
  isNewSentence?: boolean;
  isNewParagraph?: boolean;
  // Fields for verse ranges
  isRange?: boolean;
  endVerse?: number;
  endChapter?: number;
  verseCount?: number;
}

export class WorkspaceVerseImpl implements WorkspaceVerse {
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
  isNewParagraph?: boolean;
  isNewSentence?: boolean;

  constructor(data: WorkspaceVerse) {
    this.verseCode = data.verseCode;
    this.reference = data.reference;
    this.text = data.text;
    this.firstLetters = data.firstLetters;
    this.isMemorized = data.isMemorized;
    this.isFifth = data.isFifth;
    this.bookName = data.bookName;
    this.chapter = data.chapter;
    this.verse = data.verse;
    this.isSaving = data.isSaving || false;
    this.isNewParagraph = data.isNewParagraph || this.checkIsNewParagraph();
    this.isNewSentence = data.isNewSentence || false;
  }

  private checkIsNewParagraph(): boolean {
    return this.text.startsWith('¶') || this.text.includes('**¶');
  }
}

export interface ModalVerse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface WorkspaceState {
  bookId?: number;
  chapter?: number;
  layoutMode: 'grid' | 'single';
  isTextMode: boolean;
  highlightFifthVerse: boolean;
  showVerseNumbers: boolean;
  fontSize: number;
}

export interface WorkspaceViewSettings {
  layoutMode: 'grid' | 'single';
  isTextMode: boolean;
  highlightFifthVerse: boolean;
  showVerseNumbers: boolean;
  fontSize: number;
}