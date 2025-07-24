# Bible Tracker NgRx Migration Guide

Phase 2 migrates the Bible Tracker feature to the new NgRx utilities introduced in Phase 1. Components should now rely on selectors and dispatch the new actions exported from `state/bible-tracker`.

## Component Updates

Import the selectors and actions from the index barrel:

```typescript
import {
  BibleTrackerActions,
  selectBibleTrackerLoading,
  selectAllBooksArray
} from '../state/bible-tracker';
```

Use them in your components:

```typescript
loading$ = this.store.select(selectBibleTrackerLoading);
books$ = this.store.select(selectAllBooksArray);
```

Dispatch updates using the new action names.

The state slice now includes `dailyStreak` along with a loading map for book data.

## Redux DevTools

After rebuilding, Redux DevTools will show actions with the `[Bible Tracker]` prefix and a nested state under `bibleTracker` containing `books`, `dailyStreak`, `ui`, `loading`, and `errors`.
