import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, from, timer } from 'rxjs';
import { 
  map, 
  catchError, 
  switchMap, 
  withLatestFrom, 
  tap, 
  debounceTime,
  mergeMap,
  filter
} from 'rxjs/operators';
import { Router } from '@angular/router';

import * as VerseWorkspaceActions from '../actions/verse-workspace.actions';
import { selectVerseWorkspaceState } from '../selectors/verse-workspace.selectors';
import { BibleService } from '@services/api/bible.service';
import { NotificationService } from '@services/utils/notification.service';
import { DeckService } from '@services/api/deck.service';
import { WorkspaceParsingService } from '@services/utils/workspace-parsing.service';
import { WorkspaceVerse } from '@features/verse-workspace/models/workspace.models';

@Injectable()
export class VerseWorkspaceEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private bibleService = inject(BibleService);
  private deckService = inject(DeckService);
  private notificationService = inject(NotificationService);
  private workspaceParsingService = inject(WorkspaceParsingService);
  private router = inject(Router);
  
  loadChapter$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.loadChapter),
      switchMap(({ bookId, chapter, userId }) =>
        from(this.loadChapterData(bookId, chapter, userId)).pipe(
          map((data) => VerseWorkspaceActions.loadChapterSuccess(data)),
          catchError((error) => 
            of(VerseWorkspaceActions.loadChapterFailure({ 
              error: error.message || 'Failed to load chapter' 
            }))
          )
        )
      )
    )
  );

  toggleVerseMemorized$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.toggleVerseMemorized),
      debounceTime(300),
      mergeMap(({ verse, userId }) => {
        const [bookId, chapter, verseNum] = verse.verseCode.split('-').map(Number);
        // Toggle the memorization state - if it's currently memorized, we unmemorize it
        const saveObservable = verse.isMemorized
          ? this.bibleService.saveVerse(userId, bookId, chapter, verseNum, 0) // 0 = unmemorize
          : this.bibleService.saveVerse(userId, bookId, chapter, verseNum, 1); // 1 = memorize
        
        return saveObservable.pipe(
          map(() => VerseWorkspaceActions.toggleVerseMemorizedSuccess({
            verseCode: verse.verseCode,
            isMemorized: !verse.isMemorized
          })),
          catchError((error) => 
            of(VerseWorkspaceActions.toggleVerseMemorizedFailure({
              verseCode: verse.verseCode,
              error: error.message || 'Failed to save verse'
            }))
          )
        );
      })
    )
  );

  markMultipleVersesMemorized$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.markMultipleVersesMemorized),
      mergeMap(({ verseCodes, isMemorized, userId }) => {
        const actions = verseCodes.map(verseCode => {
          const [bookId, chapter, verseNum] = verseCode.split('-').map(Number);
          const saveObservable = isMemorized
            ? this.bibleService.saveVerse(userId, bookId, chapter, verseNum, 1)
            : this.bibleService.saveVerse(userId, bookId, chapter, verseNum, 0);
          
          return saveObservable.pipe(
            map(() => VerseWorkspaceActions.toggleVerseMemorizedSuccess({
              verseCode,
              isMemorized
            })),
            catchError((error) => 
              of(VerseWorkspaceActions.toggleVerseMemorizedFailure({
                verseCode,
                error: error.message
              }))
            )
          );
        });
        
        return from(actions).pipe(mergeMap(action => action));
      })
    )
  );

  loadCrossReferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.loadCrossReferences),
      switchMap(({ selection, userId }) =>
        from(this.loadCrossReferencesData(selection, userId)).pipe(
          map((verses) => VerseWorkspaceActions.loadCrossReferencesSuccess({
            verses,
            selection
          })),
          catchError((error) => 
            of(VerseWorkspaceActions.loadCrossReferencesFailure({
              error: error.message || 'Failed to load cross-references'
            }))
          )
        )
      )
    )
  );

  loadTopicalVerses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.loadTopicalVerses),
      switchMap(({ topic, userId }) =>
        from(this.loadTopicalVersesData(topic, userId)).pipe(
          map((verses) => VerseWorkspaceActions.loadTopicalVersesSuccess({
            verses,
            topic
          })),
          catchError((error) => 
            of(VerseWorkspaceActions.loadTopicalVersesFailure({
              error: error.message || 'Failed to load topical verses'
            }))
          )
        )
      )
    )
  );

  loadAvailableTopics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.loadAvailableTopics),
      switchMap(() =>
        // For now, return empty topics array - this can be implemented later
        of([]).pipe(
          map((topics: any[]) => VerseWorkspaceActions.loadAvailableTopicsSuccess({ topics })),
          catchError(() => of({ type: 'NO_OP' }))
        )
      )
    )
  );

  showEncouragement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.showEncouragement),
      switchMap(({ duration = 3000 }) =>
        timer(duration).pipe(
          map(() => VerseWorkspaceActions.hideEncouragement())
        )
      )
    )
  );

  navigateToVerse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.navigateToVerse),
      tap(({ bookId, chapter, verse }) => {
        this.router.navigate(['/verse-workspace'], {
          queryParams: { bookId, chapter }
        });
      }),
      map(({ verse }) => VerseWorkspaceActions.setTargetVerse({ verseNumber: verse }))
    )
  );

  addVersesToDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.addVersesToDeck),
      mergeMap(({ deckId, verseCodes, userId }) =>
        this.deckService.addVersesToDeck(deckId, verseCodes).pipe(
          tap(() => {
            this.notificationService.success(
              `Added ${verseCodes.length} verse${verseCodes.length > 1 ? 's' : ''} to deck`
            );
          }),
          map(() => VerseWorkspaceActions.addVersesToDeckSuccess({
            deckId,
            verseCodes
          })),
          catchError((error) => {
            this.notificationService.error('Failed to add verses to deck');
            return of(VerseWorkspaceActions.addVersesToDeckFailure({
              error: error.message
            }));
          })
        )
      )
    )
  );

  // Success notifications
  toggleVerseMemorizedSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VerseWorkspaceActions.toggleVerseMemorizedSuccess),
      withLatestFrom(this.store.select(selectVerseWorkspaceState)),
      tap(([action, state]) => {
        const memorizedCount = state.verses.filter(v => v.isMemorized).length;
        if (action.isMemorized && memorizedCount > 0 && memorizedCount % 5 === 0) {
          this.store.dispatch(VerseWorkspaceActions.showEncouragement({
            message: `Great job! ${memorizedCount} verses memorized! 🎉`,
            duration: 4000
          }));
        }
      })
    ), { dispatch: false }
  );


  private async loadChapterData(bookId: number, chapterNum: number, userId: number) {
    // Load Bible data
    const bibleData = this.bibleService.getBibleData();
    if (!bibleData) {
      throw new Error('Bible data not available');
    }

    const book = bibleData.getBookById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    const bibleChapter = book.getChapter(chapterNum);
    if (!bibleChapter) {
      throw new Error(`Chapter ${chapterNum} not found in ${book.name}`);
    }

    // Generate verse codes
    const totalVerses = bibleChapter.totalVerses;
    const verseCodes = Array.from({ length: totalVerses }, (_, i) =>
      `${bookId}-${chapterNum}-${i + 1}`
    );

    // Get verse texts
    const verseTexts = await this.bibleService.getVerseTexts(userId, verseCodes).toPromise() || {};

    // Create verses array
    const verses: WorkspaceVerse[] = verseCodes.map((code, index) => {
      const [, , verseNum] = code.split('-').map(Number);
      const text = verseTexts[code] || '';
      const bibleVerse = bibleChapter.verses[verseNum - 1];
      const isMemorized = bibleVerse?.memorized || false;

      return {
        verseCode: code,
        reference: book.chapters.length === 1 ? `v${verseNum}` : `${chapterNum}:${verseNum}`,
        fullReference: `${book.name} ${chapterNum}:${verseNum}`,
        text: text,
        firstLetters: this.workspaceParsingService.extractFirstLetters(text),
        isMemorized: isMemorized,
        isFifth: (index + 1) % 5 === 0,
        bookName: book.name,
        chapter: chapterNum,
        verse: verseNum,
        verseNumber: verseNum,
        isSaving: false
      };
    });

    return {
      book,
      chapter: chapterNum,
      bibleChapter,
      verses
    };
  }

  private async loadCrossReferencesData(selection: any, userId: number): Promise<WorkspaceVerse[]> {
    const references = await this.bibleService.getCrossReferencesForVerse(
      selection.bookId,
      selection.chapter,
      selection.verse
    ).toPromise();

    if (!references || references.length === 0) {
      return [];
    }

    const verseCodes = references.map(ref => ref.verse_code);
    const verseTexts = await this.bibleService.getVerseTexts(userId, verseCodes).toPromise() || {};

    return references.map((ref, index) => {
      const reference = ref.display_reference || `${ref.book_name} ${ref.chapter}:${ref.verse_number}`;
      let displayText = verseTexts[ref.verse_code] || 'Loading verse text...';
      
      if (ref.is_range && displayText !== 'Loading verse text...') {
        displayText = displayText.trim() + ' ...';
      }

      return {
        index: index,
        verseNumber: ref.verse_number,
        verseCode: ref.verse_code,
        reference: reference,
        fullReference: reference,
        text: displayText,
        firstLetters: this.workspaceParsingService.extractFirstLetters(displayText),
        isMemorized: ref.is_memorized || false,
        isFifth: false,
        bookName: ref.book_name,
        chapter: ref.chapter,
        verse: ref.verse_number,
        crossRefConfidence: ref.confidence_score || 0.0,
        direction: ref.direction || 'from',
        isRange: ref.is_range || false,
        endVerse: ref.end_verse_number,
        endChapter: ref.end_chapter,
        verseCount: ref.is_range ? 
          (ref.end_chapter && ref.end_chapter !== ref.chapter ? 
            999 : (ref.end_verse_number - ref.verse_number + 1)) : 1
      } as WorkspaceVerse;
    });
  }

  private async loadTopicalVersesData(topic: any, userId: number): Promise<WorkspaceVerse[]> {
    const verses = await this.bibleService.getTopicalVerses(topic.id).toPromise();
    
    if (!verses || verses.length === 0) {
      return [];
    }

    const verseCodes = verses.map(v => v.verse_code);
    const verseTexts = await this.bibleService.getVerseTexts(userId, verseCodes).toPromise() || {};

    return verses.map((verse, index) => {
      const reference = verse.display_reference || `${verse.book_name} ${verse.chapter}:${verse.verse_number}`;
      let displayText = verseTexts[verse.verse_code] || '';
      
      if (verse.is_range && displayText) {
        displayText = displayText.trim() + ' ...';
      }

      return {
        verseId: verse.verse_id,
        verseCode: verse.verse_code,
        verseNumber: verse.verse_number,
        reference: reference,
        text: displayText,
        firstLetters: this.workspaceParsingService.extractFirstLetters(displayText),
        fullReference: reference,
        isMemorized: verse.is_memorized || false,
        isFifth: false,
        bookName: verse.book_name,
        chapter: verse.chapter,
        verse: verse.verse_number,
        index: index,
        topicRelevance: verse.relevance_score || 0.0,
        topicName: topic.name,
        confidenceScore: verse.confidence_score || 0.0,
        isRange: verse.is_range || false,
        endVerse: verse.end_verse_number,
        endChapter: verse.end_chapter,
        verseCount: verse.is_range ? 
          (verse.end_chapter && verse.end_chapter !== verse.chapter ? 
            999 : (verse.end_verse_number - verse.verse_number + 1)) : 1
      } as WorkspaceVerse;
    }).sort((a, b) => (b.topicRelevance || 0) - (a.topicRelevance || 0));
  }
}