# Verse Workspace Migration Guide

## Overview
This guide explains how to migrate from the service-based architecture to NgRx state management.

## Key Changes

### 1. File Structure Changes
```
OLD:
- flow-memorization/
  - services/ (11 separate services)
  - flow.component.ts (900+ lines)
  - memorization-modal/ (deeply nested)

NEW:
- verse-workspace/
  - state/ (consolidated NgRx)
  - verse-workspace.component.ts (lightweight)
  - memorization/ (module-based)
  - shared/ (reusable components)
```

### 2. Component Renaming
- `flow-header` → `workspace-header`
- `flow-filters` → `workspace-filters`
- `flow-context-menu` → `workspace-context-menu`
- All `flow-*.service.ts` → Consolidated into NgRx state

### 3. State Management Migration

#### OLD (Service-based):
```typescript
// Multiple service injections
constructor(
  private flowStateService: FlowStateService,
  private flowMemorizationService: FlowMemorizationService,
  private flowSelectionService: FlowSelectionService,
  // ... 8 more services
) {}

// Direct service calls
ngOnInit() {
  this.flowStateService.loadVerses();
  this.flowMemorizationService.trackProgress();
}

// Manual subscription management
private destroy$ = new Subject<void>();
verses$ = this.flowStateService.verses$.pipe(takeUntil(this.destroy$));
```

#### NEW (NgRx-based):
```typescript
// Single store injection
constructor(private store: Store) {}

// Dispatch actions
ngOnInit() {
  this.store.dispatch(WorkspaceActions.loadVerses({ bookId: 1, chapterNumber: 1 }));
}

// Use selectors (auto-unsubscribe with async pipe)
verses$ = this.store.select(selectAllVerses);
memorizedCount$ = this.store.select(selectMemorizationProgress);
```

### 4. Component Update Example

#### Before:
```typescript
export class FlowComponent implements OnInit, OnDestroy {
  verses: FlowVerse[] = [];
  
  constructor(
    private flowStateService: FlowStateService,
    private flowMemorizationService: FlowMemorizationService
  ) {}
  
  ngOnInit() {
    this.flowStateService.verses$.subscribe(verses => {
      this.verses = verses;
    });
  }
  
  markVerseMemorized(verse: FlowVerse) {
    this.flowMemorizationService.markMemorized(verse.id).subscribe();
  }
}
```

#### After:
```typescript
export class VerseWorkspaceComponent implements OnInit {
  verses$ = this.store.select(selectAllVerses);
  
  constructor(private store: Store) {}
  
  ngOnInit() {
    const bookId = 1; // from route params
    const chapterNumber = 1; // from route params
    this.store.dispatch(loadVerses({ bookId, chapterNumber }));
  }
  
  markVerseMemorized(verseId: string) {
    this.store.dispatch(markVerseMemorized({ verseId, confidence: 100 }));
  }
}
```

### 5. Template Updates

#### Before:
```html
<div *ngFor="let verse of verses">
  <app-flow-verse [verse]="verse"></app-flow-verse>
</div>
```

#### After:
```html
<div *ngFor="let verse of verses$ | async">
  <app-verse-card [verse]="verse"></app-verse-card>
</div>
```

## Migration Steps

### Step 1: Update Imports
```typescript
// Remove all service imports
// import { FlowStateService } from './services/flow-state.service';

// Add NgRx imports
import { Store } from '@ngrx/store';
import * as WorkspaceActions from './state/verse-workspace.actions';
import * as WorkspaceSelectors from './state/verse-workspace.selectors';
```

### Step 2: Update Constructor
```typescript
// Remove all service injections, keep only Store
constructor(
  private store: Store,
  private router: Router // if needed
) {}
```

### Step 3: Replace Service Calls with Actions
```typescript
// OLD
this.flowStateService.loadVerses(bookId, chapterNumber);

// NEW
this.store.dispatch(WorkspaceActions.loadVerses({ bookId, chapterNumber }));
```

### Step 4: Replace Observables with Selectors
```typescript
// OLD
verses$ = this.flowStateService.verses$;

// NEW
verses$ = this.store.select(WorkspaceSelectors.selectAllVerses);
```

### Step 5: Update Templates
- Replace `flow-` prefixed components with new names
- Use async pipe for all observables
- Update event handlers to dispatch actions

## Benefits of NgRx Architecture

1. **Single Source of Truth**: All state in one place
2. **Predictable State Updates**: Actions clearly describe what happened
3. **DevTools Support**: Time-travel debugging, state inspection
4. **Better Performance**: OnPush change detection, memoized selectors
5. **Easier Testing**: Pure functions, isolated effects
6. **Reduced Boilerplate**: No manual subscription management

## Common Patterns

### Loading Data
```typescript
// Dispatch action
this.store.dispatch(loadVerses({ bookId, chapterNumber }));

// Select loading state
isLoading$ = this.store.select(selectIsLoadingVerses);

// Select data
verses$ = this.store.select(selectAllVerses);

// Select errors
error$ = this.store.select(selectError);
```

### User Interactions
```typescript
onVerseClick(verseId: string, event: MouseEvent) {
  if (event.shiftKey) {
    this.store.dispatch(selectVerseRange({ startId, endId: verseId }));
  } else if (event.ctrlKey) {
    this.store.dispatch(selectVerse({ verseId, multiSelect: true }));
  } else {
    this.store.dispatch(selectVerse({ verseId, multiSelect: false }));
  }
}
```

### Complex Computations
```typescript
// Use selectors for derived state
memorizedProgress$ = this.store.select(selectMemorizationProgress);
dailyStats$ = this.store.select(selectDailyStats);
filteredVerses$ = this.store.select(selectFilteredVerses);
```

## Testing

### Testing Components
```typescript
// Provide mock store
providers: [
  provideMockStore({ 
    initialState,
    selectors: [
      { selector: selectAllVerses, value: mockVerses }
    ]
  })
]
```

### Testing Effects
```typescript
// Use TestScheduler for async testing
it('should load verses', () => {
  const action = loadVerses({ bookId: 1, chapterNumber: 1 });
  const completion = loadVersesSuccess({ verses: mockVerses });
  
  actions$ = hot('-a', { a: action });
  const expected = cold('-c', { c: completion });
  
  expect(effects.loadVerses$).toBeObservable(expected);
});
```

## Troubleshooting

### Issue: State not updating
- Check that reducer handles the action
- Verify action is dispatched
- Check selector is correct

### Issue: Effects not running
- Ensure effects are registered in module
- Check action type matches
- Verify service injection

### Issue: Memory leaks
- Use async pipe in templates
- No need to unsubscribe from store.select()
- Effects handle their own cleanup

## Next Steps

1. Complete component migrations
2. Remove old service files
3. Update unit tests
4. Add e2e tests for critical flows
5. Document new patterns for team