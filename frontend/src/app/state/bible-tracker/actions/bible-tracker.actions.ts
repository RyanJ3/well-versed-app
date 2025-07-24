import { createAction, props } from '@ngrx/store';
import { StreakData, ReadingFilters } from '../models/bible-tracker.model';

export const BibleTrackerActions = {
  init: createAction('[Bible Tracker] Init'),

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
