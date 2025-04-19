// bible-tracker.service.ts - Service for managing Bible memorization data with backend simulation
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {delay} from 'rxjs/operators';
import {BIBLE_DATA, BibleBook, BookProgress, BookStats, GroupStats} from './models';

@Injectable({
    providedIn: 'root'
})
export class BibleTrackerService {
    private progressSubject = new BehaviorSubject<BookProgress>({});
    public progress$ = this.progressSubject.asObservable();

    // Simulated backend latency (in ms)
    private apiLatency = 300;

    constructor() {
        this.loadProgress();
    }

// Update method to use boolean array tracking
    public updateMemorizedVerses(bookName: string, chapterIndex: number, selectedVerses: number[]): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const maxVerses = book.chapters[chapterIndex];
        const currentProgress = {...this.progressSubject.value};

        // Ensure the book entry exists
        if (!currentProgress[bookName]) {
            currentProgress[bookName] = this.initializeEmptyProgress()[bookName];
        }

        // Ensure chapter entry exists
        if (!currentProgress[bookName][chapterIndex]) {
            currentProgress[bookName][chapterIndex] = {
                chapter: chapterIndex + 1,
                memorizedVerses: 0,
                inProgress: false,
                completed: false,
                versesMemorized: Array(maxVerses).fill(false)
            };
        }

        // Create a new array of booleans based on selected verses
        const versesMemorized = Array(maxVerses).fill(false);
        selectedVerses.forEach(verseNum => {
            if (verseNum >= 1 && verseNum <= maxVerses) {
                versesMemorized[verseNum - 1] = true;
            }
        });

        // Update the chapter progress
        currentProgress[bookName][chapterIndex] = {
            ...currentProgress[bookName][chapterIndex],
            memorizedVerses: selectedVerses.length, // Keep for backward compatibility
            versesMemorized: versesMemorized,
            inProgress: selectedVerses.length > 0,
            completed: selectedVerses.length === maxVerses
        };

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

// Update the incrementVerses method
    public incrementVerses(bookName: string, chapterIndex: number): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const maxVerses = book.chapters[chapterIndex];
        const currentProgress = {...this.progressSubject.value};

        // Ensure the book entry exists
        if (!currentProgress[bookName]) {
            currentProgress[bookName] = this.initializeEmptyProgress()[bookName];
        }

        // Ensure chapter entry exists
        if (!currentProgress[bookName][chapterIndex]) {
            currentProgress[bookName][chapterIndex] = {
                chapter: chapterIndex + 1,
                memorizedVerses: 0,
                inProgress: false,
                completed: false,
                versesMemorized: Array(maxVerses).fill(false)
            };
        }

        const chapter = currentProgress[bookName][chapterIndex];
        const versesMemorized = [...(chapter.versesMemorized || Array(maxVerses).fill(false))];

        // Find the first unmemorized verse and mark it as memorized
        let incremented = false;
        for (let i = 0; i < versesMemorized.length; i++) {
            if (!versesMemorized[i]) {
                versesMemorized[i] = true;
                incremented = true;
                break;
            }
        }

        if (incremented) {
            const memorizedCount = versesMemorized.filter(v => v).length;

            currentProgress[bookName][chapterIndex] = {
                ...chapter,
                memorizedVerses: memorizedCount,
                versesMemorized: versesMemorized,
                inProgress: memorizedCount > 0,
                completed: memorizedCount === maxVerses
            };

            this.progressSubject.next(currentProgress);
            this.saveProgressToAPI(currentProgress).subscribe();
        }
    }

// Update the decrementVerses method
    public decrementVerses(bookName: string, chapterIndex: number): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const currentProgress = {...this.progressSubject.value};

        // Handle case where book or chapter doesn't exist yet
        if (!currentProgress[bookName] || !currentProgress[bookName][chapterIndex]) {
            return;
        }

        const chapter = currentProgress[bookName][chapterIndex];
        const versesMemorized = [...(chapter.versesMemorized || [])];

        // Find the last memorized verse and mark it as not memorized
        let decremented = false;
        for (let i = versesMemorized.length - 1; i >= 0; i--) {
            if (versesMemorized[i]) {
                versesMemorized[i] = false;
                decremented = true;
                break;
            }
        }

        if (decremented) {
            const memorizedCount = versesMemorized.filter(v => v).length;

            currentProgress[bookName][chapterIndex] = {
                ...chapter,
                memorizedVerses: memorizedCount,
                versesMemorized: versesMemorized,
                inProgress: memorizedCount > 0,
                completed: false
            };

            this.progressSubject.next(currentProgress);
            this.saveProgressToAPI(currentProgress).subscribe();
        }
    }

// Update the resetChapter method
    public resetChapter(bookName: string, chapterIndex: number): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const maxVerses = book.chapters[chapterIndex];
        const currentProgress = {...this.progressSubject.value};

        // Ensure the book entry exists
        if (!currentProgress[bookName]) {
            currentProgress[bookName] = this.initializeEmptyProgress()[bookName];
        }

        currentProgress[bookName][chapterIndex] = {
            chapter: chapterIndex + 1,
            memorizedVerses: 0,
            inProgress: false,
            completed: false,
            versesMemorized: Array(maxVerses).fill(false)
        };

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

// Update the calculateBookStats method
    public calculateBookStats(bookName: string): BookStats {
        const book = BIBLE_DATA[bookName];
        const currentProgress = this.progressSubject.value;
        const bookProgress = currentProgress[bookName];

        if (!book || !bookProgress) {
            return {
                percentComplete: 0,
                memorizedVerses: 0,
                totalVerses: 0,
                completedChapters: 0,
                inProgressChapters: 0
            };
        }

        // Calculate total memorized verses by counting true values in versesMemorized arrays
        let memorizedVerses = 0;
        bookProgress.forEach(chapter => {
            if (chapter && chapter.versesMemorized) {
                memorizedVerses += chapter.versesMemorized.filter(v => v).length;
            }
        });

        const completedChapters = bookProgress.filter(ch => ch?.completed).length;
        const inProgressChapters = bookProgress.filter(ch => ch?.inProgress && !ch?.completed).length;

        return {
            percentComplete: book.totalVerses ? Math.round((memorizedVerses / book.totalVerses) * 100) : 0,
            memorizedVerses,
            totalVerses: book.totalVerses,
            completedChapters,
            inProgressChapters
        };
    }

    public getTestaments(): string[] {
        return [...new Set(Object.values(BIBLE_DATA).map(book => book.testament))].sort();
    }

    public getBooksInGroup(group: string): { [key: string]: BibleBook } {
        return Object.entries(BIBLE_DATA)
            .filter(([_, book]) => book.group === group)
            .sort((a, b) => a[1].order - b[1].order) // Sort by canonical order
            .reduce((acc, [name, book]) => {
                acc[name] = book;
                return acc;
            }, {} as { [key: string]: BibleBook });
    }

    public getGroupsInTestament(testament: string): string[] {
        // Define the order of groups within each testament
        const groupOrder: { [key: string]: string[] } = {
            "Old Testament": ["Torah", "Historical", "Wisdom", "Prophets", "Deuterocanonical"],
            "New Testament": ["Gospels", "Modern Historical", "Pauline Epistles", "General Epistles", "Apocalyptic"]
        };

        // Get all groups in this testament
        const groups = [...new Set(
            Object.values(BIBLE_DATA)
                .filter(book => book.testament === testament)
                .map(book => book.group)
        )];

        // Sort groups according to the defined order
        return groups.sort((a, b) => {
            const orderA = groupOrder[testament]?.indexOf(a) ?? 999;
            const orderB = groupOrder[testament]?.indexOf(b) ?? 999;
            return orderA - orderB;
        });
    }

    public calculateGroupStats(group: string): GroupStats {
        let groupMemorizedVerses = 0;
        let groupTotalVerses = 0;
        let groupCompletedChapters = 0;
        let groupTotalChapters = 0;
        const currentProgress = this.progressSubject.value;

        Object.entries(BIBLE_DATA)
            .filter(([_, book]) => book.group === group)
            .forEach(([name, book]) => {
                groupTotalVerses += book.totalVerses;
                groupTotalChapters += book.totalChapters;
                if (currentProgress[name]) {
                    currentProgress[name].forEach(chapter => {
                        if (chapter) {
                            // Use versesMemorized array if available
                            if (chapter.versesMemorized) {
                                groupMemorizedVerses += chapter.versesMemorized.filter(v => v).length;
                            } else {
                                groupMemorizedVerses += chapter.memorizedVerses || 0;
                            }

                            if (chapter.completed) {
                                groupCompletedChapters++;
                            }
                        }
                    });
                }
            });

        return {
            percentComplete: groupTotalVerses ? Math.round((groupMemorizedVerses / groupTotalVerses) * 100) : 0,
            completedChapters: groupCompletedChapters,
            totalChapters: groupTotalChapters
        };
    }

    public calculateTestamentStats(testament: string): { percentComplete: number } {
        let testamentMemorizedVerses = 0;
        let testamentTotalVerses = 0;
        const currentProgress = this.progressSubject.value;

        Object.entries(BIBLE_DATA)
            .filter(([_, book]) => book.testament === testament)
            .forEach(([name, book]) => {
                testamentTotalVerses += book.totalVerses;
                if (currentProgress[name]) {
                    currentProgress[name].forEach(chapter => {
                        if (chapter) {
                            // Use versesMemorized array if available
                            if (chapter.versesMemorized) {
                                testamentMemorizedVerses += chapter.versesMemorized.filter(v => v).length;
                            } else {
                                testamentMemorizedVerses += chapter.memorizedVerses || 0;
                            }
                        }
                    });
                }
            });

        return {
            percentComplete: testamentTotalVerses
                ? Math.round((testamentMemorizedVerses / testamentTotalVerses) * 100)
                : 0
        };
    }

    public updateChapterProgress(bookName: string, chapterIndex: number, newValue: number): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const maxVerses = book.chapters[chapterIndex];
        const currentProgress = {...this.progressSubject.value};

        // Ensure the book entry exists
        if (!currentProgress[bookName]) {
            currentProgress[bookName] = Array(book.totalChapters).fill(null).map((_, i) => ({
                chapter: i + 1,
                memorizedVerses: 0,
                inProgress: false,
                completed: false,
                versesMemorized: Array(book.chapters[i]).fill(false)
            }));
        }

        // Ensure chapter entry exists
        if (!currentProgress[bookName][chapterIndex]) {
            currentProgress[bookName][chapterIndex] = {
                chapter: chapterIndex + 1,
                memorizedVerses: 0,
                inProgress: false,
                completed: false,
                versesMemorized: Array(maxVerses).fill(false)
            };
        }

        // Create a new boolean array for verse tracking
        const versesMemorized = Array(maxVerses).fill(false);
        // Mark the first 'newValue' verses as memorized
        for (let i = 0; i < newValue && i < maxVerses; i++) {
            versesMemorized[i] = true;
        }

        currentProgress[bookName][chapterIndex] = {
            ...currentProgress[bookName][chapterIndex],
            memorizedVerses: newValue,
            versesMemorized: versesMemorized,
            inProgress: newValue > 0,
            completed: newValue === maxVerses
        };

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

    public resetBook(bookName: string): void {
        const book = BIBLE_DATA[bookName];
        if (!book) return;

        const currentProgress = {...this.progressSubject.value};

        // Reset all chapters in the book
        currentProgress[bookName] = Array(book.totalChapters).fill(null).map((_, i) => ({
            chapter: i + 1,
            memorizedVerses: 0,
            inProgress: false,
            completed: false,
            versesMemorized: Array(book.chapters[i]).fill(false)
        }));

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

    public resetGroup(group: string): void {
        const currentProgress = {...this.progressSubject.value};

        Object.entries(BIBLE_DATA)
            .filter(([_, book]) => book.group === group)
            .forEach(([name, book]) => {
                currentProgress[name] = Array(book.totalChapters).fill(null).map((_, i) => ({
                    chapter: i + 1,
                    memorizedVerses: 0,
                    inProgress: false,
                    completed: false,
                    versesMemorized: Array(book.chapters[i]).fill(false)
                }));
            });

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

    public resetTestament(testament: string): void {
        const currentProgress = {...this.progressSubject.value};

        Object.entries(BIBLE_DATA)
            .filter(([_, book]) => book.testament === testament)
            .forEach(([name, book]) => {
                currentProgress[name] = Array(book.totalChapters).fill(null).map((_, i) => ({
                    chapter: i + 1,
                    memorizedVerses: 0,
                    inProgress: false,
                    completed: false,
                    versesMemorized: Array(book.chapters[i]).fill(false)
                }));
            });

        this.progressSubject.next(currentProgress);
        this.saveProgressToAPI(currentProgress).subscribe();
    }

    /**
     * Simulates fetching progress data from a backend API
     */
    private fetchProgressFromAPI(): Observable<BookProgress> {
        // This is where you would make your actual API call in the future
        // For now, we're returning dummy data with a simulated delay

        // Create some sample progress data for demonstration
        const dummyProgress = this.initializeEmptyProgress();

        // Add some progress to John
        if (dummyProgress['John'] && dummyProgress['John'].length > 0) {
            // Chapter 1 completed
            dummyProgress['John'][0] = {
                chapter: 1,
                memorizedVerses: 1, // All verses in John 1
                inProgress: false,
                completed: true,
                versesMemorized: [true, true, false, true]
            };

            // Chapter 2 in progress
            dummyProgress['John'][1] = {
                chapter: 2,
                memorizedVerses: 15, // Partial completion of John 2
                inProgress: true,
                completed: false,
                versesMemorized: [false, true, false, true]
            };

            // Chapter 3 in progress
            dummyProgress['John'][2] = {
                chapter: 3,
                memorizedVerses: 20, // Partial completion of John 3
                inProgress: true,
                completed: false,
                versesMemorized: [false, true, false, true]
            };
        }

        // Add some progress to Psalms
        if (dummyProgress['Psalms'] && dummyProgress['Psalms'].length > 0) {
            // Psalm A few completed psalms
            for (let i = 0; i < 10; i++) {
                if (dummyProgress['Psalms'][i]) {
                    dummyProgress['Psalms'][i] = {
                        chapter: i + 1,
                        memorizedVerses: BIBLE_DATA['Psalms'].chapters[i], // Complete chapter
                        inProgress: false,
                        completed: true,
                        versesMemorized: [true, true, false, true, true, true]
                    };
                }
            }
        }

        // Add some progress to Romans
        if (dummyProgress['Romans'] && dummyProgress['Romans'].length > 0) {
            // Romans 8 completed
            dummyProgress['Romans'][7] = {
                chapter: 8,
                memorizedVerses: 39, // All verses in Romans 8
                inProgress: false,
                completed: false,
                versesMemorized: [false, true, false, true]
            };
        }

        // Simulate network delay
        return of(dummyProgress).pipe(
            delay(this.apiLatency)
        );
    }

    /**
     * Simulates saving progress data to a backend API
     */
    private saveProgressToAPI(progress: BookProgress): Observable<boolean> {
        // This is where you would make your actual API call in the future
        // For now, we're just simulating a successful save with a delay
        console.log('Saving progress to API:', progress);
        return of(true).pipe(
            delay(this.apiLatency)
        );
    }

// Update the initializeEmptyProgress method
    private initializeEmptyProgress(): BookProgress {
        const initialProgress: BookProgress = {};
        Object.keys(BIBLE_DATA).forEach(bookName => {
            const book = BIBLE_DATA[bookName];
            initialProgress[bookName] = Array(book.totalChapters).fill(null).map((_, i) => {
                const chapterVerseCount = book.chapters[i];
                return {
                    chapter: i + 1,
                    memorizedVerses: 0,
                    inProgress: false,
                    completed: false,
                    versesMemorized: Array(chapterVerseCount).fill(false) // Initialize all verses as not memorized
                };
            });
        });
        return initialProgress;
    }

// Add data migration handling
    private migrateProgressData(progress: BookProgress): BookProgress {
        const updatedProgress = {...progress};

        Object.entries(updatedProgress).forEach(([bookName, chapters]) => {
            const book = BIBLE_DATA[bookName];
            if (chapters && book) {
                updatedProgress[bookName] = chapters.map((chapter, chapterIndex) => {
                    if (chapter) {
                        // If versesMemorized doesn't exist or is wrong length, create it
                        if (!chapter.versesMemorized ||
                            chapter.versesMemorized.length !== book.chapters[chapterIndex]) {

                            // Create a boolean array based on memorizedVerses count
                            const versesMemorized = Array(book.chapters[chapterIndex]).fill(false);
                            for (let i = 0; i < chapter.memorizedVerses && i < versesMemorized.length; i++) {
                                versesMemorized[i] = true;
                            }

                            return {
                                ...chapter,
                                versesMemorized
                            };
                        }
                    }
                    return chapter;
                });
            }
        });

        return updatedProgress;
    }

// Update the loadProgress method to migrate data
    private loadProgress(): void {
        // Simulate API call with dummy data
        this.fetchProgressFromAPI().subscribe(
            (progress) => {
                // Migrate old data format if needed
                const migratedProgress = this.migrateProgressData(progress);
                this.progressSubject.next(migratedProgress);
            },
            (error) => {
                console.error('Error loading progress data:', error);
                // In case of error, initialize with empty progress
                this.progressSubject.next(this.initializeEmptyProgress());
            }
        );
    }
}
