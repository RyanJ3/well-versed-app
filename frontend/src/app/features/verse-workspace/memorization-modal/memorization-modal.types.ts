// memorization-modal.types.ts

export interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface PracticeSettings {
  fontSize: number;
  layoutMode: 'column' | 'paragraph';
}

export interface ProgressMarker {
  position: number;
  type: 'star' | 'flag' | 'finish';
  completed: boolean;
  id: string;
  label?: string;
}

export interface ReviewStage {
  groups: Verse[][];
  stageType: 'individual' | 'review' | 'final';
  stageLevel: number;
}

export interface StarPopup {
  starId: string;
  message: string;
  show: boolean;
  visible: boolean;
}

export interface AnimatedStar {
  show: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface MemorizationState {
  setup: boolean;
  promptSave: boolean;
  currentStageIndex: number;
  currentSubStageIndex: number;
  currentStepIndex: number;
  completedSteps: number;
  totalSteps: number;
}

export interface CompletionData {
  chapterName: string;
  verseCount: number;
  timeSpent: number;
  isLastChapterOfBible: boolean;
  nextChapterName: string;
  hasMarkedComplete: boolean;
  showNavigationOptions: boolean;
  isSaving: boolean;
  saveError: boolean;
  showSuccessCheck: boolean;
}

export interface NavigationOptions {
  canGoBack: boolean;
  currentStepIndex: number;
  nextDisabled: boolean;
  stageNames: string[];
}