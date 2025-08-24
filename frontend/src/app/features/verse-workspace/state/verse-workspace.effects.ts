import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, tap, mergeMap, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';

import * as WorkspaceActions from './verse-workspace.actions';
import { selectCurrentBook, selectCurrentChapter } from './verse-workspace.selectors';
import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { DeckService } from '@services/api/deck.service';
import { NotificationService } from '@services/utils/notification.service';
import { StorageService } from '@services/utils/storage.service';

@Injectable()
export class VerseWorkspaceEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private bibleService: BibleService,
    private userService: UserService,
    private deckService: DeckService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private router: Router
  ) {}

  // Load verses when chapter is requested
  loadVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadVerses),
      switchMap(({ bookId, chapterNumber }) =>
        this.bibleService.getChapterVerses(bookId, chapterNumber).pipe(
          map(response => {
            const verses = response.verses.map(v => ({
              id: v.verse_code,
              verseCode: v.verse_code,
              bookId: v.book_id,
              chapterNumber: v.chapter_number,
              verseNumber: v.verse_number,
              text: v.text,
              isMemorized: false,
              confidence: 0,
              practiceCount: 0,
              lastPracticed: null,
              isSelected: false,
              isHighlighted: false
            }));
            
            return WorkspaceActions.loadVersesSuccess({
              verses,
              book: response.book,
              chapter: response.chapter
            });
          }),
          catchError(error => 
            of(WorkspaceActions.loadVersesFailure({ 
              error: error.message || 'Failed to load verses' 
            }))
          )
        )
      )
    )
  );

  // Mark verse as memorized
  markVerseMemorized$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.markVerseMemorized),
      mergeMap(({ verseId, confidence }) =>
        this.userService.saveVerseProgress(verseId, confidence).pipe(
          map(() => {
            this.notificationService.success('Verse marked as memorized!');
            return WorkspaceActions.markVerseMemorizedSuccess({ verseId });
          }),
          catchError(error => {
            this.notificationService.error('Failed to save progress');
            return of(WorkspaceActions.loadVersesFailure({ 
              error: error.message 
            }));
          })
        )
      )
    )
  );

  // Navigation effects
  navigateNext$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.navigateNext),
      withLatestFrom(
        this.store.select(selectCurrentBook),
        this.store.select(selectCurrentChapter)
      ),
      map(([_, book, chapter]) => {
        if (!book || !chapter) return WorkspaceActions.clearError();
        
        const nextChapter = chapter.chapterNumber + 1;
        if (nextChapter <= book.totalChapters) {
          return WorkspaceActions.loadVerses({
            bookId: book.id,
            chapterNumber: nextChapter
          });
        }
        
        this.notificationService.info('You\'ve reached the last chapter');
        return WorkspaceActions.clearError();
      })
    )
  );

  navigatePrevious$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.navigatePrevious),
      withLatestFrom(
        this.store.select(selectCurrentBook),
        this.store.select(selectCurrentChapter)
      ),
      map(([_, book, chapter]) => {
        if (!book || !chapter) return WorkspaceActions.clearError();
        
        const prevChapter = chapter.chapterNumber - 1;
        if (prevChapter >= 1) {
          return WorkspaceActions.loadVerses({
            bookId: book.id,
            chapterNumber: prevChapter
          });
        }
        
        this.notificationService.info('You\'re at the first chapter');
        return WorkspaceActions.clearError();
      })
    )
  );

  // Save settings to local storage
  saveSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.updateSettings),
      debounceTime(500),
      tap(({ settings }) => {
        this.storageService.setItem('verse-workspace-settings', settings);
      })
    ),
    { dispatch: false }
  );

  // Load settings from local storage
  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadSettings),
      map(() => {
        const settings = this.storageService.getItem('verse-workspace-settings');
        if (settings) {
          return WorkspaceActions.loadSettingsSuccess({ settings });
        }
        return WorkspaceActions.clearError();
      })
    )
  );

  // Add verses to deck
  addToDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.addToDeck),
      mergeMap(({ verseIds, deckId }) =>
        this.deckService.addVersesToDeck(deckId, verseIds).pipe(
          map(() => {
            this.notificationService.success(`Added ${verseIds.length} verses to deck`);
            return WorkspaceActions.addToDeckSuccess({ deckId });
          }),
          catchError(error => {
            this.notificationService.error('Failed to add verses to deck');
            return of(WorkspaceActions.loadVersesFailure({ 
              error: error.message 
            }));
          })
        )
      )
    )
  );

  // Create deck from selection
  createDeckFromSelection$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.createDeckFromSelection),
      mergeMap(({ name, description, verseIds }) =>
        this.deckService.createDeck({
          name,
          description,
          is_public: false,
          verse_codes: verseIds
        }).pipe(
          tap(deck => {
            this.notificationService.success('Deck created successfully!');
            this.router.navigate(['/deck-editor', deck.deck_id]);
          }),
          map(() => WorkspaceActions.clearSelection()),
          catchError(error => {
            this.notificationService.error('Failed to create deck');
            return of(WorkspaceActions.loadVersesFailure({ 
              error: error.message 
            }));
          })
        )
      )
    )
  );

  // Load topical verses
  loadTopicalVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadTopicalVerses),
      switchMap(({ topic }) =>
        this.bibleService.getTopicalVerses(topic).pipe(
          map(verses => {
            const verseData = verses.map(v => ({
              id: v.verse_code,
              verseCode: v.verse_code,
              bookId: v.book_id,
              chapterNumber: v.chapter_number,
              verseNumber: v.verse_number,
              text: v.text,
              isMemorized: false,
              confidence: 0,
              practiceCount: 0,
              lastPracticed: null,
              isSelected: false,
              isHighlighted: false,
              topics: [topic]
            }));
            
            return WorkspaceActions.loadTopicalVersesSuccess({
              verses: verseData,
              topic
            });
          }),
          catchError(error => 
            of(WorkspaceActions.loadVersesFailure({ 
              error: error.message || 'Failed to load topical verses' 
            }))
          )
        )
      )
    )
  );

  // Load cross references
  loadCrossReferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadCrossReferences),
      mergeMap(({ verseId }) =>
        this.bibleService.getCrossReferences(verseId).pipe(
          map(references => 
            WorkspaceActions.loadCrossReferencesSuccess({
              verseId,
              references
            })
          ),
          catchError(() => of(WorkspaceActions.clearError()))
        )
      )
    )
  );

  // Mark multiple verses as memorized
  markMultipleVersesMemorized$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.markMultipleVersesMemorized),
      mergeMap(({ verseIds }) =>
        from(Promise.all(
          verseIds.map(id => 
            this.userService.saveVerseProgress(id, 100).toPromise()
          )
        )).pipe(
          tap(() => {
            this.notificationService.success(
              `Marked ${verseIds.length} verses as memorized!`
            );
          }),
          map(() => WorkspaceActions.clearSelection()),
          catchError(error => {
            this.notificationService.error('Failed to save progress');
            return of(WorkspaceActions.loadVersesFailure({ 
              error: error.message 
            }));
          })
        )
      )
    )
  );

  // Session management
  endSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.endMemorizationSession),
      tap(({ accuracy, timeSpent }) => {
        const message = accuracy >= 80 
          ? 'Great job! Keep up the excellent work!' 
          : 'Good effort! Practice makes perfect!';
        this.notificationService.success(message);
      })
    ),
    { dispatch: false }
  );

  // Error handling
  showError$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WorkspaceActions.loadVersesFailure),
      tap(({ error }) => {
        this.notificationService.error(error);
      })
    ),
    { dispatch: false }
  );
}