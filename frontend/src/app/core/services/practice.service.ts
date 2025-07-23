import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  StartSessionRequest,
  ActiveSession,
  SubmitResponseRequest,
  CardResponse,
  SessionSummary,
  CompletedSession,
  SessionType,
  SessionState,
  ResponseQuality
} from '../../state/practice-session/models/practice-session.model';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  
  startSession(request: StartSessionRequest): Observable<ActiveSession> {
    const mockSession: ActiveSession = {
      id: 'session-' + Date.now(),
      deckId: request.deckId,
      deckName: 'Mock Deck',
      type: request.settings?.sessionType || SessionType.REVIEW,
      cards: this.generateMockCards(request.settings?.cardLimit || 20),
      currentIndex: 0,
      responses: [],
      startTime: new Date(),
      settings: {
        sessionType: SessionType.REVIEW,
        cardLimit: 20,
        timeLimit: null,
        newCardsPerSession: 5,
        reviewOrder: 'due_date' as any,
        prioritizeDue: true,
        includeNewCards: true,
        showHints: true,
        autoPlayAudio: false,
        flipAnimation: true,
        fontSize: 'medium',
        immediateAnswerFeedback: true,
        requireTypedAnswer: false,
        caseSensitive: false,
        showProgress: true,
        easyBonus: 1.3,
        intervalModifier: 1.0,
        lapseMultiplier: 0.5,
        minimumInterval: 1,
        ...request.settings
      },
      state: SessionState.IN_PROGRESS
    };
    
    return of(mockSession).pipe(delay(500));
  }

  submitResponse(request: SubmitResponseRequest): Observable<CardResponse> {
    const response: CardResponse = {
      cardId: request.cardId,
      quality: request.quality,
      responseTime: request.responseTime,
      hintsUsed: request.hintsUsed,
      audioPlayed: false,
      timestamp: new Date(),
      correct: request.quality >= ResponseQuality.GOOD,
      newInterval: this.calculateNewInterval(request.quality),
      newEaseFactor: this.calculateNewEaseFactor(request.quality)
    };
    
    return of(response).pipe(delay(300));
  }

  completeSession(sessionId: string): Observable<SessionSummary> {
    const mockSummary: SessionSummary = {
      session: {
        id: sessionId,
        deckId: 1,
        type: SessionType.REVIEW,
        startTime: new Date(Date.now() - 15 * 60 * 1000),
        endTime: new Date(),
        duration: 900,
        cardsStudied: 20,
        correctCount: 18,
        accuracy: 90,
        averageResponseTime: 3.5,
        masteryChange: 5,
        streakMaintained: true
      },
      cardUpdates: [],
      achievements: [],
      nextReviewSummary: {
        today: 5,
        tomorrow: 10,
        thisWeek: 25,
        thisMonth: 50
      }
    };
    
    return of(mockSummary).pipe(delay(500));
  }

  getSessionHistory(): Observable<CompletedSession[]> {
    return of([]).pipe(delay(300));
  }

  private generateMockCards(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      deckId: 1,
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
      hint: `Hint for question ${i + 1}`,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      order: i,
      seen: false
    }));
  }

  private calculateNewInterval(quality: ResponseQuality): number {
    switch (quality) {
      case ResponseQuality.AGAIN: return 1;
      case ResponseQuality.HARD: return 2;
      case ResponseQuality.GOOD: return 4;
      case ResponseQuality.EASY: return 7;
      default: return 1;
    }
  }

  private calculateNewEaseFactor(quality: ResponseQuality): number {
    switch (quality) {
      case ResponseQuality.AGAIN: return 1.3;
      case ResponseQuality.HARD: return 2.0;
      case ResponseQuality.GOOD: return 2.5;
      case ResponseQuality.EASY: return 2.8;
      default: return 2.5;
    }
  }
}
