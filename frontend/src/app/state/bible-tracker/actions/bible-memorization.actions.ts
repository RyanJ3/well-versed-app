import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  ToggleVerseRequest,
  BulkVerseOperation,
  UserVerseDetail,
  ProgressSegment
} from '@models/bible-memorization.model';

export const BibleMemorizationActions = createActionGroup({
  source: 'Bible Memorization',
  events: {
    // Initialization
    'Initialize': emptyProps(),
    'Initialize Success': emptyProps(),
    'Initialize Failure': props<{ error: string }>(),
    
    // Load memorization data
    'Load Memorization Progress': props<{ userId: number; forceRefresh?: boolean }>(),
    'Load Memorization Progress Success': props<{ verses: UserVerseDetail[] }>(),
    'Load Memorization Progress Failure': props<{ error: string }>(),
    
    // Single verse operations
    'Toggle Verse Memorization': props<ToggleVerseRequest>(),
    'Toggle Verse Memorization Success': props<{ request: ToggleVerseRequest }>(),
    'Toggle Verse Memorization Failure': props<{ request: ToggleVerseRequest; error: string }>(),
    
    // Bulk operations
    'Memorize All Chapter Verses': props<BulkVerseOperation>(),
    'Memorize All Chapter Verses Success': props<{ 
      operation: BulkVerseOperation; 
      bookName: string; 
      chapterNumber?: number 
    }>(),
    'Memorize All Chapter Verses Failure': props<{ error: string }>(),
    
    'Clear All Chapter Verses': props<BulkVerseOperation>(),
    'Clear All Chapter Verses Success': props<{ 
      operation: BulkVerseOperation; 
      bookName: string; 
      chapterNumber?: number 
    }>(),
    'Clear All Chapter Verses Failure': props<{ error: string }>(),
    
    'Memorize All Book Verses': props<BulkVerseOperation>(),
    'Memorize All Book Verses Success': props<{ 
      operation: BulkVerseOperation; 
      bookName: string 
    }>(),
    'Memorize All Book Verses Failure': props<{ error: string }>(),
    
    'Clear All Book Verses': props<BulkVerseOperation>(),
    'Clear All Book Verses Success': props<{ 
      operation: BulkVerseOperation; 
      bookName: string 
    }>(),
    'Clear All Book Verses Failure': props<{ error: string }>(),
    
    // Preferences
    'Update Apocrypha Preference': props<{ includeApocrypha: boolean }>(),
    'Toggle Progress View Mode': emptyProps(),
    
    // Statistics
    'Calculate Statistics': emptyProps(),
    'Calculate Statistics Success': props<{ 
      totalVersesMemorized: number;
      percentageComplete: number;
      progressSegments: ProgressSegment[];
    }>(),
    
    // UI State
    'Select Book': props<{ bookId: number | null }>(),
    'Select Chapter': props<{ chapterNumber: number | null }>(),
    'Set View Mode': props<{ viewMode: 'grid' | 'list' }>(),
    'Set Bulk Saving': props<{ isSaving: boolean }>(),
    
    // Sync
    'Sync Memorization Data': emptyProps(),
    'Sync Memorization Data Success': props<{ timestamp: string }>(),
    'Sync Memorization Data Failure': props<{ error: string }>(),
    
    // Retry mechanism
    'Retry Failed Operation': props<{ operation: any; attemptNumber: number }>(),
  }
});
