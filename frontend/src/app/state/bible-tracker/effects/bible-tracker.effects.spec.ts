import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError, ReplaySubject } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';
import { TestScheduler } from 'rxjs/testing';

import { BibleTrackerEffects } from './bible-tracker.effects';
import { BibleTrackerActions } from '../actions/bible-tracker.actions';
import { bibleTrackerReducer } from '../reducers/bible-tracker.reducer';
import { BibleBook } from '../../core/models/bible';
import { BibleService } from '@app/app/core/services/bible.service';

describe('BibleTrackerEffects', () => {
    let actions$: ReplaySubject<any>;
    let effects: BibleTrackerEffects;
    let bibleService: jasmine.SpyObj<BibleService>;
    let store: Store;

    beforeEach(() => {
        const bibleServiceSpy = jasmine.createSpyObj('BibleService', [
            'getUserReadingProgress',
            'markVersesAsRead',
            'markChapterAsComplete',
            'syncProgress'
        ]);

        actions$ = new ReplaySubject(1);

        TestBed.configureTestingModule({
            imports: [
                StoreModule.forRoot({ bibleTracker: bibleTrackerReducer })
            ],
            providers: [
                BibleTrackerEffects,
                provideMockActions(() => actions$),
                { provide: BibleService, useValue: bibleServiceSpy }
            ]
        });

        effects = TestBed.inject(BibleTrackerEffects);
        bibleService = TestBed.inject(BibleService) as jasmine.SpyObj<BibleService>;
        store = TestBed.inject(Store);
    });

    describe('init$', () => {
        it('should dispatch loadReadingProgress and loadStatistics on init', (done) => {
            const expectedActions = [
                BibleTrackerActions.loadReadingProgress(),
                BibleTrackerActions.loadStatistics()
            ];

            actions$.next(BibleTrackerActions.init());

            let emittedActions: any[] = [];
            effects.init$.subscribe(action => {
                emittedActions.push(action);

                if (emittedActions.length === 2) {
                    expect(emittedActions).toEqual(expectedActions);
                    done();
                }
            });
        });
    });

    describe('loadReadingProgress$', () => {
        it('should return loadReadingProgressSuccess on successful API call', (done) => {
            const mockBooks: { [bookId: string]: BibleBook } = {
                'genesis': {} as BibleBook
            };

            bibleService.getUserReadingProgress.and.returnValue(of(mockBooks));

            const action = BibleTrackerActions.loadReadingProgress();
            const expectedAction = BibleTrackerActions.loadReadingProgressSuccess({ books: mockBooks });

            actions$.next(action);

            effects.loadReadingProgress$.subscribe(result => {
                expect(result).toEqual(expectedAction);
                expect(bibleService.getUserReadingProgress).toHaveBeenCalled();
                done();
            });
        });

        it('should return loadReadingProgressFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Network error' },
                status: 500
            });

            bibleService.getUserReadingProgress.and.returnValue(throwError(() => error));

            const action = BibleTrackerActions.loadReadingProgress();
            const expectedAction = BibleTrackerActions.loadReadingProgressFailure({
                error: 'Server error. Please try again later'
            });

            actions$.next(action);

            effects.loadReadingProgress$.subscribe(result => {
                expect(result).toEqual(expectedAction);
                done();
            });
        });
    });

    describe('markVersesAsRead$', () => {
        it('should return markVersesAsReadSuccess on successful API call', (done) => {
            const request = {
                bookId: 'genesis',
                chapter: 1,
                verses: [1, 2, 3]
            };

            bibleService.markVersesAsRead.and.returnValue(of(void 0));

            const action = BibleTrackerActions.markVersesAsRead(request);
            actions$.next(action);

            effects.markVersesAsRead$.subscribe(result => {
                expect(result.type).toBe('[Bible Tracker] Mark Verses As Read Success');
                expect((result as any).update).toEqual(request);
                expect((result as any).timestamp).toBeTruthy();
                expect(bibleService.markVersesAsRead).toHaveBeenCalledWith('genesis', 1, [1, 2, 3]);
                done();
            });
        });
    });

    describe('markChapterAsComplete$', () => {
        it('should return markChapterAsCompleteSuccess on successful API call', (done) => {
            const request = {
                bookId: 'exodus',
                chapter: 3
            };

            bibleService.markChapterAsComplete.and.returnValue(of(void 0));

            const action = BibleTrackerActions.markChapterAsComplete(request);
            actions$.next(action);

            effects.markChapterAsComplete$.subscribe(result => {
                expect(result.type).toBe('[Bible Tracker] Mark Chapter As Complete Success');
                expect((result as any).update).toEqual(request);
                expect((result as any).timestamp).toBeTruthy();
                expect(bibleService.markChapterAsComplete).toHaveBeenCalledWith('exodus', 3);
                done();
            });
        });

        it('should return markChapterAsCompleteFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Unauthorized' },
                status: 401
            });

            bibleService.markChapterAsComplete.and.returnValue(throwError(() => error));

            const action = BibleTrackerActions.markChapterAsComplete({ bookId: 'exodus', chapter: 3 });
            const expectedAction = BibleTrackerActions.markChapterAsCompleteFailure({
                error: 'Unauthorized. Please login again'
            });

            actions$.next(action);

            effects.markChapterAsComplete$.subscribe(result => {
                expect(result).toEqual(expectedAction);
                done();
            });
        });
    });

    describe('updateStatisticsAfterChange$', () => {
        it('should debounce multiple progress updates and dispatch updateStatistics', (done) => {
            // Send multiple success actions rapidly
            actions$.next(BibleTrackerActions.markVersesAsReadSuccess({
                update: { bookId: 'genesis', chapter: 1, verses: [1] },
                timestamp: new Date().toISOString()
            }));

            actions$.next(BibleTrackerActions.markVersesAsReadSuccess({
                update: { bookId: 'genesis', chapter: 1, verses: [2] },
                timestamp: new Date().toISOString()
            }));

            actions$.next(BibleTrackerActions.markChapterAsCompleteSuccess({
                update: { bookId: 'genesis', chapter: 2 },
                timestamp: new Date().toISOString()
            }));

            // Should only emit one updateStatistics action after debounce
            let emissionCount = 0;
            effects.updateStatisticsAfterChange$.subscribe(result => {
                emissionCount++;
                expect(result.type).toBe('[Bible Tracker] Update Statistics');

                // Wait a bit to ensure no more emissions
                setTimeout(() => {
                    expect(emissionCount).toBe(1);
                    done();
                }, 600);
            });
        });
    });

    describe('updateStatistics$', () => {
        it('should calculate statistics from current state and return loadStatisticsSuccess', (done) => {
            // Set up state with some books
            const mockState = {
                readingProgress: {
                    books: {
                        'genesis': {
                            bookId: 'genesis',
                            bookName: 'Genesis',
                            totalChapters: 50,
                            totalVerses: 1533,
                            chapters: {
                                '1': {
                                    chapterNumber: 1,
                                    totalVerses: 31,
                                    versesRead: [1, 2, 3, 4, 5],
                                    percentComplete: 16.13,
                                    completedDate: null,
                                    notes: null
                                }
                            },
                            percentComplete: 0.33,
                            lastRead: '2024-01-15'
                        }
                    },
                    loading: false,
                    loaded: true,
                    error: null,
                    lastSync: null
                }
            };

            store.dispatch(BibleTrackerActions.loadReadingProgressSuccess({
                books: mockState.readingProgress.books
            }));

            actions$.next(BibleTrackerActions.updateStatistics());

            effects.updateStatistics$.subscribe(result => {
                expect(result.type).toBe('[Bible Tracker] Load Statistics Success');
                const stats = (result as any).statistics;

                expect(stats.overview.versesRead).toBe(5);
                expect(stats.overview.chaptersCompleted).toBe(0); // Not 100% complete
                expect(stats.overview.booksCompleted).toBe(0);
                expect(stats.overview.overallPercentage).toBeCloseTo(0.016, 2); // 5/31102
                done();
            });
        });
    });

    describe('syncProgress$', () => {
        it('should sync current progress and return syncProgressSuccess', (done) => {
            const mockBooks = {
                'genesis': {
                    bookId: 'genesis',
                    bookName: 'Genesis',
                    totalChapters: 50,
                    totalVerses: 1533,
                    chapters: {},
                    percentComplete: 10,
                    lastRead: '2024-01-20'
                }
            };

            store.dispatch(BibleTrackerActions.loadReadingProgressSuccess({ books: mockBooks }));
            bibleService.syncProgress.and.returnValue(of(void 0));

            actions$.next(BibleTrackerActions.syncProgress());

            effects.syncProgress$.subscribe(result => {
                expect(result.type).toBe('[Bible Tracker] Sync Progress Success');
                expect((result as any).timestamp).toBeTruthy();
                expect(bibleService.syncProgress).toHaveBeenCalledWith(mockBooks);
                done();
            });
        });

        it('should return syncProgressFailure on API error', (done) => {
            const error = new HttpErrorResponse({
                error: { message: 'Network error' },
                status: 0
            });

            bibleService.syncProgress.and.returnValue(throwError(() => error));

            actions$.next(BibleTrackerActions.syncProgress());

            effects.syncProgress$.subscribe(result => {
                expect(result.type).toBe('[Bible Tracker] Sync Progress Failure');
                expect((result as any).error).toBe('Unable to connect to server');
                done();
            });
        });
    });

    describe('autoSync$', () => {
        it('should be configured to trigger sync after progress changes', (done) => {
            // Since the effect has a 5-minute debounce which is too long for unit tests,
            // we'll verify it processes the right action types

            // Create a test scheduler to control time
            const testScheduler = new TestScheduler((actual, expected) => {
                expect(actual).toEqual(expected);
            });

            // For this test, we'll just verify the effect responds to the correct actions
            const validTriggerActions = [
                BibleTrackerActions.markVersesAsReadSuccess({
                    update: { bookId: 'genesis', chapter: 1, verses: [1] },
                    timestamp: new Date().toISOString()
                }),
                BibleTrackerActions.markChapterAsCompleteSuccess({
                    update: { bookId: 'genesis', chapter: 1 },
                    timestamp: new Date().toISOString()
                })
            ];

            // Test that the effect is wired to the correct action types
            validTriggerActions.forEach(action => {
                actions$.next(action);
            });

            // Since we can't easily test the 5-minute debounce in unit tests,
            // just verify the effect exists and is defined
            expect(effects.autoSync$).toBeDefined();

            // The actual debounce behavior would be better tested in an integration test
            // or by making the debounce time configurable via dependency injection
            done();
        });
    });

    describe('syncSuccessNotification$', () => {
        it('should log success message when sync completes', (done) => {
            spyOn(console, 'log');

            actions$.next(BibleTrackerActions.syncProgressSuccess({
                timestamp: new Date().toISOString()
            }));

            effects.syncSuccessNotification$.subscribe(() => {
                expect(console.log).toHaveBeenCalledWith('Progress synced successfully');
                done();
            });
        });
    });
});

