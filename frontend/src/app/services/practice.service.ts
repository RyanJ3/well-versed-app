import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  StartSessionRequest,
  ActiveSession,
  CardResponse,
  SessionSummary,
} from '../../state/practice-session/models/practice-session.model';

@Injectable({ providedIn: 'root' })
export class PracticeService {
  startSession(request: StartSessionRequest): Observable<ActiveSession> {
    console.log('Starting practice session', request);
    // Placeholder: should call backend API
    const dummy: ActiveSession = {
      id: 'local',
      deckId: request.deckId,
      deckName: 'Dummy',
      type: request.settings.sessionType || ('review' as any),
      cards: [],
      currentIndex: 0,
      responses: [],
      startTime: new Date(),
      settings: request.settings as any,
      state: 'in_progress' as any,
    };
    return of(dummy);
  }

  submitResponse(payload: {
    sessionId: string;
    cardId: number;
    quality: number;
    responseTime: number;
    hintsUsed: number;
  }): Observable<CardResponse> {
    console.log('Submitting response', payload);
    return of({
      cardId: payload.cardId,
      quality: payload.quality as any,
      responseTime: payload.responseTime,
      hintsUsed: payload.hintsUsed,
      audioPlayed: false,
      timestamp: new Date(),
      correct: true,
      newInterval: 1,
      newEaseFactor: 2.5,
    });
  }

  completeSession(sessionId: string): Observable<SessionSummary> {
    console.log('Completing session', sessionId);
    return of({
      session: {
        id: sessionId,
        deckId: 0,
        type: 'review' as any,
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
        cardsStudied: 0,
        correctCount: 0,
        accuracy: 0,
        averageResponseTime: 0,
        masteryChange: 0,
        streakMaintained: true,
      },
      cardUpdates: [],
      achievements: [],
      nextReviewSummary: { today: 0, tomorrow: 0, thisWeek: 0, thisMonth: 0 },
    });
  }

  getSessionHistory(): Observable<any[]> {
    console.log('Loading session history');
    return of([]);
  }
}
