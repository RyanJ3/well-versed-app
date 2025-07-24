# Bible Tracker NgRx Migration Guide

Phase 2 migrates the Bible Tracker feature to the new NgRx utilities introduced in Phase 1. Components should now rely on selectors and dispatch the new actions exported from `state/bible-tracker`.

## Component Updates

Import the selectors and actions from the index barrel:

```typescript
import {
  BibleTrackerActions,
  selectBibleTrackerLoading,
  selectAllBooksArray,
  selectReadingStatistics
} from '../state/bible-tracker';
```

Use them in your components:

```typescript
loading$ = this.store.select(selectBibleTrackerLoading);
books$ = this.store.select(selectAllBooksArray);
readingStats$ = this.store.select(selectReadingStatistics);
```

Dispatch updates using the new action names, e.g. `BibleTrackerActions.markVersesAsRead`.

The state slice now includes `readingPlans`, `dailyStreak`, and `readingStatistics` along with per-operation loading and error maps.

## Redux DevTools

After rebuilding, Redux DevTools will show actions with the `[Bible Tracker]` prefix and a nested state under `bibleTracker` containing `books`, `readingPlans`, `dailyStreak`, `readingStatistics`, `ui`, `loading`, and `errors`.
