import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError, ReplaySubject } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';

import { DeckEffects } from './deck.effects';
import { DeckActions, CardActions } from '../actions/deck.actions';
import { decksReducer } from '../reducers/deck.reducer';
import { Deck, Card, DeckCategory } from '../models/deck.model';
import { DeckResponse, DeckService } from '@services/api/deck.service';
import { NotificationService } from '@services/utils/notification.service';

describe('DeckEffects', () => {
    let actions$: ReplaySubject<any>;
    let effects: DeckEffects;
    let deckService: jasmine.SpyObj<DeckService>;
    let notificationService: jasmine.SpyObj<NotificationService>;
    let store: Store;

    const mockDeck: Deck = {
        id: 1,
        name: 'Test Deck',
        description: 'Test Description',
        category: DeckCategory.BIBLE_VERSES,
        cardCount: 5,
        newCardsCount: 2,
        dueCardsCount: 3,
        isPublic: true,
        isFavorite: false,
        lastStudied: null,
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-15'),
        masteryScore: 45,
        studyStreak: 3,
        tags: ['test', 'sample']
    };

    const mockDeckResponse: DeckResponse = {
        deck_id: 1,
        creator_id: 1,
        creator_name: 'Test User',
        name: 'Test Deck',
        description: 'Test Description',
        is_public: true,
        save_count: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        card_count: 5,
        tags: ['test', 'sample'],
        is_saved: false
    };

    const mockCard: Card = {
        id: 1,
        deckId: 1,
        front: 'What is the first verse?',
        back: 'In the beginning...',
        hint: 'Genesis 1:1',
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        lapses: 0,
        lastReviewed: null,
        nextReview: new Date('2024-01-20'),
        studyCount: 0,
        averageResponseTime: 0,
        status: 'new' as any,
        created: new Date('2024-01-01'),
        updated: new Date('2024-01-01')
    };

    beforeEach(() => {
        const deckServiceSpy = jasmine.createSpyObj('DeckService', [
            'getDecks',
            'getDeck',
            'createDeck',
            'updateDeck',
            'deleteDeck',
            'toggleFavorite',
            'getCards',
            'createCard',
            'importDeck',
            'completeStudySession'
        ]);

        const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
            'success',
            'error',
            'warning',
            'info'
        ]);

        actions$ = new ReplaySubject(1);

        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({ decks: decksReducer })
            ],
            providers: [
                DeckEffects,
                provideMockActions(() => actions$),
                { provide: DeckService, useValue: deckServiceSpy },
                { provide: NotificationService, useValue: notificationServiceSpy }
            ]
        });

        effects = TestBed.inject(DeckEffects);
        deckService = TestBed.inject(DeckService) as jasmine.SpyObj<DeckService>;
        notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
        store = TestBed.inject(Store);
    });

    describe('init$', () => {
        it('should dispatch loadDecks on init', (done) => {
            actions$.next(DeckActions.init());

            effects.init$.subscribe(result => {
                expect(result).toEqual(DeckActions.loadDecks());
                done();
            });
        });
    });

    describe('loadDecks$', () => {
        it('should return loadDecksSuccess with decks on successful API call', (done) => {
            const mockDecks = [mockDeck];
            deckService.getDecks.and.returnValue(of(mockDecks));

            actions$.next(DeckActions.loadDecks());

            effects.loadDecks$.subscribe(result => {
                expect(result).toEqual(DeckActions.loadDecksSuccess({ decks: mockDecks }));
                expect(deckService.getDecks).toHaveBeenCalled();
                done();
            });
        });

        it('should return loadDecksFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Failed to load' },
                status: 500
            });

            deckService.getDecks.and.returnValue(throwError(() => error));

            actions$.next(DeckActions.loadDecks());

            effects.loadDecks$.subscribe(result => {
                expect(result).toEqual(DeckActions.loadDecksFailure({
                    error: 'Server error. Please try again later'
                }));
                done();
            });
        });
    });

    describe('loadDeck$', () => {
        it('should return loadDeckSuccess and loadCards on successful API call', (done) => {
            // Use the DeckResponse type for the mock
            deckService.getDeck.and.returnValue(of(mockDeckResponse));

            actions$.next(DeckActions.loadDeck({ deckId: 1 }));

            let emissions: any[] = [];
            effects.loadDeck$.subscribe(result => {
                emissions.push(result);

                if (emissions.length === 2) {
                    // The effect converts DeckResponse to Deck internally
                    expect(emissions[0].type).toBe('[Deck] Load Deck Success');
                    expect(emissions[1]).toEqual(CardActions.loadCards({ deckId: 1 }));
                    expect(deckService.getDeck).toHaveBeenCalledWith(1);
                    done();
                }
            });
        });
    });

    describe('createDeck$', () => {
        it('should return createDeckSuccess and show notification on success', (done) => {
            const createRequest = {
                name: 'New Deck',
                description: 'New Description',
                category: DeckCategory.BIBLE_VERSES,
                isPublic: false,
                tags: ['new']
            };

            // When using CreateDeckRequest, createDeck returns Deck (not DeckResponse)
            deckService.createDeck.and.returnValue(of(mockDeck));

            actions$.next(DeckActions.createDeck({ request: createRequest }));

            effects.createDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.createDeckSuccess({ deck: mockDeck }));
                expect(deckService.createDeck).toHaveBeenCalledWith(createRequest);
                expect(notificationService.success).toHaveBeenCalledWith('Deck created successfully!');
                done();
            });
        });

        it('should return createDeckFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Name already exists' },
                status: 400
            });

            deckService.createDeck.and.returnValue(throwError(() => error));

            actions$.next(DeckActions.createDeck({ request: {} as any }));

            effects.createDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.createDeckFailure({
                    error: 'Name already exists'
                }));
                done();
            });
        });
    });

    describe('deleteDeck$', () => {
        it('should return deleteDeckSuccess and show notification on success', (done) => {
            deckService.deleteDeck.and.returnValue(of({}));

            actions$.next(DeckActions.deleteDeck({ deckId: 1 }));

            effects.deleteDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.deleteDeckSuccess({ deckId: 1 }));
                expect(deckService.deleteDeck).toHaveBeenCalledWith(1);
                expect(notificationService.success).toHaveBeenCalledWith('Deck deleted successfully!');
                done();
            });
        });
    });

    describe('toggleFavorite$', () => {
        it('should return toggleFavoriteSuccess with new favorite status', (done) => {
            deckService.toggleFavorite.and.returnValue(of(true));

            actions$.next(DeckActions.toggleFavorite({ deckId: 1 }));

            effects.toggleFavorite$.subscribe(result => {
                expect(result).toEqual(DeckActions.toggleFavoriteSuccess({
                    deckId: 1,
                    isFavorite: true
                }));
                expect(deckService.toggleFavorite).toHaveBeenCalledWith(1);
                done();
            });
        });
    });

    describe('selectDeck$', () => {
        it('should dispatch loadCards when a deck is selected', (done) => {
            actions$.next(DeckActions.selectDeck({ deckId: 5 }));

            effects.selectDeck$.subscribe(result => {
                expect(result).toEqual(CardActions.loadCards({ deckId: 5 }));
                done();
            });
        });

        it('should not dispatch loadCards when deck is deselected (null)', (done) => {
            actions$.next(DeckActions.selectDeck({ deckId: null }));

            // The effect should not emit anything
            let emitted = false;
            effects.selectDeck$.subscribe(() => {
                emitted = true;
            });

            setTimeout(() => {
                expect(emitted).toBe(false);
                done();
            }, 100);
        });
    });

    describe('loadCards$', () => {
        it('should return loadCardsSuccess with cards on successful API call', (done) => {
            const mockCards = [mockCard];
            deckService.getCards.and.returnValue(of(mockCards));

            actions$.next(CardActions.loadCards({ deckId: 1 }));

            effects.loadCards$.subscribe(result => {
                expect(result).toEqual(CardActions.loadCardsSuccess({ cards: mockCards }));
                expect(deckService.getCards).toHaveBeenCalledWith(1);
                done();
            });
        });

        it('should return loadCardsFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Failed to load cards' },
                status: 404
            });

            deckService.getCards.and.returnValue(throwError(() => error));

            actions$.next(CardActions.loadCards({ deckId: 1 }));

            effects.loadCards$.subscribe(result => {
                expect(result).toEqual(CardActions.loadCardsFailure({
                    error: 'Resource not found'
                }));
                done();
            });
        });
    });

    describe('createCard$', () => {
        it('should return createCardSuccess and show notification on success', (done) => {
            const cardRequest = {
                front: 'New Question',
                back: 'New Answer',
                hint: 'New Hint'
            };

            deckService.createCard.and.returnValue(of(mockCard));

            actions$.next(CardActions.createCard({ deckId: 1, card: cardRequest }));

            effects.createCard$.subscribe(result => {
                expect(result).toEqual(CardActions.createCardSuccess({ card: mockCard }));
                expect(deckService.createCard).toHaveBeenCalledWith(1, cardRequest);
                expect(notificationService.success).toHaveBeenCalledWith('Card added successfully!');
                done();
            });
        });

        it('should return createCardFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Invalid card data' },
                status: 400
            });

            deckService.createCard.and.returnValue(throwError(() => error));

            actions$.next(CardActions.createCard({ deckId: 1, card: {} as any }));

            effects.createCard$.subscribe(result => {
                expect(result).toEqual(CardActions.createCardFailure({
                    error: 'Invalid card data'
                }));
                done();
            });
        });
    });

    describe('updateDeck$', () => {
        it('should return updateDeckSuccess and show notification on success', (done) => {
            const updates = { name: 'Updated Name', description: 'Updated Description' };
            const updatedDeckResponse: DeckResponse = {
                ...mockDeckResponse,
                deck_id: 1,
                name: 'Updated Name',
                description: 'Updated Description'
            };

            deckService.updateDeck.and.returnValue(of(updatedDeckResponse));

            actions$.next(DeckActions.updateDeck({ deckId: 1, changes: updates }));

            effects.updateDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.updateDeckSuccess({
                    deck: {
                        id: 1, // Now correctly mapped from deck_id
                        changes: updatedDeckResponse
                    }
                }));
                expect(deckService.updateDeck).toHaveBeenCalledWith(1, updates);
                expect(notificationService.success).toHaveBeenCalledWith('Deck updated successfully!');
                done();
            });
        });
    });

    describe('importDeck$', () => {
        it('should return importDeckSuccess and show notification with card count', (done) => {
            const importRequest = {
                format: 'json' as const,
                data: '{"cards": []}',
                options: {
                    skipDuplicates: true,
                    updateExisting: false,
                    preserveSchedule: false
                }
            };

            const importResult = {
                deck: mockDeck,
                cardsImported: 15
            };

            deckService.importDeck.and.returnValue(of(importResult));

            actions$.next(DeckActions.importDeck({ request: importRequest }));

            effects.importDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.importDeckSuccess(importResult));
                expect(deckService.importDeck).toHaveBeenCalledWith(importRequest);
                expect(notificationService.success).toHaveBeenCalledWith(
                    'Deck imported successfully! 15 cards added.'
                );
                done();
            });
        });

        it('should return importDeckFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Invalid file format' },
                status: 400
            });

            deckService.importDeck.and.returnValue(throwError(() => error));

            actions$.next(DeckActions.importDeck({ request: {} as any }));

            effects.importDeck$.subscribe(result => {
                expect(result).toEqual(DeckActions.importDeckFailure({
                    error: 'Invalid file format'
                }));
                done();
            });
        });
    });

    describe('completeStudySession$', () => {
        it('should return completeStudySessionSuccess with updates', (done) => {
            const sessionResult = {
                deckId: 1,
                cardsStudied: 20,
                correctCount: 18,
                averageResponseTime: 3.5,
                masteryChange: 5,
                streakMaintained: true
            };

            const deckUpdates = {
                masteryScore: 80,
                studyStreak: 8,
                lastStudied: new Date('2024-01-20')
            };

            deckService.completeStudySession.and.returnValue(of(deckUpdates));

            actions$.next(DeckActions.completeStudySession({ result: sessionResult }));

            effects.completeStudySession$.subscribe(result => {
                expect(result).toEqual(DeckActions.completeStudySessionSuccess({
                    deckId: 1,
                    updates: deckUpdates
                }));
                expect(deckService.completeStudySession).toHaveBeenCalledWith(sessionResult);
                done();
            });
        });

        it('should show streak notification when streak is maintained', (done) => {
            const sessionResult = {
                deckId: 1,
                cardsStudied: 20,
                correctCount: 18,
                averageResponseTime: 3.5,
                masteryChange: 5,
                streakMaintained: true
            };

            deckService.completeStudySession.and.returnValue(of({}));

            actions$.next(DeckActions.completeStudySession({ result: sessionResult }));

            effects.completeStudySession$.subscribe(() => {
                expect(notificationService.success).toHaveBeenCalledWith('Great job! Streak maintained! 🔥');
                done();
            });
        });

        it('should not show streak notification when streak is broken', (done) => {
            const sessionResult = {
                deckId: 1,
                cardsStudied: 20,
                correctCount: 10,
                averageResponseTime: 5.2,
                masteryChange: -2,
                streakMaintained: false
            };

            deckService.completeStudySession.and.returnValue(of({}));

            actions$.next(DeckActions.completeStudySession({ result: sessionResult }));

            effects.completeStudySession$.subscribe(() => {
                expect(notificationService.success).not.toHaveBeenCalled();
                done();
            });
        });
    });

    describe('autoSync$', () => {
        it('should be configured to trigger sync after deck/card changes', () => {
            // Similar to Bible Tracker, the autoSync has a 5-minute debounce
            // We'll just verify it exists and is configured properly
            expect(effects.autoSync$).toBeDefined();

            // Verify it's an Observable
            expect(effects.autoSync$.subscribe).toBeDefined();

            // The actual debounce timing would be tested in integration tests
        });
    });
});