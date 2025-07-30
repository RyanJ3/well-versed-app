import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PracticeSessionStore } from './practice-session.store';
import { PracticeService } from '../../../../core/services/practice.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AudioService } from '../../../../core/services/audio.service';
import { 
  SessionType, 
  ResponseQuality, 
  SessionState 
} from '../../../../state/practice-session/models/practice-session.model';

describe('PracticeSessionStore', () => {
  let store: PracticeSessionStore;
  let practiceService: jasmine.SpyObj<PracticeService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let audioService: jasmine.SpyObj<AudioService>;

  const mockSession = {
    id: 'session-123',
    deckId: 1,
    deckName: 'Test Deck',
    type: SessionType.REVIEW,
    cards: [
      {
        id: 1,
        deckId: 1,
        front: 'Question 1',
        back: 'Answer 1',
        hint: 'Hint 1',
        audioUrl: 'audio1.mp3',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        order: 0,
        seen: false
      },
      {
        id: 2,
        deckId: 1,
        front: 'Question 2',
        back: 'Answer 2',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        order: 1,
        seen: false
      }
    ],
    currentIndex: 0,
    responses: [],
    startTime: new Date(),
    settings: {
      sessionType: SessionType.REVIEW,
      cardLimit: 20,
      timeLimit: null,
      autoPlayAudio: false,
      immediateAnswerFeedback: true
    },
    state: SessionState.IN_PROGRESS
  };

  beforeEach(() => {
    const practiceServiceSpy = jasmine.createSpyObj('PracticeService', [
      'startSession',
      'submitResponse',
      'completeSession'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'info',
      'warning'
    ]);
    const audioServiceSpy = jasmine.createSpyObj('AudioService', [
      'play',
      'playSound'
    ]);

    TestBed.configureTestingModule({
      providers: [
        PracticeSessionStore,
        { provide: PracticeService, useValue: practiceServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: AudioService, useValue: audioServiceSpy }
      ]
    });

    store = TestBed.inject(PracticeSessionStore);
    practiceService = TestBed.inject(PracticeService) as jasmine.SpyObj<PracticeService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    audioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
  });

  describe('Initial State', () => {
    it('should have correct initial state', (done) => {
      store.state$.subscribe(state => {
        expect(state.sessionId).toBeNull();
        expect(state.cards).toEqual([]);
        expect(state.currentIndex).toBe(0);
        expect(state.sessionState).toBe(SessionState.NOT_STARTED);
        expect(state.cardFlipped).toBe(false);
        expect(state.loading).toBe(false);
        done();
      });
    });
  });

  describe('Selectors', () => {
    it('should select current card', (done) => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 0
      });

      store.currentCard$.subscribe(card => {
        expect(card).toEqual(mockSession.cards[0]);
        done();
      });
    });

    it('should calculate progress correctly', (done) => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 1
      });

      store.progress$.subscribe(progress => {
        expect(progress.current).toBe(2);
        expect(progress.total).toBe(2);
        expect(progress.percent).toBe(100);
        expect(progress.cardsRemaining).toBe(0);
        done();
      });
    });

    it('should calculate session stats', (done) => {
      const responses = [
        { cardId: 1, correct: true, responseTime: 3000, hintsUsed: 0 },
        { cardId: 2, correct: false, responseTime: 5000, hintsUsed: 1 }
      ];

      store.patchState({
        responses: responses as any
      });

      store.sessionStats$.subscribe(stats => {
        expect(stats.correct).toBe(1);
        expect(stats.incorrect).toBe(1);
        expect(stats.accuracy).toBe(50);
        expect(stats.averageTime).toBe(4); // (3000 + 5000) / 2 / 1000
        expect(stats.hintsUsed).toBe(1);
        done();
      });
    });

    it('should provide complete view model', (done) => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 0,
        sessionState: SessionState.IN_PROGRESS,
        cardFlipped: true,
        showingHint: false,
        loading: false,
        error: null
      });

      store.vm$.subscribe(vm => {
        expect(vm.currentCard).toBeDefined();
        expect(vm.progress).toBeDefined();
        expect(vm.stats).toBeDefined();
        expect(vm.cardFlipped).toBe(true);
        expect(vm.showingHint).toBe(false);
        expect(vm.loading).toBe(false);
        expect(vm.error).toBeNull();
        expect(vm.sessionState).toBe(SessionState.IN_PROGRESS);
        expect(vm.settings).toBeDefined();
        done();
      });
    });
  });

  describe('Updaters', () => {
    it('should flip card', (done) => {
      store.flipCard();
      
      store.state$.subscribe(state => {
        expect(state.cardFlipped).toBe(true);
        done();
      });
    });

    it('should show hint', (done) => {
      store.showHint();
      
      store.state$.subscribe(state => {
        expect(state.showingHint).toBe(true);
        done();
      });
    });

    it('should navigate to next card', (done) => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 0,
        cardFlipped: true,
        showingHint: true
      });

      store.nextCard();
      
      store.state$.subscribe(state => {
        expect(state.currentIndex).toBe(1);
        expect(state.cardFlipped).toBe(false);
        expect(state.showingHint).toBe(false);
        done();
      });
    });

    it('should not exceed card bounds when navigating', (done) => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 1 // Last card
      });

      store.nextCard();
      
      store.state$.subscribe(state => {
        expect(state.currentIndex).toBe(1); // Should stay at last card
        done();
      });
    });

    it('should update settings', (done) => {
      const newSettings = { autoPlayAudio: true, fontSize: 'large' as const };
      
      store.updateSettings(newSettings);
      
      store.state$.subscribe(state => {
        expect(state.settings.autoPlayAudio).toBe(true);
        expect(state.settings.fontSize).toBe('large');
        done();
      });
    });

    it('should reset session', (done) => {
      store.patchState({
        sessionId: 'test-123',
        cards: mockSession.cards,
        currentIndex: 1
      });

      store.resetSession();
      
      store.state$.subscribe(state => {
        expect(state.sessionId).toBeNull();
        expect(state.cards).toEqual([]);
        expect(state.currentIndex).toBe(0);
        done();
      });
    });
  });

  describe('Effects', () => {
    it('should start session successfully', (done) => {
      practiceService.startSession.and.returnValue(of(mockSession as any));

      store.startSession({ 
        deckId: 1, 
        settings: { cardLimit: 10 } 
      });

      setTimeout(() => {
        store.state$.subscribe(state => {
          expect(state.sessionId).toBe('session-123');
          expect(state.deckName).toBe('Test Deck');
          expect(state.cards.length).toBe(2);
          expect(state.sessionState).toBe(SessionState.IN_PROGRESS);
          expect(state.loading).toBe(false);
          expect(notificationService.info).toHaveBeenCalledWith('Session started! Good luck! 🎯');
          done();
        });
      }, 100);
    });

    it('should handle start session error', (done) => {
      practiceService.startSession.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      store.startSession({ deckId: 1, settings: {} });

      setTimeout(() => {
        store.state$.subscribe(state => {
          expect(state.loading).toBe(false);
          expect(state.error).toBe('Failed to start session');
          expect(notificationService.error).toHaveBeenCalledWith('Failed to start session');
          done();
        });
      }, 100);
    });

    it('should submit response and update state', (done) => {
      const mockResponse = {
        cardId: 1,
        quality: ResponseQuality.GOOD,
        responseTime: 3000,
        hintsUsed: 0,
        audioPlayed: false,
        timestamp: new Date(),
        correct: true,
        newInterval: 2,
        newEaseFactor: 2.6
      };

      practiceService.submitResponse.and.returnValue(of(mockResponse));

      store.patchState({
        sessionId: 'session-123',
        cards: mockSession.cards,
        currentIndex: 0,
        startTime: new Date(),
        showingHint: false
      });

      store.submitResponse({ quality: ResponseQuality.GOOD });

      setTimeout(() => {
        store.state$.subscribe(state => {
          expect(state.responses.length).toBe(1);
          expect(state.currentStreak).toBe(1);
          expect(state.cards[0].seen).toBe(true);
          expect(notificationService.success).toHaveBeenCalledWith('Correct! 🎉', 1000);
          done();
        });
      }, 100);
    });
  });

  describe('Key Press Handling', () => {
    beforeEach(() => {
      store.patchState({
        sessionState: SessionState.IN_PROGRESS,
        cards: mockSession.cards,
        currentIndex: 0
      });
    });

    it('should flip card on space key', () => {
      store.handleKeyPress(' ');
      
      expect(store.get().cardFlipped).toBe(true);
    });

    it('should show hint on h key', () => {
      store.handleKeyPress('h');
      
      expect(store.get().showingHint).toBe(true);
    });

    it('should submit response on number keys when card is flipped', () => {
      practiceService.submitResponse.and.returnValue(of({} as any));
      store.patchState({ cardFlipped: true });
      
      store.handleKeyPress('1');
      
      expect(practiceService.submitResponse).toHaveBeenCalled();
    });

    it('should not submit response on number keys when card is not flipped', () => {
      store.patchState({ cardFlipped: false });
      
      store.handleKeyPress('1');
      
      expect(practiceService.submitResponse).not.toHaveBeenCalled();
    });

    it('should navigate with arrow keys', () => {
      store.patchState({ currentIndex: 1 });
      
      store.handleKeyPress('ArrowLeft');
      expect(store.get().currentIndex).toBe(0);
      
      store.handleKeyPress('ArrowRight');
      expect(store.get().currentIndex).toBe(1);
    });

    it('should handle Enter key properly', () => {
      // Should flip card if not flipped
      store.handleKeyPress('Enter');
      expect(store.get().cardFlipped).toBe(true);
      
      // Should submit response if flipped and card not seen
      practiceService.submitResponse.and.returnValue(of({} as any));
      store.handleKeyPress('Enter');
      expect(practiceService.submitResponse).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should return loading state', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
      
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });

    it('should return error state', () => {
      expect(store.hasError()).toBe(false);
      expect(store.getError()).toBeNull();
      
      store.setError('Test error');
      expect(store.hasError()).toBe(true);
      expect(store.getError()).toBe('Test error');
    });

    it('should return current progress percentage', () => {
      store.patchState({
        cards: mockSession.cards,
        currentIndex: 0
      });
      
      expect(store.getCurrentProgress()).toBe(50);
    });
  });
});
