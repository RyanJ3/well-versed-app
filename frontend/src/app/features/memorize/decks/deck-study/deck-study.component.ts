import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AppState } from '@app/state';
import {
  PracticeSessionActions,
  PracticeKeyboardActions,
} from '@app/state/practice-session';
import {
  selectCurrentCard,
  selectIsCardFlipped,
  selectSessionProgress,
  selectSessionStats,
  selectCurrentStreak,
  selectIsSessionActive,
} from '@app/state/practice-session/selectors/practice-session.selectors';
import {
  SessionType,
  ResponseQuality,
} from '@app/state/practice-session/models/practice-session.model';

@Component({
  selector: 'app-deck-study',
  standalone: true,
  imports: [CommonModule /* other imports */],
  template: `
    <div class="deck-study" *ngIf="isSessionActive$ | async">
      <!-- Progress Bar -->
      <div class="study-header">
        <div class="progress-info" *ngIf="progress$ | async as progress">
          <span>{{ progress.seenCards }} / {{ progress.totalCards }}</span>
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="progress.percentComplete"
            ></div>
          </div>
        </div>

        <div class="study-actions">
          <button (click)="toggleStats()">
            <i class="icon-stats"></i>
          </button>
          <button (click)="pauseSession()">
            <i class="icon-pause"></i>
          </button>
          <button (click)="endSession()">
            <i class="icon-x"></i>
          </button>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="stats-panel" *ngIf="showStats">
        <div class="stat" *ngIf="stats$ | async as stats">
          <span class="label">Accuracy</span>
          <span class="value">{{ stats.accuracy | number: '1.0-0' }}%</span>
        </div>
        <div class="stat">
          <span class="label">Streak</span>
          <span class="value">{{ currentStreak$ | async }}</span>
        </div>
      </div>

      <!-- Card Display -->
      <div class="card-container" *ngIf="currentCard$ | async as card">
        <div
          class="flashcard"
          [class.flipped]="isFlipped$ | async"
          (click)="flipCard()"
        >
          <div class="card-front">
            <div class="card-content">
              {{ card.front }}
            </div>
            <div class="card-reference" *ngIf="card.verseReference">
              {{ card.verseReference }}
            </div>
          </div>

          <div class="card-back">
            <div class="card-content">
              {{ card.back }}
            </div>
            <button
              class="hint-btn"
              *ngIf="card.hint && !showingHint"
              (click)="showHint($event)"
            >
              Show Hint
            </button>
            <div class="hint" *ngIf="showingHint">
              {{ card.hint }}
            </div>
          </div>
        </div>

        <!-- Response Buttons -->
        <div class="response-buttons" *ngIf="isFlipped$ | async">
          <button class="response-btn again" (click)="submitResponse(0)">
            <span class="quality">Again</span>
            <span class="interval">< 1 min</span>
          </button>
          <button class="response-btn hard" (click)="submitResponse(1)">
            <span class="quality">Hard</span>
            <span class="interval">~5 min</span>
          </button>
          <button class="response-btn good" (click)="submitResponse(2)">
            <span class="quality">Good</span>
            <span class="interval">~10 min</span>
          </button>
          <button class="response-btn easy" (click)="submitResponse(3)">
            <span class="quality">Easy</span>
            <span class="interval">~4 days</span>
          </button>
        </div>
      </div>

      <!-- Keyboard Shortcuts Help -->
      <div class="keyboard-help">
        <span><kbd>Space</kbd> Flip Card</span>
        <span><kbd>1-4</kbd> Rate Difficulty</span>
        <span><kbd>H</kbd> Show Hint</span>
        <span><kbd>S</kbd> Skip</span>
      </div>
    </div>

    <!-- No Active Session -->
    <div class="no-session" *ngIf="!(isSessionActive$ | async)">
      <h2>No active study session</h2>
      <button (click)="startNewSession()">Start Studying</button>
    </div>
  `,
  styleUrls: ['./deck-study.component.scss'],
})
export class DeckStudyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private responseStartTime = Date.now();
  private hintsUsed = 0;

  private store = inject(Store<AppState>);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isSessionActive$ = this.store.select(selectIsSessionActive);
  currentCard$ = this.store.select(selectCurrentCard);
  isFlipped$ = this.store.select(selectIsCardFlipped);
  progress$ = this.store.select(selectSessionProgress);
  stats$ = this.store.select(selectSessionStats);
  currentStreak$ = this.store.select(selectCurrentStreak);

  showStats = false;
  showingHint = false;
  deckId!: number;


  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.deckId = +params['id'];
      this.startNewSession();
    });

    this.currentCard$
      .pipe(
        filter((card) => card !== null),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.responseStartTime = Date.now();
        this.hintsUsed = 0;
        this.showingHint = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
    }

    switch (event.key) {
      case ' ':
        this.store.dispatch(PracticeKeyboardActions.pressSpace());
        break;
      case 'Enter':
        this.store.dispatch(PracticeKeyboardActions.pressEnter());
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        this.store.dispatch(
          PracticeKeyboardActions.pressNumber({ key: parseInt(event.key) }),
        );
        break;
      case 'h':
      case 'H':
        this.store.dispatch(PracticeKeyboardActions.pressH());
        break;
      case 's':
      case 'S':
        this.store.dispatch(PracticeKeyboardActions.pressS());
        break;
      case 'Escape':
        this.store.dispatch(PracticeKeyboardActions.pressEscape());
        break;
    }
  }

  startNewSession(): void {
    this.store.dispatch(
      PracticeSessionActions.startSession({
        request: {
          deckId: this.deckId,
          settings: {
            sessionType: SessionType.REVIEW,
            cardLimit: 20,
            showHints: true,
          },
        },
      }),
    );
  }

  flipCard(): void {
    this.store.dispatch(PracticeSessionActions.flipCard());
  }

  showHint(event: Event): void {
    event.stopPropagation();
    this.showingHint = true;
    this.hintsUsed++;
    this.store.dispatch(PracticeSessionActions.showHint());
  }

  submitResponse(quality: ResponseQuality): void {
    const responseTime = Date.now() - this.responseStartTime;
    this.currentCard$
      .pipe(
        filter((card) => card !== null),
        takeUntil(this.destroy$),
      )
      .subscribe((card) => {
        if (card) {
          this.store.dispatch(
            PracticeSessionActions.submitResponse({
              cardId: card.id,
              quality,
              responseTime,
              hintsUsed: this.hintsUsed,
            }),
          );
        }
      });
  }

  pauseSession(): void {
    this.store.dispatch(PracticeSessionActions.pauseSession());
  }

  endSession(): void {
    if (confirm('End this study session?')) {
      this.store.dispatch(PracticeSessionActions.endSession());
      this.router.navigate(['/app/memorize/decks']);
    }
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
    this.store.dispatch(PracticeSessionActions.toggleStats());
  }
}
