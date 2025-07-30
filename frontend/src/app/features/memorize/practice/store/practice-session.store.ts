import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { initialState, PracticeSessionStoreState } from './practice-session.state';
import { practiceSelectors } from './practice-session.selectors';
import { createPracticeEffects } from './practice-session.effects';
import { PracticeService } from '../../../../core/services/practice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AudioService } from '../../../../core/services/audio.service';
import { 
  PracticeSettings, 
  ResponseQuality,
  StartSessionRequest 
} from '../../../../state/practice-session/models/practice-session.model';

@Injectable()
export class PracticeSessionStore extends ComponentStore<PracticeSessionStoreState> {
  private practiceService = inject(PracticeService);
  private notificationService = inject(NotificationService);
  private audioService = inject(AudioService);

  // Expose get method publicly for testing and effects
  override get(): PracticeSessionStoreState {
    return super.get();
  }

  // Selectors
  readonly currentCard$ = this.select(practiceSelectors.currentCard);
  readonly progress$ = this.select(practiceSelectors.progress);
  readonly sessionStats$ = this.select(practiceSelectors.sessionStats);
  readonly isSessionActive$ = this.select(practiceSelectors.isSessionActive);
  readonly canFlipCard$ = this.select(practiceSelectors.canFlipCard);
  
  // View model for components
  readonly vm$ = this.select({
    currentCard: this.currentCard$,
    progress: this.progress$,
    stats: this.sessionStats$,
    cardFlipped: this.select(s => s.cardFlipped),
    showingHint: this.select(s => s.showingHint),
    loading: this.select(s => s.loading),
    error: this.select(s => s.error),
    sessionState: this.select(s => s.sessionState),
    settings: this.select(s => s.settings)
  });

  // Effects
  private effects = createPracticeEffects(
    this,
    this.practiceService,
    this.notificationService,
    this.audioService
  );

  // Public effect methods
  readonly startSession = this.effects.startSession;
  readonly submitResponse = this.effects.submitResponse;
  readonly completeSession = this.effects.completeSession;

  constructor() {
    super(initialState);
    
    // Setup auto-play audio
    this.effects.setupAutoPlayAudio();
  }

  // Simple updaters
  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading,
    error: loading ? null : state.error
  }));

  readonly setError = this.updater((state, error: string) => ({
    ...state,
    error,
    loading: false
  }));

  readonly flipCard = this.updater(state => ({
    ...state,
    cardFlipped: !state.cardFlipped
  }));

  readonly showHint = this.updater(state => ({
    ...state,
    showingHint: true
  }));

  readonly nextCard = this.updater(state => ({
    ...state,
    currentIndex: Math.min(state.currentIndex + 1, state.cards.length - 1),
    cardFlipped: false,
    showingHint: false
  }));

  readonly previousCard = this.updater(state => ({
    ...state,
    currentIndex: Math.max(state.currentIndex - 1, 0),
    cardFlipped: false,
    showingHint: false
  }));

  readonly updateSettings = this.updater(
    (state, settings: Partial<PracticeSettings>) => ({
      ...state,
      settings: { ...state.settings, ...settings }
    })
  );

  readonly resetSession = this.updater(() => initialState);

  // Public API methods
  handleKeyPress(key: string): void {
    const state = this.get();
    
    switch (key) {
      case ' ':  // Space
        if (practiceSelectors.isSessionActive(state)) {
          this.flipCard();
        }
        break;
        
      case 'Enter':
        this.handleEnterKey();
        break;
        
      case 'h':
      case 'H':
        if (!state.showingHint && practiceSelectors.isSessionActive(state)) {
          this.showHint();
        }
        break;
        
      case '1':
      case '2':
      case '3':
      case '4':
        this.handleNumberKey(key);
        break;
        
      case 'ArrowLeft':
        if (practiceSelectors.isSessionActive(state)) {
          this.previousCard();
        }
        break;
        
      case 'ArrowRight':
        if (practiceSelectors.isSessionActive(state)) {
          this.nextCard();
        }
        break;
    }
  }

  private handleEnterKey(): void {
    const state = this.get();
    const currentCard = practiceSelectors.currentCard(state);
    
    if (state.cardFlipped && currentCard && !currentCard.seen) {
      this.submitResponse({ quality: ResponseQuality.GOOD });
    } else if (currentCard?.seen) {
      this.nextCard();
    } else if (!state.cardFlipped && practiceSelectors.isSessionActive(state)) {
      this.flipCard();
    }
  }

  private handleNumberKey(key: string): void {
    const state = this.get();
    if (!state.cardFlipped || !practiceSelectors.isSessionActive(state)) return;

    const qualityMap: Record<string, ResponseQuality> = {
      '1': ResponseQuality.AGAIN,
      '2': ResponseQuality.HARD,
      '3': ResponseQuality.GOOD,
      '4': ResponseQuality.EASY
    };

    const quality = qualityMap[key];
    if (quality !== undefined) {
      this.submitResponse({ quality });
    }
  }

  // Helper methods
  isLoading(): boolean {
    return this.get().loading;
  }

  hasError(): boolean {
    return !!this.get().error;
  }

  getError(): string | null {
    return this.get().error;
  }

  getCurrentProgress(): number {
    return practiceSelectors.progress(this.get()).percent;
  }
}
