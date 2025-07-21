import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { QuizSession, QuizQuestion, QuizAttempt, QuizSettings } from '../models/quiz.types';

@Injectable()
export class QuizStateService {
  private session$ = new BehaviorSubject<QuizSession | null>(null);
  private timeRemaining$ = new BehaviorSubject<number>(0);
  private timerSubscription?: Subscription;

  currentSession = this.session$.asObservable();
  timeRemaining = this.timeRemaining$.asObservable();

  initializeQuiz(
    courseId: number,
    lessonId: number,
    questions: QuizQuestion[],
    settings: QuizSettings
  ): void {
    const session: QuizSession = {
      id: this.generateId(),
      courseId,
      lessonId,
      questions: settings.shuffleQuestions ? this.shuffleArray(questions) : questions,
      attempts: [],
      startTime: new Date(),
      settings,
      currentQuestionIndex: 0,
      score: 0,
      state: 'in-progress'
    };

    this.session$.next(session);

    if (settings.timeLimit) {
      this.startTimer(settings.timeLimit * 60);
    }
  }

  get currentQuestion(): Observable<QuizQuestion | null> {
    return new BehaviorSubject(this.getCurrentQuestion()).asObservable();
  }

  getCurrentQuestion(): QuizQuestion | null {
    const session = this.session$.value;
    if (!session) return null;
    return session.questions[session.currentQuestionIndex] || null;
  }

  submitAnswer(answer: string, timeSpent: number, hintsUsed: number): boolean {
    const session = this.session$.value;
    if (!session) return false;

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) return false;

    const isCorrect = this.validateAnswer(answer, currentQuestion.correctAnswer);

    const attempt: QuizAttempt = {
      questionId: currentQuestion.id,
      userAnswer: answer,
      isCorrect,
      timeSpent,
      hintsUsed,
      timestamp: new Date()
    };

    session.attempts.push(attempt);
    if (isCorrect) {
      session.score++;
    }

    this.session$.next(session);
    return isCorrect;
  }

  nextQuestion(): void {
    const session = this.session$.value;
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      session.currentQuestionIndex++;
      this.session$.next(session);
    } else {
      this.completeQuiz();
    }
  }

  completeQuiz(): void {
    const session = this.session$.value;
    if (!session) return;

    session.state = 'completed';
    session.endTime = new Date();
    this.session$.next(session);
    this.stopTimer();
  }

  private startTimer(seconds: number): void {
    this.timeRemaining$.next(seconds);

    this.timerSubscription = timer(0, 1000).subscribe(() => {
      const current = this.timeRemaining$.value;
      if (current > 0) {
        this.timeRemaining$.next(current - 1);
      } else {
        this.completeQuiz();
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private validateAnswer(userAnswer: string, correctAnswer: string): boolean {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
