import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, mergeMap, tap, filter, debounceTime } from 'rxjs/operators';

import { DeckService } from '../../../core/services/deck.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DeckActions, CardActions } from '../actions/deck.actions';
import { Deck } from '../models/deck.model';
import { BaseEffects } from '../../core/effects/base.effect';

@Injectable()
export class DeckEffects extends BaseEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private deckService = inject(DeckService);
  private notificationService = inject(NotificationService);

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.init),
      map(() => DeckActions.loadDecks())
    )
  );

  loadDecks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.loadDecks),
      mergeMap(() =>
        this.deckService.getDecks().pipe(
          map((decks) => DeckActions.loadDecksSuccess({ decks })),
          this.handleHttpError((error) => DeckActions.loadDecksFailure({ error }))
        )
      )
    )
  );

  loadDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.loadDeck),
      mergeMap(({ deckId }) =>
        this.deckService.getDeck(deckId).pipe(
          mergeMap((deck) => [
            DeckActions.loadDeckSuccess({ deck: deck as unknown as Deck }),
            CardActions.loadCards({ deckId }),
          ]),
          this.handleHttpError((error) => DeckActions.loadDeckFailure({ error }))
        )
      )
    )
  );

  createDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.createDeck),
      mergeMap(({ request }) =>
        this.deckService.createDeck(request as any).pipe(
          map((deck) => DeckActions.createDeckSuccess({ deck: deck as unknown as Deck })),
          tap(() => {
            this.notificationService.success('Deck created successfully!');
          }),
          this.handleHttpError((error) => DeckActions.createDeckFailure({ error }))
        )
      )
    )
  );

  updateDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.updateDeck),
      mergeMap(({ deckId, changes }) =>
        this.deckService.updateDeck(deckId, changes as any).pipe(
          map((deck) =>
            DeckActions.updateDeckSuccess({
              deck: {
                id: deck.deck_id, // Fix: use deck_id from DeckResponse
                changes: deck as any
              },
            })
          ),
          tap(() => {
            this.notificationService.success('Deck updated successfully!');
          }),
          this.handleHttpError((error) => DeckActions.updateDeckFailure({ error }))
        )
      )
    )
  );

  deleteDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.deleteDeck),
      mergeMap(({ deckId }) =>
        this.deckService.deleteDeck(deckId).pipe(
          map(() => DeckActions.deleteDeckSuccess({ deckId })),
          tap(() => {
            this.notificationService.success('Deck deleted successfully!');
          }),
          this.handleHttpError((error) => DeckActions.deleteDeckFailure({ error }))
        )
      )
    )
  );

  toggleFavorite$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.toggleFavorite),
      mergeMap(({ deckId }) =>
        this.deckService.toggleFavorite(deckId).pipe(
          map((isFavorite) =>
            DeckActions.toggleFavoriteSuccess({ deckId, isFavorite })
          ),
          this.handleHttpError((error) => DeckActions.toggleFavoriteFailure({ error }))
        )
      )
    )
  );

  selectDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.selectDeck),
      filter(({ deckId }) => deckId !== null),
      map(({ deckId }) => CardActions.loadCards({ deckId: deckId! }))
    )
  );

  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardActions.loadCards),
      mergeMap(({ deckId }) =>
        this.deckService.getCards(deckId).pipe(
          map((cards) => CardActions.loadCardsSuccess({ cards })),
          this.handleHttpError((error) => CardActions.loadCardsFailure({ error }))
        )
      )
    )
  );

  createCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardActions.createCard),
      mergeMap(({ deckId, card }) =>
        this.deckService.createCard(deckId, card).pipe(
          map((createdCard) => CardActions.createCardSuccess({ card: createdCard })),
          tap(() => {
            this.notificationService.success('Card added successfully!');
          }),
          this.handleHttpError((error) => CardActions.createCardFailure({ error }))
        )
      )
    )
  );

  autoSync$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        DeckActions.createDeckSuccess,
        DeckActions.updateDeckSuccess,
        DeckActions.deleteDeckSuccess,
        CardActions.createCardSuccess,
        CardActions.updateCardSuccess,
        CardActions.deleteCardSuccess
      ),
      debounceTime(5 * 60 * 1000), // 5 minutes
      map(() => DeckActions.syncDecks())
    )
  );

  importDeck$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.importDeck),
      mergeMap(({ request }) =>
        this.deckService.importDeck(request).pipe(
          map(({ deck, cardsImported }) =>
            DeckActions.importDeckSuccess({ deck, cardsImported })
          ),
          tap(({ cardsImported }) => {
            this.notificationService.success(
              `Deck imported successfully! ${cardsImported} cards added.`
            );
          }),
          this.handleHttpError((error) => DeckActions.importDeckFailure({ error }))
        )
      )
    )
  );

  completeStudySession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DeckActions.completeStudySession),
      mergeMap(({ result }) =>
        this.deckService.completeStudySession(result).pipe(
          map((updates) =>
            DeckActions.completeStudySessionSuccess({
              deckId: result.deckId,
              updates,
            })
          ),
          tap(() => {
            if (result.streakMaintained) {
              this.notificationService.success('Great job! Streak maintained! 🔥');
            }
          }),
          this.handleHttpError((error) =>
            DeckActions.completeStudySessionFailure({ error })
          )
        )
      )
    )
  );
}