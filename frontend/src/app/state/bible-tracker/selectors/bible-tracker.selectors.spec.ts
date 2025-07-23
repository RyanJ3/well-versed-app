import {
    selectBibleTrackerState,
    selectReadingProgress,
    selectAllBooks,
    selectBookById,
    selectUI,
    selectSelectedBook,
    selectViewMode,
    selectIsLoadingProgress,
    selectTodaysProgress,
    selectStatisticsOverview,
    selectIsAnyLoading,
    selectFilteredBooks
} from './bible-tracker.selectors';
import { BibleTrackerState } from '../models/bible-tracker.model';

describe('BibleTrackerSelectors', () => {
    const mockState: BibleTrackerState = {
        readingProgress: {
            books: {
                'genesis': {
                    bookId: 'genesis',
                    bookName: 'Genesis',
                    totalChapters: 50,
                    totalVerses: 1533,
                    chapters: {},
                    percentComplete: 25,
                    lastRead: '2024-01-15'
                },
                'exodus': {
                    bookId: 'exodus',
                    bookName: 'Exodus',
                    totalChapters: 40,
                    totalVerses: 1213,
                    chapters: {},
                    percentComplete: 10,
                    lastRead: '2024-01-10'
                }
            },
            loading: false,
            loaded: true,
            error: null,
            lastSync: '2024-01-15T10:00:00'
        },
        statistics: {
            overview: {
                totalBooks: 66,
                booksCompleted: 0,
                totalChapters: 1189,
                chaptersCompleted: 15,
                totalVerses: 31102,
                versesRead: 450,
                overallPercentage: 1.45,
                lastUpdated: '2024-01-15T10:00:00'
            },
            streaks: {
                currentStreak: 5,
                longestStreak: 12,
                lastReadDate: '2024-01-15',
                streakHistory: []
            },
            loading: false,
            error: null
        },
        ui: {
            selectedBook: 'genesis',
            selectedChapter: 3,
            viewMode: 'grid',
            showCompletedOnly: false,
            highlightToday: true
        }
    };

    const rootState = { bibleTracker: mockState };

    describe('Simple selectors', () => {
        it('should select the bible tracker state', () => {
            const result = selectBibleTrackerState(rootState);
            expect(result).toBe(mockState);
        });

        it('should select reading progress', () => {
            const result = selectReadingProgress(rootState);
            expect(result).toBe(mockState.readingProgress);
        });

        it('should select all books as array', () => {
            const result = selectAllBooks(rootState);
            expect(result.length).toBe(2);
            expect(result[0].bookId).toBe('genesis');
            expect(result[1].bookId).toBe('exodus');
        });

        it('should select UI state', () => {
            const result = selectUI(rootState);
            expect(result).toBe(mockState.ui);
        });

        it('should select selected book', () => {
            const result = selectSelectedBook(rootState);
            expect(result).toBe('genesis');
        });

        it('should select view mode', () => {
            const result = selectViewMode(rootState);
            expect(result).toBe('grid');
        });

        it('should select loading state', () => {
            const result = selectIsLoadingProgress(rootState);
            expect(result).toBe(false);
        });
    });

    describe('Parameterized selectors', () => {
        it('should select book by id', () => {
            const selector = selectBookById('genesis');
            const result = selector(rootState);
            expect(result?.bookName).toBe('Genesis');
            expect(result?.percentComplete).toBe(25);
        });

        it('should return undefined for non-existent book', () => {
            const selector = selectBookById('nonexistent');
            const result = selector(rootState);
            expect(result).toBeUndefined();
        });
    });

    describe('Complex selectors', () => {
        it('should select filtered books when showCompletedOnly is false', () => {
            const result = selectFilteredBooks(rootState);
            expect(result.length).toBe(2);
            expect(result[0].bookId).toBe('genesis');
            expect(result[1].bookId).toBe('exodus');
        });

        it('should filter only completed books when showCompletedOnly is true', () => {
            const stateWithFilter = {
                bibleTracker: {
                    ...mockState,
                    ui: {
                        ...mockState.ui,
                        showCompletedOnly: true
                    },
                    readingProgress: {
                        ...mockState.readingProgress,
                        books: {
                            'genesis': { ...mockState.readingProgress.books['genesis'], percentComplete: 100 },
                            'exodus': { ...mockState.readingProgress.books['exodus'], percentComplete: 50 }
                        }
                    }
                }
            };

            const result = selectFilteredBooks(stateWithFilter);
            expect(result.length).toBe(1);
            expect(result[0].bookId).toBe('genesis');
        });

        it('should calculate todays progress', () => {
            const today = new Date().toDateString();
            const stateWithTodaysProgress = {
                bibleTracker: {
                    ...mockState,
                    readingProgress: {
                        ...mockState.readingProgress,
                        books: {
                            'genesis': {
                                ...mockState.readingProgress.books['genesis'],
                                chapters: {
                                    '1': {
                                        chapterNumber: 1,
                                        totalVerses: 31,
                                        versesRead: [1, 2, 3, 4, 5],
                                        percentComplete: 16.13,
                                        completedDate: new Date().toISOString(), // Today
                                        notes: null
                                    },
                                    '2': {
                                        chapterNumber: 2,
                                        totalVerses: 25,
                                        versesRead: [1, 2, 3],
                                        percentComplete: 12,
                                        completedDate: '2024-01-01', // Not today
                                        notes: null
                                    }
                                }
                            }
                        }
                    }
                }
            };

            const result = selectTodaysProgress(stateWithTodaysProgress);
            expect(result.versesReadToday).toBe(5);
            expect(result.chaptersCompletedToday).toBe(1);
        });

        it('should select statistics overview', () => {
            const result = selectStatisticsOverview(rootState);
            expect(result.totalBooks).toBe(66);
            expect(result.chaptersCompleted).toBe(15);
            expect(result.versesRead).toBe(450);
        });

        it('should determine if any loading is happening', () => {
            // When nothing is loading
            let result = selectIsAnyLoading(rootState);
            expect(result).toBe(false);

            // When progress is loading
            const loadingState = {
                bibleTracker: {
                    ...mockState,
                    readingProgress: {
                        ...mockState.readingProgress,
                        loading: true
                    }
                }
            };
            result = selectIsAnyLoading(loadingState);
            expect(result).toBe(true);
        });
    });
});

