export interface Verse {
  code: string;
  text: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
}

export interface ReviewStage {
  groups: Verse[][];
  stageType: 'individual' | 'review' | 'final';
  stageLevel: number;
}

export interface ProgressMarker {
  position: number;
  type: 'star' | 'flag' | 'finish';
  completed: boolean;
  id: string;
  label?: string;
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

export interface PracticeSettings {
  fontSize: number;
  layoutMode: 'column' | 'paragraph';
}

export interface MemorizationState {
  visible: boolean;
  setup: boolean;
  groupSize: number;
  allStages: ReviewStage[];
  currentStageIndex: number;
  currentSubStageIndex: number;
  currentStepIndex: number;
  promptSave: boolean;
  completedSteps: number;
  totalSteps: number;
  showExitConfirm: boolean;
  showExitWithoutSaveConfirm: boolean;
}
