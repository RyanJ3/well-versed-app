import { Injectable } from '@angular/core';
import { Subject, Observable, filter, map, shareReplay, buffer, debounceTime } from 'rxjs';

// Event types enum for type safety
export enum FlowEventType {
  // Verse events
  VERSE_SELECTED = 'VERSE_SELECTED',
  VERSE_DESELECTED = 'VERSE_DESELECTED',
  VERSE_RANGE_SELECTED = 'VERSE_RANGE_SELECTED',
  VERSE_CLICKED = 'VERSE_CLICKED',
  VERSE_DOUBLE_CLICKED = 'VERSE_DOUBLE_CLICKED',
  VERSE_CONTEXT_MENU = 'VERSE_CONTEXT_MENU',
  
  // Memorization events
  VERSE_MEMORIZED = 'VERSE_MEMORIZED',
  VERSE_UNMEMORIZED = 'VERSE_UNMEMORIZED',
  BATCH_MEMORIZE = 'BATCH_MEMORIZE',
  
  // Study events
  STUDY_SESSION_STARTED = 'STUDY_SESSION_STARTED',
  STUDY_SESSION_ENDED = 'STUDY_SESSION_ENDED',
  STUDY_VERSE_COMPLETED = 'STUDY_VERSE_COMPLETED',
  
  // Navigation events
  CHAPTER_CHANGED = 'CHAPTER_CHANGED',
  BOOK_CHANGED = 'BOOK_CHANGED',
  MODE_CHANGED = 'MODE_CHANGED',
  
  // Deck events
  ADD_TO_DECK = 'ADD_TO_DECK',
  REMOVE_FROM_DECK = 'REMOVE_FROM_DECK',
  CREATE_DECK = 'CREATE_DECK',
  
  // Filter events
  FILTER_CHANGED = 'FILTER_CHANGED',
  SEARCH_TERM_CHANGED = 'SEARCH_TERM_CHANGED',
  
  // UI events
  FONT_SIZE_CHANGED = 'FONT_SIZE_CHANGED',
  LAYOUT_MODE_CHANGED = 'LAYOUT_MODE_CHANGED',
  FULLTEXT_TOGGLED = 'FULLTEXT_TOGGLED',
  
  // Performance events
  VERSES_LOADING = 'VERSES_LOADING',
  VERSES_LOADED = 'VERSES_LOADED',
  ERROR_OCCURRED = 'ERROR_OCCURRED'
}

// Base event interface
export interface FlowEvent<T = any> {
  type: FlowEventType;
  payload: T;
  timestamp: number;
  source?: string; // Component/service that triggered the event
  metadata?: Record<string, any>;
}

// Specific event payload interfaces
export interface VerseSelectedPayload {
  verseCode: string;
  multiSelect: boolean;
  index?: number;
}

export interface VerseRangeSelectedPayload {
  startVerseCode: string;
  endVerseCode: string;
  verseCodes: string[];
}

export interface VerseClickedPayload {
  verseCode: string;
  event: MouseEvent;
  index: number;
}

export interface VerseMemorizedPayload {
  verseCode: string;
  isMemorized: boolean;
  timestamp: number;
}

export interface StudySessionPayload {
  verseCodes: string[];
  mode: 'learn' | 'review' | 'test';
  sessionId: string;
}

export interface NavigationPayload {
  bookId?: number;
  chapter?: number;
  previousBookId?: number;
  previousChapter?: number;
}

export interface FilterChangedPayload {
  filterType: 'memorized' | 'toLearn' | 'review';
  enabled: boolean;
}

export interface ErrorPayload {
  error: Error;
  context: string;
  recoverable: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceEventBusService {
  private eventBus$ = new Subject<FlowEvent>();
  private eventHistory: FlowEvent[] = [];
  private maxHistorySize = 100;
  
  // Public observable for all events
  public readonly events$: Observable<FlowEvent> = this.eventBus$.asObservable().pipe(
    shareReplay(1)
  );
  
  // Typed event streams for specific event types
  public readonly verseSelected$ = this.createEventStream<VerseSelectedPayload>(FlowEventType.VERSE_SELECTED);
  public readonly verseDeselected$ = this.createEventStream<VerseSelectedPayload>(FlowEventType.VERSE_DESELECTED);
  public readonly verseRangeSelected$ = this.createEventStream<VerseRangeSelectedPayload>(FlowEventType.VERSE_RANGE_SELECTED);
  public readonly verseClicked$ = this.createEventStream<VerseClickedPayload>(FlowEventType.VERSE_CLICKED);
  public readonly verseDoubleClicked$ = this.createEventStream<VerseClickedPayload>(FlowEventType.VERSE_DOUBLE_CLICKED);
  public readonly verseContextMenu$ = this.createEventStream<VerseClickedPayload>(FlowEventType.VERSE_CONTEXT_MENU);
  
  public readonly verseMemorized$ = this.createEventStream<VerseMemorizedPayload>(FlowEventType.VERSE_MEMORIZED);
  public readonly verseUnmemorized$ = this.createEventStream<VerseMemorizedPayload>(FlowEventType.VERSE_UNMEMORIZED);
  public readonly batchMemorize$ = this.createEventStream<string[]>(FlowEventType.BATCH_MEMORIZE);
  
  public readonly studySessionStarted$ = this.createEventStream<StudySessionPayload>(FlowEventType.STUDY_SESSION_STARTED);
  public readonly studySessionEnded$ = this.createEventStream<string>(FlowEventType.STUDY_SESSION_ENDED);
  
  public readonly chapterChanged$ = this.createEventStream<NavigationPayload>(FlowEventType.CHAPTER_CHANGED);
  public readonly bookChanged$ = this.createEventStream<NavigationPayload>(FlowEventType.BOOK_CHANGED);
  public readonly modeChanged$ = this.createEventStream<string>(FlowEventType.MODE_CHANGED);
  
  public readonly filterChanged$ = this.createEventStream<FilterChangedPayload>(FlowEventType.FILTER_CHANGED);
  public readonly searchTermChanged$ = this.createEventStream<string>(FlowEventType.SEARCH_TERM_CHANGED);
  
  public readonly fontSizeChanged$ = this.createEventStream<number>(FlowEventType.FONT_SIZE_CHANGED);
  public readonly layoutModeChanged$ = this.createEventStream<'grid' | 'single'>(FlowEventType.LAYOUT_MODE_CHANGED);
  
  public readonly versesLoading$ = this.createEventStream<boolean>(FlowEventType.VERSES_LOADING);
  public readonly versesLoaded$ = this.createEventStream<any[]>(FlowEventType.VERSES_LOADED);
  public readonly errorOccurred$ = this.createEventStream<ErrorPayload>(FlowEventType.ERROR_OCCURRED);
  
  // Aggregated event streams
  public readonly selectionEvents$ = this.events$.pipe(
    filter(event => [
      FlowEventType.VERSE_SELECTED,
      FlowEventType.VERSE_DESELECTED,
      FlowEventType.VERSE_RANGE_SELECTED
    ].includes(event.type))
  );
  
  public readonly navigationEvents$ = this.events$.pipe(
    filter(event => [
      FlowEventType.CHAPTER_CHANGED,
      FlowEventType.BOOK_CHANGED,
      FlowEventType.MODE_CHANGED
    ].includes(event.type))
  );
  
  // Batched events for performance
  public readonly batchedSelectionEvents$ = this.selectionEvents$.pipe(
    buffer(this.selectionEvents$.pipe(debounceTime(100))),
    filter(events => events.length > 0)
  );
  
  constructor() {
    // Subscribe to events to maintain history
    this.events$.subscribe(event => {
      this.addToHistory(event);
    });
  }
  
  /**
   * Emit an event to the event bus
   */
  emit<T>(type: FlowEventType, payload: T, source?: string, metadata?: Record<string, any>): void {
    const event: FlowEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      source,
      metadata
    };
    
    this.eventBus$.next(event);
  }
  
  /**
   * Emit a verse selected event
   */
  emitVerseSelected(verseCode: string, multiSelect = false, index?: number, source?: string): void {
    this.emit<VerseSelectedPayload>(
      FlowEventType.VERSE_SELECTED,
      { verseCode, multiSelect, index },
      source
    );
  }
  
  /**
   * Emit a verse range selected event
   */
  emitVerseRangeSelected(startVerseCode: string, endVerseCode: string, verseCodes: string[], source?: string): void {
    this.emit<VerseRangeSelectedPayload>(
      FlowEventType.VERSE_RANGE_SELECTED,
      { startVerseCode, endVerseCode, verseCodes },
      source
    );
  }
  
  /**
   * Emit a verse memorized event
   */
  emitVerseMemorized(verseCode: string, isMemorized: boolean, source?: string): void {
    const type = isMemorized ? FlowEventType.VERSE_MEMORIZED : FlowEventType.VERSE_UNMEMORIZED;
    this.emit<VerseMemorizedPayload>(
      type,
      { verseCode, isMemorized, timestamp: Date.now() },
      source
    );
  }
  
  /**
   * Emit a study session started event
   */
  emitStudySessionStarted(verseCodes: string[], mode: 'learn' | 'review' | 'test', source?: string): void {
    const sessionId = this.generateSessionId();
    this.emit<StudySessionPayload>(
      FlowEventType.STUDY_SESSION_STARTED,
      { verseCodes, mode, sessionId },
      source
    );
  }
  
  /**
   * Emit a navigation event
   */
  emitNavigation(type: 'chapter' | 'book', current: number, previous?: number, source?: string): void {
    const eventType = type === 'chapter' ? FlowEventType.CHAPTER_CHANGED : FlowEventType.BOOK_CHANGED;
    const payload: NavigationPayload = type === 'chapter' 
      ? { chapter: current, previousChapter: previous }
      : { bookId: current, previousBookId: previous };
    
    this.emit(eventType, payload, source);
  }
  
  /**
   * Emit a filter changed event
   */
  emitFilterChanged(filterType: 'memorized' | 'toLearn' | 'review', enabled: boolean, source?: string): void {
    this.emit<FilterChangedPayload>(
      FlowEventType.FILTER_CHANGED,
      { filterType, enabled },
      source
    );
  }
  
  /**
   * Emit an error event
   */
  emitError(error: Error, context: string, recoverable = true, source?: string): void {
    this.emit<ErrorPayload>(
      FlowEventType.ERROR_OCCURRED,
      { error, context, recoverable },
      source
    );
  }
  
  /**
   * Create a filtered event stream for a specific event type
   */
  private createEventStream<T>(eventType: FlowEventType): Observable<T> {
    return this.events$.pipe(
      filter(event => event.type === eventType),
      map(event => event.payload as T),
      shareReplay(1)
    );
  }
  
  /**
   * Add event to history
   */
  private addToHistory(event: FlowEvent): void {
    this.eventHistory.push(event);
    
    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }
  
  /**
   * Get event history
   */
  getEventHistory(eventType?: FlowEventType): FlowEvent[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.type === eventType);
    }
    return [...this.eventHistory];
  }
  
  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Replay events (useful for debugging or testing)
   */
  replayEvents(events: FlowEvent[]): void {
    events.forEach(event => {
      this.eventBus$.next(event);
    });
  }
  
  /**
   * Get statistics about events
   */
  getEventStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    this.eventHistory.forEach(event => {
      stats[event.type] = (stats[event.type] || 0) + 1;
    });
    
    return stats;
  }
}