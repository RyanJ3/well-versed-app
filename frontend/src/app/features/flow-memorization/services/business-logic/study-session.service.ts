import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, timer } from 'rxjs';
import { map, distinctUntilChanged, takeUntil, tap } from 'rxjs/operators';
import { BaseVerse } from '../../models/verse-types.model';

export type StudyMode = 'learn' | 'review' | 'test' | 'speed';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface StudySessionConfig {
  mode: StudyMode;
  verseCodes: string[];
  repetitions: number;
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  shuffleOrder: boolean;
  hideReference: boolean;
  hintLevel: number; // 0-3 (none, first letter, first word, half)
  timeLimit?: number; // For speed mode
}

export interface StudySessionState {
  sessionId: string;
  config: StudySessionConfig;
  currentIndex: number;
  currentRound: number;
  attempts: Map<string, StudyAttempt[]>;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  isPaused: boolean;
  score: StudyScore;
}

export interface StudyAttempt {
  verseCode: string;
  round: number;
  correct: boolean;
  timeSpent: number;
  hintUsed: boolean;
  timestamp: number;
}

export interface StudyScore {
  correctCount: number;
  totalAttempts: number;
  accuracy: number;
  averageTime: number;
  streak: number;
  maxStreak: number;
  difficulty: DifficultyLevel;
}

/**
 * Service responsible for managing study sessions
 * Single responsibility: Handle all study session logic
 */
@Injectable({
  providedIn: 'root'
})
export class StudySessionService {
  private sessionState$ = new BehaviorSubject<StudySessionState | null>(null);
  private sessionTimer$ = new BehaviorSubject<number>(0);
  private autoAdvanceTimer$ = new BehaviorSubject<any>(null);
  
  // Public observables
  readonly session$ = this.sessionState$.asObservable();
  
  readonly isActive$ = this.session$.pipe(
    map(session => session?.isActive || false),
    distinctUntilChanged()
  );
  
  readonly currentVerse$ = this.session$.pipe(
    map(session => session ? session.config.verseCodes[session.currentIndex] : null),
    distinctUntilChanged()
  );
  
  readonly progress$ = this.session$.pipe(
    map(session => {
      if (!session) return null;
      const total = session.config.verseCodes.length * session.config.repetitions;
      const current = (session.currentRound * session.config.verseCodes.length) + session.currentIndex + 1;
      return {
        current,
        total,
        percentage: Math.round((current / total) * 100),
        round: session.currentRound + 1,
        totalRounds: session.config.repetitions
      };
    })
  );
  
  readonly score$ = this.session$.pipe(
    map(session => session?.score || this.getEmptyScore()),
    distinctUntilChanged()
  );
  
  readonly elapsedTime$ = this.sessionTimer$.pipe(
    map(time => this.formatTime(time))
  );
  
  /**
   * Start a new study session
   */
  startSession(config: Partial<StudySessionConfig>): string {
    const sessionId = this.generateSessionId();
    const fullConfig: StudySessionConfig = {
      mode: config.mode || 'learn',
      verseCodes: config.verseCodes || [],
      repetitions: config.repetitions || 3,
      autoAdvance: config.autoAdvance !== false,
      autoAdvanceDelay: config.autoAdvanceDelay || 3000,
      shuffleOrder: config.shuffleOrder || false,
      hideReference: config.hideReference || false,
      hintLevel: config.hintLevel || 0,
      timeLimit: config.timeLimit
    };
    
    // Shuffle verses if requested
    if (fullConfig.shuffleOrder) {
      fullConfig.verseCodes = this.shuffleArray([...fullConfig.verseCodes]);
    }
    
    const sessionState: StudySessionState = {
      sessionId,
      config: fullConfig,
      currentIndex: 0,
      currentRound: 0,
      attempts: new Map(),
      startTime: Date.now(),
      isActive: true,
      isPaused: false,
      score: this.getEmptyScore()
    };
    
    this.sessionState$.next(sessionState);
    this.startTimer();
    
    return sessionId;
  }
  
  /**
   * End the current session
   */
  endSession(): StudySessionState | null {
    const session = this.sessionState$.value;
    if (!session) return null;
    
    const finalSession: StudySessionState = {
      ...session,
      endTime: Date.now(),
      isActive: false
    };
    
    this.sessionState$.next(finalSession);
    this.stopTimer();
    this.cancelAutoAdvance();
    
    return finalSession;
  }
  
  /**
   * Record an attempt for current verse
   */
  recordAttempt(correct: boolean, hintUsed = false): void {
    const session = this.sessionState$.value;
    if (!session || !session.isActive) return;
    
    const verseCode = session.config.verseCodes[session.currentIndex];
    const attempt: StudyAttempt = {
      verseCode,
      round: session.currentRound,
      correct,
      timeSpent: this.sessionTimer$.value - this.getLastAttemptTime(session),
      hintUsed,
      timestamp: Date.now()
    };
    
    // Update attempts
    const attempts = session.attempts.get(verseCode) || [];
    attempts.push(attempt);
    session.attempts.set(verseCode, attempts);
    
    // Update score
    const score = this.calculateScore(session);
    
    // Update state
    this.sessionState$.next({
      ...session,
      attempts: session.attempts,
      score
    });
    
    // Auto-advance if enabled
    if (session.config.autoAdvance) {
      this.scheduleAutoAdvance();
    }
  }
  
  /**
   * Move to next verse
   */
  nextVerse(): void {
    const session = this.sessionState$.value;
    if (!session || !session.isActive) return;
    
    let { currentIndex, currentRound } = session;
    
    currentIndex++;
    
    // Check if we need to move to next round
    if (currentIndex >= session.config.verseCodes.length) {
      currentIndex = 0;
      currentRound++;
      
      // Check if session is complete
      if (currentRound >= session.config.repetitions) {
        this.endSession();
        return;
      }
      
      // Shuffle for new round if enabled
      if (session.config.shuffleOrder) {
        session.config.verseCodes = this.shuffleArray([...session.config.verseCodes]);
      }
    }
    
    this.sessionState$.next({
      ...session,
      currentIndex,
      currentRound
    });
    
    this.cancelAutoAdvance();
  }
  
  /**
   * Move to previous verse
   */
  previousVerse(): void {
    const session = this.sessionState$.value;
    if (!session || !session.isActive) return;
    
    let { currentIndex, currentRound } = session;
    
    currentIndex--;
    
    if (currentIndex < 0) {
      if (currentRound > 0) {
        currentRound--;
        currentIndex = session.config.verseCodes.length - 1;
      } else {
        currentIndex = 0;
      }
    }
    
    this.sessionState$.next({
      ...session,
      currentIndex,
      currentRound
    });
    
    this.cancelAutoAdvance();
  }
  
  /**
   * Jump to specific verse
   */
  jumpToVerse(index: number): void {
    const session = this.sessionState$.value;
    if (!session || !session.isActive) return;
    
    if (index >= 0 && index < session.config.verseCodes.length) {
      this.sessionState$.next({
        ...session,
        currentIndex: index
      });
    }
  }
  
  /**
   * Pause/Resume session
   */
  togglePause(): void {
    const session = this.sessionState$.value;
    if (!session || !session.isActive) return;
    
    const isPaused = !session.isPaused;
    
    this.sessionState$.next({
      ...session,
      isPaused
    });
    
    if (isPaused) {
      this.stopTimer();
      this.cancelAutoAdvance();
    } else {
      this.startTimer();
    }
  }
  
  /**
   * Get hint for current verse
   */
  getHint(verseText: string, level?: number): string {
    const hintLevel = level ?? this.sessionState$.value?.config.hintLevel ?? 0;
    
    switch (hintLevel) {
      case 1: // First letter of each word
        return verseText.split(' ').map(word => word[0] + '...').join(' ');
        
      case 2: // First word of each sentence
        return verseText.split('.').map(sentence => {
          const trimmed = sentence.trim();
          const firstWord = trimmed.split(' ')[0];
          return firstWord ? firstWord + '...' : '';
        }).filter(Boolean).join('. ');
        
      case 3: // Half the text
        const words = verseText.split(' ');
        const halfLength = Math.ceil(words.length / 2);
        return words.slice(0, halfLength).join(' ') + '...';
        
      default:
        return '';
    }
  }
  
  /**
   * Get session statistics
   */
  getSessionStats(): any {
    const session = this.sessionState$.value;
    if (!session) return null;
    
    const totalTime = Date.now() - session.startTime;
    const attemptsArray = Array.from(session.attempts.values()).flat();
    
    return {
      sessionId: session.sessionId,
      mode: session.config.mode,
      versesStudied: session.attempts.size,
      totalVerses: session.config.verseCodes.length,
      rounds: session.currentRound + 1,
      totalRounds: session.config.repetitions,
      attempts: attemptsArray.length,
      correctAttempts: attemptsArray.filter(a => a.correct).length,
      accuracy: session.score.accuracy,
      averageTime: session.score.averageTime,
      totalTime,
      streak: session.score.streak,
      maxStreak: session.score.maxStreak
    };
  }
  
  /**
   * Calculate score based on attempts
   */
  private calculateScore(session: StudySessionState): StudyScore {
    const attemptsArray = Array.from(session.attempts.values()).flat();
    
    if (attemptsArray.length === 0) {
      return this.getEmptyScore();
    }
    
    const correctCount = attemptsArray.filter(a => a.correct).length;
    const accuracy = Math.round((correctCount / attemptsArray.length) * 100);
    const averageTime = attemptsArray.reduce((sum, a) => sum + a.timeSpent, 0) / attemptsArray.length;
    
    // Calculate streak
    let streak = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    
    attemptsArray.forEach(attempt => {
      if (attempt.correct) {
        currentStreak++;
        streak = currentStreak;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    // Determine difficulty
    let difficulty: DifficultyLevel = 'medium';
    if (accuracy >= 90 && averageTime < 5000) {
      difficulty = 'easy';
    } else if (accuracy < 60 || averageTime > 15000) {
      difficulty = 'hard';
    }
    
    return {
      correctCount,
      totalAttempts: attemptsArray.length,
      accuracy,
      averageTime: Math.round(averageTime),
      streak,
      maxStreak,
      difficulty
    };
  }
  
  /**
   * Get empty score object
   */
  private getEmptyScore(): StudyScore {
    return {
      correctCount: 0,
      totalAttempts: 0,
      accuracy: 0,
      averageTime: 0,
      streak: 0,
      maxStreak: 0,
      difficulty: 'medium'
    };
  }
  
  /**
   * Start session timer
   */
  private startTimer(): void {
    const startTime = this.sessionState$.value?.startTime || Date.now();
    
    interval(1000).subscribe(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      this.sessionTimer$.next(elapsed);
    });
  }
  
  /**
   * Stop session timer
   */
  private stopTimer(): void {
    // Timer will stop when component unsubscribes
  }
  
  /**
   * Schedule auto-advance
   */
  private scheduleAutoAdvance(): void {
    const session = this.sessionState$.value;
    if (!session) return;
    
    const timer = timer(session.config.autoAdvanceDelay).subscribe(() => {
      this.nextVerse();
    });
    
    this.autoAdvanceTimer$.next(timer);
  }
  
  /**
   * Cancel auto-advance
   */
  private cancelAutoAdvance(): void {
    const timer = this.autoAdvanceTimer$.value;
    if (timer) {
      timer.unsubscribe();
      this.autoAdvanceTimer$.next(null);
    }
  }
  
  /**
   * Get last attempt time
   */
  private getLastAttemptTime(session: StudySessionState): number {
    const attemptsArray = Array.from(session.attempts.values()).flat();
    if (attemptsArray.length === 0) return 0;
    
    const lastAttempt = attemptsArray[attemptsArray.length - 1];
    return Math.floor((lastAttempt.timestamp - session.startTime) / 1000);
  }
  
  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Format time in seconds to mm:ss
   */
  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}