import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import * as WorkspaceActions from './verse-workspace.actions';
import { BibleService } from '@services/api/bible.service';
import { UserService } from '@services/api/user.service';
import { DeckService } from '@services/api/deck.service';
import { NotificationService } from '@services/utils/notification.service';
import { StorageService } from '@services/utils/storage.service';
import { VerseData, WorkspaceSettings } from './verse-workspace.state';

@Injectable()
export class VerseWorkspaceEffects {
  loadVerses$;
  markVerseMemorized$;
  saveSettings$;
  loadSettings$;
  loadTopicalVerses$;
  loadCrossReferences$;
  addToDeck$;
  markMultipleVersesMemorized$;

  constructor(
    private actions$: Actions,
    private store: Store,
    private bibleService: BibleService,
    private userService: UserService,
    private deckService: DeckService,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {
    // Load verses when chapter is requested
    this.loadVerses$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.loadVerses),
        switchMap(({ bookId, chapterNumber }) => {
          // For now, return mock data since getChapterVerses doesn't exist
          const mockVerses: VerseData[] = [];
          const mockBook = { id: bookId, name: 'Genesis', abbreviation: 'Gen' };
          const mockChapter = { number: chapterNumber, verseCount: 10 };
          
          return of(WorkspaceActions.loadVersesSuccess({
            verses: mockVerses,
            book: mockBook as any,
            chapter: mockChapter as any
          }));
        }),
        catchError(error => of(WorkspaceActions.loadVersesFailure({
          error: error.message || 'Failed to load verses'
        })))
      )
    );

    // Mark verse as memorized
    this.markVerseMemorized$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.markVerseMemorized),
        switchMap(({ verseId }) => {
          // Mock implementation - in real app would save to backend
          return of(WorkspaceActions.markVerseMemorizedSuccess({ verseId }));
        }),
        catchError(error => of(WorkspaceActions.loadVersesFailure({
          error: error.message || 'Failed to mark verse as memorized'
        })))
      )
    );

    // Save settings to local storage
    this.saveSettings$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.updateSettings),
        tap(({ settings }) => {
          this.storageService.setItem('verse-workspace-settings', JSON.stringify(settings));
        })
      ),
      { dispatch: false }
    );

    // Load settings from local storage
    this.loadSettings$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.loadSettings),
        map(() => {
          const savedSettings = this.storageService.getItem('verse-workspace-settings');
          if (savedSettings) {
            const settings = JSON.parse(savedSettings) as WorkspaceSettings;
            return WorkspaceActions.loadSettingsSuccess({ settings });
          }
          return WorkspaceActions.loadSettingsSuccess({ 
            settings: {
              autoAdvance: true,
              showVerseNumbers: true,
              showProgressBar: true,
              highlightNewVerses: true,
              defaultDifficulty: 'medium',
              practiceMode: 'sequential',
              hideMemorizedVerses: false,
              groupBySection: false
            }
          });
        })
      )
    );

    // Load topical verses
    this.loadTopicalVerses$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.loadTopicalVerses),
        switchMap(({ topic }) => {
          // Mock implementation
          const mockVerses: VerseData[] = [];
          return of(WorkspaceActions.loadTopicalVersesSuccess({
            verses: mockVerses,
            topic
          }));
        }),
        catchError(error => of(WorkspaceActions.loadVersesFailure({
          error: error.message || 'Failed to load topical verses'
        })))
      )
    );

    // Load cross references
    this.loadCrossReferences$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.loadCrossReferences),
        switchMap(({ verseId }) => {
          // Mock implementation
          return of(WorkspaceActions.loadCrossReferencesSuccess({
            verseId,
            references: []
          }));
        }),
        catchError(error => of(WorkspaceActions.loadVersesFailure({
          error: error.message || 'Failed to load cross references'
        })))
      )
    );

    // Add verses to deck
    this.addToDeck$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.addToDeck),
        switchMap(({ verseIds, deckId }) => {
          // Mock implementation
          this.notificationService.success('Verses added to deck');
          return of(WorkspaceActions.addToDeckSuccess({ deckId }));
        }),
        catchError(error => of(WorkspaceActions.loadVersesFailure({
          error: error.message || 'Failed to add verses to deck'
        })))
      )
    );

    // Mark multiple verses as memorized
    this.markMultipleVersesMemorized$ = createEffect(() =>
      this.actions$.pipe(
        ofType(WorkspaceActions.markMultipleVersesMemorized),
        tap(({ verseIds }) => {
          // Mock implementation - would save to backend
          this.notificationService.success(`Marked ${verseIds.length} verses as memorized`);
        })
      ),
      { dispatch: false }
    );
  }
}