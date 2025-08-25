import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

// State interfaces
export interface FlowUIState {
  // Display settings
  fontSize: number;
  layoutMode: 'grid' | 'single';
  showFullText: boolean;
  showVerseNumbers: boolean;
  
  // Current mode
  mode: 'memorization' | 'crossReferences' | 'topical';
  
  // Navigation
  currentBookId: number;
  currentChapter: number;
  
  // Filters
  searchTerm: string;
  showMemorizedOnly: boolean;
  showToLearnOnly: boolean;
  showReviewOnly: boolean;
  
  // Selection
  selectedVerses: Set<string>;
  lastSelectedIndex: number;
  
  // Context menu
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuVerseCode: string | null;
  
  // Modals
  studyModalOpen: boolean;
  createDeckModalOpen: boolean;
  
  // Loading states
  isLoading: boolean;
  loadingMessage: string;
}

export interface FlowDataState {
  // Verses
  verseCodes: string[];
  memorizedVerses: Set<string>;
  
  // Cross references
  crossReferenceVerses: any[];
  selectedCrossRefVerse: any | null;
  
  // Topical
  topicalVerses: any[];
  currentTopic: string | null;
  
  // Decks
  flashcardDecks: any[];
  activeDeckId: string | null;
  
  // Session data
  studySessionVerses: string[];
  studySessionIndex: number;
  
  // Cache
  verseTextCache: Map<string, string>;
  lastFetchTime: number;
}

export interface FlowSettingsState {
  // User preferences
  defaultTranslation: string;
  hideMemorizedByDefault: boolean;
  autoAdvanceInStudy: boolean;
  studyRepetitions: number;
  
  // Display preferences
  defaultFontSize: number;
  defaultLayoutMode: 'grid' | 'single';
  highlightColor: string;
  
  // Behavior
  enableKeyboardShortcuts: boolean;
  enableSwipeGestures: boolean;
  confirmBeforeDelete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceStateManagerService {
  // State subjects
  private uiState$ = new BehaviorSubject<FlowUIState>(this.getInitialUIState());
  private dataState$ = new BehaviorSubject<FlowDataState>(this.getInitialDataState());
  private settingsState$ = new BehaviorSubject<FlowSettingsState>(this.getInitialSettingsState());

  // Public observables
  public readonly ui$ = this.uiState$.asObservable();
  public readonly data$ = this.dataState$.asObservable();
  public readonly settings$ = this.settingsState$.asObservable();

  // Combined state observable
  public readonly state$ = combineLatest([this.ui$, this.data$, this.settings$]).pipe(
    map(([ui, data, settings]) => ({ ui, data, settings }))
  );

  // Specific state slices
  public readonly mode$ = this.ui$.pipe(
    map(state => state.mode),
    distinctUntilChanged()
  );

  public readonly currentVerses$ = combineLatest([this.ui$, this.data$]).pipe(
    map(([ui, data]) => {
      switch (ui.mode) {
        case 'crossReferences':
          return data.crossReferenceVerses;
        case 'topical':
          return data.topicalVerses;
        default:
          return data.verseCodes;
      }
    }),
    distinctUntilChanged()
  );

  public readonly selectedVerses$ = this.ui$.pipe(
    map(state => state.selectedVerses),
    distinctUntilChanged()
  );

  public readonly isLoading$ = this.ui$.pipe(
    map(state => state.isLoading),
    distinctUntilChanged()
  );

  constructor() {
    this.loadPersistedState();
  }

  // UI State Methods
  setMode(mode: 'memorization' | 'crossReferences' | 'topical'): void {
    this.updateUIState({ mode });
  }

  setFontSize(fontSize: number): void {
    this.updateUIState({ fontSize });
    this.saveToLocalStorage('fontSize', fontSize);
  }

  setLayoutMode(layoutMode: 'grid' | 'single'): void {
    this.updateUIState({ layoutMode });
    this.saveToLocalStorage('layoutMode', layoutMode);
  }

  toggleFullText(): void {
    const current = this.uiState$.value.showFullText;
    this.updateUIState({ showFullText: !current });
  }

  setSearchTerm(searchTerm: string): void {
    this.updateUIState({ searchTerm });
  }

  setLoading(isLoading: boolean, message?: string): void {
    this.updateUIState({ 
      isLoading, 
      loadingMessage: message || '' 
    });
  }

  // Selection Methods
  selectVerse(verseCode: string): void {
    const selectedVerses = new Set(this.uiState$.value.selectedVerses);
    selectedVerses.add(verseCode);
    this.updateUIState({ selectedVerses });
  }

  deselectVerse(verseCode: string): void {
    const selectedVerses = new Set(this.uiState$.value.selectedVerses);
    selectedVerses.delete(verseCode);
    this.updateUIState({ selectedVerses });
  }

  toggleVerseSelection(verseCode: string): void {
    const selectedVerses = new Set(this.uiState$.value.selectedVerses);
    if (selectedVerses.has(verseCode)) {
      selectedVerses.delete(verseCode);
    } else {
      selectedVerses.add(verseCode);
    }
    this.updateUIState({ selectedVerses });
  }

  clearSelection(): void {
    this.updateUIState({ selectedVerses: new Set() });
  }

  selectRange(startCode: string, endCode: string): void {
    const verseCodes = this.dataState$.value.verseCodes;
    const startIndex = verseCodes.indexOf(startCode);
    const endIndex = verseCodes.indexOf(endCode);
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    const selectedVerses = new Set<string>();
    
    for (let i = from; i <= to; i++) {
      selectedVerses.add(verseCodes[i]);
    }
    
    this.updateUIState({ selectedVerses });
  }

  // Context Menu Methods
  showContextMenu(verseCode: string, x: number, y: number): void {
    this.updateUIState({
      contextMenuVisible: true,
      contextMenuPosition: { x, y },
      contextMenuVerseCode: verseCode
    });
  }

  hideContextMenu(): void {
    this.updateUIState({
      contextMenuVisible: false,
      contextMenuPosition: null,
      contextMenuVerseCode: null
    });
  }

  // Data State Methods
  setVerseCodes(verseCodes: string[]): void {
    this.updateDataState({ verseCodes });
  }

  setMemorizedVerses(memorizedVerses: Set<string>): void {
    this.updateDataState({ memorizedVerses });
  }

  toggleMemorized(verseCode: string): void {
    const memorizedVerses = new Set(this.dataState$.value.memorizedVerses);
    if (memorizedVerses.has(verseCode)) {
      memorizedVerses.delete(verseCode);
    } else {
      memorizedVerses.add(verseCode);
    }
    this.updateDataState({ memorizedVerses });
  }

  setCrossReferenceVerses(verses: any[]): void {
    this.updateDataState({ crossReferenceVerses: verses });
  }

  setTopicalVerses(verses: any[], topic: string): void {
    this.updateDataState({ 
      topicalVerses: verses,
      currentTopic: topic
    });
  }

  // Settings Methods
  updateSettings(settings: Partial<FlowSettingsState>): void {
    this.settingsState$.next({
      ...this.settingsState$.value,
      ...settings
    });
    this.saveSettingsToLocalStorage();
  }

  // Helper methods
  private updateUIState(partial: Partial<FlowUIState>): void {
    this.uiState$.next({
      ...this.uiState$.value,
      ...partial
    });
  }

  private updateDataState(partial: Partial<FlowDataState>): void {
    this.dataState$.next({
      ...this.dataState$.value,
      ...partial
    });
  }

  private getInitialUIState(): FlowUIState {
    return {
      fontSize: this.loadFromLocalStorage('fontSize', 16),
      layoutMode: this.loadFromLocalStorage('layoutMode', 'grid'),
      showFullText: false,
      showVerseNumbers: true,
      mode: 'memorization',
      currentBookId: 1,
      currentChapter: 1,
      searchTerm: '',
      showMemorizedOnly: false,
      showToLearnOnly: false,
      showReviewOnly: false,
      selectedVerses: new Set(),
      lastSelectedIndex: -1,
      contextMenuVisible: false,
      contextMenuPosition: null,
      contextMenuVerseCode: null,
      studyModalOpen: false,
      createDeckModalOpen: false,
      isLoading: false,
      loadingMessage: ''
    };
  }

  private getInitialDataState(): FlowDataState {
    return {
      verseCodes: [],
      memorizedVerses: new Set(),
      crossReferenceVerses: [],
      selectedCrossRefVerse: null,
      topicalVerses: [],
      currentTopic: null,
      flashcardDecks: [],
      activeDeckId: null,
      studySessionVerses: [],
      studySessionIndex: 0,
      verseTextCache: new Map(),
      lastFetchTime: 0
    };
  }

  private getInitialSettingsState(): FlowSettingsState {
    return {
      defaultTranslation: this.loadFromLocalStorage('defaultTranslation', 'ESV'),
      hideMemorizedByDefault: this.loadFromLocalStorage('hideMemorizedByDefault', false),
      autoAdvanceInStudy: this.loadFromLocalStorage('autoAdvanceInStudy', true),
      studyRepetitions: this.loadFromLocalStorage('studyRepetitions', 3),
      defaultFontSize: 16,
      defaultLayoutMode: 'grid',
      highlightColor: '#ffd700',
      enableKeyboardShortcuts: true,
      enableSwipeGestures: false,
      confirmBeforeDelete: true
    };
  }

  private loadPersistedState(): void {
    // Load any persisted state from localStorage
    const savedState = localStorage.getItem('flowState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // Restore relevant parts of state
      } catch (e) {
        console.error('Error loading persisted state:', e);
      }
    }
  }

  private saveToLocalStorage(key: string, value: any): void {
    localStorage.setItem(`flow_${key}`, JSON.stringify(value));
  }

  private loadFromLocalStorage<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(`flow_${key}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  private saveSettingsToLocalStorage(): void {
    localStorage.setItem('flowSettings', JSON.stringify(this.settingsState$.value));
  }

  // State reset
  resetState(): void {
    this.uiState$.next(this.getInitialUIState());
    this.dataState$.next(this.getInitialDataState());
    this.settingsState$.next(this.getInitialSettingsState());
  }

  // Get current state snapshots
  get currentUIState(): FlowUIState {
    return this.uiState$.value;
  }

  get currentDataState(): FlowDataState {
    return this.dataState$.value;
  }

  get currentSettings(): FlowSettingsState {
    return this.settingsState$.value;
  }
}