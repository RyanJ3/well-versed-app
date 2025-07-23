import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  StartSessionRequest,
  ActiveSession,
  CardResponse,
  ResponseQuality,
  PracticeSettings,
  SessionSummary,
  CompletedSession
} from '../models/practice-session.model';

export const PracticeSessionActions = createActionGroup({
  source: 'Practice Session',
  events: {
    // Session Lifecycle
    'Start Session': props<{ request: StartSessionRequest }>(),
    'Start Session Success': props<{ session: ActiveSession }>(),
    'Start Session Failure': props<{ error: string }>(),
    
    'Pause Session': emptyProps(),
    'Resume Session': emptyProps(),
    'End Session': emptyProps(),
    'Abandon Session': emptyProps(),
    
    'Complete Session': emptyProps(),
    'Complete Session Success': props<{ summary: SessionSummary }>(),
    'Complete Session Failure': props<{ error: string }>(),
    
    // Card Actions
    'Show Next Card': emptyProps(),
    'Show Previous Card': emptyProps(),
    'Flip Card': emptyProps(),
    'Show Hint': emptyProps(),
    'Play Audio': emptyProps(),
    
    // Response Submission
    'Submit Response': props<{
      cardId: number;
      quality: ResponseQuality;
      responseTime: number;
      hintsUsed: number;
    }>(),
    'Submit Response Success': props<{ response: CardResponse }>(),
    'Submit Response Failure': props<{ error: string }>(),
    
    // Skip Card
    'Skip Card': props<{ cardId: number }>(),
    'Skip Card Success': emptyProps(),
    
    // Settings
    'Update Settings': props<{ settings: Partial<PracticeSettings> }>(),
    'Save Settings': emptyProps(),
    'Reset Settings': emptyProps(),
    
    // History
    'Load Session History': emptyProps(),
    'Load Session History Success': props<{ sessions: CompletedSession[] }>(),
    'Load Session History Failure': props<{ error: string }>(),
    
    // UI Actions
    'Toggle Stats': emptyProps(),
    'Toggle Settings': emptyProps(),
    'Show Feedback': props<{ message: string; type: 'success' | 'error' | 'info' }>(),
    'Hide Feedback': emptyProps(),
    
    // Performance Updates
    'Update Performance Metrics': emptyProps(),
    'Calculate Session Stats': emptyProps(),
  }
});

// Separate action group for keyboard shortcuts
export const PracticeKeyboardActions = createActionGroup({
  source: 'Practice Keyboard',
  events: {
    'Press Space': emptyProps(),      // Flip card
    'Press Enter': emptyProps(),      // Submit/Next
    'Press Number': props<{ key: number }>(), // Quality rating 1-4
    'Press H': emptyProps(),          // Show hint
    'Press S': emptyProps(),          // Skip card
    'Press P': emptyProps(),          // Play audio
    'Press Escape': emptyProps(),     // Pause/Settings
  }
});
