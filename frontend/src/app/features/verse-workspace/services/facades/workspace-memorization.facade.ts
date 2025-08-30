import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { WorkspaceVerse } from '../../models/workspace.models';

export interface MemorizationState {
  saveQueue: Set<string>;
  isSaving: boolean;
  lastSaveTime: number | null;
  reviewData: Record<string, { lastReviewed: number; strength: number }>;
}

/**
 * Facade for memorization and save queue management
 */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceMemorizationFacade {
  // Save queue subject for debouncing
  private saveQueueSubject = new Subject<WorkspaceVerse>();
  
  // State
  private stateSubject = new BehaviorSubject<MemorizationState>({
    saveQueue: new Set(),
    isSaving: false,
    lastSaveTime: null,
    reviewData: {}
  });

  // Notifications
  private savedNotificationSubject = new Subject<void>();

  // Public observables
  state$ = this.stateSubject.asObservable();
  savedNotification$ = this.savedNotificationSubject.asObservable();
  
  isSaving$ = new BehaviorSubject<boolean>(false);
  pendingSaveCount$ = new BehaviorSubject<number>(0);

  constructor() {
    // Setup save queue with debouncing
    this.saveQueueSubject.pipe(
      debounceTime(300),
      filter(verse => verse !== null)
    ).subscribe(verse => {
      this.processSaveQueue(verse);
    });
  }

  // Actions
  queueVerseSave(verse: WorkspaceVerse): void {
    const currentState = this.stateSubject.value;
    const newQueue = new Set(currentState.saveQueue);
    newQueue.add(verse.verseCode);
    
    this.stateSubject.next({
      ...currentState,
      saveQueue: newQueue
    });
    
    this.pendingSaveCount$.next(newQueue.size);
    this.saveQueueSubject.next(verse);
  }

  private processSaveQueue(verse: WorkspaceVerse): void {
    // This will be replaced with actual save logic
    console.log('Processing save for verse:', verse.verseCode);
    
    this.isSaving$.next(true);
    
    // Simulate save
    setTimeout(() => {
      const currentState = this.stateSubject.value;
      const newQueue = new Set(currentState.saveQueue);
      newQueue.delete(verse.verseCode);
      
      this.stateSubject.next({
        ...currentState,
        saveQueue: newQueue,
        lastSaveTime: Date.now()
      });
      
      this.pendingSaveCount$.next(newQueue.size);
      this.isSaving$.next(false);
      this.savedNotificationSubject.next();
    }, 500);
  }

  forceSave(): void {
    const currentState = this.stateSubject.value;
    if (currentState.saveQueue.size > 0) {
      console.log('Force saving all pending verses');
      // Process all pending saves
      currentState.saveQueue.forEach(verseCode => {
        console.log('Force saving:', verseCode);
      });
      
      this.stateSubject.next({
        ...currentState,
        saveQueue: new Set(),
        lastSaveTime: Date.now()
      });
      
      this.pendingSaveCount$.next(0);
      this.savedNotificationSubject.next();
    }
  }

  initializeReviewData(verses: WorkspaceVerse[]): void {
    const reviewData: Record<string, { lastReviewed: number; strength: number }> = {};
    
    // TODO: Load actual review data from the backend
    // For now, we'll initialize memorized verses as "needs review" after 3 days
    // This should be replaced with actual lastReviewed dates from the database
    
    verses.forEach(verse => {
      if (verse.isMemorized) {
        // Default: assume verse was memorized today and has full strength
        // This should be replaced with actual data from the backend
        reviewData[verse.verseCode] = {
          lastReviewed: Date.now(),
          strength: 100
        };
      }
    });
    
    const currentState = this.stateSubject.value;
    this.stateSubject.next({
      ...currentState,
      reviewData
    });
  }

  needsReview(verseCode: string): boolean {
    const reviewData = this.stateSubject.value.reviewData[verseCode];
    if (!reviewData) return false;
    
    const daysSinceReview = (Date.now() - reviewData.lastReviewed) / (1000 * 60 * 60 * 24);
    return daysSinceReview > 3 || reviewData.strength < 70;
  }

  getReviewData(): Record<string, { lastReviewed: number; strength: number }> {
    return this.stateSubject.value.reviewData;
  }
}