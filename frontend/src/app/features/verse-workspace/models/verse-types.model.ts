// Base verse interface with only core properties
export interface BaseVerse {
  verseCode: string;
  reference: string;
  text: string;
  bookName?: string;
  chapter?: number;
  verseNumber?: number;
  displayReference?: string;
}

// Memorization-specific verse
export interface MemorizationVerse extends BaseVerse {
  isMemorized: boolean;
  lastReviewDate?: Date;
  reviewCount?: number;
  memorizationDate?: Date;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isFirstInChapter?: boolean;
  isLastInChapter?: boolean;
  nextVerseCode?: string;
  previousVerseCode?: string;
  chapterProgress?: {
    memorized: number;
    total: number;
    percentage: number;
  };
}

// Cross-reference specific verse
export interface CrossReferenceVerse extends BaseVerse {
  crossRefConfidence: number;
  direction: 'from' | 'to';
  relationship?: string;
  sourceVerseCode: string;
  targetVerseCode: string;
  isSelected?: boolean;
  index?: number;
}

// Topical verse
export interface TopicalVerse extends BaseVerse {
  topicRelevance: number;
  topicName: string;
  topicId?: string;
  subtopic?: string;
  isMemorized?: boolean;
  isSelected?: boolean;
  index?: number;
}

// Study session verse (for memorization modal)
export interface StudyVerse extends BaseVerse {
  studyMode: 'learn' | 'review' | 'test';
  difficulty?: number;
  lastAttemptCorrect?: boolean;
  attemptCount?: number;
  hintLevel?: number;
}

// Type guards
export function isMemorizationVerse(verse: BaseVerse): verse is MemorizationVerse {
  return 'isMemorized' in verse;
}

export function isCrossReferenceVerse(verse: BaseVerse): verse is CrossReferenceVerse {
  return 'crossRefConfidence' in verse && 'direction' in verse;
}

export function isTopicalVerse(verse: BaseVerse): verse is TopicalVerse {
  return 'topicRelevance' in verse && 'topicName' in verse;
}

export function isStudyVerse(verse: BaseVerse): verse is StudyVerse {
  return 'studyMode' in verse;
}

// Factory functions
export function createMemorizationVerse(base: BaseVerse, additional?: Partial<MemorizationVerse>): MemorizationVerse {
  return {
    ...base,
    isMemorized: false,
    ...additional
  };
}

export function createCrossReferenceVerse(
  base: BaseVerse, 
  sourceVerseCode: string,
  confidence: number,
  direction: 'from' | 'to'
): CrossReferenceVerse {
  return {
    ...base,
    sourceVerseCode,
    targetVerseCode: base.verseCode,
    crossRefConfidence: confidence,
    direction
  };
}

export function createTopicalVerse(
  base: BaseVerse,
  topicName: string,
  relevance: number
): TopicalVerse {
  return {
    ...base,
    topicName,
    topicRelevance: relevance
  };
}