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

export class FlowVerseImpl implements FlowVerse {
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

  constructor(data: FlowVerse) {
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
  }

  isNewParagraph(): boolean {
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