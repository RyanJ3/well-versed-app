import { createAction, props } from '@ngrx/store';
import { createAsyncActions } from '../../shared/utils/action-factory';
import {
  BulkUpdateRequest,
  MarkChapterCompleteRequest,
  MarkVersesReadRequest,
  ReadingPlan,
  ReadingStatistics,
  StreakData,
  ReadingFilters
} from '../models/bible-tracker.model';
import { BibleBook as Book } from '../../../core/models/bible';

// Async action factories
const loadProgressActions = createAsyncActions<{}, { books: Book[] }, string>(
  'Bible Tracker',
  'Load Reading Progress'
);

const markVersesActions = createAsyncActions<
  MarkVersesReadRequest,
  { update: MarkVersesReadRequest; timestamp: string },
  string
>('Bible Tracker', 'Mark Verses As Read');

const markChapterActions = createAsyncActions<
  MarkChapterCompleteRequest,
  { update: MarkChapterCompleteRequest; timestamp: string },
  string
>('Bible Tracker', 'Mark Chapter As Complete');

const bulkUpdateActions = createAsyncActions<
  BulkUpdateRequest,
  { updates: BulkUpdateRequest; timestamp: string },
  string
>('Bible Tracker', 'Bulk Update Progress');

const loadPlansActions = createAsyncActions<{}, { plans: ReadingPlan[] }, string>(
  'Bible Tracker',
  'Load Reading Plans'
);

const savePlanActions = createAsyncActions<
  { plan: ReadingPlan },
  { plan: ReadingPlan },
  string
>('Bible Tracker', 'Save Reading Plan');

const deletePlanActions = createAsyncActions<
  { id: string },
  { id: string },
  string
>('Bible Tracker', 'Delete Reading Plan');

const loadStatsActions = createAsyncActions<{}, { statistics: ReadingStatistics }, string>(
  'Bible Tracker',
  'Load Statistics'
);

const syncActions = createAsyncActions<{}, { timestamp: string }, string>(
  'Bible Tracker',
  'Sync Progress'
);

export const BibleTrackerActions = {
  init: createAction('[Bible Tracker] Init'),

  loadReadingProgress: loadProgressActions.request,
  loadReadingProgressSuccess: loadProgressActions.success,
  loadReadingProgressFailure: loadProgressActions.failure,

  markVersesAsRead: markVersesActions.request,
  markVersesAsReadSuccess: markVersesActions.success,
  markVersesAsReadFailure: markVersesActions.failure,

  markChapterAsComplete: markChapterActions.request,
  markChapterAsCompleteSuccess: markChapterActions.success,
  markChapterAsCompleteFailure: markChapterActions.failure,

  bulkUpdateProgress: bulkUpdateActions.request,
  bulkUpdateProgressSuccess: bulkUpdateActions.success,
  bulkUpdateProgressFailure: bulkUpdateActions.failure,

  loadReadingPlans: loadPlansActions.request,
  loadReadingPlansSuccess: loadPlansActions.success,
  loadReadingPlansFailure: loadPlansActions.failure,

  saveReadingPlan: savePlanActions.request,
  saveReadingPlanSuccess: savePlanActions.success,
  saveReadingPlanFailure: savePlanActions.failure,

  deleteReadingPlan: deletePlanActions.request,
  deleteReadingPlanSuccess: deletePlanActions.success,
  deleteReadingPlanFailure: deletePlanActions.failure,

  loadStatistics: loadStatsActions.request,
  loadStatisticsSuccess: loadStatsActions.success,
  loadStatisticsFailure: loadStatsActions.failure,

  syncProgress: syncActions.request,
  syncProgressSuccess: syncActions.success,
  syncProgressFailure: syncActions.failure,

  setActiveReadingPlan: createAction(
    '[Bible Tracker] Set Active Plan',
    props<{ id: string | null }>()
  ),

  updateStreak: createAction(
    '[Bible Tracker] Update Streak',
    props<{ streak: StreakData }>()
  ),

  selectBook: createAction(
    '[Bible Tracker] Select Book',
    props<{ bookId: string | null }>()
  ),

  selectChapter: createAction(
    '[Bible Tracker] Select Chapter',
    props<{ chapter: number | null }>()
  ),

  setViewMode: createAction(
    '[Bible Tracker] Set View Mode',
    props<{ viewMode: 'grid' | 'list' | 'heatmap' }>()
  ),

  setFilters: createAction(
    '[Bible Tracker] Set Filters',
    props<{ filters: ReadingFilters }>()
  )
};
