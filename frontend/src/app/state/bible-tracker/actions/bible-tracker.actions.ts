import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  BibleStatisticsState,
  MarkVersesReadRequest,
  MarkChapterCompleteRequest,
  BulkUpdateRequest
} from '../models/bible-tracker.model';
import { BibleBook } from '../../../core/models/bible';

export const BibleTrackerActions = createActionGroup({
  source: 'Bible Tracker',
  events: {
    // Initialize
    'Init': emptyProps(),

    // Loading Progress
    'Load Reading Progress': emptyProps(),
    'Load Reading Progress Success': props<{ books: { [bookId: string]: BibleBook } }>(),
    'Load Reading Progress Failure': props<{ error: string }>(),

    // Mark Progress
    'Mark Verses As Read': props<MarkVersesReadRequest>(),
    'Mark Verses As Read Success': props<{ update: MarkVersesReadRequest; timestamp: string }>(),
    'Mark Verses As Read Failure': props<{ error: string }>(),

    'Mark Chapter As Complete': props<MarkChapterCompleteRequest>(),
    'Mark Chapter As Complete Success': props<{ update: MarkChapterCompleteRequest; timestamp: string }>(),
    'Mark Chapter As Complete Failure': props<{ error: string }>(),

    'Mark Book As Complete': props<{ bookId: string }>(),
    'Mark Book As Complete Success': props<{ bookId: string; timestamp: string }>(),
    'Mark Book As Complete Failure': props<{ error: string }>(),

    // Bulk Operations
    'Bulk Update Progress': props<BulkUpdateRequest>(),
    'Bulk Update Progress Success': props<{ updates: BulkUpdateRequest; timestamp: string }>(),
    'Bulk Update Progress Failure': props<{ error: string }>(),

    // Statistics
    'Load Statistics': emptyProps(),
    'Load Statistics Success': props<{ statistics: BibleStatisticsState }>(),
    'Load Statistics Failure': props<{ error: string }>(),
    'Update Statistics': emptyProps(),

    // Sync
    'Sync Progress': emptyProps(),
    'Sync Progress Success': props<{ timestamp: string }>(),
    'Sync Progress Failure': props<{ error: string }>(),

    // Reset
    'Reset Chapter Progress': props<{ bookId: string; chapter: number }>(),
    'Reset Book Progress': props<{ bookId: string }>(),
    'Reset All Progress': emptyProps(),
    'Reset Progress Success': emptyProps(),
    'Reset Progress Failure': props<{ error: string }>(),

    // Additional UI actions
    'Toggle Apocrypha': emptyProps(),
    'Set Progress View Mode': props<{ viewMode: 'testament' | 'groups' }>(),

    // Additional clear actions
    'Clear Chapter': props<{ bookId: string; chapter: number }>(),
    'Clear Book': props<{ bookId: string }>(),

    // Reset specific verses
    'Reset Progress': props<{ bookId: string; chapter: number; verses: number[] }>(),
  
    // UI Actions
    'Select Book': props<{ bookId: string | null }>(),
    'Select Chapter': props<{ chapter: number | null }>(),
    'Set View Mode': props<{ viewMode: 'grid' | 'list' | 'reading' }>(),
    'Toggle Completed Filter': emptyProps(),
    'Toggle Highlight Today': emptyProps(),
  }
});
